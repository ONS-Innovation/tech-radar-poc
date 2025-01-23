# Create a service running on fargate with a task definition and service definition
terraform {
  backend "s3" {
    # Backend is selected using terraform init -backend-config=path/to/backend-<env>.tfbackend
    # bucket         = "sdp-dev-tf-state"
    # key            = "sdp-dev-ecs-example-service/terraform.tfstate"
    # region         = "eu-west-2"
    # dynamodb_table = "terraform-state-lock"
  }

}

# Create CloudWatch Log Groups beforehand
resource "aws_cloudwatch_log_group" "frontend_logs" {
  name              = "/ecs/ecs-service-${var.service_subdomain}-frontend"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_log_group" "backend_logs" {
  name              = "/ecs/ecs-service-${var.service_subdomain}-backend"
  retention_in_days = var.log_retention_days
}

resource "aws_ecs_task_definition" "ecs_service_definition" {
  family = "ecs-service-${var.service_subdomain}-application"
  container_definitions = jsonencode([
    {
      # Frontend Container
      name      = "${var.service_subdomain}-task-application"
      image     = "${var.aws_account_id}.dkr.ecr.${var.region}.amazonaws.com/${var.frontend_ecr_repo}:${var.container_ver}"
      cpu       = var.service_cpu / 2
      memory    = var.service_memory / 2
      essential = true
      portMappings = [
        {
          containerPort = var.frontend_port,
          hostPort      = var.frontend_port,
          protocol      = "tcp"
        }
      ],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend_logs.name,
          "awslogs-region"        = var.region,
          "awslogs-stream-prefix" = "ecs"
        }
      },
      environment = [
        {
          name  = "BACKEND_URL",
          value = "https://${local.service_url}"
        }
      ]
    },
    {
      # Backend Container
      name      = "${var.service_subdomain}-backend"
      image     = "${var.aws_account_id}.dkr.ecr.${var.region}.amazonaws.com/${var.backend_ecr_repo}:${var.container_ver_backend}"
      cpu       = var.service_cpu / 2
      memory    = var.service_memory / 2
      essential = true
      portMappings = [
        {
          containerPort = var.backend_port,
          hostPort      = var.backend_port,
          protocol      = "tcp"
        }
      ],
      environment = [
        {
          name  = "AWS_REGION",
          value = var.region
        },
        {
          name  = "PORT",
          value = tostring(var.backend_port)
        },
        {
          name  = "BUCKET_NAME",
          value = var.s3_bucket_name
        },
        {
          name  = "COGNITO_USER_POOL_ID",
          value = data.terraform_remote_state.ecs_auth.outputs.github_audit_user_pool_id
        }
      ],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          "awslogs-create-group"  = "true",
          "awslogs-group"         = aws_cloudwatch_log_group.backend_logs.name,
          "awslogs-region"        = var.region,
          "awslogs-stream-prefix" = "ecs",
          "mode"                  = "non-blocking"
        }
      },
      healthcheck = {
        command     = ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:${var.backend_port}/api/health || exit 1"]
        interval    = var.healthcheck_interval
        timeout     = var.healthcheck_timeout
        retries     = var.healthcheck_retries
        startPeriod = var.healthcheck_start_period
      },
      dependsOn = [
        {
          containerName = "${var.service_subdomain}-task-application"
          condition     = "START"
        }
      ]
    }
  ])
  execution_role_arn       = "arn:aws:iam::${var.aws_account_id}:role/ecsTaskExecutionRole"
  task_role_arn           = aws_iam_role.ecs_task_role.arn
  requires_compatibilities = ["FARGATE"]
  network_mode            = "awsvpc"
  cpu                     = var.service_cpu
  memory                  = var.service_memory
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture       = "X86_64"
  }
}

resource "aws_ecs_service" "application" {
  name             = "${var.service_subdomain}-service"
  cluster          = data.terraform_remote_state.ecs_infrastructure.outputs.ecs_cluster_id
  task_definition  = aws_ecs_task_definition.ecs_service_definition.arn
  desired_count    = var.task_count
  launch_type      = "FARGATE"
  platform_version = "LATEST"

  force_new_deployment               = var.force_deployment
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  enable_ecs_managed_tags = true # It will tag the network interface with service name
  wait_for_steady_state   = true # Terraform will wait for the service to reach a steady state before continuing

  # Add dependencies to ensure target groups are created first
  depends_on = [
    aws_lb_listener_rule.frontend_rule,
    aws_lb_listener_rule.backend_rule
  ]

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend_new_tg.arn
    container_name   = "${var.service_subdomain}-task-application"
    container_port   = var.frontend_port
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend_new_tg.arn
    container_name   = "${var.service_subdomain}-backend"
    container_port   = var.backend_port
  }

  # We need to wait until the target group is attached to the listener
  # and also the load balancer so we wait until the listener creation
  # is complete first
  network_configuration {
    subnets         = data.terraform_remote_state.ecs_infrastructure.outputs.private_subnets
    security_groups = [aws_security_group.allow_rules_service.id]

    # TODO: The container fails to launch unless a public IP is assigned
    # For a private ip, you would need to use a NAT Gateway?
    assign_public_ip = true
  }

}
