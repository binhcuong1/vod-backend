const express = require('express');
const router = express.Router();
const posterTypeController = require('../controllers/posterTypeController');

router.get('/', posterTypeController.getPosterTypes);
router.get('/:id', posterTypeController.getPosterTypeByID);
router.post('/', posterTypeController.createPosterType);
router.put('/:id', posterTypeController.updatePosterType);
router.delete('/:id', posterTypeController.deletePosterType);

module.exports = router;
