import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**', 'dist-electron/**', 'release/**', 'build/**', '.ai-test-dist/**', '.storage-test-dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { rules: { 'preserve-caught-error': 'off' } },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.es2021 } },
    plugins: { '@eslint-react': eslintReact, 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      '@eslint-react/no-duplicate-key': 'error',
      'preserve-caught-error': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['electron/**/*.ts', 'vite.config.ts', 'tests/**/*.ts', 'scripts/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.es2021 } },
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  }
);
