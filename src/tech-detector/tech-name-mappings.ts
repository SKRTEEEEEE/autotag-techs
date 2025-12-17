/**
 * Mapping dictionary for package names to their official Simple Icons nameId.
 * Used when the package name doesn't directly match the API nameId.
 *
 * Format: { "package-name": "Official nameId from API" }
 */
export const TECH_NAME_MAPPINGS: Record<string, string> = {
  // UI Libraries & Icon Sets
  "lucide-react": "Lucide",
  lucide: "Lucide",
  "@radix-ui/react-alert-dialog": "Radix UI",
  "@radix-ui/react-avatar": "Radix UI",
  "@radix-ui/react-dialog": "Radix UI",
  "@radix-ui/react-dropdown-menu": "Radix UI",
  "@radix-ui/react-icons": "Radix UI",
  "@radix-ui/react-label": "Radix UI",
  "@radix-ui/react-navigation-menu": "Radix UI",
  "@radix-ui/react-popover": "Radix UI",
  "@radix-ui/react-select": "Radix UI",
  "@radix-ui/react-separator": "Radix UI",
  "@radix-ui/react-slot": "Radix UI",
  "@radix-ui/react-tabs": "Radix UI",

  // React Ecosystem
  "react-dom": "React",
  "react-router": "React Router",
  "react-router-dom": "React Router",
  "react-hook-form": "React Hook Form",
  "@testing-library/react": "Testing Library",
  "@testing-library/user-event": "Testing Library",
  "@testing-library/jest-dom": "Testing Library",

  // Next.js Ecosystem
  "next-intl": "Next.js",
  "next-themes": "Next.js",
  "next-auth": "NextAuth.js",
  "eslint-config-next": "Next.js",

  // CSS & Styling
  "tailwind-merge": "Tailwind CSS",
  "tailwind-scrollbar": "Tailwind CSS",
  "tailwind-variants": "Tailwind CSS",
  "tw-animate-css": "Tailwind CSS",
  "@tailwindcss/postcss": "Tailwind CSS",
  "class-variance-authority": "Tailwind CSS", // CVA is commonly used with Tailwind

  // Build Tools & Bundlers
  "@vitejs/plugin-react": "Vite",
  "vite-tsconfig-paths": "Vite",

  // Testing
  "@vitest/coverage-v8": "Vitest",
  "@vitest/ui": "Vitest",
  "@playwright/test": "Playwright",
  jsdom: "jsdom",

  // TypeScript
  "@typescript-eslint/eslint-plugin": "TypeScript",
  "@typescript-eslint/parser": "TypeScript",
  "@types/node": "Node.js",
  "@types/react": "React",
  "@types/react-dom": "React",

  // Linting & Formatting
  "@eslint/eslintrc": "ESLint",
  "eslint-plugin-react": "React",
  "eslint-plugin-react-hooks": "React",
  "eslint-plugin-jsx-a11y": "React",

  // Performance & Monitoring
  "@lhci/cli": "Lighthouse",
  lighthouse: "Lighthouse",

  // Package Managers & Tools
  husky: "Husky",
  "cross-env": "cross-env",
  nyc: "nyc",
  "wait-on": "wait-on",

  // Form Handling
  "@hookform/resolvers": "React Hook Form",

  // File Upload
  "@uploadthing/react": "UploadThing",
  uploadthing: "UploadThing",

  // Misc
  clsx: "clsx",
  sonner: "Sonner",
  zod: "Zod",
  thirdweb: "thirdweb",
};

/**
 * Get the mapped tech name if it exists, otherwise return original
 */
export function getMappedTechName(packageName: string): string {
  return TECH_NAME_MAPPINGS[packageName.toLowerCase()] ?? packageName;
}
