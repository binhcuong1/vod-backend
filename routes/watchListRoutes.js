const express = require('express');
const router = express.Router();
const watchListController = require('../controllers/watchListController');

router.get('/', watchListController.getWatchLists);
router.get('/profile/:profileId', watchListController.getWatchListsByProfile);
router.get('/search', watchListController.searchWatchLists);
router.get('/:id', watchListController.getWatchListByID);
router.post('/', watchListController.createWatchList);
router.put('/:id', watchListController.updateWatchList);
router.delete('/:id', watchListController.deleteWatchList);

module.exports = router;
