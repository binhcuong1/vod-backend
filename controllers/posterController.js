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
  if (!poster_url || !film_id)
    return res.status(400).json({ error: 'poster_url và film_id là bắt buộc' });

  poster.create({ postertype_id, poster_url, film_id }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res
      .status(201)
      .json({ success: true, id: result.insertId, message: 'Đã thêm poster thành công' });
  });
};


exports.updatePoster = (req, res) => {
  const id = req.params.id;
  const data = {};

  if (req.body.poster_url !== undefined) data.Poster_url = req.body.poster_url;
  if (req.body.postertype_id !== undefined)
    data.Postertype_id = req.body.postertype_id;
  if (req.body.film_id !== undefined) data.Film_id = req.body.film_id;

  if (Object.keys(data).length === 0)
    return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });

  poster.update(id, data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy poster!' });
    res.json({ success: true });
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
