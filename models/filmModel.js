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

// ✅ Lấy chi tiết phim rút gọn
getDetailByID: (id, callback) => {
  const sql = `
    SELECT 
      f.Film_id,
      f.Film_name,
      f.is_series,
      fi.Original_name,
      fi.Description,
      fi.Release_year,
      fi.Duration,
      fi.maturity_rating,
      fi.Country_id,
      c.Country_name,
      fi.process_episode,
      fi.total_episode,
      fi.trailer_url,
      fi.film_status,

      -- 🔹 Thể loại
      GROUP_CONCAT(DISTINCT g.Genre_name ORDER BY g.Genre_name SEPARATOR ', ') AS genres,

      -- 🔹 Poster chính & banner
      MAX(CASE WHEN p.Postertype_id = 1 THEN p.Poster_url END) AS poster_main,
      MAX(CASE WHEN p.Postertype_id = 3 THEN p.Poster_url END) AS poster_banner,

      -- 🔹 Nguồn phim (kèm độ phân giải)
      GROUP_CONCAT(DISTINCT CONCAT(r.Resolution_type, ':', fs.Source_url) SEPARATOR ',') AS Sources

    FROM Film f
    LEFT JOIN Film_info fi ON f.Film_id = fi.Film_id
    LEFT JOIN Country c ON fi.Country_id = c.Country_id
    LEFT JOIN Film_genre fg ON f.Film_id = fg.Film_id
    LEFT JOIN Genre g ON fg.Genre_id = g.Genre_id
    LEFT JOIN Poster p ON f.Film_id = p.Film_id AND p.is_deleted = 0
    LEFT JOIN FilmSource fs ON f.Film_id = fs.Film_id
    LEFT JOIN Resolution r ON fs.Resolution_id = r.Resolution_id
    WHERE f.Film_id = ? AND f.is_deleted = 0
    GROUP BY f.Film_id
    LIMIT 1;
  `;

  const sqlActors = `
    SELECT a.Actor_id, a.Actor_name, a.Actor_gender, a.Actor_avatar, fa.Character_name
    FROM Film_actor fa JOIN Actor a ON fa.Actor_id = a.Actor_id
    WHERE fa.Film_id = ?;
  `;

  const sqlSeasons = `
    SELECT s.Season_id, s.Season_name,
           JSON_ARRAYAGG(JSON_OBJECT('Episode_id', e.Episode_id, 'Episode_number', e.Episode_number)) AS Episodes
    FROM Season s
    LEFT JOIN Episode e ON s.Season_id = e.Season_id AND e.is_deleted = 0
    WHERE s.Film_id = ? AND s.is_deleted = 0
    GROUP BY s.Season_id
    ORDER BY s.Season_id;
  `;

  db.query(sql, [id], (err, filmRows) => {
    if (err) return callback(err);
    if (!filmRows.length) return callback(null, null);

    const film = filmRows[0];
    db.query(sqlActors, [id], (err2, actorRows) => {
      if (err2) return callback(err2);
      film.Actors = actorRows;
      db.query(sqlSeasons, [id], (err3, seasonRows) => {
        if (err3) return callback(err3);
        film.Seasons = seasonRows;
        callback(null, film);
      });
    });
  });
},



// ✅ Lấy danh sách phim đề xuất theo quốc gia hoặc thể loại 
getRecommendationsByCountry: (countryName, excludeFilmId, callback) => {
  const sql = `
    SELECT 
      f.Film_id,
      f.Film_name,
      f.is_series,
      fi.Release_year,
      fi.film_status,
      c.Country_name,
      GROUP_CONCAT(DISTINCT g.Genre_name ORDER BY g.Genre_name SEPARATOR ', ') AS genres,

      -- 🔹 Poster chính
      (
        SELECT p1.Poster_url
        FROM Poster p1
        WHERE p1.Film_id = f.Film_id
          AND p1.Postertype_id = 1
          AND p1.is_deleted = 0
        LIMIT 1
      ) AS poster_main,

      -- 🔹 Poster banner phụ
      (
        SELECT p2.Poster_url
        FROM Poster p2
        WHERE p2.Film_id = f.Film_id
          AND p2.Postertype_id = 3
          AND p2.is_deleted = 0
        LIMIT 1
      ) AS poster_banner

    FROM Film f
    JOIN Film_info fi ON f.Film_id = fi.Film_id
    JOIN Country c ON fi.Country_id = c.Country_id
    LEFT JOIN Film_genre fg ON f.Film_id = fg.Film_id
    LEFT JOIN Genre g ON fg.Genre_id = g.Genre_id

    WHERE f.is_deleted = 0
      AND f.Film_id <> ?
      AND (
          -- ✅ cùng quốc gia
          c.Country_name = ?
          -- ✅ hoặc cùng thể loại
          OR fg.Genre_id IN (
              SELECT Genre_id
              FROM Film_genre
              WHERE Film_id = ?
          )
      )

    GROUP BY f.Film_id
    ORDER BY RAND()
    LIMIT 10;
  `;

  db.query(sql, [excludeFilmId, countryName, excludeFilmId], (err, rows) => {
    if (err) {
      console.error("❌ Lỗi truy vấn phim đề xuất:", err);
      return callback(err, null);
    }
    callback(null, rows);
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

  createDeep : (payload, cb) => {
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
                        `INSERT INTO filmsource (Film_id, Episode_id, Resolution_id, Source_url) VALUES ?`,
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
