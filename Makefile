.PHONY: run dev test install clean install-fe install-ext

PYTHON = .venv/bin/python
UVICORN = .venv/bin/uvicorn

.venv/bin/python:
	python3 -m venv .venv
	$(PYTHON) -m pip install --upgrade pip

install: .venv/bin/python
	$(PYTHON) -m pip install -r syncRoleBackend/requirements.txt

install-fe:
	cd sync-role && bun install

install-ext:
	cd sync-role-extension && pnpm install

run: install
	$(UVICORN) syncRoleBackend.main:app --reload --port 8000

dev: install install-fe install-ext
	@echo "=== Starting all services ==="
	@(trap 'echo "Stopping all services..."; kill 0' SIGINT SIGTERM EXIT; \
		echo "[backend]  Starting on :8000..."; \
		$(UVICORN) syncRoleBackend.main:app --reload --port 8000 & \
		echo "[frontend] Starting on :3000..."; \
		cd sync-role && bun run dev & \
		echo "[extension] Starting..."; \
		cd sync-role-extension && pnpm dev & \
		wait)

test: install
	$(PYTHON) -m pytest syncRoleBackend/ -v

clean:
	rm -rf .venv __pycache__ .pytest_cache sync-role/node_modules sync-role-extension/node_modules
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
