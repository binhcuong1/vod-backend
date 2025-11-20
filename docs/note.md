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
