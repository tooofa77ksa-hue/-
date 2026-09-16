#!/bin/sh
# تصفير المحاكي ثم التهيئة ثم الاختبار — حتى يبدأ كل تشغيل من حالة معروفة
set -e
cd "$(dirname "$0")/.."
P=demo-injazi
curl -s -X DELETE "http://127.0.0.1:8080/emulator/v1/projects/$P/databases/(default)/documents" > /dev/null
curl -s -X DELETE "http://127.0.0.1:9099/emulator/v1/projects/$P/accounts" > /dev/null
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  GOOGLE_CLOUD_PROJECT=$P npx tsx scripts/seedInjazi.ts > /dev/null 2>&1
node tests/e2e/injazi.e2e.mjs
