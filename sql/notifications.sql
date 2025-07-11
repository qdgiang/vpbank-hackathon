CREATE TABLE notifications
(
    notification_id   CHAR(36)                 DEFAULT (UUID())    NOT NULL
        PRIMARY KEY,
    user_id           CHAR(36)                                    NOT NULL,
    notification_type VARCHAR(50)                                 NOT NULL,
    object_code       VARCHAR(50),
    object_id   CHAR(36),
    title             VARCHAR(255)                                NOT NULL,
    message           TEXT                                        NOT NULL,
    severity          VARCHAR(20)              DEFAULT 'info'     NOT NULL,
    status            INTEGER                  DEFAULT 0,
    created_at        TIMESTAMP                DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);