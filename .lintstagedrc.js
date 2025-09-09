module.exports = {
  'src/**/*.js': [
    'eslint --fix'
  ],
  'test/**/*.js': [
    'eslint --fix'
  ],
  '*.{json,md,yml,yaml}': [
    'prettier --write'
  ]
};
