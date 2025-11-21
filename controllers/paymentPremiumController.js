const crypto = require("crypto");
const moment = require("moment");
const db = require("../config/db");

// Sort object
function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => (sorted[k] = obj[k]));
  return sorted;
}


//  TẠO THANH TOÁN PREMIUM
exports.createPaymentPremium = async (req, res) => {
  try {
    const { amount, accountId, months } = req.body;

    if (!amount || !accountId || !months) {
      return res.status(400).json({ message: "amount, accountId, months là bắt buộc" });
    }

    const tmnCode = process.env.VNP_TMN_CODE.trim();
    const secretKey = process.env.VNP_HASH_SECRET.trim();
    const vnpUrl = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    const returnUrl =
      process.env.VNP_PREMIUM_RETURN_URL ||
      "https://p7jpjljn-3000.asse.devtunnels.ms/api/payment-premium/vnpay/return";

    const now = new Date();
    const createDate = moment(now).format("YYYYMMDDHHmmss");
    const expireDate = moment(now).add(15, "minutes").format("YYYYMMDDHHmmss");

    const ipAddr = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";

    
    const orderId = `${accountId}_${Date.now()}_${months}`;

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Amount: Math.round(Number(amount) * 100),
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
      vnp_CurrCode: "VND",
      vnp_IpAddr: ipAddr,
      vnp_Locale: "vn",
      vnp_OrderInfo: `Thanh toan Premium ${months} thang cho account ${accountId}`,
      vnp_OrderType: "premium",
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: orderId,
    };

    vnp_Params = sortObject(vnp_Params);

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(vnp_Params)) {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    }

    const signData = searchParams.toString();

    const signed = crypto
      .createHmac("sha512", secretKey)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    searchParams.append("vnp_SecureHashType", "HMACSHA512");
    searchParams.append("vnp_SecureHash", signed);

    const paymentUrl = `${vnpUrl}?${searchParams.toString()}`;

    return res.json({ paymentUrl, accountId });
  } catch (err) {
    console.error(" Lỗi createPaymentPremium:", err);
    return res.status(500).json({ message: "Lỗi tạo thanh toán Premium", error: String(err) });
  }
};


//  CALLBACK SAU KHI THANH TOÁN PREMIUM

exports.vnpayReturnPremium = (req, res) => {
  try {
    const responseCode = req.query.vnp_ResponseCode;
    const amount = req.query.vnp_Amount ? Number(req.query.vnp_Amount) / 100 : 0;

    console.log(" VNPay Premium Return:", req.query);

    if (responseCode === "00") {
      const parts = req.query.vnp_TxnRef.split("_");

      const accountId = parts[0];
      const months = Number(parts[2] || 1); 

      //  LƯU LỊCH SỬ 
      db.query(
        `INSERT INTO PremiumPayment (Account_id, Amount, Method, Paid_at, Expired_at)
         VALUES (?, ?, 'vnpay', NOW(), DATE_ADD(NOW(), INTERVAL ? MONTH))`,
        [accountId, amount, months],
        (err) => {
          if (err) console.error(" Lỗi lưu PremiumPayment:", err);
        }
      );

      //  UPDATE ACCOUNT 
      db.query(
        `UPDATE Account
         SET is_premium = 1,
             premium_expired = DATE_ADD(NOW(), INTERVAL ? MONTH)
         WHERE Account_id = ?`,
        [months, accountId],
        (err) => {
          if (err) console.error(" Lỗi cập nhật Premium Account:", err);
        }
      );

      return res.redirect(`movapp://premium-success?accountId=${accountId}`);
    }

    return res.redirect("movapp://premium-failed");
  } catch (err) {
    console.error(" Lỗi xử lý vnpayReturnPremium:", err);
    return res.status(500).send("Lỗi xử lý phản hồi Premium từ VNPay");
  }
};

//  LỊCH SỬ THANH TOÁN
exports.getPremiumHistory = (req, res) => {
  const accountId = req.params.accountId;

  db.query(
    `SELECT Payment_id, Amount, Method, Paid_at, Expired_at
     FROM PremiumPayment
     WHERE Account_id = ?
     ORDER BY Paid_at DESC`,
    [accountId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err });

      return res.json({
        success: true,
        count: results.length,
        data: results,
      });
    }
  );
};
