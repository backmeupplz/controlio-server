const plan = require('flightplan');

const appName = 'controlio';
const username = 'deploy';

const tmpDir = `${ appName }-${ new Date().getTime() }`;

// configuration
plan.target('staging', [
  {
    host: '107.170.84.246',
    username: username,
    agent: process.env.SSH_AUTH_SOCK
  }
]);

plan.target('production', [
  {
    host: '107.170.84.246',
    username: username,
    agent: process.env.SSH_AUTH_SOCK
  }
]);

plan.local(function(local) {
  local.log('Copy files to remote hosts');
  const filesToCopy = local.exec('git ls-files', { silent: true });
  local.transfer(filesToCopy, `/tmp/${ tmpDir }`);
});

plan.remote(function(remote) {
  remote.log('Move folder to root');
  remote.sudo(`cp -R /tmp/${ tmpDir } ~`, { user: username });
  remote.rm(`-rf /tmp/${ tmpDir }`);

  remote.log('Install dependencies');
  remote.sudo(`npm --production --prefix ~/${ tmpDir } install ~/${ tmpDir }`, { user: username });

  remote.log('Reload application');
  remote.sudo(`ln -snf ~/${ tmpDir } ~/${ appName }`, { user: username });
  remote.exec('sudo restart controlio');
});