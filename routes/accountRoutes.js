const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { requireLogin, requireRole } = require('../middlewares/authMiddleware');

router.get('/',  accountController.getAccounts);
router.get('/:id',  accountController.getAccountByID);
router.put('/:id', accountController.updateAccount);
router.delete('/:id',  accountController.deleteAccount);

module.exports = router;
