#!/usr/bin/env bash

set -eux

# npm config set '//registry.npmjs.org/:_authToken' "$NPM_TOKEN"

# Build the project
pnpm build

# Navigate to the dist directory
cd dist

# Get the version from package.json
VERSION="$(node -p "require('./package.json').version")"

# Extract the pre-release tag if it exists
if [[ "$VERSION" =~ -([a-zA-Z]+) ]]; then
  # Extract the part before any dot in the pre-release identifier
  TAG="${BASH_REMATCH[1]}"
else
  TAG="latest"
fi

# Publish with the appropriate tag
# pnpm publish --access public --tag "$TAG"

echo "Publishing $VERSION with tag $TAG"
