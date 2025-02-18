.PHONY: setup test clean

setup:
	python3 -m pip install -r mkdocs_requirements.txt

.PHONY: mkdocs
mkdocs:  ## Run mkdocs.
	mkdocs serve

.PHONY: mkdocs-build
mkdocs-build:  ## Build mkdocs.
	mkdocs build


clean:
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete 
	rm -rf .pytest_cache
	rm -rf .ruff_cache
	rm -rf venv
