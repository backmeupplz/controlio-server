/**
 * Manages all db requests for stats
 */

const { Stats } = require('../../models');

async function getStats() {
  let dbstats = await Stats.findOne({});
  if (!dbstats) {
    const newStats = new Stats({});
    dbstats = await newStats.save();
  }
  return dbstats;
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
