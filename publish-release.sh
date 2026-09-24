#!/usr/bin/env bash
set -e

# ==============================================================================
# Script to build and upload the latest APK to GitHub Releases
# ==============================================================================

TAG=${1:-"v$(node -p "require('./package.json').version")"}
TITLE="SHUBHAM Scientific Calculator $TAG"
NOTES="### 📱 SHUBHAM Scientific Calculator - Latest Release ($TAG)

- ✨ High-precision natural textbook display
- 📐 2D Graphing, Function Solver, & AI OCR Scanner
- 🚀 Installable standalone Android APK included

#### 📦 Download Assets
- **\`app-debug.apk\`**: Direct Android APK install file
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
        APK_DOWNLOAD/app-debug.apk \
        SHUBHAM-Calculator-App.zip \
        --title "$TITLE" \
        --notes "$NOTES"
    echo "✓ GitHub Release $TAG successfully created with APK attached!"
else
    echo "Notice: GitHub CLI ('gh') is not installed locally."
    echo "To publish automatically via GitHub Actions, push a git tag:"
    echo "  git tag $TAG"
    echo "  git push origin $TAG"
    echo "GitHub Actions will automatically build and attach the latest APK to the Release."
fi
