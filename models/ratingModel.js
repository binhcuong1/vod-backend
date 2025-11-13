const db = require('../config/db');
const table_name = 'Rating';

const rating = {
  //  Lấy toàn bộ đánh giá
  getAll: (callback) => {
    const sql = `
      SELECT r.*, p.Profile_name, f.Film_name
      FROM ${table_name} r
      JOIN Profile p ON r.Profile_id = p.Profile_id
      JOIN Film f ON r.Film_id = f.Film_id
      ORDER BY r.Score DESC
    `;
    db.query(sql, (err, result) => callback(err, result));
  },

  //  Lấy đánh giá theo phim
  getByFilm: (film_id, callback) => {
    const sql = `
      SELECT r.*, p.Profile_name
      FROM ${table_name} r
      JOIN Profile p ON r.Profile_id = p.Profile_id
      WHERE r.Film_id = ?
      ORDER BY r.Score DESC
    `;
    db.query(sql, [film_id], (err, result) => callback(err, result));
  },

  //  Lấy đánh giá theo người dùng
  getByProfile: (profile_id, callback) => {
    const sql = `
      SELECT r.*, f.Film_name
      FROM ${table_name} r
      JOIN Film f ON r.Film_id = f.Film_id
      WHERE r.Profile_id = ?
      ORDER BY r.Film_id DESC
    `;
    db.query(sql, [profile_id], (err, result) => callback(err, result));
  },

  //  Thêm mới hoặc cập nhật đánh giá
  upsert: (data, callback) => {
  db.query(
    `INSERT INTO ${table_name} (Profile_id, Film_id, Score, Review)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE    
       Score = VALUES(Score),
       Review = VALUES(Review)`,
    [data.profile_id, data.film_id, data.score, data.review],
    (err, result) => (err ? callback(err, null) : callback(null, result))
  );
},


  // Xóa đánh giá
  delete: (profile_id, film_id, callback) => {
    const sql = `DELETE FROM ${table_name} WHERE Profile_id = ? AND Film_id = ?`;
    db.query(sql, [profile_id, film_id], (err, result) => callback(err, result));
  },

  //  Lấy điểm trung bình của phim
  getAverageScore: (film_id, callback) => {
    const sql = `
      SELECT Film_id, ROUND(AVG(Score), 2) AS avg_score, COUNT(*) AS total_reviews
      FROM ${table_name}
      WHERE Film_id = ?
      GROUP BY Film_id
    `;
    db.query(sql, [film_id], (err, result) =>
      callback(err, result[0] || { avg_score: 0, total_reviews: 0 })
    );
  },
};

module.exports = rating;
