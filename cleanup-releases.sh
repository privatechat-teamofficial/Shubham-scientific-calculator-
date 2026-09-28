#!/usr/bin/env bash
set -e

# ==============================================================================
# Script to delete all GitHub releases and tags except v1.0.0
# ==============================================================================

echo "================================================================="
echo "  Cleaning up all previous GitHub releases except v1.0.0"
echo "================================================================="

if ! command -v gh &> /dev/null; then
    echo "Notice: GitHub CLI ('gh') is not installed or not in PATH."
    echo "Install it from https://cli.github.com/ or login with 'gh auth login'."
    exit 1
fi

echo "Fetching releases..."
RELEASES=$(gh release list --limit 100 --json tagName -q '.[].tagName' 2>/dev/null || true)

if [ -z "$RELEASES" ]; then
    echo "No releases found on GitHub."
    exit 0
fi

for TAG in $RELEASES; do
    if [ "$TAG" != "v1.0.0" ]; then
        echo "Deleting release & tag: $TAG"
        gh release delete "$TAG" --yes --cleanup-tag || true
    else
        echo "Keeping newest release: $TAG"
    fi
done

echo "Done! All older releases deleted. Only v1.0.0 is kept."
