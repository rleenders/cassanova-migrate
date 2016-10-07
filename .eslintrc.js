module.exports = {
  'extends': 'eslint:recommended',
  'env': {
    'node': true,
    'es6': true
  },
  'rules': {
    'max-len': [2, 120, 2],
    'no-var': 2,
    'no-eq-null': 2,
    'no-eval': 2,
    'no-multi-spaces': 2,
    'no-throw-literal': 2,
    'no-useless-concat': 2,
    'indent': [2, 2, { 'SwitchCase': 1 }],
    'semi': [2, 'always'],
    'quotes': [2, 'single'],
    'no-console': [0],
    'no-unused-vars': [2, {
      'args': 'none',
      'vars': 'all'
    }]
  }
};