const express = require('express');
const router = express.Router();
const posterController = require('../controllers/posterController');

router.get('/', posterController.getPosters);
router.get('/search', posterController.searchPosters);
router.get('/film/:filmId', posterController.getPostersByFilm);
router.get('/:id', posterController.getPosterByID);
router.post('/', posterController.createPoster);
router.put('/:id', posterController.updatePoster);
router.delete('/:id', posterController.deletePoster);

module.exports = router;
