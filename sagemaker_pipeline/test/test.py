import tensorflow as tf
import numpy as np

# model = tf.keras.models.load_model("test/model")
#
# for layer in model.layers:
#     weights = layer.get_weights()
#     for i, w in enumerate(weights):
#         if np.isnan(w).any() or np.isinf(w).any():
#             print(f"⚠️ NaN/Inf in layer {layer.name} weight {i}")


# Load TensorFlow SavedModel
model = tf.keras.models.load_model("test/model")

# Tạo input random (batch_size=1, dim=460)
X_test = np.random.rand(1, 460).astype(np.float32)

# Dự đoán
y_pred = model.predict(X_test)

# Nếu là mô hình phân loại softmax
predicted_class = np.argmax(y_pred, axis=1)

print("Predicted probabilities:", y_pred)
print("Predicted class:", predicted_class[0])

