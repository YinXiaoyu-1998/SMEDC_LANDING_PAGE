#!/usr/bin/env bash
# Runs on the Linux web host over SSH. Static files only; no API/Docker/DB access.
set -Eeuo pipefail
umask 022

operation=${1:?deploy or rollback required}
site_root=/opt/smedc/marketing
previous_file="$site_root/previous-release"
pending=""
archive=""
old_target=""
armed=0

case "$operation" in deploy|rollback) ;; *) exit 64 ;; esac
test -d "$site_root"
# Shared host lock also excludes legacy service releases during the migration.
exec 9>/opt/smedc/deploy.lock
flock -n 9 || exit 75

validate_target() {
  [[ "$1" =~ ^releases/[a-zA-Z0-9.-]+$ ]] && test -s "$site_root/$1/index.html"
}

switch_target() {
  rm -f "$site_root/current-next"
  ln -s "$1" "$site_root/current-next"
  mv -Tf "$site_root/current-next" "$site_root/current"
}

cleanup() {
  local status=$?
  trap - EXIT
  if [ "$status" -ne 0 ] && [ "$armed" -eq 1 ]; then
    if [ -n "$old_target" ]; then
      switch_target "$old_target" || { echo "Website restore failed." >&2; exit 1; }
    else
      rm -f "$site_root/current"
    fi
  fi
  if [ -n "$pending" ]; then rm -rf "$pending"; fi
  if [ -n "$archive" ]; then rm -f "$archive"; fi
  rm -f "$site_root/previous-release.next" "$site_root/current-next"
  exit "$status"
}
trap cleanup EXIT

if [ -L "$site_root/current" ]; then
  old_target=$(readlink "$site_root/current")
  validate_target "$old_target"
else
  # Refuse to overwrite an unmanaged directory/file.
  test ! -e "$site_root/current"
fi

verify() {
  # Bootstrap can stage files before TLS exists; activated sites must pass all checks.
  if [ ! -f /opt/smedc/marketing-enabled ]; then return 0; fi
  curl -fsS --max-time 15 https://smedatacenter.xyz/version.json | cmp - "$site_root/current/version.json"
  local path url destination status
  for path in / /styles.css /client.js /assets/hero.webp /samples/weekly-report.html /samples/weekly-report.css /samples/weekly-report.js; do
    curl -fsS --max-time 15 -o /dev/null "https://smedatacenter.xyz$path"
  done
  for url in http://smedatacenter.xyz/ http://www.smedatacenter.xyz/ https://www.smedatacenter.xyz/; do
    destination=$(curl -sS --max-time 15 -o /dev/null -w '%{redirect_url}' "$url")
    test "$destination" = "https://smedatacenter.xyz/"
  done
  for path in /readyz /api/unknown; do
    status=$(curl -sS --max-time 15 -o /dev/null -w '%{http_code}' "https://smedatacenter.xyz$path")
    test "$status" = 404
  done
}

if [ "$operation" = rollback ]; then
  target=$(cat "$previous_file")
  validate_target "$target"
  armed=1
  switch_target "$target"
  verify
else
  tag=${2:?full commit SHA required}
  incoming=${3:?archive required}
  digest=${4:?SHA256 required}
  [[ "$tag" =~ ^[a-f0-9]{40}$ ]]
  [[ "$incoming" =~ ^/tmp/smedc-landing-[a-f0-9]{40}-[0-9]+-[0-9]+\.tar\.gz$ ]]
  [[ "$digest" =~ ^[a-f0-9]{64}$ ]]
  archive=$incoming
  printf '%s  %s\n' "$digest" "$archive" | sha256sum --check --status
  mkdir -p "$site_root/releases"
  pending=$(mktemp -d "$site_root/releases/$tag.XXXXXX")
  tar --no-same-owner -xzf "$archive" -C "$pending"
  test -z "$(find "$pending" -type l -print -quit)"
  for path in index.html version.json styles.css client.js assets/hero.webp samples/weekly-report.html samples/weekly-report.css samples/weekly-report.js; do
    test -s "$pending/$path"
  done
  printf '%s\n' "$tag" > "$pending/release-commit.txt"
  chmod -R a+rX "$pending"
  armed=1
  switch_target "releases/$(basename "$pending")"
  verify
  # Update the rollback pointer only after verification succeeds.
  printf '%s\n' "$old_target" > "$site_root/previous-release.next"
  mv -Tf "$site_root/previous-release.next" "$previous_file"
  pending=""
fi
armed=0
printf 'Website %s completed: %s\n' "$operation" "$(readlink "$site_root/current")"
