const poster = require('../models/posterModel');


exports.getPosters = (req, res) => {
  poster.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.getPosterByID = (req, res) => {
  const id = req.params.id;
  poster.getByID(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result)
      return res.status(404).json({ error: 'Không tìm thấy poster!' });
    res.json({ success: true, data: result });
  });
};


exports.getPostersByFilm = (req, res) => {
  const filmId = req.params.filmId;
  poster.getByFilm(filmId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.createPoster = (req, res) => {
  const { postertype_id, poster_url, film_id } = req.body;

  // Validate
  if (!postertype_id || !poster_url || !film_id) {
    return res.status(400).json({
      success: false,
      message: "postertype_id, poster_url và film_id là bắt buộc.",
    });
  }

  // Tạo mới
  poster.create({ postertype_id, poster_url, film_id }, (err, result) => {
    if (err) {
      console.error("[poster] createPoster error:", err);
      return res.status(500).json({ success: false, message: "Lỗi khi tạo poster." });
    }

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: "Đã thêm poster thành công",
    });
  });
};




exports.updatePoster = (req, res) => {
  const id = req.params.id;
  const { postertype_id, poster_url } = req.body;

  const patch = {};

  if (postertype_id !== undefined) patch.Postertype_id = postertype_id;
  if (poster_url !== undefined) patch.Poster_url = poster_url;

  poster.update(id, patch, (err, result) => {
    if (err) {
      console.error("[poster] updatePoster error:", err);
      return res.status(500).json({ success: false, message: "Lỗi khi cập nhật poster." });
    }

    res.json({
      success: true,
      affected: result.affectedRows || 0,
      message: "Cập nhật poster thành công",
    });
  });
};



exports.deletePoster = (req, res) => {
  const id = req.params.id;
  poster.delete(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy poster!' });
    res.json({ success: true });
  });
};

// 🔹 Tìm kiếm
exports.searchPosters = (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword)
    return res
      .status(400)
      .json({ success: false, error: 'Thiếu từ khóa tìm kiếm' });

  poster.search(keyword, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: result });
  });
};
