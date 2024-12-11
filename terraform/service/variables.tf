variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID"
  type        = string
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key"
  type        = string
}

variable "container_image" {
  description = "Container image"
  type        = string
  default     = "sdp-dev-tech-radar"
}

variable "container_ver" {
  description = "Container tag"
  type        = string
  default     = "v0.0.1"
}

variable "container_ver_backend" {
  description = "Container tag"
  type        = string
  default     = "v0.0.1"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "from_port" {
  description = "From port"
  type        = number
  default     = 3000
}

variable "service_subdomain" {
  description = "Service subdomain"
  type        = string
  default     = "tech-radar"
}

variable "domain" {
  description = "Domain"
  type        = string
  default     = "sdp-dev"
}

variable "domain_extension" {
  description = "Domain extension"
  type        = string
  default     = "aws.onsdigital.uk"
}

variable "service_cpu" {
  description = "Service CPU"
  type        = string
  default     = 1024
}

variable "service_memory" {
  description = "Service memory"
  type        = string
  default     = 3072
}

variable "task_count" {
  description = "Number of instances of the service to run"
  type        = number
  default     = 1
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "log_retention_days" {
  description = "Log retention days"
  type        = number
  default     = 90
}

variable "github_org" {
  description = "Github Organisation"
  type        = string
  default     = "ONS-Innovation"
}

variable "project_tag" {
  description = "Project"
  type        = string
  default     = "SDP"
}

variable "team_owner_tag" {
  description = "Team Owner"
  type        = string
  default     = "Knowledge Exchange Hub"
}

variable "business_owner_tag" {
  description = "Business Owner"
  type        = string
  default     = "DST"
}

variable "force_deployment" {
  description = "Force new task definition deployment"
  type        = string
  default     = "true"
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket that the application needs to access"
  type        = string
  default     = "sdp-dev-tech-radar"
}

variable "frontend_ecr_repo" {
  description = "Frontend ECR repository"
  type        = string
  default     = "sdp-dev-tech-radar"
}

variable "backend_ecr_repo" {
  description = "Backend ECR repository"
  type        = string
  default     = "sdp-dev-tech-radar-backend"
}

variable "frontend_port" {
  description = "Frontend port"
  type        = number
  default     = 3000
}

variable "backend_port" {
  description = "Backend port"
  type        = number
  default     = 5001
}

variable "healthcheck_interval" {
  description = "Healthcheck interval"
  type        = number
  default     = 30
}

variable "healthcheck_timeout" {
  description = "Healthcheck timeout"
  type        = number
  default     = 10
}

variable "healthcheck_retries" {
  description = "Healthcheck retries"
  type        = number
  default     = 5
}

variable "healthcheck_start_period" {
  description = "Healthcheck start period"
  type        = number
  default     = 120
}

locals {
  url         = "${var.domain}.${var.domain_extension}"
  service_url = "${var.service_subdomain}.${local.url}"
}