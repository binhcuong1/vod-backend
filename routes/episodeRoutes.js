const express = require('express');
const router = express.Router();
const episodeController = require('../controllers/episodeController');

router.get('/', episodeController.getEpisodes);

// Lấy danh sách tập theo Season
router.get('/by-season/:seasonId', episodeController.getEpisodesBySeason);

router.get('/:id', episodeController.getEpisodeByID);
router.post('/', episodeController.createEpisode);

// Auto create next episode number for a season
router.post('/:season_id/auto', episodeController.createEpisodeAuto);

// Cập nhật tập (mở rộng nhận { title, duration })
router.put('/:id', episodeController.updateEpisode);

// === NEW: cập nhật sources cho một tập ===
router.put('/:id/sources', episodeController.updateEpisodeSources);

// Xóa tập
router.delete('/:id', episodeController.deleteEpisode);

// PATCH: xoá route trùng (đang lặp lại)
// router.post('/episodes/:season_id/auto', episodeController.createEpisodeAuto);

module.exports = router;
