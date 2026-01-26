#!/bin/bash
set -e

# Configuration
IMAGE_NAME="${IMAGE_NAME:-ghcr.io/tapie-kr/api:latest}"
CONTAINER_NAME="${CONTAINER_NAME:-tapie-api}"
PORT="${PORT:-8877}"

echo "Starting deployment..."
echo "Image: $IMAGE_NAME"
echo "Container: $CONTAINER_NAME"

# Login to GHCR (if token is provided)
if [ -n "$GITHUB_TOKEN" ]; then
  echo "Logging in to GHCR..."
  echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
fi

# Pull latest image
echo "Pulling latest image..."
docker pull "$IMAGE_NAME"

# Stop and remove old container
echo "Stopping and removing old container..."
docker stop "$CONTAINER_NAME" || true
docker rm "$CONTAINER_NAME" || true

# Start new container
echo "Starting new container..."
# Use .env file if ENV_FILE_PATH is set, otherwise use individual -e flags
if [ -n "$ENV_FILE_PATH" ] && [ -f "$ENV_FILE_PATH" ]; then
  echo "Using .env file: $ENV_FILE_PATH"
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p "$PORT:8877" \
    --env-file "$ENV_FILE_PATH" \
    "$IMAGE_NAME"
else
  echo "Warning: ENV_FILE_PATH not set or file not found. Using individual environment variables."
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p "$PORT:8877" \
    "$IMAGE_NAME"
fi

# Clean up old images
echo "Cleaning up old images..."
docker image prune -f

echo "Deployment completed successfully!"

