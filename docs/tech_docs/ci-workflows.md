# CI Workflows - Açıklama ve Dokümantasyon

Bu doküman repository içinde bulunan GitHub Actions workflow'larının ne yaptığını, ne zaman çalıştığını ve hangi secret'lara ihtiyaç duyduğunu açıklar.

Özet (kısa):
- `ci-gitops-update-manifests.yml` — GitOps ana pipeline (otomatik): master'a pushlandığında image build/push yapar, `k8s/backend-deployment.yaml` dosyasını yeni image tag ile günceller ve commitler. ArgoCD bu değişikliği algılayıp cluster'ı sync eder.
- `ci-deploy-kubectl.yml` — Manuel: workflow_dispatch ile elle çalıştırılır; image build/push sonrası `KUBECONFIG_DATA` secret'ı kullanılarak `kubectl apply` yapar.
- `ci-docker-publish.yml` — Manuel: sadece image build & push; elle tetiklenir (workflow_dispatch).

Gereken GitHub Secrets:
- `DOCKERHUB_USERNAME` — Docker Hub kullanıcı adı
- `DOCKERHUB_TOKEN` — Docker Hub erişim token veya şifresi
- `KUBECONFIG_DATA` — (opsiyonel, sadece `ci-deploy-kubectl.yml` için) base64 ile encode edilmiş kubeconfig

Detaylı Açıklama (her workflow için):

## 1) ci-gitops-update-manifests.yml (otomatik)

- Tetikleme: `on: push` — `master` branch'e yapılan push ile otomatik çalışır.
- Adımlar:
  1. Checkout: repo'yu çeker (persist-credentials: true böylece workflow repo'ya commit/push yapabilir).
  2. QEMU ve Buildx kurulumları: multi-platform build desteği için.
  3. Docker Hub'a login (secrets kullanılır).
  4. Docker image build & push: iki tag ile pushlanır — `:latest` ve `:${GITHUB_SHA}`.
  5. `k8s/backend-deployment.yaml` içinde bulunan `image:` satırı `...:${GITHUB_SHA}` olarak güncellenir.
  6. Bu manifest dosyası git ile commit edilip pushlanır (bot kullanılarak). ArgoCD bu değişikliği algılayıp cluster'ı sync eder.

Önemli notlar:
- Workflow kendi oluşturduğu commit tarafından yeniden tetiklenmemesi için iş koşulu `if: github.actor != 'github-actions[bot]'` ile koruma eklendi.
- Commit mesajında `[skip ci]` ekleme stratejisi kullanıldı ancak GitHub Actions'ta bu otomatik olarak tüm workflow'ları durdurmayabilir; bu yüzden `if` kontrolü eklendi.

## 2) ci-deploy-kubectl.yml (manuel)

- Tetikleme: `workflow_dispatch` — elle çalıştırılır.
- Adımlar:
  1. Checkout
  2. QEMU ve Buildx
  3. Docker Hub login
  4. Docker image build & push (aynı tag yapılandırması)
  5. `KUBECONFIG_DATA` secret'ını base64-decode ederek `kubeconfig` dosyası oluşturur
  6. `kubectl apply -f k8s/...` komutlarını çalıştırır (namespace, secret, pvc, mongo, backend)

Kullanım: Bu workflow CI'de otomatize olmayan, doğrudan cluster'a apply etme ihtiyacı için kullanılır (ör. hızlı test). Ancak önerilen üretim akışı GitOps'tur.

## 3) ci-docker-publish.yml (manuel)

- Tetikleme: `workflow_dispatch` — elle çalıştırılır.
- Adımlar: sadece Docker image build & push. Kullanışlıdır eğer sadece image publish etmek istiyorsanız.

---

Bu belge, proje içindeki workflow'ların hızlı bir özetini sunar. Aşağıdaki `k8s-manifests.md` belgesi ise her k8s YAML dosyasını satır satır açıklar.
