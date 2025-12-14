#!/bin/bash

check_typos_installed() {
    if ! command -v typos >/dev/null 2>&1; then
        echo "Typos CLI tool is not installed, aborting typo check."
        echo ""
        echo "Windows Git Bash installation options:"
        echo "Option 1: Using cargo (if you have Rust installed):"
        echo "  cargo install typos-cli"
        echo ""
        echo "Option 2: Download binary from GitHub releases:"
        echo "  1. Visit https://github.com/crate-ci/typos/releases"
        echo "  2. Download the Windows x86_64 binary"
        echo "  3. Extract and add to your PATH"
        echo ""
        exit 0 # We don't want to fail the build if the tool is not installed
    fi
}

get_files() {
    if [ "$#" -eq 0 ]; then
        echo "."
    else
        echo "$@"
    fi
}

filter_files() {
    IGNORE_EXTENSIONS=("png" "snap" "jpg")
    IGNORE_FOLDERS=("dist/")
    IGNORE_MD_IN_SUBDIRS="docs/*/*.md"

    local files="$1"
    local filtered=""
    for file in $files; do
        ignore_file=false

        # Check if file has an ignored extension (but allow .md for handling below)
        for ext in "${IGNORE_EXTENSIONS[@]}"; do
            if [[ $file == *.$ext ]]; then
                ignore_file=true
                break
            fi
        done

        # Special handling for .md files in docs subdirectories
        if [ "$ignore_file" = false ] && [[ $file == *.md ]]; then
            if [[ $file == docs/*/*.md || $file == ./$IGNORE_MD_IN_SUBDIRS || $file == */$IGNORE_MD_IN_SUBDIRS ]]; then
                ignore_file=true
            fi
        fi

        # Check if file is in an ignored folder
        if [ "$ignore_file" = false ]; then
            for folder in "${IGNORE_FOLDERS[@]}"; do
                if [[ $file == *"$folder"* ]]; then
                    ignore_file=true
                    break
                fi
            done
        fi

        if [ "$ignore_file" = false ]; then
            filtered="$filtered $file"
        fi
    done
    echo "$filtered"
}

convert_to_relative_paths() {
    local files="$1"
    local current_dir=$(pwd)
    local relative=""
    for file in $files; do
        relative="$relative ${file#$current_dir/}"
    done
    echo "$relative"
}

check_typos_installed
absolute_path_files=$(get_files "$@")
# Use the typos config with --force-exclude to ensure docs/*/*.md files are excluded
typos --force-exclude $absolute_path_files
