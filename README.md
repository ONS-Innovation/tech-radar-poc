# Tech Radar

Tech Radar is a tool that helps you track the Infrastructure, Languages, Frameworks and Supporting Tools used in the ONS repositories and then categorises them into Adopt, Trial, Assess or Hold.

Use the following keyboard shortcuts to navigate the tech radar:

- `2` to move up the list of technologies
- `1`to move down the list of technologies

## Getting started

Clone the repository:
```bash
git clone https://github.com/ONS-innovation/keh-tech-radar.git
```

Install both backend and frontend dependencies:
```bash
make install
```
## How to setup

First, ensure you have Node.js installed. It is recommended to use Node Version Manager (nvm) to manage Node.js versions:

1. Install nvm:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

2. Install Node.js using nvm:
```bash
nvm install 18.19.0
```

3. Set the Node.js version to use:
```bash
nvm use 18.19.0
```

4. Remember to export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
```bash
export AWS_ACCESS_KEY_ID=<your_access_key>
export AWS_SECRET_ACCESS_KEY=<your_secret_key>
```
## Running locally

Make dev.sh executable:
```bash
chmod +x dev.sh
```

To run the project locally (frontend and backend together):
```bash
make dev
```
This runs the frontend and backend locally on ports 3000 and 5001.

To run the frontend only:
```bash
make frontend
```

To run the backend only:
```bash
make backend
```

## How to deploy locally

```bash
make docker-build
```

```bash
make docker-up
```

This should build the project and then start the project locally on port 3000 and 5001.

To stop the project:
```bash
make docker-down
```

## How to containerise and deploy to ECR on AWS

Build the frontend container:

```bash
docker build -t <account_id>.dkr.ecr.<region>.amazonaws.com/<repo>:<version_tag> ./frontend
```

Push the frontend container to ECR:

```bash
docker push <account_id>.dkr.ecr.<region>.amazonaws.com/<repo>:<version_tag>
```

Build the backend container:

```bash
docker build -t <account_id>.dkr.ecr.<region>.amazonaws.com/<repo>:<version_tag> ./backend
```

Push the backend container to ECR:

```bash
docker push <account_id>.dkr.ecr.<region>.amazonaws.com/<repo>:<version_tag>
```

## How to deploy infrastructure to AWS

Login to AWS via CLI:

```bash
aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin 999999999999.dkr.ecr.eu-west-2.amazonaws.com
```

Change directory to the authentication folder:

```bash
cd terraform/authentication
```

Set the environment variables. Check the terraform/service/env/dev/example_tfvars.txt file for the correct values.

Run Terraform:

```bash
terraform init -backend-config="env/dev/backend-dev" -reconfigure
terraform plan -var-file=env/dev/dev.tfvars
terraform apply -var-file=env/dev/dev.tfvars
```

Change directory to the service folder (if in authentication folder):

```bash
cd ../service
```

Set the environment variables. Check the terraform/service/env/dev/example_tfvars.txt file for the correct values.

Run Terraform:

```bash
terraform init -backend-config="env/dev/backend-dev" -reconfigure
terraform plan -var-file=env/dev/dev.tfvars
terraform apply -var-file=env/dev/dev.tfvars
```
