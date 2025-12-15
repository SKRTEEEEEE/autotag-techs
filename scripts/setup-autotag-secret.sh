#!/bin/bash

# Script to automatically set up AUTOTAG_TOKEN secret in all GitHub repositories
# Usage: ./setup-autotag-secret.sh <github-pat-token>

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if token is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: GitHub PAT token is required${NC}"
  echo "Usage: $0 <github-pat-token>"
  echo ""
  echo "Example:"
  echo "  $0 <your-personal-access-token>"
  exit 1
fi

GITHUB_TOKEN="$1"

# Validate token format (basic check)
if ! [[ $GITHUB_TOKEN =~ ^ghp_ ]]; then
  echo -e "${YELLOW}Warning: Token doesn't look like a PAT (should start with ghp_)${NC}"
fi

echo -e "${GREEN}Setting up AUTOTAG_TOKEN secret in all repositories...${NC}"
echo ""

# Get list of repositories
echo "Fetching repositories..."
REPOS=$(gh repo list --json name,nameWithOwner -q '.[].nameWithOwner')

if [ -z "$REPOS" ]; then
  echo -e "${RED}Error: No repositories found or authentication failed${NC}"
  exit 1
fi

SUCCESS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

# Create secret for each repository
while IFS= read -r repo; do
  echo -n "Processing $repo... "
  
  # Check if secret already exists
  if gh secret list --repo "$repo" | grep -q "AUTOTAG_TOKEN"; then
    echo -e "${YELLOW}skipped (secret already exists)${NC}"
    ((SKIP_COUNT++))
  else
    # Create the secret
    if echo "$GITHUB_TOKEN" | gh secret set AUTOTAG_TOKEN --repo "$repo" 2>/dev/null; then
      echo -e "${GREEN}✓ done${NC}"
      ((SUCCESS_COUNT++))
    else
      echo -e "${RED}✗ failed${NC}"
      ((FAIL_COUNT++))
    fi
  fi
done <<< "$REPOS"

echo ""
echo -e "${GREEN}Summary:${NC}"
echo "  ✓ Created: $SUCCESS_COUNT"
echo "  ⊘ Skipped: $SKIP_COUNT"
echo "  ✗ Failed:  $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}All done! AUTOTAG_TOKEN is now available in your repositories.${NC}"
  exit 0
else
  echo -e "${YELLOW}Some repositories failed. Please check manually.${NC}"
  exit 1
fi
