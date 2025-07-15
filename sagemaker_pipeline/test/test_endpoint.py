from sagemaker.predictor import Predictor
from sagemaker.serializers import JSONSerializer
from sagemaker.deserializers import JSONDeserializer

predictor = Predictor(
    endpoint_name="transaction-classifier-serverless-endpoint",
    serializer=JSONSerializer(),
    deserializer=JSONDeserializer()
)

# Input payload
payload = {
  "user_id": "000b1dd0-c880-45fd-8515-48dd705a3aa2",
  "amount": 250000,
  "txn_time": "2025-07-10T08:30:00Z",
  "msg_content": "Thanh toán Grab",
  "merchant": "Grab",
  "location": "Hà Nội",
  "channel": "MOBILE",
  "tranx_type": "qrcode_payment",
  "category_label": ""
}

# Call endpoint
response = predictor.predict(payload)
print(response)
