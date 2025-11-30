Thêm 2 cột title và duration cho bảng episode:
ALTER TABLE Episode
ADD COLUMN Title VARCHAR(255) NULL,
ADD COLUMN Duration INT NULL;

Thêm bảng Comment
CREATE TABLE Comment (
  Comment_id INT AUTO_INCREMENT PRIMARY KEY,
  Film_id INT NOT NULL,
  Profile_id INT NOT NULL,
  Parent_id INT NULL,
  Content TEXT NOT NULL,
  Likes INT DEFAULT 0,
  Created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Film_id) REFERENCES Film(Film_id) ON DELETE CASCADE,
  FOREIGN KEY (Profile_id) REFERENCES Profile(Profile_id) ON DELETE CASCADE,
  FOREIGN KEY (Parent_id) REFERENCES Comment(Comment_id) ON DELETE CASCADE
);

//Bo sung
ALTER TABLE Account
ADD COLUMN is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN premium_expired DATETIME NULL;

ALTER TABLE Film
ADD COLUMN is_premium_only BOOLEAN DEFAULT FALSE;

CREATE TABLE PremiumPayment (
  Payment_id INT PRIMARY KEY AUTO_INCREMENT,
  Account_id INT,
  Amount DECIMAL(10,2),
  Method VARCHAR(50),
  Paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  Expired_at DATETIME,
  FOREIGN KEY (Account_id) REFERENCES Account(Account_id)
);

// Bơm dữ liệu vào sql để làm đẹp trang dash
-- Một số phim chỉ dành cho tài khoản Premium
UPDATE Film
SET is_premium_only = 1
WHERE Film_id IN (5, 8, 10, 15, 20);


-- Gắn quyền Premium cho một vài tài khoản
UPDATE Account
SET 
  is_premium = 1,
  premium_expired = DATE_ADD(NOW(), INTERVAL 20 DAY)
WHERE Account_id = 2;

UPDATE Account
SET 
  is_premium = 1,
  premium_expired = DATE_ADD(NOW(), INTERVAL 5 DAY)
WHERE Account_id = 3;

UPDATE Account
SET 
  is_premium = 1,
  premium_expired = DATE_ADD(NOW(), INTERVAL 1 DAY)
WHERE Account_id = 4;

-- Tài khoản premium đã hết hạn
UPDATE Account
SET 
  is_premium = 0,
  premium_expired = DATE_SUB(NOW(), INTERVAL 10 DAY)
WHERE Account_id = 5;


-- Lịch sử thanh toán Premium (demo)
INSERT INTO PremiumPayment (Account_id, Amount, Method, Paid_at, Expired_at) VALUES
-- Account 2: 1 tháng trước + gần đây
(2, 79000, 'Momo', DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(DATE_ADD(NOW(), INTERVAL 5 DAY), INTERVAL 20 DAY)),
(2, 99000, 'VNPAY', DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY)),
(2, 99000, 'Momo', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 27 DAY)),

-- Account 3
(3, 99000, 'VNPAY', DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 15 DAY)),
(3, 149000, 'ZaloPay', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 25 DAY)),

-- Account 4
(4, 79000, 'Momo', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_ADD(NOW(), INTERVAL 22 DAY));


-- Favorite: phim được yêu thích
-- Profile hiện tại: 1..5 (Admin, Hồng Anh, Minh Tú, Khánh Linh, Quốc Vinh)
INSERT INTO Favorite (Profile_id, Film_id) VALUES
-- Cách Em 1 Milimet (id 5) - rất hot
(1, 5),
(2, 5),
(3, 5),
(4, 5),
(5, 5),

-- Ngự Trù Của Bạo Chúa (id 1)
(1, 1),
(2, 1),
(3, 1),
(4, 1),

-- Avatar 2: Dòng Chảy Của Nước (id 10)
(2, 10),
(3, 10),
(5, 10),

-- Nhất Tiếu Tùy Ca (id 3)
(1, 3),
(4, 3),

-- Triều Tuyết Lục (id 8)
(3, 8),
(5, 8);

