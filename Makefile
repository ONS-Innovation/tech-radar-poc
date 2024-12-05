.PHONY: dev docker docker-build docker-up docker-down install clean test

# Development environment
dev:
	./dev.sh

frontend:
	cd frontend && npm start

backend:
	cd backend && npm run dev

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Docker commands
docker-build:
	docker-compose build

docker-up:
	docker-compose up


docker-down:
	docker-compose down

# Clean up
clean:
	@echo "Cleaning up node_modules..."
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	@echo "Cleaning up build artifacts..."
	rm -rf frontend/build
	@echo "Cleaning up Docker containers and images..."
	docker-compose down --rmi all

# Run tests (add when you have tests)
test:
	cd backend && npm test
	cd frontend && npm test

# Helper commands
logs:
	docker-compose logs -f

ps:
	docker-compose ps

# Combined commands
setup: install docker-build

# Default help command
help:
	@echo "Available commands:"
	@echo "  make dev          - Run in development mode (uses dev.sh)"
	@echo "  make install      - Install dependencies for both frontend and backend"
	@echo "  make docker-build - Build Docker images"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make clean        - Clean up node_modules, build artifacts, and Docker resources"
	@echo "  make test         - Run tests"
	@echo "  make logs         - View Docker logs"
	@echo "  make ps           - List running Docker containers"
	@echo "  make setup        - Install dependencies and build Docker images"

# Default target
.DEFAULT_GOAL := help
