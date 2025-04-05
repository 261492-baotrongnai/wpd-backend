#!/bin/bash

TAG=${1:-latest} 
# Load .env file
# export $(grep -v '^#' .env.production | xargs)

# Build Docker image
docker buildx build \
  --platform linux/arm64,linux/amd64 \
  -t apichayauwu/wpd-backend:$TAG \
  -t apichayauwu/wpd-backend:latest --push .