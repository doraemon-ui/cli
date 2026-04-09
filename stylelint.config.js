// stylelint.config.js
module.exports = {
  extends: 'stylelint-config-standard',
  customSyntax: 'postcss-less',
  plugins: ['@stylistic/stylelint-plugin'],
  rules: {
    // 使用插件规则
    '@stylistic/indentation': 2,
    '@stylistic/declaration-block-trailing-semicolon': 'always',
    '@stylistic/block-closing-brace-newline-before': 'always',
    '@stylistic/unit-case': null,
    '@stylistic/color-hex-case': null,
    '@stylistic/max-empty-lines': null,
    '@stylistic/number-leading-zero': null,

    // 小程序特定配置
    'unit-no-unknown': [true, { ignoreUnits: ['rpx'] }],
    'selector-type-no-unknown': [true, { ignoreTypes: ['page'] }],

    // 关闭的规则
    'at-rule-no-unknown': null,
    'comment-empty-line-before': null,
    'no-descending-specificity': null,
    'no-duplicate-selectors': null,
    'no-empty-source': null,
    'declaration-block-no-duplicate-properties': null,
    'font-family-no-missing-generic-family-keyword': null,
    'declaration-empty-line-before': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
  },
  ignoreFiles: [
    '.git',
    '.github',
    '.husky',
    '.*.js',
    'node_modules',
    'packages/**/dist',
    'packages/**/lib',
    'packages/**/types',
    'packages/**/miniprogram_dist',
    'packages/**/node_modules',
  ],
}
