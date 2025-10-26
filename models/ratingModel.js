const db = require('../config/db');
const table_name = 'Rating';

const rating = {

  getAll: (callback) => {
    db.query(
      `SELECT r.*, p.Profile_name, f.Film_name
       FROM ${table_name} r
       JOIN Profile p ON r.Profile_id = p.Profile_id
       JOIN Film f ON r.Film_id = f.Film_id
       ORDER BY r.Score DESC`,
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },


  getByFilm: (film_id, callback) => {
    db.query(
      `SELECT r.*, p.Profile_name
       FROM ${table_name} r
       JOIN Profile p ON r.Profile_id = p.Profile_id
       WHERE r.Film_id = ?
       ORDER BY r.Score DESC`,
      [film_id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },


  getByProfile: (profile_id, callback) => {
    db.query(
      `SELECT r.*, f.Film_name
       FROM ${table_name} r
       JOIN Film f ON r.Film_id = f.Film_id
       WHERE r.Profile_id = ?
       ORDER BY r.Film_id DESC`,
      [profile_id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  // 🔹 Thêm mới / cập nhật (nếu đã có)
  upsert: (data, callback) => {
    db.query(
      `INSERT INTO ${table_name} (Profile_id, Film_id, Score, Review)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE    
         Score = VALUES(Score),
         Review = VALUES(Review)`,
      [data.profile_id, data.film_id, data.episode_id || null, data.score, data.review],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },


  delete: (profile_id, film_id, callback) => {
    db.query(
      `DELETE FROM ${table_name} WHERE Profile_id = ? AND Film_id = ?`,
      [profile_id, film_id],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },


  getAverageScore: (film_id, callback) => {
    db.query(
      `SELECT Film_id, ROUND(AVG(Score), 2) AS avg_score, COUNT(*) AS total_reviews
       FROM ${table_name}
       WHERE Film_id = ?
       GROUP BY Film_id`,
      [film_id],
      (err, result) => (err ? callback(err, null) : callback(null, result[0] || null))
    );
  },
};

module.exports = rating;
