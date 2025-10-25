const filmInfo = require('../models/filmInfoModel');

exports.getFilmInfos = (req, res) => {
  filmInfo.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

exports.getFilmInfoByID = (req, res) => {
  const id = req.params.id;
  filmInfo.getByID(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result) return res.status(404).json({ error: 'Không tìm thấy thông tin phim!' });
    res.json({ success: true, data: result });
  });
};

exports.createFilmInfo = (req, res) => {
  const {
    film_id,
    original_name,
    description,
    release_year,
    duration,
    maturity_rating,
    country_id,
    process_episode,
    total_episode,
    trailer_url,
    film_status,
  } = req.body;

  if (!film_id)
    return res.status(400).json({ error: 'film_id là bắt buộc' });

  const data = {
    film_id,
    original_name,
    description,
    release_year,
    duration,
    maturity_rating,
    country_id,
    process_episode,
    total_episode,
    trailer_url,
    film_status,
  };

  filmInfo.create(data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ success: true, message: 'Đã thêm thông tin phim thành công' });
  });
};

exports.updateFilmInfo = (req, res) => {
  const id = req.params.id;
  const data = {};

  const allowed = [
    'Original_name', 'Description', 'Release_year', 'Duration',
    'maturity_rating', 'Country_id', 'process_episode',
    'total_episode', 'trailer_url', 'film_status'
  ];

  for (const key of allowed) {
    const lowerKey = key.toLowerCase();
    if (req.body[lowerKey] !== undefined) data[key] = req.body[lowerKey];
  }

  if (Object.keys(data).length === 0)
    return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });

  filmInfo.update(id, data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy thông tin phim!' });
    res.json({ success: true });
  });
};

exports.deleteFilmInfo = (req, res) => {
  const id = req.params.id;
  filmInfo.delete(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy thông tin phim!' });
    res.json({ success: true });
  });
};

// Tìm kiếm theo tên gốc
exports.searchFilmInfos = (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword)
    return res.status(400).json({ success: false, error: 'Thiếu từ khóa tìm kiếm' });

  filmInfo.search(keyword, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err });
    res.json({ success: true, data: result });
  });
};
