const db = require('../config/db');
const table_name = 'Resolution';

const resolution = {

  getAll: (callback) => {
    db.query(
      `SELECT * FROM ${table_name} ORDER BY Resolution_id`,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },


  getByID: (id, callback) => {
    db.query(
      `SELECT * FROM ${table_name} WHERE Resolution_id = ? LIMIT 1`,
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
      `INSERT INTO ${table_name} (Resolution_type) VALUES (?)`,
      [data.resolution_type],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },


  update: (id, data, callback) => {
    db.query(
      `UPDATE ${table_name} SET Resolution_type = ? WHERE Resolution_id = ?`,
      [data.resolution_type, id],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },


  delete: (id, callback) => {
    db.query(
      `DELETE FROM ${table_name} WHERE Resolution_id = ?`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  
};

module.exports = resolution;
