/**
 * Manages all db requests for stats
 */

const { Stats } = require('../../models');

/**
 * Method to get stats object; creates one if not found
 * @return {Mongoose:Stats} Stats object
 */
async function getStats() {
  /** Get stats object from db */
  let dbstats = await Stats.findOne({});
  /** Create new stats object if not found */
  if (!dbstats) {
    const newStats = new Stats({});
    dbstats = await newStats.save();
  }
  /** Return stats object */
  return dbstats;
}

/**
 * Method to decrement number of users used 'friend' discount
 * @return {Mongoose:Stats} Object with stats
 */
async function decrementNumberOfFriend() {
  /** Get stats */
  let stats = await getStats();
  /** Decrement stats of discount if greater than zero */
  if (stats.numberOfFriendDiscountsLeft >= 0) {
    stats.numberOfFriendDiscountsLeft -= 1;
  }
  /** Save stats */
  stats = await stats.save();
  /** Return saved stats */
  return stats;
}

/** Export */
module.exports = {
  getStats,
  decrementNumberOfFriend,
};
