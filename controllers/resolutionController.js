const resolution = require('../models/resolutionModel');


exports.getResolutions = (req, res) => {
  resolution.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};


exports.getResolutionByID = (req, res) => {
  const id = req.params.id;
  resolution.getByID(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result) return res.status(404).json({ error: 'Không tìm thấy độ phân giải!' });
    res.json({ success: true, data: result });
  });
};


exports.createResolution = (req, res) => {
  const { resolution_type } = req.body;
  if (!resolution_type)
    return res.status(400).json({ error: 'resolution_type là bắt buộc' });

  resolution.create({ resolution_type }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ success: true, id: result.insertId });
  });
};


exports.updateResolution = (req, res) => {
  const id = req.params.id;
  const { resolution_type } = req.body;
  if (!resolution_type)
    return res.status(400).json({ error: 'resolution_type là bắt buộc' });

  resolution.update(id, { resolution_type }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy độ phân giải!' });
    res.json({ success: true });
  });
};


exports.deleteResolution = (req, res) => {
  const id = req.params.id;
  resolution.delete(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy độ phân giải!' });
    res.json({ success: true });
  });
};

