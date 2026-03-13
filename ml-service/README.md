# ML Document Authentication Service

Flask-based ML service for authenticating government documents using TensorFlow.

## Quick Start

### 1. Place Your Model
Copy `document_authentication_model.h5` to `ml-service/models/`

### 2. Setup
```bash
setup.bat
```

### 3. Start Service
```bash
start-ml-service.bat
```

Service will run on `http://localhost:5001`

## API Endpoints

### Health Check
```
GET /health
```

### Verify Document
```
POST /verify-document
Content-Type: multipart/form-data
Body: document=[file]
```

### Model Info
```
GET /model-info
```

## Configuration

Edit `app.py` to adjust:
- Image preprocessing (line 35-60)
- Confidence threshold (line 120)
- Model interpretation (line 115-130)

## Testing

```bash
curl -X POST http://localhost:5001/verify-document -F "document=@test.jpg"
```

## Requirements

- Python 3.8+
- TensorFlow 2.15+
- Flask 3.0+

See `requirements.txt` for full list.

## Troubleshooting

**Model not loading?**
- Check file is in `models/` directory
- Verify it's `.h5` format

**Wrong predictions?**
- Adjust preprocessing to match training
- Modify confidence threshold

**Service not starting?**
- Run `setup.bat` first
- Check Python version (3.8+)

## Production

Use Gunicorn for production:
```bash
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

## Support

See `ML_INTEGRATION_GUIDE.md` in project root for detailed documentation.
