#!/usr/bin/env bash
set -euo pipefail

# === Config ===
SRC_BRANCH="develop"
DST_BRANCH="main"

# === Helpers ===
abort() { echo "❌ $*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || abort "No se encontró '$1' en PATH."; }

# === Prechequeos ===
need git
need docker

# Workspace limpio
if ! git diff --quiet || ! git diff --cached --quiet; then
  abort "Hay cambios sin commitear. Commit/stash antes de ejecutar."
fi

# Remoto y owner/repo
REMOTE="$(git remote get-url --push origin 2>/dev/null || git remote get-url origin 2>/dev/null || true)"
[[ -n "$REMOTE" && "$REMOTE" == *github.com* ]] || abort "No pude detectar remoto GitHub 'origin'."

OWNER="$(printf '%s' "$REMOTE" | sed -E 's#.*github\.com[:/]+([^/]+)/([^/.]+)(\.git)?$#\1#')"
REPO="$(printf '%s' "$REMOTE" | sed -E 's#.*github\.com[:/]+([^/]+)/([^/.]+)(\.git)?$#\2#')"
OWNER_LC="$(printf '%s' "$OWNER" | tr '[:upper:]' '[:lower:]')"
REPO_LC="$(printf '%s' "$REPO" | tr '[:upper:]' '[:lower:]')"

FRONT_REPO="ghcr.io/${OWNER_LC}/${REPO_LC}/frontend"
BACK_REPO="ghcr.io/${OWNER_LC}/${REPO_LC}/backend"

echo "📦 Repo Git: ${OWNER}/${REPO}"
echo "🌿 Merge: ${SRC_BRANCH} ➜ ${DST_BRANCH}"
echo "🖼️  Imágenes GHCR: "
echo "    - ${FRONT_REPO}:develop → :integration"
echo "    - ${BACK_REPO}:develop  → :integration"
echo

# === GIT: merge develop -> main ===
echo "➡️  Git fetch/prune"
git fetch origin --prune

git rev-parse --verify "origin/${SRC_BRANCH}" >/dev/null 2>&1 || abort "No existe origin/${SRC_BRANCH}"
git rev-parse --verify "origin/${DST_BRANCH}" >/dev/null 2>&1 || abort "No existe origin/${DST_BRANCH}"

echo "➡️  Alinear ramas locales con remotas (FF-only)"
# prepare develop
if git show-ref --verify --quiet "refs/heads/${SRC_BRANCH}"; then
  git checkout "${SRC_BRANCH}"
else
  git checkout -t "origin/${SRC_BRANCH}"
fi
git pull --ff-only origin "${SRC_BRANCH}"

# prepare main
if git show-ref --verify --quiet "refs/heads/${DST_BRANCH}"; then
  git checkout "${DST_BRANCH}"
else
  git checkout -t "origin/${DST_BRANCH}"
fi
git pull --ff-only origin "${DST_BRANCH}"

echo "➡️  Merge ${SRC_BRANCH} → ${DST_BRANCH}"
# Intento de merge con commit mensaje estándar (falla en conflicto)
git merge --no-ff -m "chore(prod): merge ${SRC_BRANCH} into ${DST_BRANCH} [pase-a-produccion]" "${SRC_BRANCH}"

echo "➡️  Push a origin/${DST_BRANCH}"
git push origin "${DST_BRANCH}"
echo "✅ Merge & push OK"
echo

# === DOCKER: retag develop -> integration en GHCR ===
retag_push() {
  local image_repo="$1"
  local from_tag="develop"
  local to_tag="integration"

  echo "🔎 Verificando tag remoto: ${image_repo}:${from_tag}"
  if ! docker manifest inspect "${image_repo}:${from_tag}" >/dev/null 2>&1; then
    abort "No existe ${image_repo}:${from_tag} en GHCR (login o push previo requerido)."
  fi

  echo "⬇️  Pull ${image_repo}:${from_tag}"
  docker pull "${image_repo}:${from_tag}"

  echo "🏷️  Tag -> ${image_repo}:${to_tag}"
  docker tag "${image_repo}:${from_tag}" "${image_repo}:${to_tag}"

  echo "⬆️  Push ${image_repo}:${to_tag}"
  docker push "${image_repo}:${to_tag}"

  echo "✅ Listo: ${image_repo}:${to_tag}"
  echo
}

echo "➡️  Reetiquetando imágenes GHCR a :integration"
retag_push "${FRONT_REPO}"
retag_push "${BACK_REPO}"

echo "🎉 Pase a producción finalizado."
echo "   - ${FRONT_REPO}:integration"
echo "   - ${BACK_REPO}:integration"
