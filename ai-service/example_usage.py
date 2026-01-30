"""
Example usage of AI Service modules
"""
from pathlib import Path
from ai_service.temperature import TemperatureClassifier
from ai_service.face_recognition import init_arcface_v2_system

# Example 1: Temperature Classification
print("=" * 50)
print("Example 1: Temperature Classification")
print("=" * 50)

classifier = TemperatureClassifier(
    dataset_path=Path("dataset.jsonl"),
    model_path=Path("model.joblib")
)

# Predict temperature
result = classifier.predict("Cà phê đá", "Đồ uống")
print(f"Prediction: {result}")

# Collect sample
classifier.collect_sample(
    name="Trà xanh đá",
    category_name="Đồ uống",
    label="COLD",
    source="MANUAL",
    confidence=1.0
)
print("Sample collected!")

# Get stats
stats = classifier.get_stats()
print(f"Dataset stats: {stats}")

# Example 2: Face Recognition
print("\n" + "=" * 50)
print("Example 2: Face Recognition")
print("=" * 50)

# Initialize face recognition
print("Initializing face recognition...")
if init_arcface_v2_system():
    print("Face recognition initialized successfully!")
else:
    print("Face recognition initialization failed!")

print("\n" + "=" * 50)
print("Examples completed!")
print("=" * 50)
