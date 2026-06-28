.PHONY: run test seed install

PYTHON = .venv/bin/python
UVICORN = .venv/bin/uvicorn

run:
	$(UVICORN) syncRoleBackend.main:app --reload --port 8000

test:
	$(PYTHON) -m pytest syncRoleBackend/test_main.py -v

seed:
	$(PYTHON) -m syncRoleBackend.seed

install:
	$(PYTHON) -m pip install -r syncRoleBackend/requirements.txt
