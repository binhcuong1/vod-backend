const db = require('../config/db');
const bcrypt = require('bcrypt');
const table_name = 'Account';

const account = {
  getAll: (callback) => {
    db.query(
      `SELECT Account_id, Email, role FROM ${table_name} WHERE is_deleted = 0 ORDER BY Account_id DESC`,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  getByID: (id, callback) => {
    db.query(
      `SELECT Account_id, Email, role FROM ${table_name} WHERE Account_id = ? AND is_deleted = 0 LIMIT 1`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        if (result.length === 0) return callback(null, null);
        callback(null, result[0]);
      }
    );
  },

  getByEmail: (email, callback) => {
    db.query(
      `SELECT * FROM ${table_name} WHERE Email = ? AND is_deleted = 0 LIMIT 1`,
      [email],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result[0] || null);
      }
    );
  },

  create: async (data, callback) => {
    try {
      const hashed = await bcrypt.hash(data.password, 10);
      db.query(
        `INSERT INTO ${table_name} (Email, Password, role) VALUES (?, ?, ?)`,
        [data.email, hashed, data.role || 'user'],
        (err, result) => (err ? callback(err, null) : callback(null, result))
      );
    } catch (err) {
      callback(err, null);
    }
  },

  update: async (id, data, callback) => {
    const fields = [];
    const values = [];

    if (data.email !== undefined) { fields.push('Email = ?'); values.push(data.email); }
    if (data.password !== undefined) {
      const hashed = await bcrypt.hash(data.password, 10);
      fields.push('Password = ?'); values.push(hashed);
    }
    if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }

    if (fields.length === 0) return callback({ message: 'Không có dữ liệu cập nhật' }, null);

    values.push(id);
    db.query(
      `UPDATE ${table_name} SET ${fields.join(', ')} WHERE Account_id = ? AND is_deleted = 0`,
      values,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  delete: (id, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE Account_id = ?`,
      [id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },
};

module.exports = account;
