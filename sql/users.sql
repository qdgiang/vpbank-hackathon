CREATE TABLE users
(
    user_id       CHAR(36)                 DEFAULT (UUID()) NOT NULL
        PRIMARY KEY,
    email         VARCHAR(255)                              NOT NULL
        UNIQUE,
    phone         VARCHAR(20),
    full_name     VARCHAR(255),
    date_of_birth DATE,
    created_at    TIMESTAMP                DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP                DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active     BOOLEAN                  DEFAULT TRUE,
    timezone      VARCHAR(50)              DEFAULT 'Asia/Ho_Chi_Minh',
    city          VARCHAR(30)
);