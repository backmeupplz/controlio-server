const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const db = require('../helpers/db');
const hash = require('../helpers/hash');
const jwt = require('../helpers/jwt');
const request = require('supertest');
const app = require('../app');

function closeConnectDrop() {
  return new Promise((resolve, reject) => {
    if (mongoose.connection.readyState) {
      mongoose.connection.close((err) => {
        if (err) return reject(err);
        mongoose.connect('mongodb://localhost:27017/controlio-test', (error) => {
          if (error) return reject(error);
          drop()
            .then(resolve)
            .catch(reject);
        });
      });
    } else {
      mongoose.connect('mongodb://localhost:27017/controlio-test', (error) => {
        if (error) return reject(error);
        drop()
          .then(resolve)
          .catch(reject);
      });
    }
  });
}

function dropClose() {
  return new Promise((resolve, reject) => {
    drop()
      .then(() => {
        mongoose.connection.close((inerr) => {
          if (inerr) return reject(inerr);
          resolve();
        });
      })
      .catch(reject);
  });
}

function drop() {
  return new Promise((resolve, reject) => {
    mongoose.connection.db.dropDatabase((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * Method to add new user and generate JWT for it
 * @param {Object} user Object describing user
 * @return {Mongoose:User} User that was created
 */
async function addUserWithJWT(user) {
  const dbuser = await db.addUser(user);
  dbuser.generateJWT();
  return await dbuser.save();
}

function generateResetPasswordToken(user) {
  user.generateResetPasswordToken();
  return user.save();
}

function setPassword(password) {
  return user => hash.hashPassword(password)
    .then((result) => {
      user.password = result;
      return user.save();
    });
}

function generateJWT(user) {
  user.token = jwt.sign({
    email: user.email,
    userid: user._id,
  });
  return user.save();
}

function maximizePlan(user) {
  user.plan = 3;
  return user.save();
}

module.exports = {
  closeConnectDrop,
  dropClose,
  drop,
  addUserWithJWT,
  request: request(app),
  generateResetPasswordToken,
  setPassword,
  generateJWT,
  maximizePlan,
};
