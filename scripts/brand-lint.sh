#!/usr/bin/env bash
# ============================================================
# NHÀ CHUNG — BRAND + LANGUAGE LINTER
# Usage: bash scripts/brand-lint.sh [path]
# Default path: nhachung-landing/public/
#
# Fails (exit 1) if any forbidden token found in public-facing files.
# Pass into CI before deploy.
# Source rules: MASTER_PLAN_NHACHUNG_2026.md §4.3 + brand book
# ============================================================
set -euo pipefail

TARGET="${1:-public}"

if [ ! -d "$TARGET" ]; then
  echo "❌ Target dir not found: $TARGET"
  exit 1
fi

echo "🔍 Brand-lint scanning: $TARGET"
echo ""

FAILED=0

# ─────────────────────────────────────────────────────────────
# 1. WORD FILTER (cấm trên public)
# ─────────────────────────────────────────────────────────────
declare -a FORBIDDEN_WORDS=(
  # Spiritual / wellness language
  "tâm linh"
  "khai mở"
  "tỉnh thức"
  "huyền môn"
  "minh triết"
  # Investment promises
  "kêu gọi đầu tư"
  "gọi vốn"
  "cam kết lợi nhuận"
  "đảm bảo lợi nhuận"
  "ROI bảo đảm"
  "đảm bảo thu nhập"
  "chắc chắn sinh lời"
  "x lần vốn"
  "nhân vốn"
  "đa cấp"
  # Public-disallowed scale claims
  "5 tỷ USD"
  "33 quốc gia"
  "99 công ty"
  # Hype / corporate speak
  "đột phá"
  "cách mạng"
  "thay đổi cuộc đời"
  "super app"
  # Formality wrong tone
  "quý khách"
  "kính thưa"
)

echo "─── Word filter check ───"
for word in "${FORBIDDEN_WORDS[@]}"; do
  # Find raw matches first
  raw=$(grep -rIni "$word" "$TARGET" 2>/dev/null || true)
  if [ -z "$raw" ]; then
    continue
  fi

  # Filter out negated forms (preceded by "không"/"Not"/"no") — those are correct disclaimer usage
  # Also allow lines that explicitly tag "DISCLAIMER" as a comment marker
  bad=$(echo "$raw" | grep -ivE "(không|not |no )[^.]{0,30}${word}|<!-- *disclaimer *-->" || true)

  if [ -n "$bad" ]; then
    echo "❌ FORBIDDEN WORD: \"$word\""
    echo "   Lines:"
    echo "$bad" | sed 's/^/     /'
    FAILED=1
  fi
done

if [ "$FAILED" -eq 0 ]; then
  echo "✅ No forbidden words found"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# 2. REQUIRED LEGAL ENTITIES (must appear in footer)
# ─────────────────────────────────────────────────────────────
REQUIRED_LEGAL=(
  "VIET CAN NEW CORP"
  "BỒ CÂU TRẮNG"
)

echo "─── Required legal entities check ───"
for entity in "${REQUIRED_LEGAL[@]}"; do
  if ! grep -rqi "$entity" "$TARGET" 2>/dev/null; then
    echo "❌ MISSING legal entity: \"$entity\" not found in $TARGET"
    FAILED=1
  fi
done

if [ "$FAILED" -eq 0 ]; then
  echo "✅ All required legal entities present"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# 3. BRAND TOKENS (CSS variables must reference Brand v2.0 Gold·White·Black)
# ─────────────────────────────────────────────────────────────
echo "─── Brand color tokens check (v2.0 Gold·White·Black) ───"
CSS_FILE="$TARGET/assets/css/style.css"
if [ -f "$CSS_FILE" ]; then
  # v2.0 Real Gold primary must exist
  if grep -qi "#D4AF37" "$CSS_FILE"; then
    echo "✅ Real Gold primary (#D4AF37) present"
  else
    echo "❌ Brand primary color #D4AF37 NOT FOUND in style.css"
    FAILED=1
  fi

  # v2.0 Bright gold accent must exist
  if grep -qi "#FFD700" "$CSS_FILE"; then
    echo "✅ 24K Bright Gold (#FFD700) present"
  else
    echo "❌ #FFD700 NOT FOUND in style.css"
    FAILED=1
  fi

  # Pure black background must exist
  if grep -qE "#000000|#0A0A0A" "$CSS_FILE"; then
    echo "✅ Black background present"
  else
    echo "❌ Black background NOT FOUND"
    FAILED=1
  fi

  # Old palettes must NOT exist (Thanh Tâm OR v1.0 clay)
  if grep -qi "#c9a455\|#d9b96a" "$CSS_FILE"; then
    echo "❌ Legacy Thanh Tâm gold (#c9a455/#d9b96a) still present"
    FAILED=1
  fi
  if grep -qi "#C75D3F" "$CSS_FILE"; then
    echo "⚠️  v1.0 clay (#C75D3F) still in CSS — should be removed"
    # Warning only, not fail (could be in archived comment)
  fi

  # Required fonts
  if grep -q "Fraunces\|Plus Jakarta" "$CSS_FILE"; then
    echo "✅ Brand fonts (Fraunces / Plus Jakarta Sans) referenced"
  else
    echo "❌ Brand fonts NOT referenced in style.css"
    FAILED=1
  fi

  # Mirror animation must exist
  if grep -q "nc-shimmer-sweep\|nc-gold-flow" "$CSS_FILE"; then
    echo "✅ Brand v2.0 animations present"
  else
    echo "❌ Brand v2.0 animations (mirror shimmer / gold flow) NOT FOUND"
    FAILED=1
  fi
fi
echo ""

# ─────────────────────────────────────────────────────────────
# 3b. PUBLIC ASSET LEGACY COLOR DRIFT
# ─────────────────────────────────────────────────────────────
echo "─── Public asset legacy color drift check ───"
LEGACY_COLOR_MATCHES=$(grep -rInE "#C75D3F|#c9a455|#d9b96a|Đất Ấm|Thanh Tâm Foundation" "$TARGET" 2>/dev/null || true)
if [ -n "$LEGACY_COLOR_MATCHES" ]; then
  echo "❌ Legacy public brand token found outside v2.0 Gold·White·Black:"
  echo "$LEGACY_COLOR_MATCHES" | sed 's/^/     /'
  FAILED=1
else
  echo "✅ No legacy public brand colors found"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# 4. INTERNAL ENTITY MUST NOT BE PUBLIC
# ─────────────────────────────────────────────────────────────
echo "─── Internal-only check (must NOT appear public) ───"
INTERNAL_ONLY=(
  "VIỆT ÚC TOÀN CẦU"
  "Việt Úc Toàn Cầu"
)

for entity in "${INTERNAL_ONLY[@]}"; do
  matches=$(grep -ril "$entity" "$TARGET" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "❌ INTERNAL-ONLY entity \"$entity\" leaked to public:"
    echo "$matches" | sed 's/^/     /'
    FAILED=1
  fi
done

if [ "$FAILED" -eq 0 ]; then
  echo "✅ No internal-only entities leaked"
fi
echo ""

# ─────────────────────────────────────────────────────────────
# 5. SUMMARY
# ─────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
  echo "✅ Brand-lint PASSED. Safe to deploy."
  exit 0
else
  echo "❌ Brand-lint FAILED. Fix violations above before deploy."
  exit 1
fi
