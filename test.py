import importlib.util
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load the delete_goal Lambda module
spec = importlib.util.spec_from_file_location("pause_goal", "./lambda/pause_goal/index.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

# --- Replace these with actual values in your database ---
user_id = "789"
goal_id = "1752446290.595106Vacat"  # <- set a real, active goal_id from your DB

# Construct test event
event = {
    "user_id": user_id,
    "goal_id": goal_id
}

# Run Lambda function
response = module.lambda_handler(event, None)

# Pretty print the result
print("Lambda Response:")
print(json.dumps(json.loads(response["body"]), indent=2))
