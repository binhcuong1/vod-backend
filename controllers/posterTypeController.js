const posterType = require('../models/posterTypeModel');


exports.getPosterTypes = (req, res) => {
  posterType.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.getPosterTypeByID = (req, res) => {
  const id = req.params.id;
  posterType.getByID(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result)
      return res.status(404).json({ error: 'Không tìm thấy loại poster!' });
    res.json({ success: true, data: result });
  });
};


exports.createPosterType = (req, res) => {
  const { postertype_name } = req.body;
  if (!postertype_name)
    return res
      .status(400)
      .json({ error: 'postertype_name là bắt buộc' });

  posterType.create({ postertype_name }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res
      .status(201)
      .json({ success: true, id: result.insertId, message: 'Đã thêm loại poster' });
  });
};


exports.updatePosterType = (req, res) => {
  const id = req.params.id;
  const { postertype_name } = req.body;
  if (!postertype_name)
    return res.status(400).json({ error: 'postertype_name là bắt buộc' });

  posterType.update(id, { postertype_name }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy loại poster!' });
    res.json({ success: true });
  });
};


exports.deletePosterType = (req, res) => {
  const id = req.params.id;
  posterType.delete(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy loại poster!' });
    res.json({ success: true });
  });
};


