/**
 * Manages all db requests for stats
 */

const { Stats } = require('../../models');

function getStats() {
  return Stats.findOne({})
    .then((stats) => {
      if (!stats) {
        const newStats = new Stats({});
        return newStats.save();
      }
      return stats;
    });
}

/** Export */
module.exports = {
  getStats,
};
