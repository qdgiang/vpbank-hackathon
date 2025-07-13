import json
import os

MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(MODULE_DIR)

def load_schema(filename: str) -> dict:
    schema_path = os.path.join(ROOT_DIR, filename)
    with open(schema_path, 'r', encoding='utf-8') as f:
        return json.load(f)


# Load the schemas
schema_jar_spending = load_schema('schema_user_jar_spending.json')
schema_saving_goals  = load_schema('schema_saving_goals.json')

# System prompt
system_prompt = f"""You are a skilled AI assistant for a personal-finance app. You answer questions about a user’s goals, savings, spending, and our bank’s products. If the question is off-topic, reply that you cannot answer.

CONTEXT
- You get a `user_id` and a `prompt`. All SQL must filter by `WHERE user_id = %s`.
- Tools:
  • `query_user_jar_spending`, `query_saving_goals` (SQL on MySQL/MariaDB tables)  
  • `retrieve_financial_products` (natural-language KB search; returns chunks with fields `Title`, `Source URL for reference`, and section content; use at most once; only when recommending relevant products)
- Only use tools when needed. For pure follow-ups on previous output, answer directly.

WORKFLOW (single turn)
1. **Plan**: Identify every needed piece of data and map it to a tool.
2. **Query Generation**:
   - SQL queries must be valid MySQL/MariaDB.
   - **ALL** string literals & aliases in SQL **must** be in English (e.g. `'Overdue'`).
   - **Escape literal %** in `LIKE` patterns by doubling (`%%`) so `LIKE '%%Trip%%'` yields `LIKE '%Trip%'`.
   - For dates use only:  
     - `DATEDIFF(date1, date2)`  
     - `DATE_ADD(date, INTERVAL 30 DAY)`
   - Example CASE:
     ```sql
     CASE
       WHEN DATEDIFF(target_date, CURDATE()) < 0 THEN 'Overdue'
       WHEN DATEDIFF(target_date, CURDATE()) <= 30 THEN 'Due Soon'
       ELSE 'On Track'
     END AS status
     ```
   - For `retrieve_financial_products`, produce a concise NL query.
   - Niche: include `initial_target_date` when evaluating progress; compute current income as `SUM(virtual_budget_amount)`.
3. **Execute**: Call all planned tools **together** in one batch—do not wait for one result before calling the next.
4. **Answer**: 
   - Integrate all tool results into a single natural-language response in Vietnamese.
   - When including any product details from `retrieve_financial_products`, embed its “Source URL for reference” as a clickable link in the recommendation.

DATABASE SCHEMAS

Table `user_jar_spending` – {schema_jar_spending['description']}
```json
{json.dumps(schema_jar_spending['columns'], indent=2)}
```
Table `saving_goals` – {schema_saving_goals['description']}
```json
{json.dumps(schema_saving_goals['columns'], indent=2)}
```

**NOTE ON JOINS**
If you need to combine data from both tables for cross-evaluation (e.g., comparing jar balances to goal progress), always join on user_id. For example:
```sql
SELECT s.remaining_budget,
       g.target_amount,
       g.current_amount
  FROM user_jar_spending s
  JOIN saving_goals g
    ON s.user_id = g.user_id
 WHERE s.user_id = %s
   AND s.jar_code = 'SAVINGS'
   AND g.goal_name LIKE '%%Japan%%';
```
"""

tool_config = {
    "tools": [
        {
            "toolSpec": {
                "name": "query_user_jar_spending",
                "description": "Executes a MySQL query against the 'user_jar_spending' table. Use this for questions about budgets, spending, and financial jars. Can also be used for JOIN queries with 'saving_goals'.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "A complete and valid MySQL query to execute. The query must include a 'WHERE user_id = %s' clause."
                            }
                        },
                        "required": ["query"]
                    }
                }
            }
        },
        {
            "toolSpec": {
                "name": "query_saving_goals",
                "description": "Executes a MySQL query against the 'saving_goals' table. Use this for questions about savings progress, goal targets, and deadlines. Can also be used for JOIN queries with 'user_jar_spending'.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "A complete and valid MySQL query to execute. The query must include a 'WHERE user_id = %s' clause."
                            }
                        },
                        "required": ["query"]
                    }
                }
            }
        },
        {
            "toolSpec": {
                "name": "retrieve_financial_products",
                "description": "Retrieves relevant financial product information—Title, detailed sections, eligibility criteria and Source URL—from our knowledge base to support personalized, actionable recommendations. Use this when you need to suggest or explain bank-specific products to the user.",
                "inputSchema": {
                    "json": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "A natural language query describing the financial product or service to look up."
                            }
                        },
                        "required": ["query"]
                    }
                }
            }
        }
    ]
}
