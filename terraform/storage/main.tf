terraform {
  backend "s3" {
    # Backend is selected using terraform init -backend-config=path/to/backend-<env>.tfbackend
    # bucket         = "sdp-dev-tf-state"
    # key            = "sdp-dev-tech-radar-storage/terraform.tfstate"
    # region         = "eu-west-2"
    # dynamodb_table = "terraform-state-lock"
  }
}
