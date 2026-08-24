#!/usr/bin/env bash

set -e

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE does not exist."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL is missing or empty in $ENV_FILE."
  exit 1
fi

if [[ ! "$NEXT_PUBLIC_SUPABASE_URL" =~ ^https://([a-zA-Z0-9_-]+)\.supabase\.co/?$ ]]; then
  echo "Error: Invalid NEXT_PUBLIC_SUPABASE_URL:"
  echo "$NEXT_PUBLIC_SUPABASE_URL"
  exit 1
fi

PROJECT_REF="${BASH_REMATCH[1]}"

echo "Project ref:  $PROJECT_REF"

BACKUP_DIR="supabase-backup/$(date +%Y-%m-%d_%H-%M-%S)"

echo "Creating backup in: $BACKUP_DIR"

mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/functions"
mkdir -p "$BACKUP_DIR/storage"
mkdir -p "$BACKUP_DIR/config"

# --------------------------------------------------
# 1. Check Supabase CLI
# --------------------------------------------------

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is not installed."
  echo "Install it first, then run this script again."
  exit 1
fi

echo "Supabase CLI:"
supabase --version

# --------------------------------------------------
# 2. Link project
# --------------------------------------------------

echo ""
echo "Linking Supabase project..."

supabase link --project-ref "$PROJECT_REF"

# --------------------------------------------------
# 3. Database backup
# --------------------------------------------------

echo ""
echo "Backing up database schema..."

supabase db dump \
  --project-ref "$PROJECT_REF" \
  -f "$BACKUP_DIR/database/schema.sql"

echo "Backing up database data..."

supabase db dump \
  --project-ref "$PROJECT_REF" \
  --data-only \
  -f "$BACKUP_DIR/database/data.sql"

echo "Backing up database roles..."

supabase db dump \
  --project-ref "$PROJECT_REF" \
  --role-only \
  -f "$BACKUP_DIR/database/roles.sql"

# --------------------------------------------------
# 4. Edge Functions
# --------------------------------------------------

echo ""
echo "Backing up Edge Functions..."

FUNCTIONS=$(
  supabase functions list \
    --project-ref "$PROJECT_REF" \
    --output json
)

FUNCTION_NAMES=$(
  echo "$FUNCTIONS" \
    | jq -r '.[].name'
)

if [ -z "$FUNCTION_NAMES" ]; then
  echo "No Edge Functions found."
else
  while IFS= read -r FUNCTION_NAME; do
    [ -z "$FUNCTION_NAME" ] && continue

    echo "Downloading function: $FUNCTION_NAME"

    supabase functions download \
      "$FUNCTION_NAME" \
      --project-ref "$PROJECT_REF"

    if [ -d "supabase/functions/$FUNCTION_NAME" ]; then
      cp -R \
        "supabase/functions/$FUNCTION_NAME" \
        "$BACKUP_DIR/functions/"
    fi

  done <<< "$FUNCTION_NAMES"
fi

# --------------------------------------------------
# 5. Edge Function secret inventory
# --------------------------------------------------

echo ""
echo "Saving Edge Function secret names..."

supabase secrets list \
  --project-ref "$PROJECT_REF" \
  > "$BACKUP_DIR/config/secrets-list.txt"

cat > "$BACKUP_DIR/config/SECRETS-README.txt" <<EOF
IMPORTANT:

Supabase does NOT expose the actual values of previously saved Edge Function
secrets through the CLI.

secrets-list.txt contains the available secret metadata/names, not a reusable
.env backup.

You must separately preserve the original values for secrets such as:

STRIPE_SECRET_KEY
OPENAI_API_KEY
RESEND_API_KEY
SENDGRID_API_KEY
WEBHOOK_SECRET
etc.

Store those securely in a password manager or encrypted .env backup.

Restore them later with:

supabase secrets set --env-file .env --project-ref NEW_PROJECT_REF
EOF

# --------------------------------------------------
# 6. Local Supabase config
# --------------------------------------------------

echo ""
echo "Looking for local Supabase configuration..."

if [ -f "supabase/config.toml" ]; then
  cp "supabase/config.toml" "$BACKUP_DIR/config/config.toml"
fi

if [ -f "supabase/deno.json" ]; then
  cp "supabase/deno.json" "$BACKUP_DIR/config/deno.json"
fi

if [ -f "deno.json" ]; then
  cp "deno.json" "$BACKUP_DIR/config/deno-root.json"
fi

# --------------------------------------------------
# 7. Existing migrations
# --------------------------------------------------

if [ -d "supabase/migrations" ]; then
  echo "Backing up local migrations..."

  mkdir -p "$BACKUP_DIR/migrations"
  cp -R supabase/migrations/. "$BACKUP_DIR/migrations/"
fi

# --------------------------------------------------
# 8. Existing seed files
# --------------------------------------------------

if [ -f "supabase/seed.sql" ]; then
  cp "supabase/seed.sql" "$BACKUP_DIR/database/seed.sql"
fi

# --------------------------------------------------
# 9. Storage
# --------------------------------------------------

echo ""
echo "Backing up Storage..."

echo "Listing storage buckets/objects..."

supabase storage ls \
  --linked \
  --experimental \
  > "$BACKUP_DIR/storage/storage-list.txt" || true

echo ""
echo "NOTE:"
echo "Automatic Storage downloading is intentionally not enabled here."
echo "See storage/storage-list.txt and the instructions below."

# --------------------------------------------------
# 10. Metadata
# --------------------------------------------------

cat > "$BACKUP_DIR/BACKUP-INFO.txt" <<EOF
Supabase project backup

Project ref:
$PROJECT_REF

Created:
$(date)

Contents:

database/
  schema.sql
  data.sql
  roles.sql

functions/
  downloaded Edge Function source code

config/
  config.toml
  deno.json
  secrets-list.txt

migrations/
  existing local migrations, if available

storage/
  storage-list.txt

IMPORTANT:
Storage files and secret VALUES require separate handling.
EOF

echo ""
echo "------------------------------------------"
echo "Backup completed."
echo "------------------------------------------"
echo ""
echo "$BACKUP_DIR"