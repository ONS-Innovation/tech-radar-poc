.PHONY: setup test clean

setup:
	python3 -m pip install -r requirements.txt

test:
	python3 -m pytest backend/test_main.py -v

ruff:
	python3 -m ruff check backend/test_main.py

pylint:
	python3 -m pylint backend/test_main.py || true

lint:
	make ruff
	make pylint

clean:
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete 
	rm -rf .pytest_cache
	rm -rf .ruff_cache
	rm -rf venv
