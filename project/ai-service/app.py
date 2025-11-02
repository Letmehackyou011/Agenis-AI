from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import IsolationForest
import pickle
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = 'isolation_forest_model.pkl'

def generate_training_data():
    np.random.seed(42)
    normal_data = []

    for _ in range(1000):
        base_load = np.random.uniform(0.3, 0.6)
        cpu = base_load * 100 + np.random.normal(0, 5)
        memory = base_load * 100 + np.random.normal(0, 8)
        network = base_load * 500 + np.random.normal(0, 30)

        normal_data.append([
            np.clip(cpu, 0, 100),
            np.clip(memory, 0, 100),
            np.clip(network, 0, 1000)
        ])

    return np.array(normal_data)

def train_model():
    print("Training Isolation Forest model...")
    training_data = generate_training_data()

    model = IsolationForest(
        contamination=0.1,
        random_state=42,
        n_estimators=100
    )
    model.fit(training_data)

    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)

    print("Model trained and saved successfully")
    return model

if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    print("Loaded existing model")
else:
    model = train_model()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json

        features = np.array([[
            float(data.get('cpu_usage', 0)),
            float(data.get('memory_usage', 0)),
            float(data.get('network_usage', 0))
        ]])

        prediction = model.predict(features)[0]
        score_samples = model.score_samples(features)[0]

        anomaly_score = -score_samples
        normalized_score = 1 / (1 + np.exp(-anomaly_score))

        is_anomaly = prediction == -1

        return jsonify({
            'anomaly': bool(is_anomaly),
            'score': float(normalized_score),
            'raw_score': float(score_samples)
        })

    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({
            'anomaly': False,
            'score': 0,
            'error': str(e)
        }), 500

@app.route('/retrain', methods=['POST'])
def retrain():
    try:
        global model
        model = train_model()
        return jsonify({'success': True, 'message': 'Model retrained successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
