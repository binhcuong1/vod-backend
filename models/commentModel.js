const db = require('../config/db');
const table_name = 'Comment';

const comment = {
  // Lấy toàn bộ bình luận của 1 phim (bao gồm cả phản hồi)
  getByFilm: (film_id, callback) => {
    const sql = `
      SELECT c.*, 
             p.Profile_name, 
             p.Avatar_url
      FROM ${table_name} c
      JOIN Profile p ON c.Profile_id = p.Profile_id
      WHERE c.Film_id = ?
      ORDER BY c.Created_at DESC
    `;
    db.query(sql, [film_id], (err, result) =>
      err ? callback(err, null) : callback(null, result)
    );
  },

  //  Thêm mới bình luận (Parent_id = NULL nếu là bình luận chính)
  add: (data, callback) => {
    const { film_id, profile_id, parent_id, content } = data;
    const sql = `
      INSERT INTO ${table_name} (Film_id, Profile_id, Parent_id, Content)
      VALUES (?, ?, ?, ?)
    `;
    db.query(
      sql,
      [film_id, profile_id, parent_id || null, content],
      (err, result) => (err ? callback(err, null) : callback(null, result))
    );
  },

  //  Thích bình luận (tăng 1 Like)
  like: (comment_id, callback) => {
    const sql = `
      UPDATE ${table_name}
      SET Likes = Likes + 1
      WHERE Comment_id = ?
    `;
    db.query(sql, [comment_id], (err, result) =>
      err ? callback(err, null) : callback(null, result)
    );
  },

  //  Xóa bình luận
  delete: (comment_id, callback) => {
    const sql = `
      DELETE FROM ${table_name}
      WHERE Comment_id = ?
    `;
    db.query(sql, [comment_id], (err, result) =>
      err ? callback(err, null) : callback(null, result)
    );
  },

  //  Lấy danh sách phản hồi của 1 bình luận 
  getReplies: (parent_id, callback) => {
    const sql = `
      SELECT c.*, p.Profile_name, p.Avatar_url
      FROM ${table_name} c
      JOIN Profile p ON c.Profile_id = p.Profile_id
      WHERE c.Parent_id = ?
      ORDER BY c.Created_at ASC
    `;
    db.query(sql, [parent_id], (err, result) =>
      err ? callback(err, null) : callback(null, result)
    );
  },
};

module.exports = comment;
