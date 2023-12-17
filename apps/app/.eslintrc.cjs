/**
 * Specific eslint rules for this app/package, extends the base rules
 * @see https://github.com/belgattitude/nextjs-monorepo-example/blob/main/docs/about-linters.md
 */

// Workaround for https://github.com/eslint/eslint/issues/3458 (re-export of @rushstack/eslint-patch)
require("@mx/config/patch/modern-module-resolution");

const { getDefaultIgnorePatterns } = require("@mx/config/helpers");

const typescriptOptions = {
  tsconfigRootDir: __dirname,
  project: "tsconfig.json",
};

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  root: true,
  parserOptions: {
    ...typescriptOptions,
    ecmaVersion: "latest",
    sourceType: "module",
  },
  ignorePatterns: [...getDefaultIgnorePatterns()],
  extends: [
    "./node_modules/@mx/config/src/bases/typescript.js",
    "./node_modules/@mx/config/src/bases/regexp.js",
    // Apply prettier and disable incompatible rules
    "./node_modules/@mx/config/src/bases/prettier.js",
    "./node_modules/@mx/config/src/bases/react.js",
  ],
  rules: {
    "react/no-unknown-property": ["error", { ignore: ["aria-label-delay"] }],
    "jsx-a11y/aria-props": "off",
    "import/no-deprecated": "warn",
  },
  settings: {
    "import/resolver": {
      typescript: typescriptOptions,
    },
  },
  overrides: [],
};
