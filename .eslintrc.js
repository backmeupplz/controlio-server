module.exports = {
  'extends': 'airbnb',
  'installedESLint': true,
  'plugins': [
    'react',
    'jsx-a11y',
    'import',
    'promise',
  ],
  'rules': {
    'promise/param-names': 2,
    'promise/always-return': 0,
    'promise/catch-or-return': 2,
    'promise/no-native': 0,
    'consistent-return': 0,
    'no-use-before-define': 0,
  },
};