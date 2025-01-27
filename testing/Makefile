.PHONY: setup test clean

setup:
	python3 -m pip install -r requirements.txt

test:
	python3 -m pytest backend/test_main.py -v

clean:
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type f -name "*.pyc" -delete 
	rm -rf .pytest_cache