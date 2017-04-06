const test = require('unit.js');
const helper = require('../helper');

describe('routes/public.js', () => {
  let email = 'test@controlio.co';
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
    user.generateResetPasswordToken();
    user.save()
      .then((saved) => {
        helper.request
          .get(`/public/resetPassword?token=${saved.tokenForPasswordReset}`)
          .expect(200, (error, res) => {
            if (error) return done(error);
            test.string(res.text)
              .contains(saved.tokenForPasswordReset);
            done();
          });
      })
      .catch(done);
  });
  it('returns error when reset password token not provided', (done) => {
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
  it('returns error when reset password token malformed', (done) => {
    helper.request
      .get('/public/resetPassword?token=123')
      .expect(200, (error, res) => {
        if (error) return done(error);
        test.string(res.text)
          .contains('jwt malformed');
        done();
      });
  });
  it('returns error on second view of the reset password', (done) => {
    user.generateResetPasswordToken();
    user.save()
      .then((saved) => {
        helper.request
          .get(`/public/resetPassword?token=${saved.tokenForPasswordReset}`)
          .end(() => {
            helper.request
              .get(`/public/resetPassword?token=${saved.tokenForPasswordReset}`)
              .expect(200, (error, res) => {
                if (error) return done(error);

                test.string(res.text)
                  .contains('You can only use reset link once');
                done();
              });
          });
      })
      .catch(done);
  });
});
