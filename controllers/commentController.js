const comment = require('../models/commentModel');

//  Lấy danh sách bình luận của một phim
exports.getCommentsByFilm = (req, res) => {
  const { filmId } = req.params;
  comment.getByFilm(filmId, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });

    //  phản hồi lồng nhau 
    const map = {};
    result.forEach(c => (map[c.Comment_id] = { ...c, replies: [] }));
    const roots = [];
    result.forEach(c => {
      if (c.Parent_id) {
        map[c.Parent_id]?.replies.push(map[c.Comment_id]);
      } else {
        roots.push(map[c.Comment_id]);
      }
    });

    res.json({ success: true, data: roots });
  });
};

// Thêm mới bình luận (hoặc phản hồi)
exports.addComment = (req, res) => {
  const { film_id, profile_id, content, parent_id } = req.body;

  if (!film_id || !profile_id || !content) {
    return res.status(400).json({ success: false, error: 'Thiếu dữ liệu bắt buộc' });
  }

  comment.add({ film_id, profile_id, parent_id, content }, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.status(201).json({ success: true, message: 'Đã thêm bình luận thành công' });
  });
};

// Like bình luận
exports.likeComment = (req, res) => {
  const { commentId } = req.params;

  comment.like(commentId, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: 'Đã thích bình luận' });
  });
};

//  Xóa bình luận
exports.deleteComment = (req, res) => {
  const { commentId } = req.params;

  comment.delete(commentId, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, error: 'Không tìm thấy bình luận để xóa' });

    res.json({ success: true, message: 'Đã xóa bình luận' });
  });
};

//  Lấy phản hồi của một bình luận
exports.getReplies = (req, res) => {
  const { parentId } = req.params;

  comment.getReplies(parentId, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: result });
  });
};
