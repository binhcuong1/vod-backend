const express = require('express');
const router = express.Router();
const filmController = require('../controllers/filmController');

router.get('/', filmController.getFilms);
router.get('/search', filmController.searchFilms);
router.get('/:id', filmController.getFilmByID);
router.post('/', filmController.createFilm);
router.put('/:id', filmController.updateFilm);
router.delete('/:id', filmController.deleteFilm);

module.exports = router;