#!/usr/bin/env bash

set -euo pipefail

# ==================================================
# Configuration
# ==================================================

BACKUP_DIR="${1:-}"
ENV_FILE="${2:-.env.import}"

# ==================================================
# Helpers
# ==================================================

error() {
  echo "Error: $1" >&2
  exit 1
}

info() {
  echo ""
  echo "--------------------------------------------------"
  echo "$1"
  echo "--------------------------------------------------"
}

read_env_value() {
  local key="$1"
  local file="$2"

  local value
  value=$(
    grep -E "^${key}=" "$file" \
      | head -n 1 \
      | cut -d '=' -f2- || true
  )

  # Remove surrounding single/double quotes
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  printf '%s' "$value"
}

# ==================================================
# Validate arguments
# ==================================================

if [ -z "$BACKUP_DIR" ]; then
  echo "Usage:"
  echo ""
  echo "  ./import-supabase.sh BACKUP_DIR [.env.import]"
  echo ""
  echo "Example:"
  echo ""
  echo "  ./import-supabase.sh \\"
  echo "    supabase-backup/2026-08-24_18-30-00 \\"
  echo "    .env.import"
  exit 1
fi

[ -d "$BACKUP_DIR" ] \
  || error "Backup directory does not exist: $BACKUP_DIR"

[ -f "$ENV_FILE" ] \
  || error "Import env file does not exist: $ENV_FILE"

# ==================================================
# Read target project configuration
# ==================================================

NEXT_PUBLIC_SUPABASE_URL="$(
  read_env_value "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE"
)"

SUPABASE_DB_URL="$(
  read_env_value "SUPABASE_DB_URL" "$ENV_FILE"
)"

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  error "NEXT_PUBLIC_SUPABASE_URL is missing from $ENV_FILE"
fi

if [[ ! "$NEXT_PUBLIC_SUPABASE_URL" =~ ^https://([a-zA-Z0-9_-]+)\.supabase\.co/?$ ]]; then
  error "Invalid NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL"
fi

PROJECT_REF="${BASH_REMATCH[1]}"

if [ -z "$SUPABASE_DB_URL" ]; then
  error "SUPABASE_DB_URL is missing from $ENV_FILE"
fi

echo "Target Supabase project:"
echo "  $PROJECT_REF"

echo ""
echo "Backup:"
echo "  $BACKUP_DIR"

# ==================================================
# Safety check
# ==================================================

echo ""
echo "WARNING:"
echo "This script will restore data into Supabase project:"
echo ""
echo "  $PROJECT_REF"
echo ""
echo "Database:"
echo "  $SUPABASE_DB_URL"
echo ""

read -r -p "Continue? [y/N] " CONFIRM

case "$CONFIRM" in
  y|Y|yes|YES)
    ;;
  *)
    echo "Cancelled."
    exit 0
    ;;
esac

# ==================================================
# Check dependencies
# ==================================================

info "Checking dependencies"

command -v psql >/dev/null 2>&1 \
  || error "psql is not installed"

command -v supabase >/dev/null 2>&1 \
  || error "Supabase CLI is not installed"

echo "psql:"
psql --version

echo ""
echo "Supabase CLI:"
supabase --version

# ==================================================
# Check Supabase authentication
# ==================================================

info "Checking Supabase authentication"

if ! supabase projects list >/dev/null 2>&1; then
  error "Supabase CLI is not authenticated. Run: supabase login"
fi

echo "Supabase CLI authentication OK."

# ==================================================
# Check backup files
# ==================================================

ROLES_FILE="$BACKUP_DIR/database/roles.sql"
SCHEMA_FILE="$BACKUP_DIR/database/schema.sql"
DATA_FILE="$BACKUP_DIR/database/data.sql"

[ -f "$SCHEMA_FILE" ] \
  || error "Missing schema file: $SCHEMA_FILE"

[ -f "$DATA_FILE" ] \
  || error "Missing data file: $DATA_FILE"

if [ ! -f "$ROLES_FILE" ]; then
  echo "Warning: roles.sql not found."
  echo "Database restore will continue without custom roles."
fi

# ==================================================
# Test database connection
# ==================================================

info "Testing target database connection"

psql \
  "$SUPABASE_DB_URL" \
  --variable ON_ERROR_STOP=1 \
  --command "select current_database(), current_user;" \
  >/dev/null

echo "Database connection OK."

# ==================================================
# Restore database
# ==================================================

if [ "$SKIP_DATABASE" = "true" ]; then

  info "Database restore"

  echo "Skipping database restore."

