const express = require('express');
const router = express.Router();
const watchListItemController = require('../controllers/watchListItemController');

router.get('/', watchListItemController.getAllItems);
router.get('/watchlist/:watchListId', watchListItemController.getItemsByWatchList);
router.post('/', watchListItemController.addItem);
router.delete('/:watchlist_id/:film_id', watchListItemController.removeItem);

module.exports = router;
