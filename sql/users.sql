CREATE TABLE users (
    user_id        CHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    hash_pwd       VARCHAR(255),
    phone          VARCHAR(20) UNIQUE,
    identity_number VARCHAR(20) UNIQUE, -- CMND/CCCD
    full_name      VARCHAR(255),
    gender         ENUM('male', 'female', 'other') DEFAULT NULL,
    date_of_birth  DATE,
    status         TINYINT DEFAULT 0 COMMENT '0 = inactive, 1 = active, 2 = locked',
    timezone       VARCHAR(50) DEFAULT 'Asia/Ho_Chi_Minh',
    city           VARCHAR(30),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
