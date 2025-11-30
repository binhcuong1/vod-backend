const db = require('../config/db');
const table_name = 'Poster';

const poster = {
  getAll: (callback) => {
    db.query(
      `SELECT p.*, f.Film_name, pt.Postertype_name
       FROM ${table_name} p
       LEFT JOIN Film f ON p.Film_id = f.Film_id
       LEFT JOIN Poster_type pt ON p.Postertype_id = pt.Postertype_id
       WHERE p.is_deleted = 0
       ORDER BY p.Poster_id DESC`,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  getByID: (id, callback) => {
    db.query(
      `SELECT p.*, f.Film_name, pt.Postertype_name
       FROM ${table_name} p
       LEFT JOIN Film f ON p.Film_id = f.Film_id
       LEFT JOIN Poster_type pt ON p.Postertype_id = pt.Postertype_id
       WHERE p.Poster_id = ? AND p.is_deleted = 0
       LIMIT 1`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        if (result.length === 0) return callback(null, null);
        callback(null, result[0]);
      }
    );
  },

  getByFilm: (filmId, callback) => {
    db.query(
      `SELECT p.*, pt.Postertype_name
       FROM ${table_name} p
       LEFT JOIN Poster_type pt ON p.Postertype_id = pt.Postertype_id
       WHERE p.Film_id = ? AND p.is_deleted = 0`,
      [filmId],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  create: (data, callback) => {
    const { postertype_id, poster_url, film_id } = data || {};

    // Validate cơ bản
    if (!postertype_id || !poster_url || !film_id) {
      return callback(
        {
          code: "VALIDATION_ERROR",
          message: "postertype_id, poster_url và film_id là bắt buộc."
        },
        null
      );
    }

    const sql = `
        INSERT INTO ${table_name} (Postertype_id, Poster_url, Film_id)
        VALUES (?, ?, ?)
    `;

    const params = [
      Number(postertype_id),
      poster_url.trim(),
      Number(film_id)
    ];

    db.query(sql, params, (err, result) => {
      if (err) {
        // Xử lý lỗi duplicate (trùng Film_id + Postertype_id)
        if (err.code === "ER_DUP_ENTRY") {
          return callback(
            {
              code: "DUPLICATE_POSTER",
              message: "Poster cho loại này của phim đã tồn tại."
            },
            null
          );
        }
        return callback(err, null);
      }

      return callback(null, result);
    });
  },


  update: (id, data, callback) => {
    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(data);
    values.push(id);

    db.query(
      `UPDATE ${table_name} SET ${fields} WHERE Poster_id = ? AND is_deleted = 0`,
      values,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  delete: (id, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE Poster_id = ?`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  //  Tìm kiếm theo tên phim hoặc loại poster
  search: (keyword, callback) => {
    const searchTerm = `%${keyword}%`;
    db.query(
      `SELECT p.*, f.Film_name, pt.Postertype_name
       FROM ${table_name} p
       LEFT JOIN Film f ON p.Film_id = f.Film_id
       LEFT JOIN Poster_type pt ON p.Postertype_id = pt.Postertype_id
       WHERE (f.Film_name LIKE ? OR pt.Postertype_name LIKE ?)
       AND p.is_deleted = 0`,
      [searchTerm, searchTerm],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },
};

module.exports = poster;
