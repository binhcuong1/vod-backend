const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

router.get('/', ratingController.getRatings);
router.get('/film/:filmId', ratingController.getRatingsByFilm);
router.get('/profile/:profileId', ratingController.getRatingsByProfile);
router.get('/film/:filmId/average', ratingController.getAverageScore);
router.post('/', ratingController.upsertRating);
router.delete('/:profile_id/:film_id', ratingController.deleteRating);

module.exports = router;
