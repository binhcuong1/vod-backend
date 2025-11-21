const db = require('../config/db');
const table_name = 'Actor';

const actor = {
  getAll: (callback) => {
    db.query(
      `SELECT * FROM ${table_name} WHERE is_deleted = 0 ORDER BY Actor_id DESC`,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  getByID: (id, callback) => {
    db.query(
      `SELECT * FROM ${table_name} WHERE Actor_id = ? AND is_deleted = 0 LIMIT 1`,
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
      `INSERT INTO ${table_name} (Actor_name, Actor_gender, Actor_avatar)
       VALUES (?, ?, ?)`,
      [data.actor_name, data.actor_gender, data.actor_avatar],
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
      `UPDATE ${table_name} SET ${fields} WHERE Actor_id = ? AND is_deleted = 0`,
      values,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  delete: (id, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE Actor_id = ?`,
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
      `SELECT * FROM ${table_name}
       WHERE Actor_name LIKE ? AND is_deleted = 0`,
      [searchTerm],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  // ⭐⭐⭐ THÊM ĐÚNG CHỖ NÀY: HÀM NẰM TRONG OBJECT
  getFilmsByActor: (actorId, callback) => {
    const sql = `
      SELECT
        f.Film_id,
        f.Film_name,
        fi.Release_year,
        fi.Description,
        (
          SELECT p.Poster_url
          FROM Poster p
          WHERE p.Film_id = f.Film_id
            AND p.Postertype_id = 1
            AND p.is_deleted = 0
          LIMIT 1
        ) AS poster_main
      FROM Film_actor fa
      JOIN Film f ON fa.Film_id = f.Film_id
      JOIN Film_info fi ON fi.Film_id = f.Film_id
      WHERE fa.Actor_id = ?
        AND f.is_deleted = 0
    `;

    db.query(sql, [actorId], callback);
  },
};

module.exports = actor;
