module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  extends: ["prettier", "plugin:prettier/recommended"],
  env: {
    browser: true,
    node: true,
  },
  plugins: [
    "@typescript-eslint",
    "import",
    "jsdoc",
    "prefer-arrow",
    "simple-import-sort",
  ],
};
