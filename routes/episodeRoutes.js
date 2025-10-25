const express = require('express');
const router = express.Router();
const episodeController = require('../controllers/episodeController');

router.get('/', episodeController.getEpisodes);
//  Lấy danh sách tập theo Season
router.get('/by-season/:seasonId', episodeController.getEpisodesBySeason);
router.get('/:id', episodeController.getEpisodeByID);
router.post('/', episodeController.createEpisode);
router.put('/:id', episodeController.updateEpisode);
router.delete('/:id', episodeController.deleteEpisode);

module.exports = router;
