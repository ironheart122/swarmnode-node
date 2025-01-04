/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  arrowParens: 'always',
  printWidth: 90,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
}

export default {
  ...config,
  plugins: ['@ianvs/prettier-plugin-sort-imports'],
  importOrder: ['^node', '<THIRD_PARTY_MODULES>', '', '^~/', '^[../]', '^[./]'],
  importOrderParserPlugins: ['typescript'],
}
