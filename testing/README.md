# Backend Testing

This directory contains tests for the backend API endpoints. The tests are written in Python using pytest.

## Prerequisites

- Python 3.8 or higher
- Make (for using Makefile commands)
- Backend server running on localhost:5001

Make sure you are currently in the /testing directory when running the commands. To change directory, run:

```bash
cd testing
```

## Setup

1. Create a virtual environment (recommended but not required):
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
make setup
```

## Running Tests

Make sure the backend server is running on localhost:5001 before running tests.

To run all tests:
```bash
make test
```

Ensure tests are passing before committing.

## Cleaning Up

To clean Python cache files:
```bash
make clean
```

## Test Structure

The tests cover three main endpoints:
- `/api/health` - Basic health check endpoint
- `/api/csv` - CSV data endpoint
- `/api/json` - Repository statistics endpoint with filtering capabilities 
- `/api/repository/project/json` - Repository project JSON endpoint with filtering capabilities 

## Making changes to the tests

To make changes to the tests, edit the `backend/test_main.py` file.

To run the tests after making changes, run:
```bash
make test
```

Once created, please run `make lint` to check for any linting errors.

Then run `make clean` to clean up the cache files.