CREATE TABLE transactions
(
    transaction_id     CHAR(36)                 DEFAULT (UUID()) NOT NULL
        PRIMARY KEY,
    user_id            CHAR(36)                                  NOT NULL,
    amount             DECIMAL(15, 2)                            NOT NULL,
    txn_time           TIMESTAMP                DEFAULT CURRENT_TIMESTAMP NOT NULL,
    msg_content        TEXT,
    merchant           VARCHAR(255),
    to_account_name    VARCHAR(255),
    location           VARCHAR(255),
    channel            VARCHAR(20),
    tranx_type         VARCHAR(30)                               NOT NULL,
    category_label     VARCHAR(10),
    is_manual_override BOOLEAN                  DEFAULT FALSE,
    created_at         TIMESTAMP                DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP                DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT valid_amount CHECK (amount <> 0),
    CONSTRAINT fk_transactions_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);