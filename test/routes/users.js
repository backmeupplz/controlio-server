const test = require('unit.js');
const helper = require('../helper');
const db = require('../../helpers/db');
const config = require('../../config');

describe('routes/users.js', function () {
  const testEmail = 'test@controlio.co';
  const signupEmail = 'signup@controlio.co';
  const password = 'password';
  let user;
  let signupUser;

  before(function (done) {
    this.timeout(5000);
    helper.closeConnectDrop()
      .then(done)
      .catch(done);
  });
  after(function (done) {
    helper.dropClose()
      .then(done)
      .catch(done);
  });

  context('POST /users/requestMagicLink', function () {
    it('returns error when no email is provided', function (done) {
      helper.request
        .post('/users/requestMagicLink')
        .set('apiKey', config.apiKey)
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when malformed email is provided', function (done) {
      helper.request
        .post('/users/requestMagicLink')
        .set('apiKey', config.apiKey)
        .send({
          email: '123',
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('creates new user with magic link token', function (done) {
      this.timeout(10000);
      helper.request
        .post('/users/requestMagicLink')
        .set('apiKey', config.apiKey)
        .send({
          email: testEmail,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('success', true);
            db.findUser({ email: testEmail })
              .select('+magicToken')
              .then((dbuser) => {
                if (!dbuser) {
                  return done(new Error('No user created'));
                }
                user = dbuser;
                test.string(dbuser.magicToken);
                done();
              })
              .catch(done);
          } catch (error) {
            done(error);
          }
        });
    });
    it('does not create the same user twice but changes token', function (done) {
      this.timeout(10000);
      helper.request
        .post('/users/requestMagicLink')
        .set('apiKey', config.apiKey)
        .send({
          email: testEmail,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('success', true);
            db.findUser({ email: testEmail })
              .select('+magicToken')
              .then((dbuser) => {
                if (!dbuser) {
                  return done(new Error('No user fetched'));
                }
                test
                  .string(dbuser.magicToken)
                    .isNotEqualTo(user.magicToken)
                  .string(String(dbuser._id))
                    .isEqualTo(String(user._id));
                user = dbuser;
                done();
              })
              .catch(done);
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('POST /users/loginMagicLink', function () {
    it('returns error when no token is provided', function (done) {
      helper.request
        .post('/users/loginMagicLink')
        .set('apiKey', config.apiKey)
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when malformed token is provided', function (done) {
      helper.request
        .post('/users/loginMagicLink')
        .set('apiKey', config.apiKey)
        .send({ token: '123' })
        .expect(500, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.string(json.message)
              .contains('jwt malformed');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('successfully logs in user and saves tokens', function (done) {
      helper.request
        .post('/users/loginMagicLink')
        .set('apiKey', config.apiKey)
        .send({
          token: user.magicToken,
          iosPushToken: 'ios',
          androidPushToken: 'android',
          webPushToken: 'web',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('_id')
              .hasProperty('token')
              .hasProperty('email', 'test@controlio.co')
              .hasProperty('isDemo', false)
              .hasProperty('isAdmin', false)
              .hasProperty('plan', 0)
              .hasProperty('stripeId');
            db.findUserById(json._id)
              .select('iosPushTokens androidPushTokens webPushTokens')
              .then((dbuser) => {
                const object = dbuser.toObject();
                test
                  .string(object.iosPushTokens[0])
                    .isEqualTo('ios')
                  .string(object.androidPushTokens[0])
                    .isEqualTo('android')
                  .string(object.webPushTokens[0])
                    .isEqualTo('web');
                done();
              })
              .catch(done);
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('POST /users/signUp', function () {
    it('returns error when no email is provided', function (done) {
      helper.request
        .post('/users/signUp')
        .set('apiKey', config.apiKey)
        .send({ password })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when no password is provided', function (done) {
      helper.request
        .post('/users/signUp')
        .set('apiKey', config.apiKey)
        .send({ email: signupEmail })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when email is malformed', function (done) {
      helper.request
        .post('/users/signUp')
        .set('apiKey', config.apiKey)
        .send({
          email: '123',
          password,
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when password is too short', function (done) {
      helper.request
        .post('/users/signUp')
        .set('apiKey', config.apiKey)
        .send({
          email: signupEmail,
          password: 'pass',
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when password is too long', function (done) {
      helper.request
        .post('/users/signUp')
        .set('apiKey', config.apiKey)
        .send({
          email: signupEmail,
          password: 'passwordddpasswordddpasswordddd',
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when email is too long', function (done) {
      helper.request
        .post('/users/signUp')
        .set('apiKey', config.apiKey)
        .send({
          email: '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890@controlio.co',
          password,
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('successfully signs up user and saves tokens', function (done) {
      helper.request
        .post('/users/signUp')
        .set('apiKey', config.apiKey)
        .send({
          email: signupEmail,
          password,
          iosPushToken: 'ios_two',
          androidPushToken: 'android_two',
          webPushToken: 'web_two',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('_id')
              .hasProperty('token')
              .hasProperty('email', 'signup@controlio.co')
              .hasProperty('isDemo', false)
              .hasProperty('isAdmin', false)
              .hasProperty('plan', 0)
              .hasProperty('stripeId');
            db.findUserById(json._id)
              .select('iosPushTokens androidPushTokens webPushTokens')
              .then((dbuser) => {
                const object = dbuser.toObject();
                test
                  .string(object.iosPushTokens[0])
                    .isEqualTo('ios_two')
                  .string(object.androidPushTokens[0])
                    .isEqualTo('android_two')
                  .string(object.webPushTokens[0])
                    .isEqualTo('web_two');
                done();
              })
              .catch(done);
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when signing up the same user again', function (done) {
      helper.request
        .post('/users/signUp')
        .set('apiKey', config.apiKey)
        .send({
          email: signupEmail,
          password,
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'USER_ALREADY_EXIST_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when signing up existing user without password', function (done) {
      const email = 'some@controlio.co';
      helper.addUserWithJWT({ email })
        .then(() => {
          helper.request
            .post('/users/signUp')
            .set('apiKey', config.apiKey)
            .send({
              email,
              password,
            })
            .expect(500, (err, res) => {
              if (err) return done(err);
              try {
                const json = JSON.parse(res.text);
                test.object(json)
                  .hasProperty('type', 'PASSWORD_NOT_FOUND_ERROR');
                done();
              } catch (error) {
                done(error);
              }
            });
        })
        .catch(done);
    });
  });

  context('POST /users/login', function () {
    it('returns error when no email is provided', function (done) {
      helper.request
        .post('/users/login')
        .set('apiKey', config.apiKey)
        .send({ password })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when no password is provided', function (done) {
      helper.request
        .post('/users/login')
        .set('apiKey', config.apiKey)
        .send({ email: signupEmail })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when email not registered', function (done) {
      helper.request
        .post('/users/login')
        .set('apiKey', config.apiKey)
        .send({
          email: 'random@controlio.co',
          password,
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'EMAIL_NOT_REGISTERED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when logining in existing user without password', function (done) {
      const email = 'another@controlio.co';
      helper.addUserWithJWT({ email })
        .then(() => {
          helper.request
            .post('/users/login')
            .set('apiKey', config.apiKey)
            .send({
              email,
              password,
            })
            .expect(500, (err, res) => {
              if (err) return done(err);
              try {
                const json = JSON.parse(res.text);
                test.object(json)
                  .hasProperty('type', 'PASSWORD_NOT_FOUND_ERROR');
                done();
              } catch (error) {
                done(error);
              }
            });
        })
        .catch(done);
    });
    it('successfully logs in user and saves tokens', function (done) {
      helper.request
        .post('/users/login')
        .set('apiKey', config.apiKey)
        .send({
          email: signupEmail,
          password,
          iosPushToken: 'ios_three',
          androidPushToken: 'android_three',
          webPushToken: 'web_three',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('_id')
              .hasProperty('token')
              .hasProperty('email', 'signup@controlio.co')
              .hasProperty('isDemo', false)
              .hasProperty('isAdmin', false)
              .hasProperty('plan', 0)
              .hasProperty('stripeId');
            db.findUserById(json._id)
              .select('iosPushTokens androidPushTokens webPushTokens')
              .then(helper.generateJWT)
              .then((dbuser) => {
                user = dbuser.toObject();
                test
                  .string(user.iosPushTokens[1])
                    .isEqualTo('ios_three')
                  .string(user.androidPushTokens[1])
                    .isEqualTo('android_three')
                  .string(user.webPushTokens[1])
                    .isEqualTo('web_three');
                done();
              })
              .catch(done);
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('POST /users/recoverPassword', function () {
    it('returns error when no email is provided', function (done) {
      helper.request
        .post('/users/recoverPassword')
        .set('apiKey', config.apiKey)
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when no email is malformed', function (done) {
      helper.request
        .post('/users/recoverPassword')
        .set('apiKey', config.apiKey)
        .send({ email: '123' })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when no user is found', function (done) {
      helper.request
        .post('/users/recoverPassword')
        .set('apiKey', config.apiKey)
        .send({ email: 'nouser@controlio.co' })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'EMAIL_NOT_REGISTERED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('successfully initiates reset password', function (done) {
      helper.request
        .post('/users/recoverPassword')
        .set('apiKey', config.apiKey)
        .send({ email: testEmail })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('success', true);
            db.findUser({ email: testEmail })
              .select('tokenForPasswordResetIsFresh tokenForPasswordReset')
              .then((dbuser) => {
                user = dbuser.toObject();
                test.object(user)
                  .hasProperty('tokenForPasswordReset')
                  .hasProperty('tokenForPasswordResetIsFresh', true);
                done();
              })
              .catch(done);
          } catch (error) {
            done(error);
          }
        });
    });
    it('successfully initiates reset password again changing tokens', function (done) {
      helper.request
        .post('/users/recoverPassword')
        .set('apiKey', config.apiKey)
        .send({ email: testEmail })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('success', true);
            db.findUser({ email: testEmail })
              .select('tokenForPasswordResetIsFresh tokenForPasswordReset')
              .then((dbuser) => {
                const temp = user.tokenForPasswordReset;
                user = dbuser.toObject();
                test.object(user)
                  .hasProperty('tokenForPasswordResetIsFresh', true)
                  .hasProperty('tokenForPasswordReset')
                    .string(user.tokenForPasswordReset)
                      .isNotEqualTo(temp);
                done();
              })
              .catch(done);
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('POST /users/resetPassword', function () {
    it('returns error when no token is provided', function (done) {
      helper.request
        .post('/users/resetPassword')
        .set('apiKey', config.apiKey)
        .send({ password })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when no password is provided', function (done) {
      helper.request
        .post('/users/resetPassword')
        .set('apiKey', config.apiKey)
        .send({ token: '123' })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when token is malformed', function (done) {
      helper.request
        .post('/users/resetPassword')
        .set('apiKey', config.apiKey)
        .send({
          password,
          token: '123',
        })
        .expect(500, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('message', 'jwt malformed');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when password is too short', function (done) {
      helper.request
        .post('/users/resetPassword')
        .set('apiKey', config.apiKey)
        .send({
          password: 'pass',
          token: '123',
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when password is too long', function (done) {
      helper.request
        .post('/users/resetPassword')
        .set('apiKey', config.apiKey)
        .send({
          password: '12345678901234567890123456789000',
          token: '123',
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('successfully changes password', function (done) {
      helper.request
        .post('/users/resetPassword')
        .set('apiKey', config.apiKey)
        .send({
          password,
          token: user.tokenForPasswordReset,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('success', true);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('cannot change password again because token is not the same anyore', function (done) {
      helper.request
        .post('/users/resetPassword')
        .set('apiKey', config.apiKey)
        .send({
          password,
          token: user.tokenForPasswordReset,
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'AUTH_PASS_RESET_TOKEN_FAILED');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('POST /users/logout', function () {
    it('grabs correct user', function (done) {
      db.findUser({ email: signupEmail })
        .select('iosPushTokens androidPushTokens webPushTokens')
        .then(helper.generateJWT)
        .then((dbuser) => {
          signupUser = dbuser;
          user = dbuser;
          done();
        });
    });
    it('removes ios, web and android token on logout', function (done) {
      helper.request
        .post('/users/logout')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          iosPushToken: 'ios_three',
          androidPushToken: 'android_three',
          webPushToken: 'web_three',
        })
        .send({ password })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('success', true);
            db.findUserById(user._id)
              .select('iosPushTokens androidPushTokens webPushTokens token')
              .then((dbuser) => {
                user = dbuser.toObject();
                test
                  .array(user.iosPushTokens)
                    .hasLength(1)
                  .array(user.androidPushTokens)
                    .hasLength(1)
                  .array(user.webPushTokens)
                    .hasLength(1);
                done();
              })
              .catch(done);
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('GET /users/profile', function () {
    it('grabs test user', function (done) {
      db.findUser({ email: testEmail })
        .select('token')
        .then((dbuser) => {
          user = dbuser;
          done();
        })
        .catch(done);
    });
    it('returns error when id is malformed', function (done) {
      helper.request
        .get('/users/profile')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({ id: '123' })
        .expect(500, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'DB_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly grabs somebody others profile', function (done) {
      helper.request
        .get('/users/profile')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({ id: String(signupUser._id) })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('email', 'signup@controlio.co');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly grabs self profile', function (done) {
      helper.request
        .get('/users/profile')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('email', 'test@controlio.co');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('POST /users/profile', function () {
    it('returns error if name is too long', function (done) {
      helper.request
        .post('/users/profile')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          name: '12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error if phone is too long', function (done) {
      helper.request
        .post('/users/profile')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          phone: '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'VALIDATION_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly edits profile', function (done) {
      helper.request
        .post('/users/profile')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          phone: '+1 778 288 1444',
          name: 'Nikita Kolmogorov',
          photo: '/path/to/image.png',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('token')
              .hasProperty('email', 'test@controlio.co')
              .hasProperty('name', 'Nikita Kolmogorov')
              .hasProperty('phone', '+1 778 288 1444')
              .hasProperty('photo', '/path/to/image.png');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });
});
