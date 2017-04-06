const test = require('unit.js');
const helper = require('../helper');
const db = require('../../helpers/db');
const hash = require('../../helpers/hash');

describe('routes/public.js', () => {
  const email = 'test@controlio.co';
  let user;

  before((done) => {
    helper.closeConnectDrop()
      .then(done)
      .catch(done);
  });
  after((done) => {
    helper.dropClose()
      .then(done)
      .catch(done);
  });
  beforeEach((done) => {
    helper.addUserWithJWT({ email })
      .then(helper.generateResetPasswordToken)
      .then((dbuser) => {
        user = dbuser;
        done();
      })
      .catch(done);
  });
  afterEach((done) => {
    helper.drop()
      .then(done)
      .catch(done);
  });

  it('returns reset password page with token', (done) => {
    helper.request
      .get('/public/resetPassword')
      .query({ token: user.tokenForPasswordReset })
      .expect(200, (error, res) => {
        if (error) return done(error);
        test.string(res.text)
          .contains(user.tokenForPasswordReset);
        done();
      });
  });
  it('returns error when reset password page token not provided', (done) => {
    helper.request
      .get('/public/resetPassword')
      .expect(400, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
  it('returns error when reset password page token malformed', (done) => {
    helper.request
      .get('/public/resetPassword')
      .query({ token: '123' })
      .expect(200, (error, res) => {
        if (error) return done(error);
        test.string(res.text)
          .contains('jwt malformed');
        done();
      });
  });
  it('returns error on second view of the reset password page', (done) => {
    helper.request
      .get('/public/resetPassword')
      .query({ token: user.tokenForPasswordReset })
      .end(() => {
        helper.request
          .get('/public/resetPassword')
          .query({ token: user.tokenForPasswordReset })
          .expect(200, (error, res) => {
            if (error) return done(error);

            test.string(res.text)
              .contains('You can only use reset link once');
            done();
          });
      });
  });
  it('returns success message if everything is ok', (done) => {
    helper.request
      .post('/public/resetPassword')
      .send({
        token: user.tokenForPasswordReset,
        password: '123456789',
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        test.string(res.text)
          .contains('Success!');
        done();
      });
  });
  it('correctly resets password on user without password', (done) => {
    const password = '123456789';
    helper.request
      .post('/public/resetPassword')
      .send({
        token: user.tokenForPasswordReset,
        password,
      })
      .end(() => {
        db.findUserById(user._id)
          .select('password')
          .then(dbuser => hash.checkPassword(dbuser.password, password))
          .then((result) => {
            if (result) {
              done();
            } else {
              done(new Error('Failed to check new password'));
            }
          })
          .catch(done);
      });
  });
  it('correctly resets password on user with password', (done) => {
    const firstPassword = '123456789';
    const secondPassword = '987654321';

    helper.setPassword(firstPassword)(user)
      .then((userWithPassword) => {
        helper.request
          .post('/public/resetPassword')
          .send({
            token: userWithPassword.tokenForPasswordReset,
            password: secondPassword,
          })
          .end(() => {
            db.findUserById(userWithPassword._id)
              .select('password')
              .then(dbuser => hash.checkPassword(dbuser.password, secondPassword))
              .then((result) => {
                if (result) {
                  done();
                } else {
                  done(new Error('Failed to check new password'));
                }
              })
              .catch(done);
          });
      })
      .catch(done);
  });
  it('returns an error when password is too short', (done) => {
    const password = '123';
    helper.request
      .post('/public/resetPassword')
      .send({
        token: user.tokenForPasswordReset,
        password,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);

        test.string(res.text)
          .contains('Password length should be between 6 and 30 characters');
        done();
      });
  });
  it('returns an error when password is too long', (done) => {
    const password = '1234567890123456789012345678901';
    helper.request
      .post('/public/resetPassword')
      .send({
        token: user.tokenForPasswordReset,
        password,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);

        test.string(res.text)
          .contains('Password length should be between 6 and 30 characters');
        done();
      });
  });
  it('returns error when reset password token not provided', (done) => {
    helper.request
      .post('/public/resetPassword')
      .expect(400, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
  it('returns error when reset password token malformed', (done) => {
    helper.request
      .post('/public/resetPassword')
      .send({ token: '123' })
      .expect(400, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
  it('returns set password page with token', (done) => {
    helper.request
      .get('/public/setPassword')
      .query({ token: user.tokenForPasswordReset })
      .expect(200, (error, res) => {
        if (error) return done(error);
        test.string(res.text)
          .contains(user.tokenForPasswordReset);
        done();
      });
  });
  it('returns error when set password page token not provided', (done) => {
    helper.request
      .get('/public/setPassword')
      .expect(400, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
  it('returns error when set password page token malformed', (done) => {
    helper.request
      .get('/public/setPassword')
      .query({ token: '123' })
      .expect(200, (error, res) => {
        if (error) return done(error);
        test.string(res.text)
          .contains('jwt malformed');
        done();
      });
  });
  it('returns error on second view of the set password page', (done) => {
    helper.request
      .get('/public/setPassword')
      .query({ token: user.tokenForPasswordReset })
      .end(() => {
        helper.request
          .get('/public/setPassword')
          .query({ token: user.tokenForPasswordReset })
          .expect(200, (error, res) => {
            if (error) return done(error);

            test.string(res.text)
              .contains('You can only use set password link once.');
            done();
          });
      });
  });
  it('returns success message if everything is ok', (done) => {
    helper.request
      .post('/public/setPassword')
      .send({
        token: user.tokenForPasswordReset,
        password: '123456789',
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        test.string(res.text)
          .contains('Success!');
        done();
      });
  });
  it('correctly sets password on user without password', (done) => {
    const password = '123456789';
    helper.request
      .post('/public/setPassword')
      .send({
        token: user.tokenForPasswordReset,
        password,
      })
      .end(() => {
        db.findUserById(user._id)
          .select('password')
          .then(dbuser => hash.checkPassword(dbuser.password, password))
          .then((result) => {
            if (result) {
              done();
            } else {
              done(new Error('Failed to check new password'));
            }
          })
          .catch(done);
      });
  });
  it('correctly sets password on user with password', (done) => {
    const firstPassword = '123456789';
    const secondPassword = '987654321';

    helper.setPassword(firstPassword)(user)
      .then((userWithPassword) => {
        helper.request
          .post('/public/setPassword')
          .send({
            token: userWithPassword.tokenForPasswordReset,
            password: secondPassword,
          })
          .end(() => {
            db.findUserById(userWithPassword._id)
              .select('password')
              .then(dbuser => hash.checkPassword(dbuser.password, secondPassword))
              .then((result) => {
                if (result) {
                  done();
                } else {
                  done(new Error('Failed to check new password'));
                }
              })
              .catch(done);
          });
      })
      .catch(done);
  });
  it('returns an error when password is too short', (done) => {
    const password = '123';
    helper.request
      .post('/public/setPassword')
      .send({
        token: user.tokenForPasswordReset,
        password,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);

        test.string(res.text)
          .contains('Password length should be between 6 and 30 characters');
        done();
      });
  });
  it('returns an error when password is too long', (done) => {
    const password = '1234567890123456789012345678901';
    helper.request
      .post('/public/setPassword')
      .send({
        token: user.tokenForPasswordReset,
        password,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);

        test.string(res.text)
          .contains('Password length should be between 6 and 30 characters');
        done();
      });
  });
  it('returns error when set password token not provided', (done) => {
    helper.request
      .post('/public/setPassword')
      .expect(400, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
  it('returns error when set password token malformed', (done) => {
    helper.request
      .post('/public/setPassword')
      .send({ token: '123' })
      .expect(400, (error, res) => {
        if (error) return done(error);
        try {
          const json = JSON.parse(res.text);
          test.object(json);
          done();
        } catch (err) {
          done(err);
        }
      });
  });
});
