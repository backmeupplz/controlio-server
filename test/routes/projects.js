const test = require('unit.js');
const helper = require('../helper');
const config = require('../../config');
const db = require('../../helpers/db');

describe('routes/projects.js', function () {
  const email = 'test@controlio.co';
  const managerEmail = 'manager@controlio.co';
  const secondManagerEmail = 'secondmanager@controlio.co';
  const demoEmail = 'awesome@controlio.co';
  const testOwnerEmail = 'testowner@controlio.co';
  const clientEmails = [
    'client1@controlio.co',
    'client2@controlio.co',
    'client3@controlio.co',
  ];
  let user;
  let managerObject;
  let secondManagerObject;
  let clientObjects;
  let testProject;
  let testProjectCannotEdit;
  let testOwner;

  before(function (done) {
    helper.closeConnectDrop()
      .then(() => helper.addUserWithJWT({ email, plan: 3 }))
      .then((dbuser) => {
        user = dbuser;
      })
      .then(() => helper.addUserWithJWT({ email: demoEmail, isDemo: true }))
      .then(() => done())
      .catch(done);
  });
  after(function (done) {
    helper.dropClose()
      .then(done)
      .catch(done);
  });

  context('POST /projects', function () {
    it('creates a project as a client', function (done) {
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
          progressEnabled: true,
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
                .hasProperty('progressEnabled', true)
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
    it('invites manager after creating a project as a client', function (done) {
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
    it('creates a project without image, description, client emails, progressEnabled and initial status as a client', function (done) {
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
                .hasProperty('progressEnabled', false)
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
    it('creates another project without image, description, client emails and initial status as a client', function (done) {
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          title: 'Test owner can reject',
          type: 'client',
          managerEmail: testOwnerEmail,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('title', 'Test owner can reject');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('creates third project without image, description, client emails and initial status as a client', function (done) {
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          title: 'Test owner can reject 2',
          type: 'client',
          managerEmail: testOwnerEmail,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('title', 'Test owner can reject 2');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('creates third project as client', function (done) {
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          title: 'Test client third',
          type: 'client',
          managerEmail,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test
              .object(json)
                .hasProperty('title', 'Test client third')
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
    it('does not create manager object twice', function (done) {
      db.findUsers({ email: managerEmail })
        .then((users) => {
          test.array(users)
            .hasLength(1);
          done();
        })
        .catch(done);
    });
    it('returns error creating a project with malformed manager email as client', function (done) {
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          type: 'client',
          title: 'SHould fail',
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
    it('returns error creating a project with malformed progressEnabled flag as client', function (done) {
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          type: 'client',
          title: 'Should fail',
          progressEnabled: '90qwe',
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
    it('returns error creating a project without title', function (done) {
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
    it('returns error creating a project without type', function (done) {
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
    it('returns error creating a project without managerEmail as a client', function (done) {
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
    it('returns error creating a project with manager email too long', function (done) {
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
          title: 'Manager email that is too long',
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
    it('returns error creating a project as client with self as manager', function (done) {
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
    it('returns error creating a project as client with demo as manager', function (done) {
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
    it('returns error creating a project with strange type', function (done) {
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
    it('returns error creating a project with title too long', function (done) {
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
    it('returns error creating a project with description too long', function (done) {
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
    it('returns error creating a project with initial status too long', function (done) {
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
    it('creates a project as a manager', function (done) {
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
          progressEnabled: true,
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
                .hasProperty('progressEnabled', true)
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
    it('invites clients after creating a project as a manager', function (done) {
      Promise.reduce(clientEmails, (array, clientEmail) =>
        db.findUser({ email: clientEmail })
          .then((client) => {
            array.push(client);
            return array;
          }), [])
        .then((clients) => {
          clients.forEach((client, index) => {
            test.object(client.toObject())
              .hasProperty('email', clientEmails[index])
              .array(client.toObject().invites)
                .hasLength(1);
          });
          done();
        })
        .catch(done);
    });
    it('creates a project without image, description, manager email, progressEnabled and initial status as a manager', function (done) {
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          title: 'Test manager almost empty',
          type: 'manager',
          clientEmails,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test
              .object(json)
                .hasProperty('title', 'Test manager almost empty')
                .hasNotProperty('description')
                .hasProperty('isFinished', false)
                .hasNotProperty('image')
                .hasProperty('owner')
                .hasNotProperty('lastPost')
                .hasNotProperty('lastStatus')
                .hasProperty('progressEnabled', false)
                .array(json.posts)
                  .hasLength(0)
                .array(json.invites)
                  .hasLength(3)
                .array(json.clients)
                  .hasLength(0)
                .array(json.managers)
                  .hasLength(0);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('does not create client objects twice', function (done) {
      Promise.reduce(clientEmails, (array, clientEmail) =>
        db.findUser({ email: clientEmail })
          .then((client) => {
            array.push(client);
            return array;
          }), [])
        .then((clients) => {
          test.array(clients)
            .hasLength(3);
          done();
        })
        .catch(done);
    });
    it('returns error creating a project with malformed client email as manager', function (done) {
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          title: 'Should fail',
          type: 'manager',
          clientEmails: ['123'],
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
    it('returns error creating a project with malformed progressEnabled flag as manager', function (done) {
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          type: 'client',
          title: 'Should fail',
          progressEnabled: '90qwe',
          clientEmails,
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
    it('returns error creating a project without client emails as a manager', function (done) {
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          title: 'Test manager without client emails',
          type: 'manager',
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
    it('returns error creating a project with clients emails too long', function (done) {
      const stub = '1234567890';
      let client = stub;
      for (let i = 0; i < 11; i += 1) {
        client += stub;
      }
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          title: 'Client emails that are too long',
          type: 'manager',
          clientEmails: [`${client}@controlio.co`],
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
    it('returns error creating a project as client with self as client', function (done) {
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          title: 'Self as client',
          type: 'manager',
          clientEmails: [email],
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'ADD_SELF_AS_CLIENT_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error creating a project as client with demo as client', function (done) {
      helper.request
        .post('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          title: 'Demo as client',
          type: 'manager',
          clientEmails: [demoEmail],
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'ADD_DEMO_AS_CLIENT_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('POST projects/invite', function () {
    it('grabs manager object and client objects, has correct number of invites on each', function (done) {
      Promise.reduce(clientEmails.concat(managerEmail), (array, inemail) =>
        db.findUser({ email: inemail })
          .then(helper.generateJWT)
          .then(helper.maximizePlan)
          .then((dbuser) => {
            array.push(dbuser);
            return array;
          }), [])
        .then((users) => {
          managerObject = users[3];
          test.object(managerObject.toObject())
            .hasProperty('invites')
            .array(managerObject.toObject().invites)
              .hasLength(3);
          clientObjects = users.slice(0, 3);
          clientObjects.forEach((clientObject) => {
            test.object(clientObject.toObject())
              .hasProperty('invites')
              .array(clientObject.toObject().invites)
              .hasLength(2);
          });
          done();
        })
        .catch(done);
    });
    it('returns an error when not providing invite id on accept invite', function (done) {
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          accept: true,
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
    it('returns an error when not providing accept value on accept invite', function (done) {
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          inviteid: String(managerObject.invites[1]),
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
    it('returns an error when providing non existing invite id on accept invite', function (done) {
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          inviteid: '58e73c820a9f165ffc06c1cf',
          accept: true,
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'INVITE_NOT_FOUND_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns an error when providing non existing invite id on reject invite', function (done) {
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          inviteid: '58e73c820a9f165ffc06c1cf',
          accept: false,
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'INVITE_NOT_FOUND_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly accepts invite for owner', function (done) {
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          inviteid: String(managerObject.invites[1]),
          accept: true,
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
    it('removes invite from owner afterwards and adds project to owner', function (done) {
      db.findUser({ email: managerEmail })
        .select('+token')
        .then((object) => {
          managerObject = object;
          const objectifiedManager = managerObject.toObject();
          test.object(objectifiedManager)
            .array(objectifiedManager.invites)
              .hasLength(2)
            .array(objectifiedManager.projects)
              .hasLength(1);
          done();
        })
        .catch(done);
    });
    it('correctly rejects invite for owner', function (done) {
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          inviteid: String(managerObject.invites[1]),
          accept: false,
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
    it('removes invite from owner afterwards and does not add project to owner', function (done) {
      db.findUser({ email: managerEmail })
        .select('+token')
        .then((object) => {
          managerObject = object;
          const objectifiedManager = managerObject.toObject();
          test.object(objectifiedManager)
            .array(objectifiedManager.invites)
              .hasLength(1)
            .array(objectifiedManager.projects)
              .hasLength(1);
          done();
        })
        .catch(done);
    });
    it('correctly accepts invite for client', function (done) {
      const firstClient = clientObjects[0];
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', firstClient.token)
        .send({
          inviteid: String(firstClient.invites[0]),
          accept: true,
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
    it('removes invite from client afterwards and adds project to client', function (done) {
      db.findUser({ email: clientEmails[0] })
        .select('+token')
        .then((object) => {
          const clientObject = object;
          clientObjects[0] = clientObject;
          const objectifiedClient = clientObject.toObject();
          test.object(objectifiedClient)
            .array(objectifiedClient.invites)
              .hasLength(1)
            .array(objectifiedClient.projects)
              .hasLength(1);
          done();
        })
        .catch(done);
    });
    it('correctly rejects invite for client', function (done) {
      const secondClient = clientObjects[1];
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', secondClient.token)
        .send({
          inviteid: String(secondClient.invites[0]),
          accept: false,
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
    it('removes invite from client afterwards and does not add project to client', function (done) {
      db.findUser({ email: clientEmails[1] })
        .select('+token')
        .then((object) => {
          const clientObject = object;
          clientObjects[1] = clientObject;
          const objectifiedClient = clientObject.toObject();
          test.object(objectifiedClient)
            .array(objectifiedClient.invites)
              .hasLength(1)
            .array(objectifiedClient.projects)
              .hasLength(0);
          done();
        })
        .catch(done);
    });
    it('correctly fetches test manager', function (done) {
      db.findUser({ email: testOwnerEmail })
        .then(helper.generateJWT)
        .then((dbuser) => {
          testOwner = dbuser.toObject();
          test.object(testOwner)
            .hasProperty('token')
            .hasProperty('invites')
            .array(testOwner.invites)
              .hasLength(2);
          done();
        })
        .catch(done);
    });
    it('allows user to reject owner invite', function (done) {
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', testOwner.token)
        .send({
          inviteid: String(testOwner.invites[0]),
          accept: true,
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
    it('allows user with plan over limit invited as owner to reject invite', function (done) {
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', testOwner.token)
        .send({
          inviteid: String(testOwner.invites[1]),
          accept: false,
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
  });

  context('DELETE /projects/invite', function () {
    it('returns an error when providing non existing invite id on delete invite', function (done) {
      helper.request
        .delete('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          inviteid: '58e73c820a9f165ffc06c1cf',
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'INVITE_NOT_FOUND_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns an error when providing no invite id on delete invite', function (done) {
      helper.request
        .delete('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
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
    it('does not allow to delete invite for manager by client', function (done) {
      helper.request
        .delete('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          inviteid: String(managerObject.invites[0]),
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly allows to remove invite for client', function (done) {
      helper.request
        .delete('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          inviteid: String(clientObjects[2].invites[0]),
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
    it('removes invite from client afterwards and does not add project to client', function (done) {
      db.findUser({ email: clientEmails[2] })
        .select('+token')
        .then((object) => {
          const clientObject = object;
          clientObjects[2] = clientObject;
          const objectifiedClient = clientObject.toObject();
          test.object(objectifiedClient)
            .array(objectifiedClient.invites)
              .hasLength(1)
            .array(objectifiedClient.projects)
              .hasLength(0);
          done();
        })
        .catch(done);
    });
  });

  context('GET /projects/project', function () {
    it('returns error on getting project with empty project id', function (done) {
      helper.request
        .get('/projects/project')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
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
    it('returns error on getting project with non existing project id', function (done) {
      helper.request
        .get('/projects/project')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          projectid: '58e73c820a9f165ffc06c1cf',
        })
        .expect(400, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'PROJECT_NOT_FOUND_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('grabs user', function (done) {
      db.findUser({ email })
        .select('+token')
        .then((dbuser) => {
          user = dbuser;
          done();
        })
        .catch(done);
    });
    it('returns error on getting project that does not include getter', function (done) {
      helper.request
        .get('/projects/project')
        .set('apiKey', config.apiKey)
        .set('token', clientObjects[2].token)
        .query({
          projectid: String(user.projects[0]),
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches project by client', function (done) {
      helper.request
        .get('/projects/project')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          projectid: String(user.projects[0]),
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('title', 'Test client')
              .hasProperty('description', 'Test project description')
              .hasProperty('image', 'key/to/test/image.png')
              .hasProperty('isFinished', false)
              .hasProperty('canEdit', false);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches project by manager', function (done) {
      helper.request
        .get('/projects/project')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .query({
          projectid: String(managerObject.projects[0]),
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('title', 'Test client almost empty')
              .hasNotProperty('description')
              .hasNotProperty('image')
              .hasProperty('isFinished', false)
              .hasProperty('canEdit', true);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('GET /projects', function () {
    it('correctly fetches list of projects', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(7)
              .object(json[0])
                .hasProperty('canEdit', true)
              .object(json[1])
                .hasProperty('canEdit', false)
              .object(json[2])
                .hasProperty('canEdit', false)
              .object(json[3])
                .hasProperty('canEdit', true)
              .object(json[4])
                .hasProperty('canEdit', false);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches list of projects with skip and limit', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          skip: 4,
          limit: 1,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(1)
              .object(json[0])
                .hasProperty('canEdit', false);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches empty list of projects with skip over the number of projects', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          skip: 7,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(0);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches list of projects with query', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          query: 'Test client',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(3);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches list of projects with empty string query', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          query: '',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(7);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches list of projects with query, skip and limit', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          query: 'Test client',
          skip: 1,
          limit: 2,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(2)
              .object(json[0])
                .hasProperty('title', 'Test client third')
              .object(json[1])
                .hasProperty('title', 'Test client');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches list of projects with type all', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          type: 'all',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(7);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches list of projects with type live', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          type: 'live',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(7);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches list of projects with type is empty string', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          type: '',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(7);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches list of projects with type finished', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          type: 'finished',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(0);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when fetching projects with strange type', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .query({
          type: 'strange',
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
    it('correctly fetches list of invites for user with no invites', function (done) {
      helper.request
        .get('/projects/invites')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(0);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly fetches list of invites for user with invites', function (done) {
      helper.request
        .get('/projects/invites')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.array(json)
              .hasLength(1);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('POST /projects/managers', function () {
    it('grabs test projects', function (done) {
      helper.request
        .get('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            testProject = json[0];
            testProjectCannotEdit = json[1];
            test.object(testProject)
              .hasProperty('canEdit', true)
              .hasProperty('title', 'Test manager');
            test.object(testProjectCannotEdit)
              .hasProperty('canEdit', false);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when adding managers without project id', function (done) {
      helper.request
        .post('/projects/managers')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          managers: [managerEmail, managerEmail, secondManagerEmail, demoEmail],
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
    it('returns error when adding managers without managers list', function (done) {
      helper.request
        .post('/projects/managers')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: testProject._id,
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
    it('returns error when adding managers with empty managers array', function (done) {
      helper.request
        .post('/projects/managers')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: testProject._id,
          managers: [],
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
    it('returns error when adding managers to project without access', function (done) {
      helper.request
        .post('/projects/managers')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: testProjectCannotEdit._id,
          managers: [managerEmail],
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly invites two managers', function (done) {
      helper.request
        .post('/projects/managers')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: testProject._id,
          managers: [managerEmail, managerEmail, secondManagerEmail, demoEmail],
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
    it('adds invites to project', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .hasProperty('invites')
            .array(testProject.invites)
              .hasLength(3);
          done();
        })
        .catch(done);
    });
    it('adds invites to managers', function (done) {
      Promise.all([
        db.findUser({ email: managerEmail }).select('+token'),
        db.findUser({ email: secondManagerEmail }).then(helper.generateJWT),
      ]).then((managers) => {
        managerObject = managers[0].toObject();
        secondManagerObject = managers[1].toObject();
        test
          .array(managerObject.invites)
            .hasLength(2)
          .array(secondManagerObject.invites)
            .hasLength(1);
        done();
      })
      .catch(done);
    });
    it('does not do anything when inviting the same managers again', function (done) {
      helper.request
        .post('/projects/managers')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: testProject._id,
          managers: [managerEmail, managerEmail, secondManagerEmail, demoEmail],
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
    it('project still has same number of invites', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .hasProperty('invites')
            .array(testProject.invites)
              .hasLength(3);
          done();
        })
        .catch(done);
    });
    it('managers still have same number of invites', function (done) {
      Promise.all([
        db.findUser({ email: managerEmail }).select('+token'),
        db.findUser({ email: secondManagerEmail }).select('+token'),
      ]).then((managers) => {
        managerObject = managers[0].toObject();
        secondManagerObject = managers[1].toObject();
        test
          .array(managerObject.invites)
            .hasLength(2)
          .array(secondManagerObject.invites)
            .hasLength(1);
        done();
      })
      .catch(done);
    });
    it('correctly accepts invite from manager', function (done) {
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', secondManagerObject.token)
        .send({
          inviteid: String(secondManagerObject.invites[0]),
          accept: true,
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
    it('adds manager to project afterwards', function (done) {
      db.getProject(secondManagerObject._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .array(testProject.managers)
              .hasLength(1);
          done();
        })
        .catch(done);
    });
    it('correctly fetches project by manager', function (done) {
      helper.request
        .get('/projects/project')
        .set('apiKey', config.apiKey)
        .set('token', secondManagerObject.token)
        .query({
          projectid: String(testProject._id),
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('canEdit', true);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly removes all invites from test project', function (done) {
      Promise.map(testProject.invites, invite =>
        new Promise((resolve, reject) => {
          helper.request
            .delete('/projects/invite')
            .set('apiKey', config.apiKey)
            .set('token', user.token)
            .send({ inviteid: String(invite._id) })
            .expect(200, (err, res) => {
              if (err) return reject(err);
              try {
                const json = JSON.parse(res.text);
                test.object(json)
                  .hasProperty('success', true);
                resolve();
              } catch (error) {
                reject(error);
              }
            });
        }), { concurrency: 1 })
      .then(() => {
        done();
      })
      .catch(done);
    });
  });

  context('DELETE /projects/manager', function () {
    it('correctly deletes manager from test project', function (done) {
      helper.request
        .delete('/projects/manager')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: String(testProject._id),
          managerid: String(secondManagerObject._id),
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
  });

  context('DELETE /projects/client', function () {
    it('correctly deletes client from test project', function (done) {
      helper.request
        .delete('/projects/client')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: String(testProject._id),
          clientid: String(testProject.clients[0]._id),
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
    it('has no managers and clients afterwards', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .array(testProject.invites)
              .hasLength(0)
            .array(testProject.clients)
              .hasLength(0)
            .array(testProject.managers)
              .hasLength(0);
          done();
        })
        .catch(done);
    });
  });

  context('POST /projects/client', function () {
    it('returns error when adding clients without project id', function (done) {
      helper.request
        .post('/projects/clients')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          clients: [managerEmail, managerEmail, secondManagerEmail, demoEmail],
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
    it('returns error when adding clients without clients list', function (done) {
      helper.request
        .post('/projects/clients')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: testProject._id,
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
    it('returns error when adding clients with empty clients array', function (done) {
      helper.request
        .post('/projects/clients')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: testProject._id,
          clients: [],
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
    it('returns error when adding clients to project without access', function (done) {
      helper.request
        .post('/projects/clients')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: testProjectCannotEdit._id,
          clients: [managerEmail],
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly invites two clients', function (done) {
      helper.request
        .post('/projects/clients')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: testProject._id,
          clients: [managerEmail, managerEmail, secondManagerEmail, demoEmail],
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
    it('adds invites to project', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .hasProperty('invites')
            .array(testProject.invites)
              .hasLength(2);
          done();
        })
        .catch(done);
    });
    it('adds invites to clients', function (done) {
      Promise.all([
        db.findUser({ email: managerEmail }).select('+token'),
        db.findUser({ email: secondManagerEmail }).select('+token'),
      ]).then((clients) => {
        managerObject = clients[0].toObject();
        secondManagerObject = clients[1].toObject();
        test
          .array(managerObject.invites)
            .hasLength(2)
          .array(secondManagerObject.invites)
            .hasLength(1);
        done();
      })
      .catch(done);
    });
    it('does not do anything when inviting the same clients again', function (done) {
      helper.request
        .post('/projects/clients')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: testProject._id,
          clients: [managerEmail, managerEmail, secondManagerEmail, demoEmail],
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
    it('project still has same number of invites', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .hasProperty('invites')
            .array(testProject.invites)
              .hasLength(2);
          done();
        })
        .catch(done);
    });
    it('clients still have same number of invites', function (done) {
      Promise.all([
        db.findUser({ email: managerEmail }).select('+token'),
        db.findUser({ email: secondManagerEmail }).select('+token'),
      ]).then((clients) => {
        managerObject = clients[0].toObject();
        secondManagerObject = clients[1].toObject();
        test
          .array(managerObject.invites)
            .hasLength(2)
          .array(secondManagerObject.invites)
            .hasLength(1);
        done();
      })
      .catch(done);
    });
    it('correctly accepts invite from client', function (done) {
      helper.request
        .post('/projects/invite')
        .set('apiKey', config.apiKey)
        .set('token', secondManagerObject.token)
        .send({
          inviteid: String(secondManagerObject.invites[0]),
          accept: true,
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
    it('adds client to project afterwards', function (done) {
      db.getProject(secondManagerObject._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .array(testProject.clients)
              .hasLength(1);
          done();
        })
        .catch(done);
    });
    it('correctly fetches project by client', function (done) {
      helper.request
        .get('/projects/project')
        .set('apiKey', config.apiKey)
        .set('token', secondManagerObject.token)
        .query({
          projectid: String(testProject._id),
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('canEdit', false);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly removes all invites from test project', function (done) {
      Promise.map(testProject.invites, invite =>
        new Promise((resolve, reject) => {
          helper.request
            .delete('/projects/invite')
            .set('apiKey', config.apiKey)
            .set('token', user.token)
            .send({ inviteid: String(invite._id) })
            .expect(200, (err, res) => {
              if (err) return reject(err);
              try {
                const json = JSON.parse(res.text);
                test.object(json)
                  .hasProperty('success', true);
                resolve();
              } catch (error) {
                reject(error);
              }
            });
        }), { concurrency: 1 })
      .then(() => {
        done();
      })
      .catch(done);
    });
  });

  context('POST /projects/finish', function () {
    it('returns error when tries to finish the project by client', function (done) {
      helper.request
        .post('/projects/finish')
        .set('apiKey', config.apiKey)
        .set('token', secondManagerObject.token)
        .send({ projectid: String(testProject._id) })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly finishes the project', function (done) {
      helper.request
        .post('/projects/finish')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({ projectid: String(testProject._id) })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('has test project finished then', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .hasProperty('isFinished', true);
          done();
        })
        .catch(done);
    });
    it('correctly finishes the project again', function (done) {
      helper.request
        .post('/projects/finish')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({ projectid: String(testProject._id) })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('still has test project finished then', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .hasProperty('isFinished', true);
          done();
        })
        .catch(done);
    });
  });

  context('POST /projects/revive', function () {
    it('returns error when tries to revive the project by client', function (done) {
      helper.request
        .post('/projects/revive')
        .set('apiKey', config.apiKey)
        .set('token', secondManagerObject.token)
        .send({ projectid: String(testProject._id) })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly revives the project', function (done) {
      helper.request
        .post('/projects/revive')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({ projectid: String(testProject._id) })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('has test project revived then', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .hasProperty('isFinished', false);
          done();
        })
        .catch(done);
    });
    it('correctly revives the project again', function (done) {
      helper.request
        .post('/projects/revive')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({ projectid: String(testProject._id) })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('still has test project finished then', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .hasProperty('isFinished', false);
          done();
        })
        .catch(done);
    });
  });

  context('POST /projects/leave', function () {
    it('returns error when tries to leave the project by owner', function (done) {
      helper.request
        .post('/projects/leave')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({ projectid: String(testProject._id) })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'LEAVE_AS_OWNER_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('correctly leaves the project as client', function (done) {
      helper.request
        .post('/projects/leave')
        .set('apiKey', config.apiKey)
        .set('token', secondManagerObject.token)
        .send({ projectid: String(testProject._id) })
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
    it('does not have client on project anymore', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .array(testProject.clients)
              .hasLength(0);
          done();
        })
        .catch(done);
    });
    it('correctly leaves the project as manager', function (done) {
      db.getProject(user._id, testProject._id)
      .then((project) => {
        project.managers.push(managerObject._id);
        return project.save()
          .then((dbproject) => {
            testProject = dbproject.toObject();
          });
      })
      .then(() => {
        helper.request
          .post('/projects/leave')
          .set('apiKey', config.apiKey)
          .set('token', managerObject.token)
          .send({ projectid: String(testProject._id) })
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
      })
      .catch(done);
    });
    it('does not have manager on project anymore', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .array(testProject.managers)
              .hasLength(0);
          done();
        })
        .catch(done);
    });
  });

  context('PUT /projects', function () {
    it('adds manager and client to project', function (done) {
      db.getProject(user._id, testProject._id)
        .then((project) => {
          project.managers.push(managerObject._id);
          project.clients.push(secondManagerObject._id);
          return project.save();
        })
        .then((project) => {
          testProject = project.toObject();
          test.object(testProject)
            .array(testProject.managers)
              .hasLength(1)
            .array(testProject.clients)
              .hasLength(1);
          done();
        })
        .catch(done);
    });
    it('returns error when client tries to edit project', function (done) {
      helper.request
        .put('/projects')
        .set('apiKey', config.apiKey)
        .set('token', secondManagerObject.token)
        .send({
          projectid: String(testProject._id),
          title: 'Should fail',
          description: 'Desctiption for should fail',
          progressEnabled: true,
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('successfully edits project as manager', function (done) {
      helper.request
        .put('/projects')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          projectid: String(testProject._id),
          title: 'Should work',
          description: 'As manager',
          progressEnabled: true,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('title', 'Should work')
              .hasProperty('description', 'As manager')
              .hasNotProperty('image');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('successfully edits project as owner', function (done) {
      helper.request
        .put('/projects')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          projectid: String(testProject._id),
          title: 'Should work too',
          description: 'As client',
          progressEnabled: true,
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('title', 'Should work too')
              .hasProperty('description', 'As client')
              .hasNotProperty('image');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('PUT /projects/progress', function () {
    it('returns error when client tries to edit progress', function (done) {
      helper.request
        .put('/projects/progress')
        .set('apiKey', config.apiKey)
        .set('token', secondManagerObject.token)
        .send({
          projectid: String(testProject._id),
          progress: '99',
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    // TODO
    it('successfully edits progress as manager', function (done) {
      helper.request
        .put('/projects/progress')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          projectid: String(testProject._id),
          progress: '99',
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
    it('successfully edits progress as owner', function (done) {
      helper.request
        .put('/projects/progress')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: String(testProject._id),
          progress: '100',
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
    it('returns error when progress is malformed', function (done) {
      helper.request
        .put('/projects/progress')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          projectid: String(testProject._id),
          progress: 'qwe',
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
    it('returns error when progress is out of range', function (done) {
      helper.request
        .put('/projects/progress')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          projectid: String(testProject._id),
          progress: '101',
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
    it('disable progress for project as manager', function (done) {
      helper.request
        .put('/projects')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          projectid: String(testProject._id),
          progressEnabled: false,
          title: 'Should work too',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test
              .object(json)
                .hasProperty('progressEnabled', false);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    // TODO
    it('returns error when trying to change progress as manager while progress disabled', function (done) {
      helper.request
        .put('/projects/progress')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          projectid: String(testProject._id),
          progress: '1',
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'PROGRESS_DISABLED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('Enabling progress for project again, as owner', function (done) {
      helper.request
        .put('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: String(testProject._id),
          progressEnabled: true,
          title: 'Should work too',
        })
        .expect(200, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test
              .object(json)
                .hasProperty('progressEnabled', true);
            done();
          } catch (error) {
            done(error);
          }
        });
    });
  });

  context('DELETE /projects', function () {
    it('returns error when client tries to delete project', function (done) {
      helper.request
        .delete('/projects')
        .set('apiKey', config.apiKey)
        .set('token', secondManagerObject.token)
        .send({
          projectid: String(testProject._id),
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('returns error when manager tries to delete project', function (done) {
      helper.request
        .delete('/projects')
        .set('apiKey', config.apiKey)
        .set('token', managerObject.token)
        .send({
          projectid: String(testProject._id),
        })
        .expect(403, (err, res) => {
          if (err) return done(err);
          try {
            const json = JSON.parse(res.text);
            test.object(json)
              .hasProperty('type', 'NOT_AUTHORIZED_ERROR');
            done();
          } catch (error) {
            done(error);
          }
        });
    });
    it('successfully deletes project', function (done) {
      helper.request
        .delete('/projects')
        .set('apiKey', config.apiKey)
        .set('token', user.token)
        .send({
          projectid: String(testProject._id),
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
  });
});
