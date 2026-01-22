require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  // Temporarily disable extends to avoid version conflicts
  // extends: ['@microsoft/eslint-config-spfx/lib/profiles/react'],
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    },
    tsconfigRootDir: __dirname
  },
  rules: {
    // Basic rules to get started
    'no-console': 'warn',
    'no-unused-vars': 'warn'
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
    }
  ]
};
