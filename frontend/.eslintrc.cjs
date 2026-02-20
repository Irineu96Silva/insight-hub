
module.exports = {
  root: true,
  parserOptions: {
    parser: require.resolve('@typescript-eslint/parser'),
    ecmaVersion: 2021,
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
    'vue/setup-compiler-macros': true,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
  ],
  plugins: ['@typescript-eslint', 'vue'],
  globals: {
    process: 'readonly',
    ga: 'readonly',
    cordova: 'readonly',
    Capacitor: 'readonly',
    chrome: 'readonly',
  },
  rules: {
    'prefer-promise-reject-errors': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // Turning off for now to focus on critical errors
    'vue/multi-word-component-names': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  },
}
