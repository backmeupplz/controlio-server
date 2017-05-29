/** Dependencies */
const errors = require('./errors');

const demoAccounts = ['awesome@controlio.co'];

/** Method to check if user is demo */
function checkDemo(req, res, next) {
  try {
    /** Throw error if user is demo */
    if (req.user.isDemo) {
      throw errors.demoError();
    }
    /** Continue router execution */
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkDemo,
  demoAccounts,
};
