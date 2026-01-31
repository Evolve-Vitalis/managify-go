output "endpoint" {
  description = "The endpoint of the DocumentDB cluster"
  value       = aws_docdb_cluster.this.endpoint
}

output "port" {
  description = "The port the DocumentDB cluster is listening on"
  value       = aws_docdb_cluster.this.port
}

output "cluster_id" {
  description = "The ID of the DocumentDB cluster"
  value       = aws_docdb_cluster.this.id
}
