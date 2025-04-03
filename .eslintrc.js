module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    // Disable rules that might be causing issues
    'react/no-unescaped-entities': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'prefer-const': 'warn',
  },
}; 