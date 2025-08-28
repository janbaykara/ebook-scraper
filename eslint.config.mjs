import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import-x';
import prettierPluginRecommended from 'eslint-plugin-prettier/recommended';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import tsEslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  prettierPluginRecommended,
  {
    plugins: {
      'unused-imports': unusedImportsPlugin,
    },
    languageOptions: {
      ecmaVersion: 6,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          modules: true,
        },
        tsconfigRootDir: '.',
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/explicit-function-return-type': 0,
      '@typescript-eslint/explicit-member-accessibility': 0,
      '@typescript-eslint/no-floating-promises': ['error', { ignoreIIFE: true, ignoreVoid: false }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/return-await': ['error', 'always'],
      curly: 'error',
      eqeqeq: 2,
      'import-x/no-named-as-default-member': 0,
      'import-x/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
      'no-console': 'off', // until we have a better logging solution
      'no-return-await': 'off', // must be disabled for @typescript-eslint/return-await to work
      'no-unused-expressions': 2, // no short-circuit eval, e.g. `!!x && (() => ...)`
      'prettier/prettier': ['error', { singleQuote: true }],
      'require-await': 'off', // must be disabled for @typescript-eslint/require-await to work
      'unused-imports/no-unused-imports': 'error',
    },
  },
  {
    ignores: [
      // dependencies
      'node_modules',
      // compiled / generated output
      'dist',
      'build',
      '.output',
      '**/generated',
      // test coverage output
      'coverage',
      // binary scripts
      'bin',
      // wxt configs
      '.wxt/**/*.d.ts',
      '.wxt/eslint-auto-imports.mjs',
    ],
  },
  {
    /**
     * Disable type-aware linting for JS configs and build output.
     */
    files: ['*.mjs', 'dist/**'],
    ...tsEslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
];
