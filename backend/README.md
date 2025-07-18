
# 🧠 Flask Backend - Live Dashboard API (Single File)

This is a simple, single-file Flask backend that powers the Live Dashboard project. It returns random data for use in real-time charts.

---

## ▶️ Run the Backend

### 📦 Prerequisites

- Python 3.x
- Flask + flask-cors (install below)

### 💻 Run with Python

```bash
cd backend
pip install flask flask-cors
python app.py
```

API will be available at:

```
http://localhost:5000/api/data
```

---

## 📡 API Endpoint

- **GET `/api/data`**  
  Returns random values for weekdays:

```json
{
  "labels": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "values": [random, random, random, random, random]
}
```

---

## 📁 Files

```
backend/
└── app.py          # Standalone Flask API
```

---

## 🔧 Dev Tips

- Edit `random.randint(...)` in `app.py` to simulate different ranges.
- CORS is enabled by default for frontend access.
- Compatible with Docker and React.

---

## 👨‍💻 Maintainer

Hermes Colina  
[LinkedIn](https://www.linkedin.com/in/hermes-colina/)  
[GitHub](https://github.com/hermescolina)
