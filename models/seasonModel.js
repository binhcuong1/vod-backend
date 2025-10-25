const db = require('../config/db');
const table_name = 'Season';

const season = {
  getAll: (callback) => {
    db.query(
      `SELECT s.*, f.Film_name
       FROM ${table_name} s
       JOIN Film f ON s.Film_id = f.Film_id
       WHERE s.is_deleted = 0
       ORDER BY f.Film_name, s.Season_id DESC`,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  // Lấy tất cả season theo Film
  getByFilm: (filmId, callback) => {
    db.query(
      `SELECT s.*
       FROM ${table_name} s
       WHERE s.Film_id = ? AND s.is_deleted = 0
       ORDER BY s.Season_id`,
      [filmId],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  getByID: (id, callback) => {
    db.query(
      `SELECT s.*, f.Film_name
       FROM ${table_name} s
       JOIN Film f ON s.Film_id = f.Film_id
       WHERE s.Season_id = ? AND s.is_deleted = 0
       LIMIT 1`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        if (result.length === 0) return callback(null, null);
        callback(null, result[0]);
      }
    );
  },

  create: (data, callback) => {
    if (!data.film_id) {
      return callback({ message: 'Film_id là bắt buộc vì Season phải thuộc về Film' }, null);
    }

    db.query(
      `INSERT INTO ${table_name} (Season_name, Film_id)
       VALUES (?, ?)`,
      [data.season_name, data.film_id],
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
      `UPDATE ${table_name} SET ${fields} WHERE Season_id = ? AND is_deleted = 0`,
      values,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

 
  delete: (id, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE Season_id = ?`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },
};

module.exports = season;
