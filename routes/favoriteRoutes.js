const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

router.get('/', favoriteController.getFavorites);
router.get('/profile/:profileId', favoriteController.getFavoritesByProfile);
router.post('/', favoriteController.addFavorite);
router.delete('/:profile_id/:film_id', favoriteController.removeFavorite);

module.exports = router;
