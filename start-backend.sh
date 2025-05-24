cd ~/tourism-app/k8s
minikube start
kubectl port-forward service/flask-backend 5000:5000
