#!/bin/bash

echo "🚀 Starting Cloudflare Tunnel..."
../cloudflared/cloudflared tunnel run tourwise > cloudflared.log 2>&1 &

echo "⏳ Waiting for Cloudflared to establish..."
sleep 15  # or use grep on log like before

echo "🐳 Starting Docker Compose stack in detached mode..."
docker-compose up -d

