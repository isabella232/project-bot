/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env mocha */

const path = require('path');
const fse = require('fs-extra');
const { Application } = require('probot');
const sinon = require('sinon');

const PushHandler = require('../src/push.js');

const TEST_PRIVATE_KEY_FILE = path.resolve(__dirname, 'fixtures', 'test-private-key.txt');

const TEST_CONFIG = `
touch:
 user: test-user
 github-token:  W2fx8RomRO+vCXP7coyoQJ0F8hJdTKDzCXiuOWcgPt06t2G4kPE5mnOcDWITMoCNr9FiMniOH0K+VgT9QkxRiOvAr56Sk4xz71YajtlSEvOzsTeTo4VycvL0zfdVCgnPyKyr4+RUIX9mAcZr0RLCWrLh6kzt5RLAWlOsTghC5QE=
`;

const TEST_CONFIG_WRONG_USER = `
touch:
 user: another-user
 github-token:  W2fx8RomRO+vCXP7coyoQJ0F8hJdTKDzCXiuOWcgPt06t2G4kPE5mnOcDWITMoCNr9FiMniOH0K+VgT9QkxRiOvAr56Sk4xz71YajtlSEvOzsTeTo4VycvL0zfdVCgnPyKyr4+RUIX9mAcZr0RLCWrLh6kzt5RLAWlOsTghC5QE=
`;

const TEST_CONFIG_NO_TOUCH = `
columns:
  - 42
  - 99
`;

const TEST_CONFIG_NO_USER = `
touch:
 github-token:  W2fx8RomRO+vCXP7coyoQJ0F8hJdTKDzCXiuOWcgPt06t2G4kPE5mnOcDWITMoCNr9FiMniOH0K+VgT9QkxRiOvAr56Sk4xz71YajtlSEvOzsTeTo4VycvL0zfdVCgnPyKyr4+RUIX9mAcZr0RLCWrLh6kzt5RLAWlOsTghC5QE=
`;

const TEST_CONFIG_NO_TOKEN = `
touch:
 user: test-user
`;

const TEST_CONFIG_EMPTY = '';

const mockCreateCommit = sinon.stub().returns({
  data: {
    sha: '1234',
  },
});
const mockUpdateRef = sinon.stub().returns({
  data: {
    object: {
      url: 'test-commit-url',
    },
  },
});

// TODO: invoke openwhisk action or figure out how to test failures....
async function createApp(handler, cfg, params = {}) {
  const app = new Application();

  // mock default github
  const github = {
    repos: {
      getContents: sinon.stub().returns({
        data: {
          content: Buffer.from(cfg).toString('base64'),
        },
      }),
    },
  };
  // mock authenticated github
  const authGithub = {
    git: {
      createCommit: mockCreateCommit,
      updateRef: mockUpdateRef,
    },
  };
  // Passes the mocked out GitHub API into our app instance
  app.auth = async () => {
    if (app.githubToken === 'Hello, world.') {
      return authGithub;
    }
    return github;
  };
  app.load((p) => handler.init(p, params));
  return app;
}

describe('Push Tests', () => {
  let privateKey;

  before(async () => {
    privateKey = await fse.readFile(TEST_PRIVATE_KEY_FILE, 'utf-8');
  });

  beforeEach(() => {
    mockCreateCommit.resetHistory();
    mockUpdateRef.resetHistory();
  });

  it('adds a commit and updates the ref if a push event is received.', async () => {
    const handler = new PushHandler();
    const app = await createApp(handler, TEST_CONFIG, {
      GH_APP_PRIVATE_KEY: privateKey,
    });
    await app.receive({
      name: 'push',
      payload: JSON.parse(await fse.readFile(path.resolve(__dirname, 'fixtures/push.json'))),
    });
    sinon.assert.calledOnce(mockCreateCommit);
    sinon.assert.calledWith(mockUpdateRef);
  });

  it('ignores commits by not configured used.', async () => {
    const handler = new PushHandler();
    const app = await createApp(handler, TEST_CONFIG_WRONG_USER, {
      GH_APP_PRIVATE_KEY: privateKey,
    });
    await app.receive({
      name: 'push',
      payload: JSON.parse(await fse.readFile(path.resolve(__dirname, 'fixtures/push.json'))),
    });
    sinon.assert.notCalled(mockCreateCommit);
    sinon.assert.notCalled(mockUpdateRef);
  });

  it('does not create a commit when commit contains skip marker.', async () => {
    const handler = new PushHandler();
    const app = await createApp(handler, TEST_CONFIG, {
      GH_APP_PRIVATE_KEY: privateKey,
    });
    await app.receive({
      name: 'push',
      payload: JSON.parse(await fse.readFile(path.resolve(__dirname, 'fixtures/push_skip_action.json'))),
    });
    sinon.assert.notCalled(mockCreateCommit);
    sinon.assert.notCalled(mockUpdateRef);
  });

  it('ignores when empty config.', async () => {
    const handler = new PushHandler();
    const app = await createApp(handler, TEST_CONFIG_EMPTY, {
      GH_APP_PRIVATE_KEY: privateKey,
    });
    await app.receive({
      name: 'push',
      payload: JSON.parse(await fse.readFile(path.resolve(__dirname, 'fixtures/push.json'))),
    });
    sinon.assert.notCalled(mockCreateCommit);
    sinon.assert.notCalled(mockUpdateRef);
  });

  it('ignores when no touch config.', async () => {
    const handler = new PushHandler();
    const app = await createApp(handler, TEST_CONFIG_NO_TOUCH, {
      GH_APP_PRIVATE_KEY: privateKey,
    });
    await app.receive({
      name: 'push',
      payload: JSON.parse(await fse.readFile(path.resolve(__dirname, 'fixtures/push.json'))),
    });
    sinon.assert.notCalled(mockCreateCommit);
    sinon.assert.notCalled(mockUpdateRef);
  });

  it('ignores when no user configured.', async () => {
    const handler = new PushHandler();
    const app = await createApp(handler, TEST_CONFIG_NO_USER, {
      GH_APP_PRIVATE_KEY: privateKey,
    });
    await app.receive({
      name: 'push',
      payload: JSON.parse(await fse.readFile(path.resolve(__dirname, 'fixtures/push.json'))),
    });
    sinon.assert.notCalled(mockCreateCommit);
    sinon.assert.notCalled(mockUpdateRef);
  });

  it('ignores when no token configured.', async () => {
    const handler = new PushHandler();
    const app = await createApp(handler, TEST_CONFIG_NO_TOKEN, {
      GH_APP_PRIVATE_KEY: privateKey,
    });
    await app.receive({
      name: 'push',
      payload: JSON.parse(await fse.readFile(path.resolve(__dirname, 'fixtures/push.json'))),
    });
    sinon.assert.notCalled(mockCreateCommit);
    sinon.assert.notCalled(mockUpdateRef);
  });
});
