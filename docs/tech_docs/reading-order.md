# Okuma ve Uygulama Sırası (Reading Order)

Bu kısa rehber, projenin CI ve Kubernetes bölümlerini anlamak veya uygulamak isteyenler için adım adım hangi dosyaların hangi sırayla okunması/uygulanması gerektiğini gösterir.

1) README.md — genel proje ve kısa kullanım talimatları (başlangıç noktası).
2) `docs/ci-workflows.md` — hangi workflow'ların olduğunu, hangisinin otomatik olduğunu öğrenin.
3) `.github/workflows/ci-gitops-update-manifests.yml` — GitOps ana pipeline'ın akışını satır satır inceleyin.
4) `k8s/namespace.yaml` — namespace oluşturun.
5) `k8s/secrets.yaml` — secrets oluşturma stratejisini okuyun; production için SealedSecrets/ExternalSecrets düşünün.
6) `k8s/mongo-service-pvc.yaml` ve `k8s/mongo-deployment.yaml` — MongoDB'i ayağa kaldırmak için önce bunları uygulayın.
7) `k8s/backend-deployment.yaml` — backend manifestini inceleyin ve `REPLACE_IMAGE:REPLACE_TAG` placeholder'ını kontrol edin.
8) `k8s/argocd-application.yaml` — ArgoCD kullanacaksanız ArgoCD'ye bu uygulamayı ekleyin.
9) `k8s/README.md` — uygulama / deploy adımlarını takip edin.

Not: Eğer doğrudan GitHub Actions ile `kubectl apply` yapacaksanız, `ci-deploy-kubectl.yml`'ü manuel tetikleyerek ilerleyin. Ancak önerilen yol: GitOps + ArgoCD.
