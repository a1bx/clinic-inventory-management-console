module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'src/_designSystem/**'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  overrides: [
    {
      // UI primitive barrels intentionally re-export non-component helpers alongside components.
      files: ['src/components/ui/**/*.tsx'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
    {
      // The context provider and its hook are intentionally kept as one public context module.
      files: ['src/contexts/InventoryContext.tsx'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
};
