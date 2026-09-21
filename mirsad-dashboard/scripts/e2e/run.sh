#!/usr/bin/env bash
# تجربة شاملة على قاعدة بيانات حقيقية (المحاكي) ومتصفّح حقيقي، بلا مفاتيح.
set -euo pipefail
cd "$(dirname "$0")/../.."

export VITE_MIRSAD_FIREBASE_API_KEY=demo-key
export VITE_MIRSAD_FIREBASE_AUTH_DOMAIN=demo-qiyas.firebaseapp.com
export VITE_MIRSAD_FIREBASE_PROJECT_ID=demo-qiyas
export VITE_MIRSAD_FIREBASE_APP_ID='1:1:web:demo'
export VITE_MIRSAD_USE_EMULATOR=true

echo "▸ بناء نسخة تتصل بالمحاكي"
npm run build --silent
npm run verify:no-pii --silent

echo "▸ تشغيل المحاكيات ثم الرفع والتجربة"
npx firebase emulators:exec --only firestore,auth --project demo-qiyas '
  set -e
  export GCLOUD_PROJECT=demo-qiyas
  node scripts/firestore/seed.mjs --project demo-qiyas | tail -12
  node scripts/firestore/grant-admin.mjs --project demo-qiyas \
    --email e2e-admin@example.test --password e2e-password-1448
  node scripts/e2e/remote-flow.mjs
'
