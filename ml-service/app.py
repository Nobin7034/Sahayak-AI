from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import io
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'document_authentication_model.h5')
model = None

def load_model():
    """Load the ML model at startup"""
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = keras.models.load_model(MODEL_PATH)
            logger.info(f"Model loaded successfully from {MODEL_PATH}")
            logger.info(f"Model input shape: {model.input_shape}")
            logger.info(f"Model output shape: {model.output_shape}")
        else:
            logger.error(f"Model file not found at {MODEL_PATH}")
            logger.error("Please place your document_authentication_model.h5 file in the ml-service/models/ directory")
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")

def preprocess_image(image_file):
    """
    Preprocess the uploaded image for model prediction
    Adjust this based on your model's training preprocessing
    """
    try:
        # Read image
        img = Image.open(io.BytesIO(image_file.read()))
        
        # Convert to RGB if needed
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to model's expected input size (adjust based on your model)
        # Common sizes: 224x224, 256x256, 299x299
        target_size = (224, 224)  # Adjust this to match your model's input
        img = img.resize(target_size)
        
        # Convert to array
        img_array = np.array(img)
        
        # Normalize pixel values (adjust based on your training)
        # Option 1: Scale to [0, 1]
        img_array = img_array / 255.0
        
        # Option 2: Standardize (if you used ImageNet preprocessing)
        # img_array = tf.keras.applications.mobilenet_v2.preprocess_input(img_array)
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'model_path': MODEL_PATH
    })

@app.route('/verify-document', methods=['POST'])
def verify_document():
    """
    Verify if a document is authentic or fake
    
    Expected request:
    - multipart/form-data with 'document' file
    
    Returns:
    - prediction: 'authentic' or 'fake'
    - confidence: confidence score (0-1)
    - details: additional information
    """
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({
                'success': False,
                'error': 'ML model not loaded. Please check server logs.'
            }), 500
        
        # Check if file is present
        if 'document' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No document file provided'
            }), 400
        
        file = request.files['document']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Empty filename'
            }), 400
        
        # Preprocess image
        try:
            processed_image = preprocess_image(file)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Image preprocessing failed: {str(e)}'
            }), 400
        
        # Make prediction
        prediction = model.predict(processed_image, verbose=0)
        
        # Interpret prediction
        # Adjust this based on your model's output
        # Assuming binary classification: 0 = fake, 1 = authentic
        confidence = float(prediction[0][0])
        
        # Threshold for classification (adjust based on your model's performance)
        threshold = 0.5
        is_authentic = confidence >= threshold
        
        result = {
            'success': True,
            'prediction': 'authentic' if is_authentic else 'fake',
            'confidence': confidence,
            'threshold': threshold,
            'details': {
                'raw_prediction': float(prediction[0][0]),
                'interpretation': 'Document appears to be authentic' if is_authentic else 'Document appears to be fake or tampered'
            }
        }
        
        logger.info(f"Prediction: {result['prediction']}, Confidence: {confidence:.4f}")
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error during verification: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Verification failed: {str(e)}'
        }), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    if model is None:
        return jsonify({
            'success': False,
            'error': 'Model not loaded'
        }), 500
    
    try:
        return jsonify({
            'success': True,
            'model_info': {
                'input_shape': str(model.input_shape),
                'output_shape': str(model.output_shape),
                'layers': len(model.layers),
                'trainable_params': int(np.sum([np.prod(v.get_shape()) for v in model.trainable_weights]))
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Load model at startup
    load_model()
    
    # Run Flask app
    port = int(os.environ.get('ML_SERVICE_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
