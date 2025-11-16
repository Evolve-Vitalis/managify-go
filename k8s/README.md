Kubernetes manifests for Managify backend and MongoDB

Files included:

- `namespace.yaml` - creates `managify` namespace
- `mongo-deployment.yaml` - MongoDB deployment
- `mongo-service-pvc.yaml` - MongoDB service and PVC
- `backend-deployment.yaml` - backend deployment and service (replace image)
- `secrets.yaml` - template for Mongo credentials and imagePullSecret

Quick start (cluster must be reachable with kubectl):

1. Create namespace:

```bash
kubectl apply -f namespace.yaml
```

2. Create secrets (replace values):

# encode values to base64
```bash
echo -n "root" | base64  # username
echo -n "password" | base64  # password
```

Fill `secrets.yaml` with the base64 values or create secret directly:

```bash
kubectl create secret generic managify-secrets \
  --from-literal=mongo-root-username=root \
  --from-literal=mongo-root-password=password \
  -n managify
```

3. If your Docker Hub image is private, create an imagePullSecret:

```bash
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=${DOCKERHUB_USERNAME} \
  --docker-password=${DOCKERHUB_TOKEN} \
  --docker-email=you@example.com -n managify
```

4. Apply Mongo manifests and backend:

```bash
kubectl apply -f mongo-deployment.yaml
kubectl apply -f mongo-service-pvc.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f secrets.yaml
```

5. Check pods and logs:

```bash
kubectl get pods -n managify
kubectl logs -n managify deploy/managify-backend
kubectl logs -n managify deploy/managify-mongo
```

Notes:
- Replace `REPLACE_WITH_DOCKERHUB_USER/managify-backend:latest` in `backend-deployment.yaml` with your Docker Hub image path.
- The backend service is ClusterIP. Use port-forward or expose via Ingress for external access.


CI / CD (current repo setup)
----------------------------

This repository is configured to use the `ci-deploy-kubectl.yml` workflow as the canonical deploy path (direct CI → cluster). ArgoCD is removed per request.

What the CI does (high level):
- Build the Docker image (Dockerfile)
- Tag the image (`:latest` and `:${GITHUB_SHA}`)
- Push the image to Docker Hub (requires `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets)
- Use the `KUBECONFIG_DATA` secret (base64 kubeconfig) to connect to the target cluster
- Create/update the `managify-secrets` Kubernetes Secret from GitHub Secrets (reads `MONGO_ROOT_USERNAME` and `MONGO_ROOT_PASSWORD`)
- Apply the manifests in `k8s/` (namespace, secrets, mongo, backend)

Secrets required for this workflow:
- `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- `KUBECONFIG_DATA` (base64 of kubeconfig) — needed so workflow can run `kubectl apply` against the cluster
- `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD` (used to create `managify-secrets` in the cluster)

Notes for AWS / EKS
-------------------
If you want to target AWS EKS instead of an AKS or local cluster, the CI workflow only needs different authentication steps. Two main options:

1. Provide `KUBECONFIG_DATA` for the EKS cluster (quick):
   - Generate or export a kubeconfig that can access the EKS cluster and base64-encode it, then add as the `KUBECONFIG_DATA` secret in GitHub. The current `ci-deploy-kubectl.yml` will use it as-is.

2. Use AWS credentials in GitHub Actions to update kubeconfig at runtime (recommended for automation):
   - Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `EKS_CLUSTER_NAME` to GitHub Secrets.
   - In the workflow, add steps to configure AWS credentials and run `aws eks update-kubeconfig --name ${EKS_CLUSTER_NAME} --region ${AWS_REGION}` before applying manifests. Example:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ secrets.AWS_REGION }}

- name: Update kubeconfig for EKS
  run: |
    aws eks update-kubeconfig --name ${{ secrets.EKS_CLUSTER_NAME }} --region ${{ secrets.AWS_REGION }}
```

After updating kubeconfig, the workflow can run `kubectl apply -f k8s/...` as it already does.

Choosing between the two:
- `KUBECONFIG_DATA` is simple and works for quick setups/testing. But it's less flexible for rotating credentials.
- Using AWS credentials + `aws eks update-kubeconfig` is cleaner for automation and lets workflows run without embedding long-lived kubeconfig files in GitHub Secrets.


