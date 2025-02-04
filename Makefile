# Development environment
dev:
	@echo "Starting frontend and backend in development mode..."
	@trap 'kill %1 %2' SIGINT; \
	make frontend & make backend & wait

frontend:
	cd frontend && REACT_APP_BACKEND_URL=http://localhost:5001 npm start

backend:
	cd backend && npm run dev

# Install dependencies
install:
	@echo "Installing backend production dependencies..."
	cd backend && npm ci --only=production
	@echo "Installing frontend production dependencies..."
	cd frontend && npm ci --only=production

install-dev:
	@echo "Installing backend dependencies (including dev)..."
	cd backend && npm install
	@echo "Installing frontend dependencies (including dev)..."
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

setup: install docker-build

lint: lint-frontend lint-backend

lint-fix: lint-fix-frontend lint-fix-backend

lint-frontend:
	cd frontend && npm run lint

lint-fix-frontend:
	cd frontend && npm run lint:fix

lint-backend:
	cd backend && npm run lint

lint-fix-backend:
	cd backend && npm run lint:fix

# Default help command
help:
	@echo "Available commands:"
	@echo "  make dev          			- Run in development mode (uses dev.sh)"
	@echo "  make frontend     			- Run just the frontend"
	@echo "  make backend      			- Run just the backend"
	@echo " "
	@echo "  make install      			- Install production dependencies only"
	@echo "  make install-dev  			- Install all dependencies (including dev)"
	@echo " "
	@echo "  make docker-build 			- Build Docker images"
	@echo "  make docker-up    			- Start Docker containers"
	@echo "  make docker-down  			- Stop Docker containers"
	@echo " "
	@echo "  make clean        			- Clean up node_modules, build artifacts, and Docker resources"
	@echo "  make test         			- Run tests"
	@echo "  make lint         			- Run linting for both frontend and backend"
	@echo "  make lint-fix     			- Fix linting issues for both frontend and backend"
	@echo " "
	@echo "  make lint-frontend         		- Run linting for frontend without fix"
	@echo "  make lint-fix-frontend     		- Fix linting for frontend and fix"
	@echo " "
	@echo "  make lint-backend         		- Run linting for backend without fix"
	@echo "  make lint-fix-backend     		- Fix linting for backend and fix"
	@echo " "
	@echo "  make logs         			- View Docker logs"
	@echo "  make ps           			- List running Docker containers"
	@echo "  make setup        			- Install dependencies and build Docker images"

# Default target
.DEFAULT_GOAL := help
