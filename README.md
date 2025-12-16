<p align="center">
  <a href="https://github.com/SKRTEEEEEE/github-action-nodejs-template" target="blank"><img src="images/logo.png" alt="Github Actions Logo" width="512" /></a>
</p>

<h1 align="center">⭐ Auto Tag Techs Github Action ⭐</h1>

<p align="center">
  Template for new Github Actions based on Typescript with the Best Practices and Ready to be Released
</p>

<p align="center">
  <a href="https://github.com/SKRTEEEEEE/github-action-nodejs-template/actions/workflows/node.yml?branch=main"><img src="https://github.com/SKRTEEEEEE/github-action-nodejs-template/actions/workflows/node.yml/badge.svg?branch=main" alt="nodejs"/></a>
  <a href="https://nodejs.org/docs/latest-v20.x/api/index.html"><img src="https://img.shields.io/badge/node-20.x-green.svg" alt="node"/></a>
  <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-9.x-red.svg" alt="pnpm"/></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/supported_node-18.x_--_20.x-forestgreen.svg" alt="supported node"/></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/typescript-5.x-blue.svg" alt="typescript"/></a>
  <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/Test-Vitest_-yellow.svg" alt="swc"/></a>
</p>

## 👀 Quick Start

For detailed instructions on how to use this template with **Windows + Git Bash**, see our [Quick Start Guide](docs/start.md).

## 🎯 Motivation

Starting a new github action with NodeJS can be a bit frustrating, there are a lot of things to consider if we want to have a really good starting point where later we can iterate.

The main objective of this template is to provide a good base configuration for our NodeJS Github Actions that we can start using.

## 🌟 What is including?

### For Dev

1. 👷 Use [SWC](https://swc.rs/) for running the tests of the GitHub Action.
2. 🐶 Integration with [husky](https://typicode.github.io/husky/) to ensure we have good quality and conventions while we are developing like:
   - 💅 Running the linter over the files that have been changed
   - 💬 Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) to ensure our commits have a convention.
   - ✅ Run the tests automatically.
   - ⚙️ Check our action does not have type errors with Typescript.
   - 🙊 Check typos to ensure we don't have grammar mistakes.
3. 🧪 Testing with [Vitest](https://vitest.dev/)
4. 📌 Custom path aliases, where you can define your own paths (you will be able to use imports like `@/src` instead of `../../../src`).
5. 🚀 CI/CD using GitHub Actions, helping ensure a good quality of our code and providing useful insights about dependencies, security vulnerabilities and others.
6. 🥷 Fully automatized release process. You just need to merge into `main` branch using conventional commits and that's all. Automatically we will:
   - 📍 Create the tags associated to your change
   - 📝 Update the changelog
   - 📦 Create a release
7. 👮🏻 Detection of mismatch of the `dist` folder. Also, it will suggest automatic and manual ways of fixing it via [IssueOps](https://github.com/marketplace/actions/slash-command-dispatch) approach. Click [here](https://github.com/AlbertHernandez/github-action-nodejs-template/pull/32#issuecomment-1951901513) to see an example.
8. 🐦‍🔥 Use of ESModules instead of CommonJS, which is the standard in JavaScript.
9. 📦 Use of [pnpm](https://pnpm.io/) as package manager, which is faster and more efficient than npm or yarn.

### For User

1. 🐈‍⬛ Usage of local cache and controlled call (only when deps change) for fast action.

## 👀 Usage

- ⛔ `.` is not allowed for 'Topics' names: _next.js, tailwind.css, .net_ - use -> _nextjs, tailwind-css, dotnet_
  - **`.` -> `dot` or `-`**
- 📄 `.github/techs.json` is used as source of true
  - Use "user" (Array) camp, for specific name config: this will be auto included in 'Topics' and not deleted if not delete of this list.

Below is a simple example of how to use this action:

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
          token: ${{ secrets.GITHUB_TOKEN }}
```

<!-- action-docs-inputs source="action.yml" -->

## Inputs

| name    | description                                                                 | required | default      |
| ------- | --------------------------------------------------------------------------- | -------- | ------------ |
| `token` | <p>GitHub token with repository write permissions</p>                       | `true`   | NOT INCLUDED |
| `full`  | <p>Include all detected technologies or only those available in the API</p> | `false`  | `false`      |

<!-- action-docs-inputs source="action.yml" -->

<!-- action-docs-outputs source="action.yml" -->

## Outputs

| name             | description                                          |
| ---------------- | ---------------------------------------------------- |
| `detected_techs` | <p>List of technologies detected</p>                 |
| `created_topics` | <p>List of topics created</p>                        |
| `skip_message`   | <p>Message when action is skipped</p>                |
| `skipped`        | <p>Boolean flag indicating if action was skipped</p> |

<!-- action-docs-outputs source="action.yml" -->

## `.github/techs.json`

This file is automatically created and maintained by the action. It serves as a cache of detected technologies and persists user-defined technologies across runs.

**Format:** Each timestamp key contains an array of detected technologies (in normalized nameId format), and the `user` array contains technologies that will always be included in GitHub Topics.

Example:

```json
{
  "user": ["nest-js", "nextjs", "tailwind-css"],
  "15-12-2025-14": ["shadcn-ui", "go"],
  "18-12-2025-17": ["radix-ui"]
}
```

**Benefits:**

- **Smart caching:** Detected technologies are stored with timestamps (DD-MM-YYYY-HH format)
- **Performance optimized:** Avoids redundant API calls for already-detected techs
- **Persistent tech tracking:** User-defined technologies persist across runs and won't be deleted
- **User-defined techs support:** Use the `user` field to specify technologies that should always be included in Topics

### API Field Mapping

The action validates technologies against the API and uses the following field priority:

- **`nameId`**: The primary identifier (typical name, may contain `.`). This is what gets normalized and stored in `techs.json`.
  - Example: `Next.js` → normalized to `nextjs`, `.NET` → normalized to `dotnet`
- **`nameBadge`**: GitHub Topics-compatible format (already normalized, no `.`). Used as fallback for validation.
- **`slug`**: Additional identifier for matching. Used as last resort if nameId/nameBadge unavailable.

### Normalization Rules

When `full: false` (default), only technologies with exact API matches are included. Normalization converts:

- `.` (dot) → `-` (dash), with special cases like `.net` → `dotnet`
- Spaces and underscores → `-` (dash)
- Multiple dashes → single dash
- Uppercase → lowercase
- Special characters removed

## 😎 Contributing

You're thinking about contributing to this project? Take a look at our [contribution guide](docs/CONTRIBUTING.md).
