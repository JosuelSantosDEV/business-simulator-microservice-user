module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [".eslintrc.js"],
  rules: {
    // TypeScript

    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "no-multiple-empty-lines": "off",

    // DESLIGADO para permitir linhas em branco
    "no-multiple-empty-lines": "off",

    // Prettier manda no estilo
    "prettier/prettier": [
      "warn",
      {
        singleQuote: false,
        semi: true,
        trailingComma: "all",
        printWidth: 80,
        tabWidth: 2,
      },
    ],
  },
};
