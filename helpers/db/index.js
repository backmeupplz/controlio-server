/**
 * Manager to encapsulate all actions on database
 */

/** Dependencies */
const _ = require('lodash');

const users = require('./users');
const projects = require('./projects');
const posts = require('./posts');
const stats = require('./stats');

/** Exports */
module.exports = _.merge(users, projects, posts, stats);
