const express = require('express');
const router = express.Router();
const resolutionController = require('../controllers/resolutionController');

router.get('/', resolutionController.getResolutions);
router.get('/:id', resolutionController.getResolutionByID);
router.post('/', resolutionController.createResolution);
router.put('/:id', resolutionController.updateResolution);
router.delete('/:id', resolutionController.deleteResolution);

module.exports = router;
