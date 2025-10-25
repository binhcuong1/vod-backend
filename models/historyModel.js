const db = require('../config/db');
const table_name = 'History';

const history = {
  //  Lấy tất cả lịch sử (JOIN để có tên profile, phim, số tập)
  getAll: (callback) => {
    db.query(
      `SELECT h.*,
              p.Profile_name,
              f.Film_name,
              e.Episode_number
       FROM ${table_name} h
       JOIN Profile p ON h.Profile_id = p.Profile_id
       JOIN Film f ON h.Film_id = f.Film_id
       LEFT JOIN Episode e ON h.Episode_id = e.Episode_id
       WHERE h.is_deleted = 0
       ORDER BY h.last_watched DESC, h.History_id DESC`,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  //  Lấy lịch sử theo ID
  getByID: (id, callback) => {
    db.query(
      `SELECT h.*,
              p.Profile_name,
              f.Film_name,
              e.Episode_number
       FROM ${table_name} h
       JOIN Profile p ON h.Profile_id = p.Profile_id
       JOIN Film f ON h.Film_id = f.Film_id
       LEFT JOIN Episode e ON h.Episode_id = e.Episode_id
       WHERE h.History_id = ? AND h.is_deleted = 0
       LIMIT 1`,
      [id],
      (err, result) => {
        if (err) return callback(err, null);
        if (result.length === 0) return callback(null, null);
        callback(null, result[0]);
      }
    );
  },

  // Lấy lịch sử theo Profile (mặc định sắp xếp mới nhất)
  getByProfile: (profileId, callback) => {
    db.query(
      `SELECT h.*,
              f.Film_name,
              e.Episode_number
       FROM ${table_name} h
       JOIN Film f ON h.Film_id = f.Film_id
       LEFT JOIN Episode e ON h.Episode_id = e.Episode_id
       WHERE h.Profile_id = ? AND h.is_deleted = 0
       ORDER BY h.last_watched DESC, h.History_id DESC`,
      [profileId],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },


  getByComposite: (profileId, filmId, episodeId, callback) => {
    const sql = `
      SELECT * FROM ${table_name}
      WHERE Profile_id = ? AND Film_id = ? AND ${episodeId ? 'Episode_id = ?' : 'Episode_id IS NULL'}
        AND is_deleted = 0
      LIMIT 1`;
    const params = episodeId ? [profileId, filmId, episodeId] : [profileId, filmId];
    db.query(sql, params, (err, result) => {
      if (err) return callback(err, null);
      callback(null, result[0] || null);
    });
  },


  create: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name}
        (Profile_id, Film_id, Episode_id, position_seconds, duration_seconds, last_watched)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [data.profile_id, data.film_id, data.episode_id || null, data.position_seconds || 0, data.duration_seconds || 0],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },


  updateById: (id, data, callback) => {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    values.push(id);

    db.query(
      `UPDATE ${table_name} SET ${fields}, last_watched = NOW()
       WHERE History_id = ? AND is_deleted = 0`,
      values,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  //  Upsert (Profile_id, Film_id, Episode_id) – nếu tồn tại thì update, chưa có thì insert
  upsertProgress: (data, callback) => {
    // Thử update theo composite trước
    const whereEpisode = data.episode_id ? 'Episode_id = ?' : 'Episode_id IS NULL';
    const paramsUpdate = data.episode_id
      ? [data.position_seconds || 0, data.duration_seconds || 0, data.profile_id, data.film_id, data.episode_id]
      : [data.position_seconds || 0, data.duration_seconds || 0, data.profile_id, data.film_id];

    db.query(
      `UPDATE ${table_name}
       SET position_seconds = ?, duration_seconds = ?, last_watched = NOW()
       WHERE Profile_id = ? AND Film_id = ? AND ${whereEpisode} AND is_deleted = 0`,
      paramsUpdate,
      (err, result) => {
        if (err) return callback(err, null);
        if (result.affectedRows > 0) return callback(null, { affectedRows: result.affectedRows, upserted: false });

        // Chưa có -> insert mới
        db.query(
          `INSERT INTO ${table_name}
            (Profile_id, Film_id, Episode_id, position_seconds, duration_seconds, last_watched)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [data.profile_id, data.film_id, data.episode_id || null, data.position_seconds || 0, data.duration_seconds || 0],
          (err2, result2) => (err2 ? callback(err2, null) : callback(null, { insertId: result2.insertId, upserted: true }))
        );
      }
    );
  },


  deleteById: (id, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE History_id = ?`,
      [id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

 
  clearByProfile: (profileId, callback) => {
    db.query(
      `UPDATE ${table_name} SET is_deleted = 1 WHERE Profile_id = ?`,
      [profileId],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },
};

module.exports = history;
