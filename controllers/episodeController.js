const episode = require('../models/episodeModel');


exports.getEpisodes = (req, res) => {
  episode.getAll((err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

exports.getEpisodesBySeason = (req, res) => {
  const seasonId = req.params.seasonId;
  episode.getBySeason(seasonId, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true, data: result });
  });
};

exports.getEpisodeByID = (req, res) => {
  const id = req.params.id;
  episode.getByID(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (!result) return res.status(404).json({ error: 'Không tìm thấy tập phim!' });
    res.json({ success: true, data: result });
  });
};


exports.createEpisode = (req, res) => {
  const { episode_number, season_id } = req.body;
  if (!episode_number || !season_id)
    return res.status(400).json({ error: 'episode_number và season_id là bắt buộc' });

  episode.create({ episode_number, season_id }, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(201).json({ success: true, id: result.insertId });
  });
};


exports.updateEpisode = (req, res) => {
  const id = req.params.id;
  const data = {};

  if (req.body.episode_number !== undefined)
    data.Episode_number = req.body.episode_number;
  if (req.body.season_id !== undefined)
    data.Season_id = req.body.season_id;

  if (Object.keys(data).length === 0)
    return res.status(400).json({ error: 'Không có dữ liệu để cập nhật' });

  episode.update(id, data, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy tập phim!' });
    res.json({ success: true });
  });
};


exports.deleteEpisode = (req, res) => {
  const id = req.params.id;
  episode.delete(id, (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Không tìm thấy tập phim!' });
    res.json({ success: true });
  });
};
