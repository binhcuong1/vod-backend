const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/seasonController');
const episodeController = require('../controllers/episodeController');

router.get('/', seasonController.getSeasons);
router.get('/by-film/:filmId', seasonController.getSeasonsByFilm);
router.get('/:id', seasonController.getSeasonByID);
router.post('/', seasonController.createSeason);
router.put('/:id', seasonController.updateSeason);
router.delete('/:id', seasonController.deleteSeason);

// === NEW: thao tác tập trực tiếp theo mùa ===
router.get('/:seasonId/episodes', episodeController.getEpisodesBySeason);
router.post('/:seasonId/episodes', episodeController.createEpisode); // auto-number nếu không gửi episode_number

module.exports = router;
