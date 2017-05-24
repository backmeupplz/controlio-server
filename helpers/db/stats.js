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

function decrementNumberOfFriend() {
  return getStats()
    .then((stats) => {
      if (stats.numberOfFriendDiscountsLeft >= 0) {
        stats.numberOfFriendDiscountsLeft -= 1;
      }
      return stats.save();
    });
}

/** Export */
module.exports = {
  getStats,
  decrementNumberOfFriend,
};
