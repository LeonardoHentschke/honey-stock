module.exports = {
  extends: ['expo', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Proibir any explícito (CLAUDE.md §9)
    '@typescript-eslint/no-explicit-any': 'error',
    // Exigir tipos de retorno explícitos em funções exportadas
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // Não permitir imports de módulos não-tipados sem @types
    '@typescript-eslint/no-require-imports': 'warn',
    // Imports não usados
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/'],
};
