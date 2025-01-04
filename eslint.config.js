// @ts-check

import eslint from '@eslint/js'
import vitest from 'eslint-plugin-vitest'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  vitest.configs.recommended,
  {
    files: ['src/**/*.ts', 'test/**/*.ts', 'examples/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-this-alias': 'warn',
    },
  },
  {
    ignores: ['dist', 'tmp'],
  },
)
