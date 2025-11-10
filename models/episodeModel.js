const db = require('../config/db');
const table_name = 'Episode';

const episode = {

  getAll: (callback) => {
    db.query(
      `SELECT e.*, s.Season_name, f.Film_name
       FROM ${table_name} e
       JOIN Season s ON e.Season_id = s.Season_id
       JOIN Film f ON s.Film_id = f.Film_id
       WHERE e.is_deleted = 0
       ORDER BY f.Film_name, s.Season_id, e.Episode_number`,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  // Lấy Episode theo Season_id (phụ thuộc Season)
  getBySeason: (seasonId, callback) => {
    db.query(
      `SELECT e.*, s.Season_name
       FROM ${table_name} e
       JOIN Season s ON e.Season_id = s.Season_id
       WHERE e.Season_id = ? AND e.is_deleted = 0
       ORDER BY e.Episode_number`,
      [seasonId],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  // Lấy Episode theo ID
  getByID: (id, callback) => {
    db.query(
      `SELECT e.*, s.Season_name, f.Film_name
       FROM ${table_name} e
       JOIN Season s ON e.Season_id = s.Season_id
       JOIN Film f ON s.Film_id = f.Film_id
       WHERE e.Episode_id = ? AND e.is_deleted = 0
       LIMIT 1`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        if (result.length === 0) return callback(null, null);
        callback(null, result[0]);
      }
    );
  },

  // 🔹 Tạo Episode mới 
  create: (data, callback) => {
    if (!data.season_id)
      return callback({ message: 'season_id là bắt buộc' }, null);
    if (!data.episode_number)
      return callback({ message: 'episode_number là bắt buộc' }, null);

    db.query(
      `INSERT INTO ${table_name} (Episode_number, Season_id)
       VALUES (?, ?)`,
      [data.episode_number, data.season_id],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  update: (id, data, callback) => {
    const allowed = ['Episode_number', 'Season_id', 'Title', 'Duration'];
    const patch = {};
    for (const k of allowed)
      if (k in data) patch[k] = data[k];

    if (!Object.keys(patch).length) return callback(null, { affectedRows: 0 });

    const fields = Object.keys(patch).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(patch), id];

    db.query(
      `UPDATE Episode SET ${fields} WHERE Episode_id = ? AND is_deleted = 0`,
      values,
      (err, result) => err ? callback(err, null) : callback(null, result)
    );
  },


  delete: (id, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE Episode_id = ?`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  createAutoNumber: (season_id, callback) => {
    db.query(
      `SELECT COALESCE(MAX(Episode_number),0) AS maxno
       FROM ${table_name}
       WHERE Season_id = ? AND is_deleted = 0`,
      [season_id],
      (err, rows) => {
        if (err) return callback(err, null);
        const nextNo = Number(rows[0].maxno) + 1;
        db.query(
          `INSERT INTO ${table_name} (Episode_number, Season_id)
           VALUES (?, ?)`,
          [nextNo, season_id],
          (e2, r2) => {
            if (e2) return callback(e2, null);
            callback(null, { insertId: r2.insertId, number: nextNo });
          }
        );
      }
    );
  },
};

module.exports = episode;
