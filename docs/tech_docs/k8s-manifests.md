# Kubernetes Manifests - Açıklama ve Satır Satır Dokümantasyon

Bu dosya `k8s/` içindeki YAML manifestlerini açıklar. Her manifest'in amacı, hangi alanların önemli olduğu ve hangi placeholder'ların değiştirileceği anlatılacak.

Genel not: tüm manifestler `namespace: managify` olarak ayarlandı. Uygulamayı uygulamadan önce bu namespace'i oluşturduğunuzdan emin olun (`kubectl apply -f k8s/namespace.yaml`).

## 1) namespace.yaml

Amaç: `managify` adında bir namespace oluşturur. Basit bir manifest:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: managify
```

Kullanım: `kubectl apply -f k8s/namespace.yaml`

---

## 2) mongo-deployment.yaml

Amaç: MongoDB çalıştırmak. Root kullanıcı ve şifre `managify-secrets` adlı Secret'tan okunur.

Önemli parçalar:
- `image: mongo:6.0` — MongoDB image sürümü.
- `env` — `MONGO_INITDB_ROOT_USERNAME` ve `MONGO_INITDB_ROOT_PASSWORD` değerleri `secretKeyRef` ile `managify-secrets`'ten okunur.
- `volumeMounts` ve `volumes` — veri kalıcılığı için PVC (`mongo-pvc`) kullanılır.

Kullanım:
1. Secrets oluşturun (örnek):
```bash
kubectl create secret generic managify-secrets \
  --from-literal=mongo-root-username=root \
  --from-literal=mongo-root-password=password -n managify
```
2. PVC ve Service'i oluşturun: `kubectl apply -f k8s/mongo-service-pvc.yaml`
3. Deployment'i uygulayın: `kubectl apply -f k8s/mongo-deployment.yaml`

---

## 3) mongo-service-pvc.yaml

İki kaynak içerir:
- `Service` (ClusterIP): Mongo'yu cluster içinde `managify-mongo:27017` olarak erişilebilir kılar.
- `PersistentVolumeClaim`: Mongo verilerini tutmak için 1Gi boyutunda bir PVC talep eder.

Kullanım: `kubectl apply -f k8s/mongo-service-pvc.yaml`

---

## 4) backend-deployment.yaml

Amaç: Backend uygulamasının Deployment ve Service manifestleri.

Önemli parçalar:
- `image: REPLACE_IMAGE:REPLACE_TAG` — bu placeholder, CI (GitOps) tarafından commit SHA ile güncellenecek. Örnek: `doguhanniltextra/managify-backend:abc123`.
- `env` — Mongo credential'ları `secretKeyRef` ile `managify-secrets`'ten okunur. `MONGO_URI` env ayarı `mongodb://$(MONGO_USER):$(MONGO_PASSWORD)@managify-mongo:27017/?authSource=admin` şeklinde oluşturulur.
- `imagePullSecrets` — eğer Docker Hub private repository ise `regcred` gibi bir secret ekleyin.
- `Service` (ClusterIP): backend'i cluster içinden port 80 üzerinde erişilebilir kılar.

Kullanım:
1. `k8s/secrets.yaml` veya `kubectl create secret` ile secret'ı oluşturun.
2. `k8s/backend-deployment.yaml` içinde `REPLACE_IMAGE:REPLACE_TAG` placeholder'ını kendi image path'iniz ile değiştirin veya CI'nin yazmasını sağlayın.
3. `kubectl apply -f k8s/backend-deployment.yaml`

---

## 5) secrets.yaml

Amaç: `managify-secrets` template'i sağlar. GitOps pratiklerinde secrets genelde repoda plaintext olarak tutulmaz. Burada `stringData` kullanıldı (kolaylık için) fakat gerçek ortamda SealedSecrets veya ExternalSecrets önerilir.

Kullanım önerisi:
- Lokal test: `kubectl apply -f k8s/secrets.yaml` veya `kubectl create secret generic ...` komutu.
- Prod: SealedSecrets, HashiCorp Vault veya ExternalSecrets ile entegre edin.

---

## 6) argocd-application.yaml

Amaç: ArgoCD'ye bu repo içindeki `k8s/` dosyalarını takip etmesini söyleyen Application manifesti.

Örnekte `repoURL`, `targetRevision` ve `path` alanlarını kendi repo ve branch'inize göre güncelleyin.

Kullanım: ArgoCD yüklendikten sonra `kubectl apply -f k8s/argocd-application.yaml -n argocd` ile ArgoCD'ye ekleyin. ArgoCD bu path'i izleyip otomatik sync yapacaktır (eğer `syncPolicy.automated` açıksa).

---

Bu belge, manifestlerin ne yaptığını hızlıca öğrenmeniz için hazırlandı. Aşağıdaki `reading-order.md` dosyası, hangi dosyayı hangi sırayla okumanız gerektiğini gösterir.
