#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ! -r /etc/os-release ]]; then echo "Sistema nêo identificado."; exit 1; fi
. /etc/os-release
case "${ID:-}" in
  debian|ubuntu) ;;
  *) echo "Este instalador suporta Debian e Ubuntu. Para $ID, siga docs.docker.com/engine/install/"; exit 1 ;;
esac

echo "Este script instalará Docker Engine e Compose pelo repositório oficial. sudo será solicitado."
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
arch="$(dpkg --print-architecture)"
codename="${VERSION_CODENAME:?VERSION_CODENAME ausente}"
printf 'Types: deb\nURIs: https://download.docker.com/linux/%s\nSuites: %s\nComponents: stable\nArchitectures: %s\nSigned-By: /etc/apt/keyrings/docker.asc\n' "$ID" "$codename" "$arch" \
  | sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
echo "Docker instalado. Saia e entre novamente na sessêo para aplicar o grupo docker."
