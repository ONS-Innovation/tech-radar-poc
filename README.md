# Tech Radar

Tech Radar is a tool that helps you track the infrastructure, languages, frameworks and CI/CD used in the ONS repositories and then categorises them into Adopt, Trial, Assess or Hold.

## How to use

Clone the repository:
```bash
git clone https://github.com/ONS-innovation/keh-tech-radar.git
```

Run to install the dependencies:
```bash
npm install
```

Run the project:
```bash
npm start
```

This should install the dependencies and start the project locally on port 3000.

## How to deploy locally

```bash
npm run build
```

```bash
npm i -g serve
```

```bash
serve -s build
```

This should build the project and then start the project locally on port 5000.

## How to containerise

```bash
docker build -t keh-tech-radar .
```

```bash
docker run -p 5000:5000 keh-tech-radar
```

## How to containerise and deploy to ECR on AWS

```bash
docker build -t <account_id>.dkr.ecr.<region>.amazonaws.com/<repo>:<version_tag> .
```

```bash
docker push <account_id>.dkr.ecr.<region>.amazonaws.com/<repo>:<version_tag>
```

For example:

```bash
docker push 999999999999.dkr.ecr.eu-west-2.amazonaws.com/keh-tech-radar:v0.0.1
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

Run Terraform:

```bash
terraform init -backend-config="env/dev/backend-dev" -reconfigure
terraform plan -var-file=env/dev/dev.tfvars
terraform apply -var-file=env/dev/dev.tfvars
```
