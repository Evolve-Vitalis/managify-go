output "alb_dns_name" {
  description = "The DNS name of the load balancer"
  value       = module.loadbalancer.dns_name
}

output "db_endpoint" {
  description = "The endpoint of the database"
  value       = module.database.endpoint
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = module.ecr.repository_url
}
