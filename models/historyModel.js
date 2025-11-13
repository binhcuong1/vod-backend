// models/historyModel.js
const db = require('../config/db');
const table_name = 'History';

const history = {
  // 🔹 Lấy tất cả lịch sử
  getAll: (callback) => {
    db.query(
      `SELECT h.*, p.Profile_name, f.Film_name, e.Episode_number
       FROM ${table_name} h
       JOIN Profile p ON h.Profile_id = p.Profile_id
       JOIN Film f ON h.Film_id = f.Film_id
       LEFT JOIN Episode e ON h.Episode_id = e.Episode_id
       WHERE h.is_deleted = 0
       ORDER BY h.last_watched DESC, h.History_id DESC`,
      (err, result) => (err ? callback(err) : callback(null, result))
    );
  },

  // 🔹 Lấy lịch sử theo ID
  getByID: (id, callback) => {
    db.query(
      `SELECT h.*, p.Profile_name, f.Film_name, e.Episode_number
       FROM ${table_name} h
       JOIN Profile p ON h.Profile_id = p.Profile_id
       JOIN Film f ON h.Film_id = f.Film_id
       LEFT JOIN Episode e ON h.Episode_id = e.Episode_id
       WHERE h.History_id = ? AND h.is_deleted = 0
       LIMIT 1`,
      [id],
      (err, result) => {
        if (err) return callback(err);
        callback(null, result[0] || null);
      }
    );
  },

  // 🔹 Lấy lịch sử theo Profile
  getByProfile: (profileId, callback) => {
    db.query(
      `SELECT h.*, f.Film_name, e.Episode_number
       FROM ${table_name} h
       JOIN Film f ON h.Film_id = f.Film_id
       LEFT JOIN Episode e ON h.Episode_id = e.Episode_id
       WHERE h.Profile_id = ? AND h.is_deleted = 0
       ORDER BY h.last_watched DESC, h.History_id DESC`,
      [profileId],
      (err, result) => (err ? callback(err) : callback(null, result))
    );
  },

  // 🔹 Lấy theo cặp (Profile, Film, Episode)
  getByComposite: (profileId, filmId, episodeId, callback) => {
    const sql = `
      SELECT * FROM ${table_name}
      WHERE Profile_id = ? AND Film_id = ? AND ${episodeId ? 'Episode_id = ?' : 'Episode_id IS NULL'}
        AND is_deleted = 0
      LIMIT 1`;
    const params = episodeId ? [profileId, filmId, episodeId] : [profileId, filmId];
    db.query(sql, params, (err, result) => {
      if (err) return callback(err);
      callback(null, result[0] || null);
    });
  },

  // 🔹 Tạo bản ghi mới
  create: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name}
        (Profile_id, Film_id, Episode_id, position_seconds, duration_seconds, last_watched)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [data.profile_id, data.film_id, data.episode_id || null, data.position_seconds || 0, data.duration_seconds || 0],
      (err, result) => (err ? callback(err) : callback(null, result))
    );
  },

  // 🔹 Cập nhật theo ID
  updateById: (id, data, callback) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(data), id];
    db.query(
      `UPDATE ${table_name} SET ${fields}, last_watched = NOW()
       WHERE History_id = ? AND is_deleted = 0`,
      values,
      (err, result) => (err ? callback(err) : callback(null, result))
    );
  },

  // 🔹 Upsert tiến độ xem
  upsertProgress: (data, callback) => {
    const { profile_id, film_id, episode_id, position_seconds = 0, duration_seconds = 0 } = data;

    if (position_seconds < 5) {
      return callback(null, { skipped: true });
    }

    const whereEpisode = episode_id ? 'Episode_id = ?' : 'Episode_id IS NULL';
    const paramsUpdate = episode_id
      ? [position_seconds, duration_seconds, profile_id, film_id, episode_id]
      : [position_seconds, duration_seconds, profile_id, film_id];

    const sqlUpdate = `
      UPDATE ${table_name}
      SET position_seconds = ?, duration_seconds = ?, last_watched = NOW()
      WHERE Profile_id = ? AND Film_id = ? AND ${whereEpisode} AND is_deleted = 0`;

    db.query(sqlUpdate, paramsUpdate, (err, result) => {
      if (err) return callback(err);
      if (result.affectedRows > 0)
        return callback(null, { affectedRows: result.affectedRows, upserted: false });

      const sqlInsert = `
        INSERT INTO ${table_name}
          (Profile_id, Film_id, Episode_id, position_seconds, duration_seconds, last_watched)
        VALUES (?, ?, ?, ?, ?, NOW())`;
      const paramsInsert = [profile_id, film_id, episode_id || null, position_seconds, duration_seconds];
      db.query(sqlInsert, paramsInsert, (err2, result2) => {
        if (err2) return callback(err2);
        callback(null, { insertId: result2.insertId, upserted: true });
      });
    });
  },

  // 🔹 Xóa mềm theo ID
  deleteById: (id, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE History_id = ?`,
      [id],
      (err, result) => (err ? callback(err) : callback(null, result))
    );
  },

  // 🔹 Xóa mềm toàn bộ theo profile
  clearByProfile: (profileId, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE Profile_id = ?`,
      [profileId],
      (err, result) => (err ? callback(err) : callback(null, result))
    );
  },

  // 🔹 Lấy danh sách phim "Xem tiếp" (chỉ tập mới nhất mỗi phim)
getContinueWatching: (profileId, callback) => {
  const sql = `
    SELECT 
      h.History_id,
      h.Film_id,
      f.Film_name,
      h.Episode_id,
      e.Episode_number,
      h.position_seconds,
      h.duration_seconds,
      h.last_watched,
      (
        SELECT Poster_url
        FROM Poster p
        WHERE p.Film_id = f.Film_id 
          AND p.Postertype_id = 1 
          AND p.is_deleted = 0
        LIMIT 1
      ) AS poster_url
    FROM ${table_name} h
    JOIN Film f ON f.Film_id = h.Film_id
    LEFT JOIN Episode e ON e.Episode_id = h.Episode_id
    WHERE h.Profile_id = ?
      AND h.is_deleted = 0
      AND h.position_seconds >= 5
      AND h.duration_seconds >= 60
      AND h.position_seconds < (h.duration_seconds - 30)
      AND h.History_id IN (
        SELECT MAX(h2.History_id)
        FROM ${table_name} h2
        WHERE h2.Profile_id = h.Profile_id
          AND h2.is_deleted = 0
        GROUP BY h2.Film_id
      )
    ORDER BY h.last_watched DESC, h.History_id DESC
    LIMIT 10`;

  db.query(sql, [profileId], (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
},
};

module.exports = history;
