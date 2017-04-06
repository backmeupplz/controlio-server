const test = require('unit.js');
const helper = require('../helper');
const config = require('../../config');
const db = require('../../helpers/db');

describe('routes/projects.js', () => {
  const email = 'test@controlio.co';
  const managerEmail = 'manager@controlio.co';
  const demoEmail = 'awesome@controlio.co';
  const clientEmails = [
    'client1@controlio.co',
    'client2@controlio.co',
    'client3@controlio.co',
  ];
  let user;

  before((done) => {
    helper.closeConnectDrop()
      .then(() => helper.addUserWithJWT({ email }))
      .then((dbuser) => {
        user = dbuser;
      })
      .then(() => helper.addUserWithJWT({ email: demoEmail, isDemo: true }))
      .then(() => done())
      .catch(done);
  });
  after((done) => {
    helper.dropClose()
      .then(done)
      .catch(done);
  });

  it('creates a project as a client', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test client',
        type: 'client',
        description: 'Test project description',
        initialStatus: 'Test initial status',
        managerEmail,
        image: 'key/to/test/image.png',
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test
            .object(json)
              .hasProperty('title', 'Test client')
              .hasProperty('description', 'Test project description')
              .hasProperty('isFinished', false)
              .hasProperty('image', 'key/to/test/image.png')
              .hasNotProperty('owner')
              .array(json.posts)
                .hasLength(1)
                .object(json.posts[0])
                  .hasProperty('text', 'Test initial status')
                  .hasProperty('isEdited', false)
                  .hasProperty('type', 'status')
                  .array(json.posts[0].attachments)
                    .hasLength(0)
              .array(json.invites)
                .hasLength(1)
              .array(json.clients)
                .hasLength(1)
                .object(json.clients[0])
                  .hasProperty('email', email)
              .array(json.managers)
                .hasLength(0)
              .object(json.lastPost)
                .hasProperty('text', 'Test initial status')
                .hasProperty('isEdited', false)
                .hasProperty('type', 'status')
                .array(json.posts[0].attachments)
                  .hasLength(0)
              .object(json.lastStatus)
                .hasProperty('text', 'Test initial status')
                .hasProperty('isEdited', false)
                .hasProperty('type', 'status')
                .array(json.posts[0].attachments)
                  .hasLength(0);
          done();
        } catch (error) {
          done(error);
        }
      });
  });

  it('invites manager after creating a project as a client', (done) => {
    db.findUser({ email: managerEmail })
      .then((manager) => {
        test.object(manager.toObject())
          .hasProperty('email', managerEmail)
          .array(manager.toObject().invites)
            .hasLength(1);
        done();
      })
      .catch(done);
  });

  it('creates a project without image, description, client emails and initial status as a client', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test client almost empty',
        type: 'client',
        managerEmail,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test
            .object(json)
              .hasProperty('title', 'Test client almost empty')
              .hasNotProperty('description')
              .hasProperty('isFinished', false)
              .hasNotProperty('image')
              .hasNotProperty('owner')
              .hasNotProperty('lastPost')
              .hasNotProperty('lastStatus')
              .array(json.posts)
                .hasLength(0)
              .array(json.invites)
                .hasLength(1)
              .array(json.clients)
                .hasLength(1)
                .object(json.clients[0])
                  .hasProperty('email', email)
              .array(json.managers)
                .hasLength(0);
          done();
        } catch (error) {
          done(error);
        }
      });
  });

  it('does not create manager object twice', (done) => {
    db.findUsers({ email: managerEmail })
      .then((users) => {
        test.array(users)
          .hasLength(1);
        done();
      })
      .catch(done);
  });

  it('returns error creating a project with malformed manager email as client', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        type: 'client',
        managerEmail: '123',
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

  it('returns error creating a project without title', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        type: 'client',
        managerEmail,
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

  it('returns error creating a project without type', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test client without type',
        managerEmail,
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

  it('returns error creating a project without managerEmail as a client', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test client without manager email',
        type: 'client',
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

  it('returns error creating a project with manager email too long', (done) => {
    const stub = '1234567890';
    let manager = stub;
    for (let i = 0; i < 11; i += 1) {
      manager += stub;
    }
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Initial status that is too long',
        type: 'client',
        managerEmail: `${manager}@controlio.co`,
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

  it('returns error creating a project as client with self as manager', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Self as manager',
        type: 'client',
        managerEmail: email,
      })
      .expect(400, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'ADD_SELF_AS_MANAGER_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });

  it('returns error creating a project as client with demo as manager', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Demo as manager',
        type: 'client',
        managerEmail: demoEmail,
      })
      .expect(403, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test.object(json)
            .hasProperty('type', 'ADD_DEMO_AS_MANAGER_ERROR');
          done();
        } catch (error) {
          done(error);
        }
      });
  });

  it('returns error creating a project with strange type', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test client without manager email',
        type: 'strange',
        managerEmail,
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

  it('returns error creating a project with title too long', (done) => {
    const stub = '1234567890';
    let title = stub;
    for (let i = 0; i < 30; i += 1) {
      title += stub;
    }
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title,
        type: 'client',
        managerEmail,
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

  it('returns error creating a project with description too long', (done) => {
    const stub = '1234567890';
    let description = stub;
    for (let i = 0; i < 101; i += 1) {
      description += stub;
    }
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'description that is too long',
        description,
        type: 'client',
        managerEmail,
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

  it('returns error creating a project with initial status too long', (done) => {
    const stub = '1234567890';
    let initialStatus = stub;
    for (let i = 0; i < 30; i += 1) {
      initialStatus += stub;
    }
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Initial status that is too long',
        initialStatus,
        type: 'client',
        managerEmail,
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

  it('creates a project as a manager', (done) => {
    helper.request
      .post('/projects')
      .set('apiKey', config.apiKey)
      .set('token', user.token)
      .send({
        title: 'Test manager',
        type: 'manager',
        description: 'Test project description for manager',
        initialStatus: 'Test initial status for manager',
        image: 'key/to/test/image_for_manager.png',
        clientEmails,
      })
      .expect(200, (err, res) => {
        if (err) return done(err);
        try {
          const json = JSON.parse(res.text);
          test
            .object(json)
              .hasProperty('title', 'Test manager')
              .hasProperty('description', 'Test project description for manager')
              .hasProperty('isFinished', false)
              .hasProperty('image', 'key/to/test/image_for_manager.png')
              .hasProperty('owner')
              .array(json.posts)
                .hasLength(1)
                .object(json.posts[0])
                  .hasProperty('text', 'Test initial status for manager')
                  .hasProperty('isEdited', false)
                  .hasProperty('type', 'status')
                  .array(json.posts[0].attachments)
                    .hasLength(0)
              .array(json.invites)
                .hasLength(3)
              .array(json.clients)
                .hasLength(0)
              .array(json.managers)
                .hasLength(0)
              .object(json.lastPost)
                .hasProperty('text', 'Test initial status for manager')
                .hasProperty('isEdited', false)
                .hasProperty('type', 'status')
                .array(json.posts[0].attachments)
                  .hasLength(0)
              .object(json.lastStatus)
                .hasProperty('text', 'Test initial status for manager')
                .hasProperty('isEdited', false)
                .hasProperty('type', 'status')
                .array(json.posts[0].attachments)
                  .hasLength(0);
          done();
        } catch (error) {
          done(error);
        }
      });
  });
});
