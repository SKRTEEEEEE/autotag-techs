# Quick Start Guide

This guide will help you get started with this GitHub Action template using Windows with Git Bash terminal.

## Prerequisites

Before starting, ensure you have the following installed:

1. **Git for Windows** - Download from [git-scm.com](https://git-scm.com/download/win)
   - During installation, make sure to select "Git Bash Here" option
2. **Node.js** (v18 or later) - Download from [nodejs.org](https://nodejs.org)
3. **pnpm** (v9 or later) - Install with:
   ```bash
   npm install -g pnpm
   ```
4. **GitHub CLI** (optional, for release management) - Download from [cli.github.com](https://cli.github.com)

## Getting Started

### 1. Clone the Template

```bash
git clone https://github.com/SKRTEEEEEE/github-action-nodejs-template.git your-action-name
cd your-action-name
```

### 2. Initialize Your Project

```bash
# Remove the original git history
rm -rf .git
git init
git add .
git commit -m "feat: initial commit from template"

# Update package.json with your action details
# Edit the following fields:
# - name
# - description
# - author
# - repository.url
# - repository.bugs.url
# - homepage
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Development Workflow

#### Building Your Action

```bash
pnpm build
```

#### Running Tests

```bash
pnpm test
```

#### Linting

```bash
# Check for linting issues
pnpm lint

# Fix linting issues automatically
pnpm lint:fix
```

#### TypeScript Validation

```bash
pnpm validate-typescript
```

#### Check for Typos (Windows Git Bash Compatible)

Note: The typos check requires the typos-cli tool. On Windows, you can install it using:

```bash
# Option 1: Using cargo (if you have Rust installed)
cargo install typos-cli

# Option 2: Download binary from GitHub releases
# Visit https://github.com/crate-ci/typos/releases
# Download the Windows binary and add it to your PATH
```

Once installed, run:

```bash
pnpm typos
```

### 5. Publishing Your Action

#### Step 1: Update Action Metadata

Edit `action.yml` to update:

- `name`: Your action name
- `description`: Your action description
- `author`: Your name or organization
- `inputs`: Define your action inputs
- `outputs`: Define your action outputs

#### Step 2: Update README.md

Customize the README.md to:

- Update badges with your repository URL
- Modify the usage example
- Add your specific documentation

#### Step 3: Push to GitHub

```bash
git add .
git commit -m "feat: customize template for my action"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

#### Step 4: Release Management

This template uses automated releases through GitHub Actions. To release a new version:

1. Make changes to your code
2. Commit using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
   ```bash
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve issue"
   # or
   git commit -m "chore: update dependencies"
   ```
3. Push to main branch:
   ```bash
   git push origin main
   ```

The CI pipeline will:

- Create a new tag
- Update the changelog
- Create a GitHub release

## Windows Git Bash Tips

### Script Execution

To make shell scripts executable in Git Bash:

```bash
chmod +x scripts/your-script.sh
```

### Line Endings

If you encounter issues with line endings, run:

```bash
git config --global core.autocrlf false
git rm --cached -r .
git reset --hard
```

### Path Handling

Use forward slashes (/) in paths instead of backslashes (\):

```bash
# Correct
cd /c/Users/YourName/Projects

# Incorrect - don't use backslashes
cd C:\Users\YourName\Projects
```

### Environment Variables

To set environment variables in Git Bash:

```bash
# Temporary (current session)
export MY_VAR="value"

# Permanent (add to ~/.bashrc)
echo 'export MY_VAR="value"' >> ~/.bashrc
```

## Troubleshooting

### Permission Denied Errors

If you get "permission denied" errors when running scripts:

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### Module Not Found Errors

If you encounter module not found errors:

```bash
# Clear node modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Git Bash Issues

If Git Bash commands don't work:

1. Make sure Git for Windows is properly installed
2. Right-click and select "Git Bash Here" in your project folder
3. Verify you're using Bash and not Windows CMD

### Typos Check Fails

If the typos check fails:

1. Install typos-cli (see above)
2. Add it to your PATH if not automatically added
3. Try running `typos --version` to verify installation

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Documentation](https://nodejs.org/docs)
- [pnpm Documentation](https://pnpm.io)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [Vitest Testing Framework](https://vitest.dev)
