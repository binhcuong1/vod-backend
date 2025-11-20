const express = require("express");
const router = express.Router();
const paymentPremiumController = require("../controllers/paymentPremiumController");

router.post("/create", paymentPremiumController.createPaymentPremium);
router.get("/vnpay/return", paymentPremiumController.vnpayReturnPremium);
router.get("/history/:accountId", paymentPremiumController.getPremiumHistory);

module.exports = router;
