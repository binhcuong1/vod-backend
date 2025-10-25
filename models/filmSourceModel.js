const db = require('../config/db');
const table_name = 'FilmSource';

const filmSource = {
 
  getAll: (callback) => {
    db.query(
      `SELECT fs.*, f.Film_name, e.Episode_number, r.Resolution_type
       FROM ${table_name} fs
       LEFT JOIN Film f ON fs.Film_id = f.Film_id
       LEFT JOIN Episode e ON fs.Episode_id = e.Episode_id
       LEFT JOIN Resolution r ON fs.Resolution_id = r.Resolution_id
       WHERE fs.is_deleted = 0
       ORDER BY fs.Resolution_id`,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  // 🔹 Lấy theo Film_id hoặc Episode_id
  getByParent: (filmId, episodeId, callback) => {
    let sql = `
      SELECT fs.*, f.Film_name, e.Episode_number, r.Resolution_type
      FROM ${table_name} fs
      LEFT JOIN Film f ON fs.Film_id = f.Film_id
      LEFT JOIN Episode e ON fs.Episode_id = e.Episode_id
      LEFT JOIN Resolution r ON fs.Resolution_id = r.Resolution_id
      WHERE fs.is_deleted = 0
    `;
    const params = [];
    if (filmId) {
      sql += ' AND fs.Film_id = ?';
      params.push(filmId);
    } else if (episodeId) {
      sql += ' AND fs.Episode_id = ?';
      params.push(episodeId);
    }
    db.query(sql, params, (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },

  
  create: (data, callback) => {
    if (!data.source_url || !data.resolution_id)
      return callback({ message: 'source_url và resolution_id là bắt buộc' }, null);
    if (!data.film_id && !data.episode_id)
      return callback({ message: 'Phải có Film_id hoặc Episode_id' }, null);

    db.query(
      `INSERT INTO ${table_name} (Film_id, Episode_id, Resolution_id, Source_url)
       VALUES (?, ?, ?, ?)`,
      [data.film_id || null, data.episode_id || null, data.resolution_id, data.source_url],
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
      `UPDATE ${table_name} SET ${fields} WHERE id = ? AND is_deleted = 0`,
      values,
      (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
      }
    );
  },

  // 🔹 Xóa mềm
  delete: (filmId, episodeId, resolutionId, callback) => {
    let sql = `UPDATE ${table_name} SET is_deleted = 1 WHERE Resolution_id = ?`;
    const params = [resolutionId];

    if (filmId) {
      sql += ' AND Film_id = ?';
      params.push(filmId);
    } else if (episodeId) {
      sql += ' AND Episode_id = ?';
      params.push(episodeId);
    }

    db.query(sql, params, (err, result) => {
      if (err) return callback(err, null);
      callback(null, result);
    });
  },
};

module.exports = filmSource;
