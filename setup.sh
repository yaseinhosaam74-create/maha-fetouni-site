#!/bin/bash
set -euo pipefail

required_variables=(
  NEXT_PUBLIC_FIREBASE_API_KEY
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  NEXT_PUBLIC_FIREBASE_PROJECT_ID
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  NEXT_PUBLIC_FIREBASE_APP_ID
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
)

if [ ! -f .env.local ]; then
  echo "Missing .env.local. Copy .env.example first."
  exit 1
fi

set -a
source .env.local
set +a

missing=0
for key in "${required_variables[@]}"; do
  if [ -z "${!key:-}" ]; then
    echo "Missing environment variable: $key"
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  exit 1
fi

npm install
npm run lint
npm run build

echo "Setup completed. Remember to apply firestore.rules and set the admin custom claim in Firebase."
