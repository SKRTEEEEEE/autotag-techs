# Setup Instructions for AUTOTAG_TOKEN Secret

This document explains how to set up the `AUTOTAG_TOKEN` secret across all your GitHub repositories to enable the `autotag-techs` action.

## Why is AUTOTAG_TOKEN needed?

The `autotag-techs` action requires a GitHub token with administrative permissions to modify repository topics. The default `GITHUB_TOKEN` in GitHub Actions doesn't have these permissions, so you need to provide a Personal Access Token (PAT) with the necessary scopes.

## Step 1: Create a Personal Access Token (PAT)

1. Go to GitHub Settings → [Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a descriptive name: `autotag-techs-token`
4. Select these scopes:
   - `repo` (full control of private repositories)
   - `admin:repo_hook` (access to hooks and repository configuration)
5. Click **"Generate token"**
6. **Copy the token** (you won't be able to see it again!)

⚠️ **SECURITY WARNING**: Keep this token safe! It has significant permissions.

## Step 2: Run the Setup Script

Choose your operating system:

### On Linux/macOS:

```bash
bash scripts/setup-autotag-secret.sh "<your-personal-access-token>"
```

### On Windows (PowerShell):

```powershell
.\scripts\setup-autotag-secret.ps1 -Token "<your-personal-access-token>"
```

Replace `<your-personal-access-token>` with your actual PAT token created in Step 1.

### What the script does:

1. Fetches all your repositories
2. For each repository:
   - Checks if `AUTOTAG_TOKEN` secret already exists
   - If not, creates it with your PAT value
   - Shows success/skip/failure status
3. Displays a summary

## Step 3: Update Your Workflows

Once the script completes, update your workflow files to use the secret:

```yaml
name: 🏷️ Autotag techs

on:
  push:

permissions:
  contents: write

jobs:
  autotag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: SKRTEEEEEE/autotag-techs@latest
        with:
          token: ${{ secrets.AUTOTAG_TOKEN }}
```

## Verifying the Setup

After running the script:

1. Go to any of your repositories
2. Navigate to **Settings → Secrets and variables → Actions**
3. You should see `AUTOTAG_TOKEN` listed
4. Try pushing code to trigger the workflow and verify it works

## Troubleshooting

### "No repositories found"

- Make sure you're authenticated with GitHub: `gh auth login`
- Verify your PAT has `repo` scope

### "Permission denied"

- Check that your PAT has `admin:repo_hook` scope
- Verify you have write access to the repositories

### "Secret already exists"

- The script will skip repositories where the secret already exists
- To update, delete the secret manually and re-run the script, or use `--Force` flag

### Script fails on some repos

- You might not have permission to modify secrets in those repositories
- Check that you're an owner or have appropriate permissions

## Updating the Token

If you ever need to update the token (e.g., rotate for security):

1. Create a new PAT in GitHub settings
2. Run the script again with the new token
3. The existing secrets will be overwritten

## Security Best Practices

1. **Rotate tokens regularly**: Consider rotating your PAT every 6-12 months
2. **Use the minimum scope needed**: Only `repo` and `admin:repo_hook` are required
3. **Monitor usage**: Check your GitHub audit log for unusual activity
4. **Delete old tokens**: Remove PATs you no longer use
5. **Never commit tokens**: The scripts handle this securely

## Need Help?

For issues with the `autotag-techs` action itself, visit: https://github.com/SKRTEEEEEE/autotag-techs
