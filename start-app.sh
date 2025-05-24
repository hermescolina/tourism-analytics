tmux new-session \; \
  send-keys 'kubectl port-forward service/flask-backend 5000:5000' C-m \; \
  split-window -v \; \
  send-keys 'kubectl port-forward service/react-frontend 3000:80' C-m \; \
  attach

