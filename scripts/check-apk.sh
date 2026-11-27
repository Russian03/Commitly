#!/usr/bin/env bash
# Falla si la APK pide permisos no previstos, permite copias de seguridad o tráfico sin cifrar.
set -euo pipefail

apk="${1:?uso: check-apk.sh <fichero.apk>}"
aapt2="$(find "${ANDROID_HOME:?falta ANDROID_HOME}/build-tools" -name aapt2 | sort -V | tail -n 1)"

package="$("$aapt2" dump packagename "$apk")"
permissions="$("$aapt2" dump permissions "$apk")"
manifest="$("$aapt2" dump xmltree "$apk" --file AndroidManifest.xml)"

# Único permiso admitido: el interno que AndroidX declara para la propia app.
allowed="$package.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
requested="$(sed -n "s/^uses-permission[^:]*: name='\([^']*\)'.*/\1/p" <<<"$permissions")"
unexpected="$(grep -vxF -e "$allowed" -e '' <<<"$requested" || true)"

failed=0
if [[ -n "$unexpected" ]]; then
  echo "Permisos no previstos en $apk:" >&2
  echo "$unexpected" >&2
  failed=1
fi
for flag in allowBackup usesCleartextTraffic; do
  if ! grep -qE "android:$flag\([^)]*\)=false" <<<"$manifest"; then
    echo "$apk: android:$flag tiene que ser false" >&2
    failed=1
  fi
done

[[ $failed -eq 0 ]] && echo "$apk: permisos y ajustes del manifiesto correctos"
exit "$failed"
