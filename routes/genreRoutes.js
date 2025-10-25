const express = require('express');
const router = express.Router();
const genreController = require('../controllers/genreController');

router.get('/', genreController.getGenres);
router.get('/search', genreController.searchGenres);
router.get('/:id', genreController.getGenreByID);
router.post('/', genreController.createGenre);
router.put('/:id', genreController.updategenre);
router.delete('/:id', genreController.deleteGenre);

module.exports = router;