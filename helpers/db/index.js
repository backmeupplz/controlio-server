/**
 * Manager to encapsulate all actions on database
 */

/** Dependencies */
const _ = require('lodash');

const users = require('./users');
const projects = require('./projects');
const posts = require('./posts');

/** Exports */
module.exports = _.merge(users, projects, posts);
