Thêm 2 cột title và duration cho bảng episode:
ALTER TABLE Episode
ADD COLUMN Title VARCHAR(255) NULL,
ADD COLUMN Duration INT NULL;