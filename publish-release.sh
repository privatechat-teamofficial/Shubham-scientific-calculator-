#!/usr/bin/env bash
set -e

# ==============================================================================
# Script to delete previous releases and publish v1.0.0 as the single release
# ==============================================================================

TAG=${1:-"v1.0.0"}
TITLE="SHUBHAM Scientific Calculator $TAG"
NOTES="### 📱 SHUBHAM Scientific Calculator - Official First Release ($TAG)

- ✨ High-precision natural textbook display
- 📐 2D Graphing, Function Solver, & Constant/Unit Conversions
- 🚀 Installable standalone Android APK included

#### 📦 Download Assets
- **\`SHUBHAM-Scientific-Calculator.apk\`**: Direct Android APK install file
- **\`SHUBHAM-Calculator-App.zip\`**: Full source code and offline assets bundle
"

echo "=================================================="
echo "  Preparing GitHub Release: $TAG                  "
echo "=================================================="

# 1. Build APK
echo "1. Building fresh APK and project bundle..."
python3 build-apk.py

# 2. Check if gh is installed
if command -v gh &> /dev/null; then
    echo "2. Deleting any previous releases..."
    for OLD_TAG in $(gh release list --limit 100 --json tagName -q '.[].tagName' 2>/dev/null || true); do
        if [ "$OLD_TAG" != "$TAG" ]; then
            echo "Deleting old release: $OLD_TAG"
            gh release delete "$OLD_TAG" --yes --cleanup-tag 2>/dev/null || true
        fi
    done

    echo "3. Publishing single release: $TAG..."
    gh release create "$TAG" \
        APK_DOWNLOAD/SHUBHAM-Scientific-Calculator.apk \
        SHUBHAM-Calculator-App.zip \
        --title "$TITLE" \
        --notes "$NOTES"
    echo "✓ GitHub Release $TAG successfully created as the single official release!"
else
    echo "Notice: GitHub CLI ('gh') is not installed locally."
    echo "When pushing to GitHub (or on GitHub Actions), previous releases will be cleaned up automatically and $TAG published."
fi
