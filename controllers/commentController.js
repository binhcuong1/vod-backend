const comment = require('../models/commentModel');

// ⭐ Added: Import censor function
const censorText = require("../utils/filterText");




//  Lấy danh sách bình luận của một phim  (BẠN VIẾT 2 LẦN, GIỮ LẠI 1 LẦN)
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


// ⭐⭐⭐ THÊM MỚI: API xử lý bình luận + LỌC TỪ BẬY ⭐⭐⭐
exports.addComment = (req, res) => {
  const { film_id, profile_id, content, parent_id } = req.body;

  if (!film_id || !profile_id || !content) {
    return res.status(400).json({ success: false, error: 'Thiếu dữ liệu bắt buộc' });
  }

  // ⭐ NEW: Lọc từ bậy / từ nhạy cảm
  const filteredContent = censorText(content);

  comment.add(
    { film_id, profile_id, parent_id, content: filteredContent },
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });
      res.status(201).json({ success: true, message: 'Đã thêm bình luận thành công' });
    }
  );
};


// ⭐ Thả tim bình luận
exports.likeComment = (req, res) => {
  const { commentId } = req.params;

  comment.like(commentId, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, message: 'Đã thích bình luận' });
  });
};


// ⭐ Xóa bình luận
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


// ⭐⭐⭐ NEW: API THÊM PHẢN HỒI (Reply) — CÓ LỌC TỪ ⭐⭐⭐
exports.addReply = (req, res) => {
  const { film_id, profile_id, parent_id, content } = req.body;

  if (!film_id || !profile_id || !parent_id || !content) {
    return res.status(400).json({ success: false, error: "Thiếu dữ liệu" });
  }

  // ⭐ NEW: Lọc từ bậy / từ tục
  const filteredContent = censorText(content);

  comment.add(
    {
      film_id,
      profile_id,
      parent_id,
      content: filteredContent, // ⭐ ĐÃ LỌC TỪ
    },
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err });

      res.json({
        success: true,
        message: "Đã thêm phản hồi thành công",
      });
    }
  );
};
