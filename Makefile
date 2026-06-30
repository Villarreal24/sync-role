.PHONY: run test install clean

PYTHON = .venv/bin/python
UVICORN = .venv/bin/uvicorn

.venv/bin/python:
	python3 -m venv .venv
	$(PYTHON) -m pip install --upgrade pip

install: .venv/bin/python
	$(PYTHON) -m pip install -r syncRoleBackend/requirements.txt

run: install
	$(UVICORN) syncRoleBackend.main:app --reload --port 8000

test: install
	$(PYTHON) -m pytest syncRoleBackend/test_main.py -v

clean:
	rm -rf .venv __pycache__ .pytest_cache
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