else
    info "Restoring database"

    if [ -f "$ROLES_FILE" ]; then

    echo "Restoring:"
    echo "  roles.sql"
    echo "  schema.sql"
    echo "  data.sql"

    psql \
        --single-transaction \
        --variable ON_ERROR_STOP=1 \
        --file "$ROLES_FILE" \
        --file "$SCHEMA_FILE" \
        --command 'SET session_replication_role = replica' \
        --file "$DATA_FILE" \
        --dbname "$SUPABASE_DB_URL"

    else

    echo "Restoring:"
    echo "  schema.sql"
    echo "  data.sql"

    psql \
        --single-transaction \
        --variable ON_ERROR_STOP=1 \
        --file "$SCHEMA_FILE" \
        --command 'SET session_replication_role = replica' \
        --file "$DATA_FILE" \
        --dbname "$SUPABASE_DB_URL"

    fi
fi

echo ""
echo "Database restored successfully."

# ==================================================
# Link Supabase CLI to new project
# ==================================================

info "Linking Supabase CLI"

supabase link \
  --project-ref "$PROJECT_REF"

echo "Project linked."

# ==================================================
# Restore Edge Functions
# ==================================================

FUNCTIONS_BACKUP="$BACKUP_DIR/functions"

if [ -d "$FUNCTIONS_BACKUP" ] && \
   [ -n "$(find "$FUNCTIONS_BACKUP" -mindepth 1 -maxdepth 1 -type d 2>/dev/null)" ]; then

  info "Restoring Edge Functions"

  mkdir -p supabase/functions

  cp -R "$FUNCTIONS_BACKUP"/. supabase/functions/

  echo "Deploying all Edge Functions..."

  supabase functions deploy \
    --project-ref "$PROJECT_REF"

  echo "Edge Functions deployed."

else

  info "Edge Functions"

  echo "No Edge Functions found in backup."
  echo ""
  echo "Note:"
  echo "Postgres functions/RPC functions are already restored"
  echo "through database/schema.sql."

fi

# ==================================================
# Restore Edge Function secrets
# ==================================================

SECRETS_FILE="$BACKUP_DIR/config/secrets.env"

if [ -f "$SECRETS_FILE" ]; then

  info "Restoring Edge Function secrets"

  supabase secrets set \
    --env-file "$SECRETS_FILE" \
    --project-ref "$PROJECT_REF"

  echo "Secrets restored."

else

  info "Edge Function secrets"

  echo "No secrets.env found at:"
  echo ""
  echo "  $SECRETS_FILE"
  echo ""
  echo "Secret values cannot be recovered from secrets-list.txt."
  echo ""
  echo "If you have them separately, restore with:"
  echo ""
  echo "  supabase secrets set \\"
  echo "    --env-file YOUR_SECRETS.env \\"
  echo "    --project-ref $PROJECT_REF"

fi

# ==================================================
# Storage
# ==================================================

info "Storage"

if [ -d "$BACKUP_DIR/storage" ]; then

  STORAGE_FILES="$(
    find "$BACKUP_DIR/storage" \
      -type f \
      ! -name "storage-list.txt" \
      | head -n 1
  )"

  if [ -n "$STORAGE_FILES" ]; then

    echo "Storage files exist in the backup."
    echo ""
    echo "They are NOT automatically uploaded by this script."
    echo ""
    echo "Storage object metadata may already exist in the restored"
    echo "database, but actual Storage files must be uploaded separately."

  else

    echo "No downloaded Storage objects found."
    echo ""
    echo "storage-list.txt is only an inventory."
    echo "It does not contain the actual Storage files."

  fi

else

  echo "No storage backup directory found."

fi

# ==================================================
# Verification
# ==================================================

info "Running basic verification"

echo "Checking schemas..."

psql \
  "$SUPABASE_DB_URL" \
  --tuples-only \
  --command "
    select schema_name
    from information_schema.schemata
    where schema_name in ('public', 'auth', 'storage')
    order by schema_name;
  "

echo ""
echo "Public tables:"

psql \
  "$SUPABASE_DB_URL" \
  --tuples-only \
  --command "
    select count(*)
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE';
  "

echo ""
echo "Public Postgres functions:"

psql \
  "$SUPABASE_DB_URL" \
  --tuples-only \
  --command "
    select count(*)
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public';
  "

# ==================================================
# Finished
# ==================================================

info "Import completed"

echo "Target project:"
echo "  $PROJECT_REF"

echo ""
echo "You should now manually verify:"
echo ""
echo "  - Auth settings"
echo "  - Auth redirect URLs"
echo "  - OAuth providers"
echo "  - SMTP settings"
echo "  - Realtime publications"
echo "  - Database extensions"
echo "  - Edge Function secrets"
echo "  - Storage files"
echo "  - New API keys in your application"
echo ""
echo "Done."