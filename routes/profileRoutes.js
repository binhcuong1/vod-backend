const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.getProfiles);
router.get('/account/:accountId', profileController.getProfileByAccount);
router.get('/search', profileController.searchProfiles);
router.get('/:id', profileController.getProfileByID);
router.post('/', profileController.createProfile);
router.put('/:id', profileController.updateProfile);
router.delete('/:id', profileController.deleteProfile);

module.exports = router;
