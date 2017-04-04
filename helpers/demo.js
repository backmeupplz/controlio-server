/** Dependencies */
const errors = require('./errors');

const demoAccounts = ['awesome@controlio.co'];

/** Method to check if user is demo */
function checkDemo(req, res, next) {
  if (req.user.isDemo) {
    next(errors.demoError());
  } else {
    next();
  }
}

module.exports = {
  checkDemo,
  demoAccounts,
};
