const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/seasonController');


router.get('/', seasonController.getSeasons);
router.get('/by-film/:filmId', seasonController.getSeasonsByFilm);
router.get('/:id', seasonController.getSeasonByID);
router.post('/', seasonController.createSeason);
router.put('/:id', seasonController.updateSeason);
router.delete('/:id', seasonController.deleteSeason);

module.exports = router;
