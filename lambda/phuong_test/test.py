#!/usr/bin/env python3
"""
Simple test script for phuong_test lambda function
"""

import json
import sys
import os

# Add the lambda directory to the path for testing
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_handler():
    """Test the lambda handler function"""
    try:
        # Import the handler
        from index import handler
        
        # Create a test event
        test_event = {
            "test": True,
            "message": "Test invocation of phuong_test lambda"
        }
        
        # Create a mock context
        class MockContext:
            def __init__(self):
                self.function_name = "phuong_test"
                self.function_version = "$LATEST"
                self.invoked_function_arn = "arn:aws:lambda:ap-southeast-2:123456789012:function:phuong_test"
                self.memory_limit_in_mb = 256
                self.remaining_time_in_millis = lambda: 30000
                self.log_group_name = "/aws/lambda/phuong_test"
                self.log_stream_name = "2023/01/01/[$LATEST]abcdefg"
                self.aws_request_id = "12345678-1234-1234-1234-123456789012"
        
        context = MockContext()
        
        # Call the handler
        print("Testing phuong_test lambda handler...")
        result = handler(test_event, context)
        
        print("Handler result:")
        print(json.dumps(result, indent=2))
        
        return result
        
    except Exception as e:
        print(f"Test failed: {str(e)}")
        return None

if __name__ == "__main__":
    test_handler()
