/**
 * Module to send out ush notifications
 */

/** Dependencies */
const apn = require('apn');
const path = require('path');

const provider = new apn.Provider({
  key: path.join(__dirname, '../certificates/production_BorodutchStudio.Controlio.pkey'),
  cert: path.join(__dirname, '../certificates/production_BorodutchStudio.Controlio.pem'),
  production: true,
});

/** Push notification methods */

/**
 * Used to send push notification about invite message
 * @param {[Mongoose:User]]} users A list of users that need to receive push
 * @param {Mongoose:Project} project Project which is the subject of the push
 * @param {String} type Enum: 'owner', 'client' or 'manager', type of invite
 */
function pushInvite(users, project, type) {
  const article = (type === 'owner') ? 'an' : 'a';
  const text = `You were invited to "${project.title}" as ${article} ${type}`;
  sendNotification(text, users);
}

/**
 * Used to push project's new message to clients
 * @param {Mongoose:Project} project Project with new message
 * @param {Mongoose:Post} post New post
 */
function pushNewPostToClients(project, post) {
  const message = (post.text && post.text.length > 0) ?
    post.text : 'New message';
  const text = `"${project.title}": ${message}`;
  sendNotification(text, project.clients);
}

/**
 * Method to send push notification
 * @param {String} text Text to send
 * @param {[Mongo:User]]} users A list of users to receive the notification
 */
function sendNotification(text, users) {
  const notification = new apn.Notification();
  notification.alert = text;
  notification.topic = 'BorodutchStudio.Controlio';
  let resultTokens = [];
  users.forEach((user) => {
    resultTokens = resultTokens.concat(user.iosPushTokens);
  });
  provider.send(notification, resultTokens)
    .then((response) => {
      if (response.sent.length > 0) {
        console.info(`Sent '${text}' to ${response.sent.map(v => JSON.stringify(v))}`);
      }
      if (response.failed.length > 0) {
        console.info(`Failed sending to ${response.failed.map(fail => JSON.stringify(fail))}`);
      }
    })
    .catch(/** TODO: handle error */);
}

/** Exports */
module.exports = {
  sendNotification,
  pushInvite,
  pushNewPostToClients,
};
