-- 1. Bảng Users (Đã chuẩn hóa)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Lịch sử dịch (Nơi lưu text gốc duy nhất)
CREATE TABLE translation_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    source_lang VARCHAR(10) NOT NULL,
    target_lang VARCHAR(10) NOT NULL,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Bảng Yêu thích / Sổ tay từ vựng (Đã fix lỗi dư thừa dữ liệu)
-- Chỉ cần tham chiếu ID của lịch sử là đủ lấy ra toàn bộ nội dung
CREATE TABLE favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    history_id BIGINT NOT NULL, 
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (history_id) REFERENCES translation_history(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, history_id) -- Tránh 1 user lưu 1 câu 2 lần
);

-- 4. Bảng Đề xuất chỉnh sửa (Edits)
CREATE TABLE translation_edits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    history_id BIGINT NOT NULL, -- Sửa lại: Tham chiếu thẳng đến bản dịch bị sai
    suggested_translation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (history_id) REFERENCES translation_history(id) ON DELETE CASCADE
);

-- 5. Bảng Đánh giá bản dịch (Votes) (Đã fix lỗi UNIQUE KEY sập hệ thống)
-- Người dùng vote dựa trên ID của bản chỉnh sửa hoặc ID của lịch sử
CREATE TABLE translation_votes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    history_id BIGINT NOT NULL, -- ID của câu dịch đang được đánh giá
    vote_type ENUM('UPVOTE', 'DOWNVOTE') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (history_id) REFERENCES translation_history(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (user_id, history_id) -- Hoàn hảo: 1 user chỉ được vote 1 lần cho 1 CÂU DỊCH CỤ THỂ
);