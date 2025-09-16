#!/usr/bin/env bash
set -euo pipefail

# ================== Config rápida ==================
TAG="develop"  # valor por defecto, cambiable con -t
FRONT_LOCAL="${FRONT_LOCAL:-homelearn_frontend:latest}"
BACK_LOCAL="${BACK_LOCAL:-homelearn_backend:latest}"
# ===================================================

usage() {
  printf '%s\n' \
"Uso: cierre-de-dia.sh -m \"<mensaje de commit>\" [-t <tag>] [-h]" \
"" \
"  -m   Mensaje de commit (requerido)" \
"  -t   Tag para GHCR (opcional, por defecto: develop)" \
"  -h   Ayuda" \
"" \
"Variables opcionales:" \
"  FRONT_LOCAL=<nombre:tag>  (default: homelearn_frontend:latest)" \
"  BACK_LOCAL=<nombre:tag>   (default: homelearn_backend:latest)" \
"" \
"Acciones:" \
"  1) git add/commit/push" \
"  2) docker tag/push a ghcr.io/<owner>/<repo>/{frontend,backend}:<tag>"
}

COMMIT_MESSAGE=""

# Parseo de flags
while getopts ":m:t:h" opt; do
  case "$opt" in
    m) COMMIT_MESSAGE="$OPTARG" ;;
    t) TAG="$OPTARG" ;;
    h) usage; exit 0 ;;
    \?) echo "Opción inválida: -$OPTARG" >&2; usage; exit 1 ;;
    :)  echo "La opción -$OPTARG requiere un argumento." >&2; usage; exit 1 ;;
  esac
done
shift $((OPTIND-1))

if [[ -z "${COMMIT_MESSAGE}" ]]; then
  echo "❌ Falta el mensaje de commit (-m)."
  usage
  exit 1
fi

# Detectar remoto GitHub y owner/repo
REMOTE="$(git remote get-url --push origin 2>/dev/null || git remote get-url origin 2>/dev/null || true)"
if [[ -z "${REMOTE}" || "${REMOTE}" != *github.com* ]]; then
  echo "❌ No pude detectar un remoto de GitHub llamado 'origin'."
  echo "   Asegurate de tener 'origin' apuntando a GitHub."
  exit 1
fi

OWNER="$(printf '%s' "$REMOTE" | sed -E 's#.*github\.com[:/]+([^/]+)/([^/.]+)(\.git)?$#\1#')"
REPO="$(printf '%s' "$REMOTE" | sed -E 's#.*github\.com[:/]+([^/]+)/([^/.]+)(\.git)?$#\2#')"
OWNER_LC="$(printf '%s' "$OWNER" | tr '[:upper:]' '[:lower:]')"
REPO_LC="$(printf '%s' "$REPO" | tr '[:upper:]' '[:lower:]')"
REGISTRY_BASE="ghcr.io/${OWNER_LC}/${REPO_LC}"

FRONT_REMOTE="${REGISTRY_BASE}/frontend:${TAG}"
BACK_REMOTE="${REGISTRY_BASE}/backend:${TAG}"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "📦 Repo: ${OWNER}/${REPO} (rama: ${CURRENT_BRANCH})"
echo "🔖 Tag GHCR: ${TAG}"
echo "🧱 Imágenes locales: ${FRONT_LOCAL} | ${BACK_LOCAL}"
echo

# ===== Paso 1: Commit & Push =====
echo "➡️  Git add/commit/push"
git add -A

if git diff --cached --quiet; then
  echo "ℹ️  No hay cambios para commitear. Salteando commit."
else
  git commit -m "${COMMIT_MESSAGE}"
fi

git push origin "HEAD:${CURRENT_BRANCH}"
echo "✅ Git push OK"
echo

# ===== Paso 2: Docker retag & push a GHCR =====
for IMG in "$FRONT_LOCAL" "$BACK_LOCAL"; do
  if ! docker image inspect "$IMG" >/dev/null 2>&1; then
    echo "❌ No existe la imagen local '$IMG'. Construí antes de ejecutar este script."
    exit 1
  fi
done

echo "➡️  Etiquetando imágenes para GHCR:"
echo "   ${FRONT_LOCAL}  ->  ${FRONT_REMOTE}"
docker tag "${FRONT_LOCAL}" "${FRONT_REMOTE}"

echo "   ${BACK_LOCAL}   ->  ${BACK_REMOTE}"
docker tag "${BACK_LOCAL}" "${BACK_REMOTE}"

echo "➡️  Pusheando a GHCR:"
docker push "${FRONT_REMOTE}"
docker push "${BACK_REMOTE}"

echo
echo "✅ Listo."
echo "   - ${FRONT_REMOTE}"
echo "   - ${BACK_REMOTE}"
