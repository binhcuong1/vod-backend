const db = require('../config/db');
const table_name = 'Film_info';

const filmInfo = {
  getAll: (callback) => {
    db.query(
      `SELECT * FROM ${table_name} ORDER BY Film_id DESC`,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  getByID: (id, callback) => {
    db.query(
      `SELECT * FROM ${table_name} WHERE Film_id = ? LIMIT 1`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        if (result.length === 0) return callback(null, null);
        callback(null, result[0]);
      }
    );
  },

  create: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name} 
      (Film_id, Original_name, Description, Release_year, Duration, maturity_rating, Country_id, process_episode, total_episode, trailer_url, film_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.film_id,
        data.original_name,
        data.description,
        data.release_year,
        data.duration,
        data.maturity_rating,
        data.country_id,
        data.process_episode || 0,
        data.total_episode || 0,
        data.trailer_url,
        data.film_status || 'đang chiếu',
      ],
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
      `DELETE FROM ${table_name} WHERE Film_id = ?`,
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
      `SELECT * FROM ${table_name} WHERE Original_name LIKE ?`,
      [searchTerm],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },
};

module.exports = filmInfo;
