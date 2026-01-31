variable "project_name" {
  description = "Project name for tagging"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where the database will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the database subnet group"
  type        = list(string)
}

variable "vpc_cidr" {
  description = "VPC CIDR to allow access from"
  type        = string
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
}

variable "master_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

variable "instance_class" {
  description = "The instance class to use"
  type        = string
  default     = "db.t3.medium"
}

variable "instance_count" {
  description = "Number of DB instances"
  type        = number
  default     = 1
}
