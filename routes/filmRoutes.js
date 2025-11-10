const express = require('express');
const router = express.Router();
const filmController = require('../controllers/filmController');


router.get('/detail/:id', filmController.getFilmDetail);
router.get('/recommendations', filmController.getRecommendations);
router.get('/home', filmController.getHomeFilms); 
router.get('/find/all', filmController.getSearchData);
router.get('/search', filmController.searchFilms);
router.get('/', filmController.getFilms);
router.get('/:id', filmController.getFilmByID);
router.post('/', filmController.createFilm);
router.put('/:id', filmController.updateFilm);
router.delete('/:id', filmController.deleteFilm);

module.exports = router;