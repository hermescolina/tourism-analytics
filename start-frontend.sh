cd ~/tourism-app/k8s
minikube start
kubectl port-forward service/react-frontend 3000:80
