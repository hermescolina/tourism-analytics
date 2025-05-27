# 🌍 Tourism Analytics Dashboard – TourWise

**TourWise** is an interactive tourism analytics platform built with React and Flask, now with full booking navigation and hosted on GitHub Pages!

🔗 **Live Site:** [https://hermescolina.github.io/tourism-analytics/](https://hermescolina.github.io/tourism-analytics/)

---

## 🧱 Project Structure

```
tourism-analytics/
├── backend/                # Flask backend (legacy)
├── backend-node/           # Node.js backend (current)
├── docs/                   # Diagrams and supporting documentation
├── frontend/               # React + Vite application
│   ├── dist/               # Built static site
│   ├── public/             # Static assets (images, logo, etc.)
│   └── src/                
│       ├── assets/         # Icons, backgrounds, and local images
│       ├── components/     # Reusable React components
│       └── pages/          # Tour pages and landing screens
├── frontend.bak02/         # Backup of earlier frontend iteration
├── k8s/                    # Kubernetes deployment configs
├── docker-compose.yml      # Docker multi-service setup
├── start.sh                # Launcher script for services
├── README.md               # Project overview and instructions
```

---

## 🚀 Getting Started

### 🔧 Local Setup with Minikube

```bash
# Set Docker to Minikube's environment
eval $(minikube docker-env)

# Build backend (Node.js)
cd backend-node
docker build -t node-backend .

# Build frontend (Vite + React)
cd ../frontend
docker build -t react-frontend .

# Deploy both
cd ../k8s
kubectl apply -f .

# Access frontend
minikube service react-frontend --url
```

---

## ✨ Features

- ✅ Fully responsive UI built with React + Vite
- ✅ Live chart visualization using Chart.js
- ✅ Search and filter tours by keyword
- ✅ Clickable destination cards with dynamic routing
- ✅ "Book Now" buttons open a new tab with a full listing
- ✅ Hosted on GitHub Pages
- ✅ Dockerized and Kubernetes-ready

---

## 📊 API Sample

**GET** `/api/data` returns:

```json
{
  "labels": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "values": [45, 78, 23, 90, 33]
}
```

---

## 🗺️ Pages Available

- `/` – Landing Page
- `/el-nido` – El Nido Island Hopping
- `/vigan` – Vigan Heritage Walk
- `/chocolatehills` – Chocolate Hills Tour
- `/siargao` – Siargao Surf Camp
- `/tour-cards` – Complete listing of tours

---

## 🔄 Roadmap

- [x] Add tour details and booking links
- [x] Deploy live demo on GitHub Pages
- [x] Move from Flask to Node backend
- [ ] Add form-based booking engine
- [ ] Integrate with payment gateway
- [ ] CI/CD with GitHub Actions

---

## 🖥️ Demo Preview

![Live Chart Demo](livechart.gif)

---

## 👨‍💻 Maintainer

**Hermes Colina**

- [GitHub](https://github.com/hermescolina)
- [LinkedIn](https://www.linkedin.com/in/hermescolina)

---

> Star the repo ⭐ and contribute 🚀 to make TourWise even better!
