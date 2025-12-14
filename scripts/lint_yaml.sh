#!/bin/bash

if ! command -v yamllint >/dev/null 2>&1; then
    echo "YamlLint CLI tool is not installed, aborting yaml linter."
    echo ""
    echo "Windows Git Bash installation options:"
    echo "Option 1: Using pip (Python package manager):"
    echo "  pip install yamllint"
    echo ""
    echo "Option 2: Using pip3 (if pip is not available):"
    echo "  pip3 install yamllint"
    echo ""
    exit 0 # We don't want to fail the build if the tool is not installed
fi

if [ "$#" -eq 0 ]; then
    files="."
else
    current_dir=$(pwd)
    files=""
    for file in "$@"; do
        relative_file="${file#$current_dir/}"
        files="$files $relative_file"
    done
fi

yamllint $files
