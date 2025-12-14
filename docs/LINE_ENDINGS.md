# Line Endings Configuration (Windows + Git Bash + GitHub Actions)

## Overview

This project uses a unified approach to handle line endings across different operating systems, while ensuring compatibility with GitHub Actions (which requires LF).

## Problem Solved

- **Windows developers** (you!) get CRLF line endings locally for compatibility with Windows tools
- **Repository** maintains LF line endings for GitHub Actions compatibility
- **All platforms** work seamlessly without conflicts

## Configuration

### 1. `.gitattributes` (Tracked in Git)

Located in the root directory, this file tells Git how to handle line endings:

```
* text=auto eol=lf
*.ts text eol=lf
*.js text eol=lf
...
```

**What it does:**

- Stores all text files with `LF` in the repository
- Ensures GitHub Actions runs with correct line endings
- Is committed to the repository and shared with all developers

### 2. Git Local Configuration (Per-Machine)

Run these commands once on your Windows machine:

```bash
cd /path/to/autotag-techs
git config core.autocrlf true
git config core.safecrlf warn
```

**What it does:**

- `core.autocrlf=true`: Automatically converts line endings
  - When you clone/checkout: `LF` → `CRLF` (Windows format)
  - When you commit: `CRLF` → `LF` (Repository format)
- `core.safecrlf=warn`: Warns about irreversible conversions (safety net)

**Note:** These settings are NOT committed; they're personal to your machine.

### 3. EditorConfig (Optional but Recommended)

The `.editorconfig` file helps your editor maintain consistency:

```
[*]
end_of_line = lf
```

This tells editors to use `LF` for all files (your tools will show CRLF on disk, but this is the "logical" setting).

### 4. Prettier Configuration

File: `prettier.config.mjs`

```javascript
const config = {
  endOfLine: "lf",
  ...
};
```

Prettier is configured to format files with `LF` internally, which aligns with the repository's `.gitattributes`.

## How It Works

### Workflow for Windows Users (You)

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourrepo/autotag-techs.git
   cd autotag-techs
   ```

2. **Local file system** (what you see in VS Code):
   - All TypeScript files have `CRLF` line endings
   - Windows Notepad, VS Code, etc. all see the correct line endings
   - Your scripts work correctly on Windows

3. **When you commit**:

   ```bash
   git add .
   git commit -m "your message"
   ```

   - Git automatically converts `CRLF` → `LF` before storing
   - The repository stores files with `LF`

4. **When you pull/checkout**:
   - Git automatically converts `LF` → `CRLF`
   - Your local files are CRLF (Windows format)

### What GitHub Actions Sees

- Repository files are stored as `LF`
- GitHub Actions runners (Linux) use `LF`
- Scripts run with correct line endings
- No issues with bash scripts, ESLint, etc.

## Verification

### Check your local configuration:

```bash
git config core.autocrlf  # Should output: true
git config core.safecrlf  # Should output: warn
```

### Check a file's line endings locally:

```bash
# Using Git (shows how Git will handle the file)
git ls-files --eol

# Output example:
# mixed  crlf  lf    CMakeLists.txt
# i/crlf w/crlf attr/src/main.cpp
```

In VS Code, check the bottom-right corner - it should show either `LF` or `CRLF`.

## When Line Endings Conflict

If you see warnings like:

```
warning: in the working copy of '...', CRLF will be replaced by LF the next time Git touches it
```

This is **normal** and means Git is doing exactly what we configured. You can safely ignore it, or:

```bash
# To force Git to normalize all files right now:
git rm --cached -r .
git add -A
git commit -m "chore: normalize line endings"
```

## Best Practices

1. **Don't change these settings** unless you understand line endings
2. **Always commit `.gitattributes`** - it's the source of truth
3. **Let Git handle the conversions** - don't manually convert line endings
4. **Trust your editor's display** - VS Code will show you the current line ending

## For Other Team Members

If other developers join the team:

**On Windows:**

```bash
git config core.autocrlf true
git config core.safecrlf warn
```

**On macOS/Linux:**

```bash
git config core.autocrlf input
git config core.safecrlf warn
```

This ensures everyone's environment respects the `.gitattributes` rules.

## References

- [Git Configuration: core.autocrlf](https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration#_core_autocrlf)
- [GitHub: Handling line endings](https://docs.github.com/en/get-started/getting-started-with-git/configuring-git-to-handle-line-endings)
- [EditorConfig: End of Line](https://editorconfig.org/#supported-properties)
