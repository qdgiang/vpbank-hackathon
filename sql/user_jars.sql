CREATE TABLE user_jar_spending (
    user_id                CHAR(36)                                  NOT NULL,
    year_month             CHAR(7)                                   NOT NULL,
    jar_code               VARCHAR(10)                               NOT NULL,
    percent                DECIMAL(5,2) DEFAULT 0.00                 NOT NULL,
    virtual_budget_amount  DECIMAL(15, 2) DEFAULT 0.00               NOT NULL,
    spent_amount           DECIMAL(15, 2) DEFAULT 0.00               NOT NULL,
    remaining_budget       DECIMAL(15, 2) GENERATED ALWAYS AS (virtual_budget_amount - spent_amount) STORED,
    last_income_allocation TIMESTAMP                                 NULL,
    last_spending_date     TIMESTAMP                                 NULL,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    income_type            TINYINT,
    PRIMARY KEY (user_id, year_month, jar_code),

    CONSTRAINT valid_jar_code_spending
        CHECK (jar_code IN ('NEC', 'FFA', 'EDU', 'LTSS', 'PLY', 'GIV')),
    CONSTRAINT valid_virtual_budget
        CHECK (virtual_budget_amount >= 0),
    CONSTRAINT valid_spent_amount
        CHECK (spent_amount >= 0),
    CONSTRAINT fk_user_jar_spending_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
