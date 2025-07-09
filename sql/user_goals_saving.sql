CREATE TABLE goal_setting
(
    goal_id             CHAR(36)                 DEFAULT (UUID())    NOT NULL
        PRIMARY KEY,
    user_id             CHAR(36)                                     NOT NULL,
    goal_name           VARCHAR(255)                                 NOT NULL,
    target_amount       NUMERIC(15,2)                                NOT NULL,
    current_amount      NUMERIC(15,2)            DEFAULT 0.00,
    target_date         DATE                                         NOT NULL,
    goal_type           VARCHAR(20),
    priority_level      INTEGER                   CHECK (priority_level IN (1, 2, 3)),
    weight              NUMERIC(5,2),
    is_active           BOOLEAN                   DEFAULT TRUE,
    eta_lock            BOOLEAN                   DEFAULT FALSE,
    initial_target_date DATE,
    sent_money          BOOLEAN                   DEFAULT FALSE,
    created_at          TIMESTAMP                 DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP                 DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_amounts 
        CHECK (target_amount > 0 AND current_amount >= 0),
    CONSTRAINT fk_goal_setting_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);
