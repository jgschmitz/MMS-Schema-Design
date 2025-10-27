module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off', // Allow console for CLI tools
    'prefer-const': 'error',
    'no-var': 'error',
  },
};