-- History: lượt xem phim (demo)
-- Profile_id 1..5, Film_id tồn tại 1..20, Episode_id có thể NULL
INSERT INTO History (Profile_id, Film_id, Episode_id, position_seconds, duration_seconds, last_watched, is_deleted) VALUES
-- Trong 7 ngày gần đây
(1, 5, NULL, 1200, 6900, DATE_SUB(NOW(), INTERVAL 1 DAY), 0),
(2, 5, NULL, 3600, 6900, DATE_SUB(NOW(), INTERVAL 2 DAY), 0),
(3, 5, NULL, 4800, 6900, DATE_SUB(NOW(), INTERVAL 3 DAY), 0),
(4, 5, NULL, 600,  6900, DATE_SUB(NOW(), INTERVAL 4 DAY), 0),
(5, 5, NULL, 6900, 6900, DATE_SUB(NOW(), INTERVAL 6 DAY), 0),

(1, 1, 1, 2400, 2700, DATE_SUB(NOW(), INTERVAL 2 DAY), 0),
(2, 1, 2, 1800, 2700, DATE_SUB(NOW(), INTERVAL 5 DAY), 0),
(3, 1, 1, 2700, 2700, DATE_SUB(NOW(), INTERVAL 1 DAY), 0),

(2, 10, NULL, 2500, 3000, DATE_SUB(NOW(), INTERVAL 3 DAY), 0),
(3, 10, NULL, 3000, 3000, DATE_SUB(NOW(), INTERVAL 4 DAY), 0),
(4, 10, NULL, 1500, 3000, DATE_SUB(NOW(), INTERVAL 6 DAY), 0),

(1, 3, 3, 1800, 2400, DATE_SUB(NOW(), INTERVAL 1 DAY), 0),
(2, 3, 3, 1200, 2400, DATE_SUB(NOW(), INTERVAL 3 DAY), 0),

(3, 8, 1, 2100, 2500, DATE_SUB(NOW(), INTERVAL 2 DAY), 0),

-- Các lượt xem cũ hơn 7 ngày (không tính vào views_7_days)
(1, 4, 4, 1500, 2600, DATE_SUB(NOW(), INTERVAL 10 DAY), 0),
(2, 6, NULL, 2000, 2700, DATE_SUB(NOW(), INTERVAL 20 DAY), 0),
(3, 7, NULL, 1300, 2500, DATE_SUB(NOW(), INTERVAL 15 DAY), 0),
(4, 9, NULL, 2100, 3600, DATE_SUB(NOW(), INTERVAL 30 DAY), 0);

-- Nhiều bình luận thêm trong 7 ngày gần đây
INSERT INTO Comment (Film_id, Profile_id, Parent_id, Content, Likes, Created_at) VALUES
-- Ngày 1
(5, 1, NULL, 'Cảnh quay quá đẹp!', 4, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 2, NULL, 'Xem lần 2 vẫn hay như lần đầu.', 6, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(10, 3, NULL, 'Phim này chấm 9/10.', 2, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 4, NULL, 'Plot twist bất ngờ phết.', 3, DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Ngày 2
(5, 2, NULL, 'Nội dung sâu sắc hơn mình nghĩ.', 8, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(8, 3, NULL, 'Nhạc background nghe ổn.', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 4, NULL, 'Nam chính diễn đỉnh cao.', 7, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(10, 5, NULL, 'Hình ảnh chân thật cực kỳ.', 4, DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Ngày 3
(5, 3, NULL, 'Câu chuyện cảm động.', 3, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 1, NULL, 'Màu phim đẹp tuyệt.', 5, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 2, NULL, 'Xem rất thư giãn.', 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 4, NULL, 'Phim hơi dài nhưng đáng xem.', 1, DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Ngày 4
(5, 5, NULL, 'Cái kết làm mình bất ngờ!', 4, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 3, NULL, 'Nhân vật phụ rất thú vị.', 2, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(10, 2, NULL, 'Nội dung liền mạch và hấp dẫn.', 7, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(8, 1, NULL, 'Nhạc phim rất đã tai.', 3, DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- Ngày 5
(1, 5, NULL, 'Đáng để xem vào cuối tuần.', 6, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(10, 4, NULL, 'Phim khá ổn về tổng thể.', 2, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5, 2, NULL, 'Tình tiết cảm động.', 5, DATE_SUB(NOW(), INTERVAL 5 DAY));

