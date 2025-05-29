# 📘 Project Overview: Tourism Analytics System

## 🗭 Purpose
The Tourism Analytics System is designed to help tour operators, travel businesses, and destination managers gain real-time and historical insights from booking and customer data.

This project demonstrates the power of combining SQL, Python, React, and Kubernetes to support better decision-making in the tourism industry.

## 🚀 Features
- Track most booked tours
- Calculate total revenue
- Analyze average group sizes
- Identify loyal/repeat customers
- Visualize insights with charts (bar, pie, line)

## 🛠 Tech Stack
- **React** for the interactive frontend
- **Flask** (Python) for the backend API
- **MySQL** for data storage and reporting
- **Kubernetes (Minikube)** for container orchestration and dev deployment
- **GitHub** for version control and collaboration

## 📁 Folder Structure
- `/frontend` – React source code
- `/backend` – Flask API and logic
- `/k8s` – Kubernetes manifests (deployments, services, etc.)
- `/docs` – documentation and project notes
- `/sql` – schema and seed data
- `/visuals` – generated charts and exports

## 🌟 Getting Started (Local Dev)

```bash
# Start Kubernetes cluster
minikube start

# Port-forward Flask backend
kubectl port-forward service/flask-backend 5000:5000

# Port-forward React frontend
kubectl port-forward service/react-frontend 3000:80
```

Then access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/data

## 🔮 Future Enhancements (Cloud & Scale)
- Deploy MySQL database to **Amazon RDS** for remote access and backups
- Host the analytics script as a **Lambda function** triggered by data uploads
- Store booking data and visual outputs in **Amazon S3**
- Set up a **scheduled job** (CloudWatch Events) for regular report generation
- Add a **dashboard (React + API Gateway + Lambda)** for live analytics access
- Use **Ingress** to unify frontend and backend under one domain

## 👥 Author
Hermes Colina  
[GitHub](https://github.com/hermescolina) | [LinkedIn](https://www.linkedin.com/in/hermes-colina)

---

> More features and data points will be added as the project evolves.
