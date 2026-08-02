#!/bin/bash

# Configuration
SERVER_IP="172.16.0.1"
SERVER_USER="lawrence"
SERVER_PASS="8?dWe7z1" # NOTE: Storing passwords in scripts is not recommended for production. Use SSH keys or environment variables.
SERVER_PORT="8091"
DEPLOY_DIR="~/circuit-breaker-portal"

echo "🚀 Deploying F5 Automation Control Center to ${SERVER_IP}..."

# Check for sshpass
if ! command -v sshpass &> /dev/null; then
    echo "⚠️ sshpass is not installed."
    echo "Attempting to install via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install sshpass
    else
        echo "❌ Homebrew not found. Please install sshpass manually."
        exit 1
    fi
fi

# Common SSH options to avoid host key verification prompts in automation
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# 1. Transfer files to the server
echo "📦 Transferring files to ${SERVER_IP}:${DEPLOY_DIR}..."
sshpass -p "${SERVER_PASS}" rsync -avz -e "ssh ${SSH_OPTS}" \
           --exclude 'node_modules' \
           --exclude '.git' \
           --exclude '.svelte-kit' \
           --exclude 'build' \
           --exclude '.env' \
           . ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}

if [ $? -ne 0 ]; then
    echo "❌ File transfer failed. Please check connectivity and permissions."
    exit 1
fi

# 2. Execute deployment commands on remote server
echo "🔧 Executing remote build and deployment..."
sshpass -p "${SERVER_PASS}" ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_IP} << EOF
    # Create directory if it doesn't exist
    mkdir -p ${DEPLOY_DIR}
    cd ${DEPLOY_DIR}

    # Ensure PATH includes common locations for docker
    export PATH=\$PATH:/usr/local/bin:/opt/homebrew/bin:/bin:/usr/bin:/sbin:/usr/sbin

    # Check for Docker (requires sudo if user is not root/in docker group)
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker on the server."
        exit 1
    fi

    # Enable debug mode
    set -x
    
    echo "� Docker Environment Check:"
    which docker || echo "docker not found in PATH"
    docker --version || echo "docker command failed"
    docker ps -a || echo "docker ps failed"

    # Force remove any container related to this project
    echo "� Stopping existing containers by name..."
    if command -v docker &> /dev/null; then
        docker ps -a -q --filter "name=circuit-breaker-portal" | xargs -r docker rm -f
    fi
    
    # Try docker-compose, fall back to docker compose
    if command -v docker-compose &> /dev/null; then
        docker-compose down --remove-orphans
    else
        docker compose down --remove-orphans
    fi

    echo "� Building and starting the application..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up --build -d
    else
        docker compose up --build -d
    fi

    echo "⏳ Waiting for application to initialize..."
    sleep 10

    # Verification on remote
    if curl -f http://localhost:${SERVER_PORT} > /dev/null 2>&1; then
        echo "✅ Application started successfully on port ${SERVER_PORT}"
    else
        echo "⚠️ Application might not be ready or healthy yet. Check logs."
    fi
EOF

if [ $? -eq 0 ]; then
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Access the portal at: http://${SERVER_IP}:${SERVER_PORT}"
else
    echo "❌ Remote deployment command failed."
    exit 1
fi
