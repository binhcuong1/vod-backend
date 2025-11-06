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
