const db = require('../config/db');
const table_name = 'Film';

const film = {
  getByID: (id, callback) => {
    db.query(
      `SELECT * FROM ${table_name} WHERE Film_id = ? AND is_deleted = 0 LIMIT 1`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        if (result.length === 0) return callback(null, null);
        callback(null, result[0]);
      }
    );
  },

  getDetail: (id, cb) => {
    // 1) film + film_info + country
    const qFilm = `
    SELECT 
      f.Film_id, f.Film_name, f.is_series, f.is_deleted,
      fi.Original_name, fi.Description, fi.Release_year, fi.Duration,
      fi.maturity_rating, fi.Country_id, c.Country_name,
      fi.process_episode, fi.total_episode, fi.trailer_url, fi.film_status
    FROM Film f
    LEFT JOIN Film_info fi ON f.Film_id = fi.Film_id
    LEFT JOIN Country   c  ON fi.Country_id = c.Country_id
    WHERE f.Film_id = ? AND f.is_deleted = 0
    LIMIT 1;
  `;

    // 2) genres
    const qGenres = `
    SELECT g.Genre_id AS id, g.Genre_name AS name
    FROM Film_genre fg
    JOIN Genre g ON fg.Genre_id = g.Genre_id
    WHERE fg.Film_id = ?;
  `;

    // 3) posters
    const qPosters = `
    SELECT p.Poster_id, p.Postertype_id, p.Poster_url
    FROM Poster p
    WHERE p.Film_id = ? AND p.is_deleted = 0
    ORDER BY p.Postertype_id ASC, p.Poster_id ASC;
  `;

    // 4) film sources (movie-level) — KHÔNG có Source_id trong DB, join resolution để lấy tên
    const qFilmSources = `
    SELECT fs.Resolution_id, r.Resolution_type, fs.Source_url
    FROM FilmSource fs
    JOIN Resolution r ON r.Resolution_id = fs.Resolution_id
    WHERE fs.Film_id = ? AND fs.Episode_id IS NULL
    ORDER BY fs.Resolution_id ASC;
  `;

    // 5) cast
    const qCast = `
    SELECT fa.Actor_id AS id, a.Actor_name AS name, fa.Character_name
    FROM Film_actor fa
    JOIN Actor a ON fa.Actor_id = a.Actor_id
    WHERE fa.Film_id = ?;
  `;

    // 6) seasons (DB không có Season_number)
    const qSeasons = `
    SELECT s.Season_id, s.Season_name
    FROM Season s
    WHERE s.Film_id = ? AND s.is_deleted = 0
    ORDER BY s.Season_id ASC;
  `;

    // 7) episodes (DB chỉ có Episode_number, không có Title/Duration)
    const qEpisodes = `
    SELECT e.Episode_id, e.Season_id, e.Episode_number
    FROM Episode e
    WHERE e.Season_id IN (SELECT Season_id FROM Season WHERE Film_id = ? AND is_deleted = 0)
      AND e.is_deleted = 0
    ORDER BY e.Season_id ASC, e.Episode_number ASC, e.Episode_id ASC;
  `;

    // 8) episode sources — KHÔNG có Source_id, join resolution để lấy Resolution_type
    const qEpisodeSources = `
    SELECT fs.Episode_id, fs.Resolution_id, r.Resolution_type, fs.Source_url
    FROM FilmSource fs
    JOIN Resolution r ON r.Resolution_id = fs.Resolution_id
    WHERE fs.Episode_id IN (
      SELECT e.Episode_id
      FROM Episode e
      WHERE e.Season_id IN (SELECT s.Season_id FROM Season s WHERE s.Film_id = ? AND s.is_deleted = 0)
        AND e.is_deleted = 0
    )
      AND fs.is_deleted = 0
    ORDER BY fs.Episode_id ASC, fs.Resolution_id ASC;
  `;

    // Chạy tuần tự
    db.query(qFilm, [id], (e1, r1) => {
      if (e1) return cb(e1);
      if (!r1 || r1.length === 0) return cb(null, null);
      const filmRow = r1[0];

      db.query(qGenres, [id], (e2, genres) => {
        if (e2) return cb(e2);

        db.query(qPosters, [id], (e3, posters) => {
          if (e3) return cb(e3);

          db.query(qFilmSources, [id], (e4, filmSources) => {
            if (e4) return cb(e4);

            db.query(qCast, [id], (e5, cast) => {
              if (e5) return cb(e5);

              db.query(qSeasons, [id], (e6, seasons = []) => {
                if (e6) seasons = [];

                db.query(qEpisodes, [id], (e7, episodes = []) => {
                  if (e7) episodes = [];

                  db.query(qEpisodeSources, [id], (e8, epSources = []) => {
                    if (e8) epSources = [];

                    // Gộp episodes vào seasons
                    const seasonMap = new Map();
                    (seasons || []).forEach(s => seasonMap.set(s.Season_id, {
                      season_id: s.Season_id,
                      name: s.Season_name,
                      // DB không có Season_number -> bỏ
                      episodes: []
                    }));

                    (episodes || []).forEach(e => {
                      const bucket = seasonMap.get(e.Season_id);
                      if (bucket) {
                        bucket.episodes.push({
                          episode_id: e.Episode_id,
                          number: e.Episode_number,
                          // DB không có Title/Duration -> set null
                          title: null,
                          duration: null,
                          sources: []
                        });
                      }
                    });

                    // map episode sources
                    const epMap = new Map();
                    Array.from(seasonMap.values()).forEach(s => {
                      s.episodes.forEach(ep => epMap.set(ep.episode_id, ep));
                    });
                    (epSources || []).forEach(s => {
                      const ep = epMap.get(s.Episode_id);
                      if (ep) ep.sources.push({
                        // không có source_id trong DB
                        resolution_id: s.Resolution_id,
                        resolution_type: s.Resolution_type,
                        source_url: s.Source_url
                      });
                    });

                    const seasonsArr = Array.from(seasonMap.values());

                    // Build JSON cuối
                    const data = {
                      film: {
                        id: filmRow.Film_id,
                        name: filmRow.Film_name,
                        is_series: !!filmRow.is_series
                      },
                      info: {
                        original_name: filmRow.Original_name,
                        description: filmRow.Description,
                        release_year: filmRow.Release_year,
                        duration: filmRow.Duration,
                        maturity_rating: filmRow.maturity_rating,
                        country: {
                          id: filmRow.Country_id,
                          name: filmRow.Country_name
                        },
                        process_episode: filmRow.process_episode,
                        total_episode: filmRow.total_episode,
                        trailer_url: filmRow.trailer_url,
                        film_status: filmRow.film_status
                      },
                      genres: (genres || []).map(g => ({ id: g.id, name: g.name })),
                      posters: (posters || []).map(p => ({
                        poster_id: p.Poster_id,
                        postertype_id: p.Postertype_id,
                        poster_url: p.Poster_url
                      })),
                      // movie-level sources
                      sources: (filmSources || []).map(s => ({
                        // không có source_id
                        resolution_id: s.Resolution_id,
                        resolution_type: s.Resolution_type,
                        source_url: s.Source_url
                      })),
                      cast: (cast || []).map(a => ({
                        actor_id: a.id, name: a.name, character_name: a.Character_name
                      })),
                      seasons: seasonsArr,
                      has_series: seasonsArr.length > 0
                    };

                    cb(null, data);
                  });
                });
              });
            });
          });
        });
      });
    });
  },


  getAll: (callback) => {
    db.query(
      `
            SELECT * 
            FROM ${table_name} f
            JOIN film_info fInfo on f.Film_id = fInfo.Film_id
            WHERE f.is_deleted = 0 
            ORDER BY f.Film_id DESC`,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  // ✅ Dùng cho "Kho phim" — lấy toàn bộ dữ liệu phim chi tiết
  getSearchData: (callback) => {
    const query = `
    SELECT 
      f.Film_id,
      f.Film_name,
      f.is_series,
      fi.Original_name,
      fi.Release_year,
      fi.Country_id,
      c.Country_name,
      GROUP_CONCAT(DISTINCT g.Genre_name ORDER BY g.Genre_name SEPARATOR ', ') AS genres,
      (SELECT p1.Poster_url FROM Poster p1 
        WHERE p1.Film_id = f.Film_id AND p1.Postertype_id = 1 AND p1.is_deleted = 0 LIMIT 1) AS poster_main,
      (SELECT p2.Poster_url FROM Poster p2 
        WHERE p2.Film_id = f.Film_id AND p2.Postertype_id = 3 AND p2.is_deleted = 0 LIMIT 1) AS poster_banner
    FROM Film f
    LEFT JOIN Film_info fi ON f.Film_id = fi.Film_id
    LEFT JOIN Country c ON fi.Country_id = c.Country_id
    LEFT JOIN Film_genre fg ON f.Film_id = fg.Film_id
    LEFT JOIN Genre g ON fg.Genre_id = g.Genre_id
    WHERE f.is_deleted = 0
    GROUP BY f.Film_id
    ORDER BY f.Film_id DESC;
  `;

    db.query(query, (err, result) => {
      if (err) return callback(err);
      console.log(`🎬 [FILM SEARCH DATA]: ${result.length} phim`);
      callback(null, result);
    });
  },

  // ✅ Lấy dữ liệu hiển thị trang Home
  getHomeData: (callback) => {
    const query = `
      SELECT 
        f.Film_id,
        f.Film_name,
        fi.Original_name,
        fi.Release_year,
        c.Country_name,
        GROUP_CONCAT(DISTINCT g.Genre_name ORDER BY g.Genre_name SEPARATOR ', ') AS genres,

        -- 🔹 Poster chính (1)
        (
          SELECT p1.Poster_url
          FROM Poster p1
          WHERE p1.Film_id = f.Film_id
            AND p1.Postertype_id = 1
            AND p1.is_deleted = 0
          LIMIT 1
        ) AS poster_main,

        -- 🔹 Banner ngang (3)
        (
          SELECT p2.Poster_url
          FROM Poster p2
          WHERE p2.Film_id = f.Film_id
            AND p2.Postertype_id = 3
            AND p2.is_deleted = 0
          LIMIT 1
        ) AS poster_banner

      FROM Film f
      LEFT JOIN Film_info fi ON f.Film_id = fi.Film_id
      LEFT JOIN Country c ON fi.Country_id = c.Country_id
      LEFT JOIN Film_genre fg ON f.Film_id = fg.Film_id
      LEFT JOIN Genre g ON fg.Genre_id = g.Genre_id
      WHERE f.is_deleted = 0
      GROUP BY f.Film_id
      ORDER BY f.Film_id DESC;
    `;

    db.query(query, (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  create: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name} (Film_name, is_series) VALUES (?, ?)`,
      [data.film_name, !!data.is_series],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  createDeep: (payload, cb) => {
    const usePool = typeof db.getConnection === 'function';
    const begin = (conn, next) => conn.beginTransaction(next);
    const commit = (conn, next) => conn.commit(next);
    const rollback = (conn, next) => conn.rollback(() => next());

    const run = (conn) => {
      const {
        film_name, is_series = false,
        info = {},
        genre_ids = [],
        posters = [],
        sources = [],
        cast_ids = [],
      } = payload;

      // 1) film
      conn.query(
        `INSERT INTO film (Film_name, is_series) VALUES (?, ?)`,
        [film_name, !!is_series],
        (e1, r1) => {
          if (e1) return rollback(conn, () => cb(e1));
          const filmId = r1.insertId;

          // 2) film_info
          const fi = info || {};
          conn.query(
            `INSERT INTO film_info
           (Film_id, Original_name, Description, Release_year, Duration, maturity_rating, Country_id,
            process_episode, total_episode, trailer_url, film_status)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [
              filmId,
              fi.original_name ?? null,
              fi.description ?? null,
              fi.release_year ?? null,
              fi.duration ?? null,
              fi.maturity_rating ?? null,
              fi.country_id ?? null,
              fi.process_episode ?? 0,
              fi.total_episode ?? 0,
              fi.trailer_url ?? null,
              fi.film_status ?? null, // nên validate enum ở controller nếu cần
            ],
            (e2) => {
              if (e2) return rollback(conn, () => cb(e2));

              // helper
              const insertMany = (sql, rows, mapFn, next) => {
                if (!rows || rows.length === 0) return next();
                const values = rows.map(mapFn).filter(Boolean);
                if (values.length === 0) return next();
                conn.query(sql, [values], (err) => err ? rollback(conn, () => cb(err)) : next());
              };

              // 3) film_genre
              insertMany(
                `INSERT INTO film_genre (Film_id, Genre_id) VALUES ?`,
                genre_ids,
                (gid) => (gid != null ? [filmId, gid] : null),
                () => {
                  // 4) poster
                  insertMany(
                    `INSERT INTO poster (Postertype_id, Poster_url, Film_id) VALUES ?`,
                    posters,
                    (p) => (p && p.postertype_id && p.poster_url ? [p.postertype_id, p.poster_url, filmId] : null),
                    () => {
                      // 5) filmsource (Film_id hoặc Episode_id phải có)
                      insertMany(
                        `INSERT INTO filmSource (Film_id, Episode_id, Resolution_id, Source_url) VALUES ?`,
                        sources,
                        (s) => {
                          if (!s || !s.source_url || !s.resolution_id) return null;
                          const episodeId = s.episode_id ?? null; // nếu movie: null
                          const filmIdOrNull = episodeId ? null : filmId; // nếu có episode_id, bỏ Film_id
                          return [filmIdOrNull, episodeId, s.resolution_id, s.source_url];
                        },
                        () => {
                          // 6) film_actor
                          insertMany(
                            `INSERT INTO film_actor (Film_id, Actor_id, Character_name) VALUES ?`,
                            cast_ids,
                            (aid) => (aid != null ? [filmId, aid, null] : null),
                            () => {
                              // 7) commit
                              commit(conn, (ec) => ec ? rollback(conn, () => cb(ec)) : cb(null, filmId));
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    };

    if (usePool) {
      db.getConnection((err, conn) => {
        if (err) return cb(err);
        begin(conn, (e) => e ? (conn.release(), cb(e)) : run(conn));
      });
    } else {
      begin(db, (e) => e ? cb(e) : run(db));
    }
  },

  update: (id, data, callback) => {
    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(data);
    values.push(id);

    db.query(
      `UPDATE ${table_name} SET ${fields} WHERE Film_id = ?`,
      values,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  delete: (id, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE Film_id = ?`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  search: (keyword, callback) => {
    const searchTerm = `%${keyword}%`;
    db.query(
      `SELECT * FROM ${table_name} WHERE Film_name LIKE ? AND is_deleted = 0`,
      [searchTerm],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },
};

module.exports = film;
