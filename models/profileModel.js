const db = require('../config/db');
const table_name = 'Profile';

const profile = {

  getAll: (callback) => {
    db.query(
      `SELECT p.*, a.Email, a.role
       FROM ${table_name} p
       LEFT JOIN Account a ON p.Account_id = a.Account_id
       WHERE p.is_deleted = 0
       ORDER BY p.Profile_id DESC`,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

 
  getByID: (id, callback) => {
    db.query(
      `SELECT p.*, a.Email, a.role
       FROM ${table_name} p
       LEFT JOIN Account a ON p.Account_id = a.Account_id
       WHERE p.Profile_id = ? AND p.is_deleted = 0
       LIMIT 1`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        if (result.length === 0) return callback(null, null);
        callback(null, result[0]);
      }
    );
  },


  getByAccount: (accountId, callback) => {
    db.query(
      `SELECT p.*, a.Email, a.role
       FROM ${table_name} p
       LEFT JOIN Account a ON p.Account_id = a.Account_id
       WHERE p.Account_id = ? AND p.is_deleted = 0
       LIMIT 1`,
      [accountId],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result[0] || null);
      }
    );
  },

  
  create: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name} (Profile_name, Avatar_url, Account_id)
       VALUES (?, ?, ?)`,
      [data.profile_name, data.avatar_url || null, data.account_id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },


  update: (id, data, callback) => {
    const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ');
    const values = Object.values(data);
    values.push(id);

    db.query(
      `UPDATE ${table_name} SET ${fields} WHERE Profile_id = ? AND is_deleted = 0`,
      values,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },


  delete: (id, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE Profile_id = ?`,
      [id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },


  search: (keyword, callback) => {
    const searchTerm = `%${keyword}%`;
    db.query(
      `SELECT p.*, a.Email
       FROM ${table_name} p
       LEFT JOIN Account a ON p.Account_id = a.Account_id
       WHERE p.is_deleted = 0 AND p.Profile_name LIKE ?
       ORDER BY p.Profile_id DESC`,
      [searchTerm],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },
};

module.exports = profile;
