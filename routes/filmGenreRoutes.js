const express = require('express');
const router = express.Router();
const filmGenreController = require('../controllers/filmGenreController');


router.get('/', filmGenreController.getFilmGenres);
router.get('/film/:filmId', filmGenreController.getGenresByFilm);// lay the loai cua phim
router.get('/genre/:genreId', filmGenreController.getFilmsByGenre);// lay cac phim theo the loai
router.post('/', filmGenreController.createFilmGenre);
router.delete('/:filmId/:genreId', filmGenreController.deleteFilmGenre);

module.exports = router;
