# Digital Landscape MkDocs

This directory contains the documentation using MkDocs in Python.

## Prerequisites

- Python 3.8 or higher
- Make (for using Makefile commands)

Make sure you are currently in the /testing directory when running the commands. To change directory, run:

```bash
cd mkdocs
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

## Running locally

To run the documentation locally:
```bash
make mkdocs
```

## Making changes to the documentation

Ensure you are running locally.

To make changes to the documentation, edit the `mkdocs.yml` file to add a new page and add markdown (.md) files or directories to the `docs` directory.

Your changes will be reflected live locally.

## Deploying to GitHub Pages

To deploy to GitHub Pages, you need to build the documentation:
```bash
make mkdocs-build
```

This will create a `site` directory with the built documentation.

You need to move this `site` directory out from the `/docs` directory and into the root directoy, alongside the `frontend`, `backend` etc. directories.

**Important:** Change this `site` directory name from `site` to `mkdocs_deployment`.

Then, through a Pull Request, merge the changes into the `main` branch.

Once merged, the changes will be deployed to GitHub Pages via GitHub actions.