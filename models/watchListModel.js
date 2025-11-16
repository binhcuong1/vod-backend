const db = require('../config/db');
const table_name = 'watchlist';

const watchList = {

  getAll: (callback) => {
    db.query(
      `SELECT w.*, p.Profile_name
       FROM ${table_name} w
       JOIN Profile p ON w.Profile_id = p.Profile_id
       WHERE w.is_deleted = 0
       ORDER BY w.WatchList_id DESC`,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  getByID: (id, callback) => {
    db.query(
      `SELECT w.*, p.Profile_name
       FROM ${table_name} w
       JOIN Profile p ON w.Profile_id = p.Profile_id
       WHERE w.WatchList_id = ? AND w.is_deleted = 0
       LIMIT 1`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        if (result.length === 0) return callback(null, null);
        callback(null, result[0]);
      }
    );
  },

  getByProfile: (profile_id, callback) => {
    db.query(
      `SELECT * FROM ${table_name}
       WHERE Profile_id = ? AND is_deleted = 0
       ORDER BY WatchList_id DESC`,
      [profile_id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  create: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name} (Profile_id, WatchList_name)
       VALUES (?, ?)`,
      [data.profile_id, data.watchlist_name],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  update: (id, data, callback) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    values.push(id);

    db.query(
      `UPDATE ${table_name} SET ${fields} WHERE WatchList_id = ? AND is_deleted = 0`,
      values,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  delete: (id, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE WatchList_id = ?`,
      [id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  search: (keyword, callback) => {
    const searchTerm = `%${keyword}%`;
    db.query(
      `SELECT w.*, p.Profile_name
       FROM ${table_name} w
       JOIN Profile p ON w.Profile_id = p.Profile_id
       WHERE w.is_deleted = 0 AND w.WatchList_name LIKE ?
       ORDER BY w.WatchList_id DESC`,
      [searchTerm],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },
};

module.exports = watchList;
