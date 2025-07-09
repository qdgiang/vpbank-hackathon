CREATE TABLE saving_goals
(
    goal_id        CHAR(36)                 DEFAULT (UUID()) NOT NULL
        PRIMARY KEY,
    user_id        CHAR(36)                                  NOT NULL,
    goal_name      VARCHAR(255)                              NOT NULL,
    target_amount  DECIMAL(15, 2)                            NOT NULL,
    current_amount DECIMAL(15, 2)           DEFAULT 0.00,
    target_date    DATE,
    goal_type      VARCHAR(20)              DEFAULT 'long_term',
    priority_level INTEGER                  DEFAULT 1,
    is_active      BOOLEAN                  DEFAULT TRUE,
    created_at     TIMESTAMP                DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP                DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT valid_amounts 
        CHECK (target_amount > 0 AND current_amount >= 0),
    CONSTRAINT fk_saving_goals_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);