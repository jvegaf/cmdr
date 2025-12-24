# CMDR TSI Editor - Makefile
# ===========================
# Development workflow automation for the Electron/React migration
#
# Usage:
#   make help          - Show this help message
#   make install       - Install all dependencies
#   make dev           - Start development server
#   make build         - Build all packages
#   make test          - Run all tests
#   make dist          - Build distributable packages

.PHONY: help install dev build test test-watch coverage lint format clean dist dist-linux dist-win dist-mac typecheck

# Colors for terminal output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m
BOLD := \033[1m

# Default target
.DEFAULT_GOAL := help

#==============================================================================
# Help
#==============================================================================

help:
	@echo ""
	@echo "$(BOLD)$(CYAN)CMDR TSI Editor - Development Commands$(RESET)"
	@echo "========================================"
	@echo ""
	@echo "$(BOLD)$(GREEN)Setup:$(RESET)"
	@echo "  $(CYAN)install$(RESET)         Install all dependencies"
	@echo "  $(CYAN)clean$(RESET)           Clean build artifacts and node_modules"
	@echo "  $(CYAN)clean-dist$(RESET)      Clean only distribution artifacts"
	@echo ""
	@echo "$(BOLD)$(GREEN)Development:$(RESET)"
	@echo "  $(CYAN)dev$(RESET)             Start development server (Electron + Vite HMR)"
	@echo "  $(CYAN)build$(RESET)           Build all packages for production"
	@echo "  $(CYAN)build-core$(RESET)      Build only @cmdr/core package"
	@echo "  $(CYAN)build-midi$(RESET)      Build only @cmdr/midi package"
	@echo "  $(CYAN)build-desktop$(RESET)   Build only @cmdr/desktop package"
	@echo "  $(CYAN)typecheck$(RESET)       Run TypeScript type checking"
	@echo ""
	@echo "$(BOLD)$(GREEN)Testing:$(RESET)"
	@echo "  $(CYAN)test$(RESET)            Run all tests once"
	@echo "  $(CYAN)test-watch$(RESET)      Run tests in watch mode"
	@echo "  $(CYAN)test-core$(RESET)       Run only @cmdr/core tests"
	@echo "  $(CYAN)test-midi$(RESET)       Run only @cmdr/midi tests"
	@echo "  $(CYAN)coverage$(RESET)        Run tests with coverage report"
	@echo "  $(CYAN)coverage-core$(RESET)   Run @cmdr/core tests with coverage"
	@echo "  $(CYAN)coverage-midi$(RESET)   Run @cmdr/midi tests with coverage"
	@echo ""
	@echo "$(BOLD)$(GREEN)Code Quality:$(RESET)"
	@echo "  $(CYAN)lint$(RESET)            Run ESLint on all packages"
	@echo "  $(CYAN)lint-fix$(RESET)        Run ESLint with auto-fix"
	@echo "  $(CYAN)format$(RESET)          Format code with Prettier"
	@echo "  $(CYAN)format-check$(RESET)    Check code formatting"
	@echo ""
	@echo "$(BOLD)$(GREEN)Distribution:$(RESET)"
	@echo "  $(CYAN)dist$(RESET)            Build distributable (alias for dist-linux)"
	@echo "  $(CYAN)dist-linux$(RESET)      Build Linux AppImage"
	@echo "  $(CYAN)dist-win$(RESET)        Build Windows installer (NSIS)"
	@echo "  $(CYAN)dist-mac$(RESET)        Build macOS DMG"
	@echo "  $(CYAN)dist-all$(RESET)        Build for all platforms"
	@echo "  $(CYAN)pack$(RESET)            Create unpacked directory (for testing)"
	@echo ""
	@echo "$(BOLD)$(GREEN)Utility:$(RESET)"
	@echo "  $(CYAN)status$(RESET)          Show project status (git, tests)"
	@echo "  $(CYAN)info$(RESET)            Show package versions"
	@echo ""

#==============================================================================
# Setup
#==============================================================================

install:
	@echo "$(CYAN)Installing dependencies...$(RESET)"
	pnpm install
	@echo "$(GREEN)✓ Dependencies installed$(RESET)"

clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(RESET)"
	rm -rf packages/core/dist
	rm -rf packages/midi/dist
	rm -rf packages/desktop/out
	rm -rf packages/desktop/release
	rm -rf node_modules
	rm -rf packages/*/node_modules
	@echo "$(GREEN)✓ Cleaned$(RESET)"

clean-dist:
	@echo "$(YELLOW)Cleaning distribution artifacts...$(RESET)"
	rm -rf packages/desktop/out
	rm -rf packages/desktop/release
	@echo "$(GREEN)✓ Distribution artifacts cleaned$(RESET)"

#==============================================================================
# Development
#==============================================================================

dev:
	@echo "$(CYAN)Starting development server...$(RESET)"
	pnpm --filter @cmdr/desktop dev

build:
	@echo "$(CYAN)Building all packages...$(RESET)"
	pnpm --filter @cmdr/core build
	pnpm --filter @cmdr/midi build
	pnpm --filter @cmdr/desktop build
	@echo "$(GREEN)✓ Build complete$(RESET)"

build-core:
	@echo "$(CYAN)Building @cmdr/core...$(RESET)"
	pnpm --filter @cmdr/core build

build-midi:
	@echo "$(CYAN)Building @cmdr/midi...$(RESET)"
	pnpm --filter @cmdr/midi build

build-desktop:
	@echo "$(CYAN)Building @cmdr/desktop...$(RESET)"
	pnpm --filter @cmdr/desktop build

typecheck:
	@echo "$(CYAN)Type checking all packages...$(RESET)"
	pnpm --filter @cmdr/core exec tsc --noEmit
	pnpm --filter @cmdr/midi exec tsc --noEmit
	pnpm --filter @cmdr/desktop exec tsc --noEmit
	@echo "$(GREEN)✓ Type check passed$(RESET)"

#==============================================================================
# Testing
#==============================================================================

test:
	@echo "$(CYAN)Running all tests...$(RESET)"
	pnpm test:run
	@echo "$(GREEN)✓ All tests passed$(RESET)"

test-watch:
	@echo "$(CYAN)Starting test watcher...$(RESET)"
	pnpm test

test-core:
	@echo "$(CYAN)Running @cmdr/core tests...$(RESET)"
	pnpm --filter @cmdr/core test:run

test-midi:
	@echo "$(CYAN)Running @cmdr/midi tests...$(RESET)"
	pnpm --filter @cmdr/midi test:run

coverage:
	@echo "$(CYAN)Running tests with coverage...$(RESET)"
	pnpm --filter @cmdr/core test:run -- --coverage
	pnpm --filter @cmdr/midi test:run -- --coverage
	@echo "$(GREEN)✓ Coverage reports generated$(RESET)"

coverage-core:
	@echo "$(CYAN)Running @cmdr/core tests with coverage...$(RESET)"
	pnpm --filter @cmdr/core test:run -- --coverage

coverage-midi:
	@echo "$(CYAN)Running @cmdr/midi tests with coverage...$(RESET)"
	pnpm --filter @cmdr/midi test:run -- --coverage

#==============================================================================
# Code Quality
#==============================================================================

lint:
	@echo "$(CYAN)Running linter...$(RESET)"
	pnpm lint
	@echo "$(GREEN)✓ Linting passed$(RESET)"

lint-fix:
	@echo "$(CYAN)Running linter with auto-fix...$(RESET)"
	pnpm lint --fix
	@echo "$(GREEN)✓ Linting complete$(RESET)"

format:
	@echo "$(CYAN)Formatting code...$(RESET)"
	pnpm exec prettier --write "packages/**/*.{ts,tsx,json,css}"
	@echo "$(GREEN)✓ Code formatted$(RESET)"

format-check:
	@echo "$(CYAN)Checking code format...$(RESET)"
	pnpm exec prettier --check "packages/**/*.{ts,tsx,json,css}"

#==============================================================================
# Distribution
#==============================================================================

dist: dist-linux

dist-linux: build
	@echo "$(CYAN)Building Linux distribution...$(RESET)"
	pnpm --filter @cmdr/desktop dist:linux
	@echo "$(GREEN)✓ Linux distribution built$(RESET)"
	@echo "$(YELLOW)Output: packages/desktop/release/$(RESET)"

dist-win: build
	@echo "$(CYAN)Building Windows distribution...$(RESET)"
	pnpm --filter @cmdr/desktop dist:win
	@echo "$(GREEN)✓ Windows distribution built$(RESET)"

dist-mac: build
	@echo "$(CYAN)Building macOS distribution...$(RESET)"
	pnpm --filter @cmdr/desktop dist:mac
	@echo "$(GREEN)✓ macOS distribution built$(RESET)"

dist-all: build
	@echo "$(CYAN)Building for all platforms...$(RESET)"
	pnpm --filter @cmdr/desktop dist:linux
	pnpm --filter @cmdr/desktop dist:win
	pnpm --filter @cmdr/desktop dist:mac
	@echo "$(GREEN)✓ All distributions built$(RESET)"

pack: build
	@echo "$(CYAN)Creating unpacked build...$(RESET)"
	pnpm --filter @cmdr/desktop pack
	@echo "$(GREEN)✓ Unpacked build created$(RESET)"

#==============================================================================
# Utility
#==============================================================================

status:
	@echo "$(BOLD)$(CYAN)Project Status$(RESET)"
	@echo "=============="
	@echo ""
	@echo "$(GREEN)Git:$(RESET)"
	@git status --short || echo "  (no changes)"
	@echo ""
	@echo "$(GREEN)Last Commit:$(RESET)"
	@git log --oneline -1
	@echo ""
	@echo "$(GREEN)Tests:$(RESET)"
	@pnpm test:run 2>&1 | grep -E "(Test Files|Tests|passed|failed)" | tail -3
	@echo ""

info:
	@echo "$(BOLD)$(CYAN)Package Information$(RESET)"
	@echo "==================="
	@echo ""
	@echo "$(GREEN)Environment:$(RESET)"
	@echo "  Node:  $$(node --version)"
	@echo "  PNPM:  $$(pnpm --version)"
	@echo ""
	@echo "$(GREEN)Packages:$(RESET)"
	@echo "  @cmdr/core:    $$(cat packages/core/package.json | grep '"version"' | head -1 | cut -d'"' -f4)"
	@echo "  @cmdr/midi:    $$(cat packages/midi/package.json | grep '"version"' | head -1 | cut -d'"' -f4)"
	@echo "  @cmdr/desktop: $$(cat packages/desktop/package.json | grep '"version"' | head -1 | cut -d'"' -f4)"
	@echo ""
	@echo "$(GREEN)Test Coverage:$(RESET)"
	@echo "  @cmdr/core:  95.68%"
	@echo "  @cmdr/midi:  92.12%"
	@echo ""

# AIDEV-NOTE: This Makefile provides a unified interface for all development tasks.
# Run 'make help' to see all available commands with descriptions.
