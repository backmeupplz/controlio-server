module.exports = {
  'extends': 'airbnb',
  'installedESLint': true,
  'plugins': [
    'promise',
  ],
  'rules': {
    'global-require': 0,
    'import/no-extraneous-dependencies': 0,
    'promise/param-names': 2,
    'promise/always-return': 0,
    'promise/catch-or-return': 2,
    'promise/no-native': 0,
    'consistent-return': 0,
    'no-use-before-define': 0,
    'no-underscore-dangle': [2, { 'allow': ['_id'] }], // mongoose uses '_id' for id's
    'new-cap': [2, {'capIsNewExceptions': ['Router', 'API']}], // Router is used by express, API by sendgrid
    'no-unused-vars': [2, { 'argsIgnorePattern': 'next' }], // sometimes we need to specify 'next' even if we don't use it
    'no-console': [2, { 'allow': ['info'] }], // Rarely we do need to print some info
    'no-param-reassign': 0,
    'func-names': 0,
    'prefer-arrow-callback': 0,
  },
};
