# Tech Radar

Tech Radar is a tool that helps you track the infrastructure, languages, frameworks and CI/CD used in the ONS repositories and then categorises them into Adopt, Trial, Assess or Hold.

## How to setup

Clone the repository:
```bash
git clone https://github.com/ONS-innovation/keh-tech-radar.git
```

Install both backend and frontend dependencies:
```bash
make install
```

## How to run locally

Remember to export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
```bash
export AWS_ACCESS_KEY_ID=<your_access_key>
export AWS_SECRET_ACCESS_KEY=<your_secret_key>
```

Make dev.sh executable:
```bash
chmod +x dev.sh
```

To run the project locally:
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

This should build the project and then start the project locally on port 5000.

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
