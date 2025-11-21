const express = require('express');
const router = express.Router();
const actorController = require('../controllers/actorController');


router.get('/', actorController.getActors);
router.get('/search', actorController.searchActors);
router.get('/:id', actorController.getActorByID);
router.post('/', actorController.createActor);
router.put('/:id', actorController.updateActor);
router.delete('/:id', actorController.deleteActor);
router.get('/:actorId/films', actorController.getFilmsByActor);

module.exports = router;
