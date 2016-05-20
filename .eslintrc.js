module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  extends: 'eslint:recommended',
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
  },
};
