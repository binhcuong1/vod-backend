const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');


router.get('/', historyController.getHistories);
// Lấy lịch sử theo Profile
router.get('/profile/:profileId', historyController.getHistoriesByProfile);
router.get('/:id', historyController.getHistoryByID);
// Upsert progress (insert/update theo Profile+Film+(Episode))
router.post('/progress', historyController.upsertProgress);
router.put('/:id', historyController.updateHistory);
router.delete('/:id', historyController.deleteHistory);
router.delete('/profile/:profileId', historyController.clearHistoryByProfile);

module.exports = router;
