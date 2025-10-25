const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireLogin } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireLogin, authController.me);

module.exports = router;
