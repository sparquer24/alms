#!/usr/bin/env bash
# setup-backup-schedule.sh
#
# Installs a daily (02:00) scheduled job that runs backend/backup-db.sh.
#   - On Windows (Git Bash / MSYS): creates a Windows Task Scheduler task via a .cmd wrapper
#   - On Linux: adds a crontab entry
#
# Idempotent: re-running replaces the existing schedule. To remove:
#   Windows:  schtasks /Delete /TN alms-db-backup /F
#   Linux:    crontab -e and remove the line tagged "# alms-db-backup"
#
# Usage: bash setup-backup-schedule.sh [HH:MM]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHED_TIME="${1:-02:00}"

# Validate HH:MM format
if ! printf '%s' "$SCHED_TIME" | grep -Eq '^[0-9]{2}:[0-9]{2}$'; then
  echo "❌ Invalid schedule time: '$SCHED_TIME' (expected HH:MM, e.g. 02:00)"
  exit 1
fi

# ── Linux / macOS: cron ───────────────────────────────────────────────────────
if [ "$(uname -s)" = "Linux" ] || [ "$(uname -s)" = "Darwin" ]; then
  HOUR="${SCHED_TIME%%:*}"
  MIN="${SCHED_TIME##*:}"
  # NOTE: backup-db.sh logs to backups/backup.log itself, so cron output is discarded
  CRON_LINE="$MIN $HOUR * * * cd '$SCRIPT_DIR' && bash backup-db.sh > /dev/null 2>&1  # alms-db-backup"

  ( crontab -l 2>/dev/null | grep -v '# alms-db-backup' ; echo "$CRON_LINE" ) | crontab -
  echo "✅ Installed cron job: $CRON_LINE"
  echo "   Verify with: crontab -l | grep alms-db-backup"
  exit 0
fi

# ── Windows (Git Bash / MSYS): Windows Task Scheduler ─────────────────────────
uname -s | grep -qiE 'MINGW|MSYS|CYGWIN' || { echo "❌ Unsupported OS: $(uname -s)"; exit 1; }

# Locate Git Bash's bash.exe
BASH_WIN=""
for cand in "/c/Program Files/Git/bin/bash.exe" "/c/Program Files/Git/usr/bin/bash.exe" "$(cygpath -w /usr/bin/bash 2>/dev/null)"; do
  [ -n "$cand" ] && [ -f "$cand" ] && BASH_WIN="$(cygpath -w "$cand" 2>/dev/null || echo "$cand")" && break
done
if [ -z "$BASH_WIN" ]; then
  echo "❌ Could not locate bash.exe (Git for Windows). Install Git or set BASH_WIN manually."
  exit 1
fi

# Generate a .cmd wrapper next to the script (%~dp0 = its own folder, no hardcoded paths)
CMD_WRAPPER="$SCRIPT_DIR/backup-db.cmd"
cat > "$CMD_WRAPPER" <<EOF
@echo off
cd /d %~dp0
"$BASH_WIN" -lc "./backup-db.sh"
EOF

# Remove any existing task so re-runs are idempotent
schtasks //Delete //TN "alms-db-backup" //F >/dev/null 2>&1 || true

WRAPPER_WIN="$(cygpath -w "$CMD_WRAPPER" 2>/dev/null || echo "$CMD_WRAPPER")"
if schtasks //Create //TN "alms-db-backup" //TR "\"$WRAPPER_WIN\"" //SC DAILY //ST "$SCHED_TIME" //F >/dev/null 2>&1; then
  echo "✅ Installed Windows Task Scheduler task 'alms-db-backup' (daily at $SCHED_TIME)"
  echo "   Wrapper: $CMD_WRAPPER"
  echo "   Verify with: schtasks /Query /TN alms-db-backup"
else
  echo "❌ schtasks /Create failed - try running this script from an Administrator shell."
  exit 1
fi
