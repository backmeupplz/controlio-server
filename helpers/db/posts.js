/**
 * Manages all db requests for posts
 */

const { Post, Project } = require('../../models');
const errors = require('../errors');
const users = require('./users');
const projects = require('./projects');
const reporter = require('../reporter');
const push = require('../push');

/**
 * Function to add new post
 * @param {Mongoose:ObjectId} userId Id of the user to add post
 * @param {Mongoose:ObjectId} projectId Id of project where to add post
 * @param {String} text Text of the post
 * @param {[String]]} attachments A list of attachment urls
 * @param {String} type Type (post or status)
 * @throws {NOT_ENOUGH_PROJECTS_ERROR} If more projects on user than allowed by plan
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to add new post
 * @throws {FINISHED_ERROR} If project is finished
 * @return {Mongoose:Post} Resulting post
 */
async function addPost(userId, projectId, text, attachments, type) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Get max number of projects allowed by plan */
  const projectsOwned = await projects.getProjectsOwned(user._id);
  /** Check if enough projects on plan */
  if (projectsOwned > user.maxProjects()) {
    throw errors.notEnoughProjectsOnPlan();
  }
  /** Get project */
  const project = Project.findById(projectId)
    .populate('clients managers owner');
  /** Check if authorized to create a post */
  let authorized = false;
  if (project.owner._id.equals(user._id)) {
    authorized = true;
  }
  project.managers.forEach((manager) => {
    if (manager._id.equals(user._id)) {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Check if project is finished */
  if (project.isFinished) {
    throw errors.projectIsFinished();
  }
  /** Create new post */
  let post = new Post({
    author: user._id,
    text,
    attachments,
    type,
  });
  post = await post.save();
  /** Push notify clients about new post */
  push.pushNewPostToClients(project, post);
  /** Add post to project */
  project.posts.push(post);
  if (post.type === 'status') {
    project.lastStatus = post._id;
  }
  project.lastPost = post._id;
  await project.save();
  /** Return resulting post */
  return post;
}

/**
 * Function to get a list of posts
 * @param {Mongoose:ObjectId} userId Id of the requesting user
 * @param {Mongoose:ObjectId} projectId Id of the project where to get posts
 * @param {Number} skip Skip of this List
 * @param {Number} limit Limit of this list
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to get posts
 * @return {[Mongoose:Post]} A list of requested posts
 */
async function getPosts(userId, projectId, skip, limit) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Get project */
  const project = await Project.findById(projectId)
    .populate([{
      path: 'posts',
      populate: {
        path: 'author',
        model: 'user',
      },
    },
    { path: 'invites' }]);
  /** Throw error if no project exist */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Check if authorized to get posts */
  let authorized = false;
  if (project.owner && project.owner.equals(user._id)) {
    authorized = true;
  }
  project.managers.forEach((manager) => {
    if (manager.equals(user._id)) {
      authorized = true;
    }
  });
  project.clients.forEach((client) => {
    if (client.equals(user._id)) {
      authorized = true;
    }
  });
  project.invites.forEach((invite) => {
    if (invite.invitee.equals(user._id)) {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Sort posts */
  const sortedPosts = project.posts.sort((a, b) =>
    b.createdAt - a.createdAt
  );
  /** Slice posts */
  const slicedPosts = sortedPosts.slice(skip, skip + limit);
  /** Return posts */
  return slicedPosts;
}

/**
 * Function to edit the post
 * @param {Mongoose:ObjectId} userId Id of editting user
 * @param {Mongoose:ObjectId} projectId Id of the project where post exists
 * @param {Mongoose:ObjectId} postId Id of the post to edit
 * @param {String} text New text
 * @param {[String]} attachments New attachments
 * @throws {NOT_ENOUGH_PROJECTS_ERROR} If not enough projects on plan
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @throws {POST_NOT_FOUND_ERROR} If no post found
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to edit post
 * @throws {FINISHED_ERROR} If project is finished
 * @return {Mongoose:Post} Resulting post
 */
async function editPost(userId, projectId, postId, text, attachments) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Get count of projects owned */
  const projectsOwned = await projects.getProjectsOwned(user._id);
  /** Check if projects owned within the limit of plan */
  if (projectsOwned > user.maxProjects()) {
    throw errors.notEnoughProjectsOnPlan();
  }
  /** Get post */
  const post = await Post.findById(postId);
  /** Get project */
  const project = await Project.findById(projectId);
  /** Throw error if no project found */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Throw error if no post found */
  if (!post) {
    throw errors.noPostFound();
  }
  /** Check if authorized */
  let authorized = false;
  if (project.owner && project.owner.equals(user._id)) {
    authorized = true;
  }
  project.managers.forEach((manager) => {
    if (manager.equals(user._id)) {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Throw an error if project finished */
  if (project.isFinished) {
    throw errors.projectIsFinished();
  }
  /** Edit post */
  post.isEdited = true;
  post.text = text;
  post.attachments = attachments;
  /** Report edit post */
  reporter.reportEditPost(user, post, project);
  /** Save and return resulting post */
  return await post.save();
}

/**
 * Function to dleete a post
 * @param {Mongoose:ObjectId} userId Id of deleting user
 * @param {Mongoose:ObjectId} projectId Id of the project where post exists
 * @param {Mongoose:ObjectId} postId Id of the post to delete
 * @throws {PROJECT_NOT_FOUND_ERROR} If no project found
 * @throws {POST_NOT_FOUND_ERROR} If no post found
 * @throws {NOT_AUTHORIZED_ERROR} If not authorized to delete post
 */
async function deletePost(userId, projectId, postId) {
  /** Get user */
  const user = await users.findUserById(userId);
  /** Get post */
  const post = await Post.findById(postId);
  /** Get project */
  let project = await Project.findById(projectId);
  /** Throw error if no project found */
  if (!project) {
    throw errors.noProjectFound();
  }
  /** Throw error if no post found */
  if (!post) {
    throw errors.noPostFound();
  }
  /** Check if authorized */
  let authorized = false;
  if (project.owner && project.owner.equals(user._id)) {
    authorized = true;
  }
  project.managers.forEach((manager) => {
    if (manager.equals(user._id)) {
      authorized = true;
    }
  });
  if (!authorized) {
    throw errors.notAuthorized();
  }
  /** Delete post */
  project.posts = project.posts.filter(id => !id.equals(post.id));
  /** Save project */
  project = await project.save();
  /** Remove post */
  await post.remove().exec();
  /** Report post deletion */
  reporter.reportDeletePost(user, post, project);
}

module.exports = {
  addPost,
  getPosts,
  editPost,
  deletePost,
};
