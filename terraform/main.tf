terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "ecr" {
  source = "./modules/ecr"

  repository_name = var.project_name
}

module "network" {
  source = "./modules/network"

  project_name         = var.project_name
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
}

module "database" {
  source = "./modules/database"

  project_name    = var.project_name
  vpc_id          = module.network.vpc_id
  subnet_ids      = module.network.private_subnet_ids
  vpc_cidr        = var.vpc_cidr
  master_username = var.db_master_username
  master_password = var.db_master_password
  instance_count  = var.db_instance_count
  instance_class  = var.db_instance_class
}

module "loadbalancer" {
  source = "./modules/loadbalancer"

  project_name      = var.project_name
  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids
}

module "ecs" {
  source = "./modules/ecs"

  project_name          = var.project_name
  vpc_id                = module.network.vpc_id
  private_subnet_ids    = module.network.private_subnet_ids
  alb_security_group_id = module.loadbalancer.alb_security_group_id
  target_group_arn      = module.loadbalancer.target_group_arn
  container_image       = var.container_image
  cpu                   = var.ecs_cpu
  memory                = var.ecs_memory
  desired_count         = var.ecs_desired_count
  aws_region            = var.aws_region
  
  container_environment = [
    { name = "MONGO_URI", value = "mongodb://${var.db_master_username}:${var.db_master_password}@${module.database.endpoint}:${module.database.port}/${var.mongo_db_name}?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false" },
    { name = "MONGO_DB", value = var.mongo_db_name },
    { name = "PORT", value = var.app_port },
    { name = "SECRET_KEY", value = var.secret_key },
    
    # SMTP
    { name = "SMTP_FROM", value = var.smtp_from },
    { name = "SMTP_PASSWORD", value = var.smtp_password },
    { name = "SMTP_HOST", value = var.smtp_host },
    { name = "SMTP_PORT", value = var.smtp_port },
    
    # App Limits
    { name = "API_MAX_LIMITER", value = var.api_max_limiter },
    { name = "RATE_LIMIT_EXPIRATION", value = var.rate_limit_expiration },

    # Features
    { name = "SWAGGER", value = var.swagger_enabled },
    { name = "METRICS", value = var.metrics_enabled },

    # Test/Legacy params mapped to actual DB if needed, or left blank if purely for testing
    { name = "MONGO_HOST_TEST", value = module.database.endpoint },
    { name = "MONGO_USER_TEST", value = var.db_master_username },
    { name = "MONGO_PASSWORD_TEST", value = var.db_master_password },
    { name = "MONGO_DB_TEST", value = var.mongo_db_name },
    { name = "MONGO_PORT", value = tostring(module.database.port) }
  ]
}
