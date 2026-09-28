#!/usr/bin/env bash
set -e

# ==============================================================================
# Script to build and upload the latest APK to GitHub Releases
# ==============================================================================

TAG=${1:-"v1.0.0"}
TITLE="SHUBHAM Scientific Calculator $TAG"
NOTES="### 📱 SHUBHAM Scientific Calculator - Official Release ($TAG)

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
    echo "2. GitHub CLI (gh) detected. Publishing release..."
    gh release create "$TAG" \
        APK_DOWNLOAD/SHUBHAM-Scientific-Calculator.apk \
        SHUBHAM-Calculator-App.zip \
        --title "$TITLE" \
        --notes "$NOTES"
    echo "✓ GitHub Release $TAG successfully created with APK attached!"
else
    echo "Notice: GitHub CLI ('gh') is not installed locally."
    echo "To publish automatically via GitHub Actions, push to main or push tag $TAG:"
    echo "  git tag $TAG"
    echo "  git push origin $TAG"
    echo "GitHub Actions will automatically build and attach SHUBHAM-Scientific-Calculator.apk to the Release."
fi
