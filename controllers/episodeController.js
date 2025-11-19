const episode = require('../models/episodeModel');
const db = require('../config/db');

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
  // ưu tiên seasonId từ params (route: /api/seasons/:seasonId/episodes)
  const season_id = req.params.seasonId ?? req.body.season_id;
  const episode_number = req.body.episode_number;
  if (!season_id) return res.status(400).json({ error: 'Thiếu season_id' });
  // nếu có episode_number -> dùng create như cũ; nếu không -> auto-number
  if (episode_number != null) {
    episode.create({ episode_number, season_id }, (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ success: true, id: result.insertId });
    });
  } else {
    episode.createAutoNumber(season_id, (err, out) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ success: true, id: out.insertId, number: out.number });
    });
  }
};

exports.createEpisodeAuto = (req, res) => {
  const seasonId = Number(req.params.season_id);
  episode.createAutoNumber(seasonId, (err, r) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, data: r });
  });
};

exports.updateEpisode = (req, res) => {
  const id = Number(req.params.id);
  const { episode_number, season_id, title, duration } = req.body || {};

  const patch = {};
  if (typeof episode_number !== 'undefined') patch.Episode_number = Number(episode_number);
  if (typeof season_id !== 'undefined') patch.Season_id = Number(season_id);
  if (typeof title !== 'undefined') patch.Title = title;           // map tên cột của bạn
  if (typeof duration !== 'undefined') patch.Duration = Number(duration);

  episode.update(id, patch, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, affected: result.affectedRows || 0 });
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

exports.getEpisodeSources = async (req, res) => {
  try {
    const episodeId = Number(req.params.id);
    if (!episodeId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid episode id" });
    }

    // dùng promise().query thay vì query
    const [filmRows] = await db.promise().query(
      `
      SELECT s.Film_id
      FROM Episode e 
      JOIN Season s ON s.Season_id = e.Season_id
      WHERE e.Episode_id = ? AND e.is_deleted = 0
      LIMIT 1
    `,
      [episodeId]
    );

    if (!filmRows || filmRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Episode not found" });
    }

    const filmId = filmRows[0].Film_id;

    const [rows] = await db.promise().query(
      `
      SELECT 
        fs.Resolution_id, 
        r.Resolution_type, 
        fs.Source_url
      FROM FilmSource fs
      JOIN Resolution r ON r.Resolution_id = fs.Resolution_id
      WHERE fs.Film_id = ? AND fs.Episode_id = ?
      ORDER BY fs.Resolution_id
    `,
      [filmId, episodeId]
    );

    return res.json({
      success: true,
      film_id: filmId,
      episode_id: episodeId,
      data: rows,
    });
  } catch (e) {
    console.error("getEpisodeSources error:", e);
    return res
      .status(500)
      .json({ success: false, message: e.message || "Server error" });
  }
};

exports.updateEpisodeSources = async (req, res) => {
  try {
    const episodeId = Number(req.params.id);
    const { sources = [] } = req.body || {};

    if (!episodeId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid episode id" });
    }

    // lấy Film_id của episode (dùng promise().query)
    const [rows] = await db.promise().query(
      `
      SELECT s.Film_id
      FROM Episode e 
      JOIN Season s ON s.Season_id = e.Season_id
      WHERE e.Episode_id = ? AND e.is_deleted = 0
      LIMIT 1
    `,
      [episodeId]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Episode not found" });
    }

    const filmId = rows[0].Film_id;

    // Xoá toàn bộ sources của tập này
    await db
      .promise()
      .query(
        `DELETE FROM FilmSource WHERE Film_id = ? AND Episode_id = ?`,
        [filmId, episodeId]
      );

    // Chuẩn bị values để insert lại
    const values = (Array.isArray(sources) ? sources : [])
      .filter((s) => s && s.resolution_id && s.source_url)
      .map((s) => [
        filmId,
        episodeId,
        Number(s.resolution_id),
        s.source_url,
      ]);

    if (values.length) {
      // INSERT nhiều dòng 1 lần
      await db
        .promise()
        .query(
          `INSERT INTO FilmSource (Film_id, Episode_id, Resolution_id, Source_url) VALUES ?`,
          [values]
        );
    }

    return res.json({
      success: true,
      film_id: filmId,
      episode_id: episodeId,
      count: values.length,
    });
  } catch (e) {
    console.error("updateEpisodeSources error:", e);
    return res
      .status(500)
      .json({ success: false, message: e.message || "Server error" });
  }
};
