const db = require('../config/db');
const table_name = 'Poster_type';

const posterType = {
  getAll: (callback) => {
    db.query(
      `SELECT * FROM ${table_name} ORDER BY Postertype_id`,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  getByID: (id, callback) => {
    db.query(
      `SELECT * FROM ${table_name} WHERE Postertype_id = ? LIMIT 1`,
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
      `INSERT INTO ${table_name} (Postertype_name) VALUES (?)`,
      [data.postertype_name],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },


  update: (id, data, callback) => {
    db.query(
      `UPDATE ${table_name} SET Postertype_name = ? WHERE Postertype_id = ?`,
      [data.postertype_name, id],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },


  delete: (id, callback) => {
    db.query(
      `DELETE FROM ${table_name} WHERE Postertype_id = ?`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

 
};

module.exports = posterType;
