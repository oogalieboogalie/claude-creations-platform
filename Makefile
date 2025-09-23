# Claude Creations Platform
.PHONY: install dev build start test clean setup help deploy cli

help:
	@echo "Claude Creations Platform - Community Showcase"
	@echo ""
	@echo "Available commands:"
	@echo "  make setup        Complete setup and start development"
	@echo "  make install      Install dependencies"
	@echo "  make dev          Start development server"
	@echo "  make start        Start production server"
	@echo "  make test         Run tests"
	@echo "  make build        Build for production"
	@echo "  make deploy       Deploy to Vercel"
	@echo "  make cli          Install CLI tool globally"
	@echo "  make clean        Clean node_modules and database"
	@echo ""
	@echo "CLI Commands:"
	@echo "  node cli-submit.js register <username> <email> <password>"
	@echo "  node cli-submit.js submit --auto"
	@echo ""

setup: install dev

install:
	@echo "Installing dependencies..."
	npm install
	@if [ ! -f .env ]; then \
		echo "Creating environment file..."; \
		cp .env.example .env; \
		echo "✅ Environment file created from .env.example"; \
		echo "⚠️  Please update JWT_SECRET in .env for production"; \
	else \
		echo "✅ Environment file already exists"; \
	fi

dev:
	@echo "Starting development server..."
	@echo "🌐 Platform: http://localhost:3000"
	@echo "📡 API: http://localhost:3000/api"
	@echo "🔧 CLI: node cli-submit.js help"
	npm run dev

start:
	@echo "Starting production server..."
	npm start

build:
	@echo "Building for production..."
	npm run build

test:
	@echo "Running tests..."
	npm test

clean:
	@echo "Cleaning up..."
	rm -rf node_modules
	rm -f database.db
	rm -f .env

deploy:
	@echo "Deploying to Vercel..."
	@if command -v vercel >/dev/null 2>&1; then \
		vercel --prod; \
	else \
		echo "❌ Vercel CLI not installed"; \
		echo "Install with: npm i -g vercel"; \
		echo "Then run: make deploy"; \
	fi

cli:
	@echo "Installing CLI tool globally..."
	chmod +x cli-submit.js
	npm link
	@echo "✅ CLI installed! Use: claude-submit help"

# Development helpers
logs:
	@echo "Showing recent logs..."
	tail -f *.log 2>/dev/null || echo "No log files found"

status:
	@echo "Platform Status:"
	@echo "Port 3000: $$(lsof -ti:3000 >/dev/null && echo '🟢 In use' || echo '🔴 Available')"
	@echo "Database: $$([ -f database.db ] && echo '🟢 Exists' || echo '🔴 Not created')"
	@echo "Config: $$([ -f .env ] && echo '🟢 Configured' || echo '🔴 Missing')"

# Database management
db-reset:
	@echo "Resetting database..."
	rm -f database.db
	@echo "✅ Database reset (will be recreated on next start)"

db-backup:
	@echo "Backing up database..."
	cp database.db database.backup.$$(date +%Y%m%d_%H%M%S).db
	@echo "✅ Database backed up"

# Production helpers
prod-setup:
	@echo "Setting up for production..."
	NODE_ENV=production npm install --only=production
	@echo "✅ Production dependencies installed"

security-check:
	@echo "Running security audit..."
	npm audit
	@echo "✅ Security check complete"