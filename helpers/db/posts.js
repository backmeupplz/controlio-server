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
 * @return {Promise(Mongoose:Post)} Resulting post
 */
function addPost(userId, projectId, text, attachments, type) {
  return new Promise((resolve, reject) =>
    users.findUserById(userId)
      .then(user =>
        projects.getProjectsOwned(user._id)
          .then((count) => {
            if (count > user.maxProjects()) {
              throw errors.notEnoughProjectsOnPlan();
            }
            return user;
          }))
      .then(user =>
        Project.findById(projectId)
          .populate('clients')
          .then(project => ({ user, project })))
      /** Check if owner */
      .then(({ user, project }) => {
        let authorized = false;
        if (project.owner.equals(user._id)) {
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
        return { user, project };
      })
      /** Check if finished */
      .then(({ user, project }) => {
        if (project.isFinished) {
          throw errors.projectIsFinished();
        }
        return { project, user };
      })
      .then(({ user, project }) => {
        const post = new Post({
          author: user._id,
          text,
          attachments,
          type,
        });
        return post.save()
          .then(dbpost => ({ project, dbpost }));
      })
      .then(({ project, dbpost }) => {
        push.pushNewPostToClients(project, dbpost);
        project.posts.push(dbpost);
        if (dbpost.type === 'status') {
          project.lastStatus = dbpost._id;
        }
        project.lastPost = dbpost._id;
        return project.save()
          .then(() => resolve(dbpost));
      })
      .catch(reject)
  );
}

/**
 * Function to get a list of posts
 * @param {Mongoose:ObjectId} userId Id of the requesting user
 * @param {Mongoose:ObjectId} projectId Id of the project where to get posts
 * @param {Number} skip Skip of this List
 * @param {Number} limit Limit of this list
 * @return {Promise([Mongoose:Post])} A list of requested posts
 */
function getPosts(userId, projectId, skip, limit) {
  return new Promise((resolve, reject) =>
    users.findUserById(userId)
      .then(user =>
        Project.findById(projectId)
          .populate([{
            path: 'posts',
            populate: {
              path: 'author',
              model: 'user',
            },
          },
          {
            path: 'invites',
          }])

          .then(project => ({ user, project }))
      )
      .then(({ user, project }) => {
        if (!project) {
          throw errors.noProjectFound();
        }
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
        const sortedPosts = project.posts.sort((a, b) =>
            b.createdAt - a.createdAt
        );
        const slicedPosts = sortedPosts.slice(skip, skip + limit);
        resolve(slicedPosts);
      })
      .catch(reject)
  );
}

/**
 * Function to edit the post
 * @param {Mongoose:ObjectId} userId Id of editting user
 * @param {Mongoose:ObjectId} projectId Id of the project where post exists
 * @param {Mongoose:ObjectId} postId Id of the post to edit
 * @param {String} text New text
 * @param {[String]} attachments New attachments
 * @return {Promise(Mongoose:Post)} Resulting post
 */
function editPost(userId, projectId, postId, text, attachments) {
  return new Promise((resolve, reject) =>
    users.findUserById(userId)
      .then(user =>
        projects.getProjectsOwned(user._id)
          .then((count) => {
            if (count > user.maxProjects()) {
              throw errors.notEnoughProjectsOnPlan();
            }
            return user;
          }))
      /** Get user, post, project */
      .then(user =>
        Post.findById(postId)
          .then(post =>
            Project.findById(projectId)
              .then(project => ({ user, post, project }))
          )
      )
      /** Verify access */
      .then(({ user, post, project }) => {
        if (!project) {
          throw errors.noProjectFound();
        }
        if (!post) {
          throw errors.noPostFound();
        }
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
        return { user, post, project };
      })
      /** Check if Finished */
      .then(({ user, post, project }) => {
        if (project.isFinished) {
          throw errors.projectIsFinished();
        }
        return { user, post, project };
      })
      /** Edit post */
      .then(({ user, post, project }) => {
        post.isEdited = true;
        post.text = text;
        post.attachments = attachments;

        reporter.reportEditPost(user, post, project);

        return post.save()
          .then(resolve)
          .catch(reject);
      })
      .catch(reject)
  );
}

/**
 * Function to dleete a post
 * @param {Mongoose:ObjectId} userId Id of deleting user
 * @param {Mongoose:ObjectId} projectId Id of the project where post exists
 * @param {Mongoose:ObjectId} postId Id of the post to delete
 * @return {Promise()} Promise thart's resolved on success
 */
function deletePost(userId, projectId, postId) {
  return new Promise((resolve, reject) =>
    users.findUserById(userId)
      /** Get user, post, project */
      .then(user =>
        Post.findById(postId)
          .then(post =>
            Project.findById(projectId)
              .then(project => ({ user, post, project }))
          )
      )
      /** Verify access */
      .then(({ user, post, project }) => {
        if (!project) {
          throw errors.noProjectFound();
        }
        if (!post) {
          throw errors.noPostFound();
        }
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
        return { user, post, project };
      })
      /** Delete post */
      .then(({ user, post, project }) => {
        project.posts = project.posts.filter(id => !id.equals(post.id));
        return project.save()
          .then(() => {
            post.remove((err) => {
              if (err) {
                throw err;
              } else {
                reporter.reportDeletePost(user, post, project);
                resolve();
              }
            });
          })
          .catch(reject);
      })
      .catch(reject)
  );
}

module.exports = {
  addPost,
  getPosts,
  editPost,
  deletePost,
};
