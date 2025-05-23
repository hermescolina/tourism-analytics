# 📈 Live Dashboard: React + Flask + Kubernetes

A real-time data visualization app using:

- ⚛️ React (Chart.js) frontend
- 🐍 Flask API backend
- 🐳 Docker for containerization
- ☸️ Kubernetes (Minikube) for orchestration

---

## 🧱 Project Structure

```
tourism-app/
├── backend/                # Flask API
│   ├── app.py
│   ├── Dockerfile
├── frontend/               # React dashboard
│   ├── src/
│   ├── Dockerfile
├── k8s/                    # Kubernetes YAMLs
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Build images inside Minikube:

```bash
eval $(minikube docker-env)

# Build backend
cd backend
docker build -t flask-backend .

# Build frontend
cd ../frontend
docker build -t react-frontend .
```

---

### 2. Deploy to Kubernetes

```bash
cd ../k8s
kubectl apply -f .
```

---

### 3. Access the app

```bash
minikube service react-frontend --url
```

To test the API:

```bash
minikube service flask-backend --url
```

---

## 📡 API Endpoint

```
GET /api/data
```

Returns:

```json
{
  "labels": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "values": [45, 78, 23, 90, 33]
}
```

---

## ✅ Next Steps

- Set up Ingress for clean URLs
- Add HTTPS with certs
- Connect a real database
- Deploy to EC2 or GKE
- Add GitHub Actions CI/CD

---

## 👨‍💻 Maintainer

Hermes Colina  
[LinkedIn](https://www.linkedin.com/in/hermes-colina/)  
[GitHub](https://github.com/hermescolina)