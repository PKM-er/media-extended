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
    "jsdoc",
    "prefer-arrow",
    "simple-import-sort",
  ],
  rules: {
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "prefer-arrow/prefer-arrow-functions": [
      "warn",
      {
        disallowPrototype: true,
        singleReturnOnly: false,
        classPropertiesAllowed: false,
      },
    ],
  },
};
