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

const { Application } = require('probot');
const sinon = require('sinon');
const path = require('path');

const IssuesHandler = require('../src/issues.js');
const pushPayload = require('./fixtures/push.json');

const TEST_CONFIG = `
BRANCH: "master"
FASTLY_SERVICE_ID: "1234abc"
FASTLY_TOKEN: "fake"
`;

const TEST_CONFIG_STABLE = `
BRANCH: "stable"
FASTLY_SERVICE_ID: "1234abc"
FASTLY_TOKEN: "fake"
`;

const TEST_CONFIG_NO_TOKEN = `
BRANCH: "master"
FASTLY_SERVICE_ID: "1234abc"
`;

const TEST_CONFIG_NO_SERVICE = `
BRANCH: "master"
FASTLY_TOKEN: "fake"
`;

const TEST_CONFIG_EMPTY = '';


const TEST_PRIV_KEY = path.resolve(__dirname, 'fixtures', 'crypto', 'privkey.asc');

const TEST_PUB_KEY = path.resolve(__dirname, 'fixtures', 'crypto', 'pubkey.asc');

async function getEncryptedConfig(cfg) {
  const crypt = new Crypt()
    .withPublicKey(TEST_PUB_KEY);
  const secureConfig = await crypt.encrypt(cfg);
  return Buffer.from(secureConfig).toString('base64');
}

// TODO: invoke openwhisk action or figure out how to test failures....
async function createApp(handler, cfg) {
  const app = new Application();
  const secureConfig = await getEncryptedConfig(cfg);

  const params = {
    HLX_BOT_PRIVKEY_PW: 'test',
    HLX_BOT_PRIVKEY_PATH: TEST_PRIV_KEY,
  };
  app.load(p => handler.init(p, params));

  // mock github
  const github = {
    repos: {
      getContent: sinon.stub().returns({
        data: {
          content: secureConfig,
        },
      }),
    },
  };
  // Passes the mocked out GitHub API into out app instance
  app.auth = () => Promise.resolve(github);

  return app;
}

describe('Purge Tests', () => {
  // mocked fastly instance
  let mockFastly;

  const FastlyMock = sinon.spy(() => {
    mockFastly = sinon.createStubInstance(Fastly);
    mockFastly.withAuthToken.returnsThis();
    mockFastly.domains.returns([{
      name: 'test.domain.com',
    }]);
    mockFastly.purgeAll.returns({
      status: 'ok',
    });
    return mockFastly;
  });

  beforeEach(() => {
    FastlyMock.resetHistory();
    mockFastly = sinon.createStubInstance(Fastly);
    mockFastly.withAuthToken.returnsThis();
    mockFastly.domains.returns([{
      name: 'test.domain.com',
    }]);
    mockFastly.purgeAll.returns({
      status: 'ok',
    });
  });

  it('triggers purge when push event received.', async () => {
    const handler = new PurgeHandler(FastlyMock);
    const app = await createApp(handler, TEST_CONFIG);
    await app.receive({
      name: 'push',
      payload: pushPayload,
    });
    sinon.assert.calledWith(mockFastly.domains, '1234abc');
    sinon.assert.calledWith(mockFastly.purgeAll, '1234abc');
  });

  it('requires a branch config.', async () => {
    const handler = new PurgeHandler(FastlyMock);
    const app = await createApp(handler, TEST_CONFIG_EMPTY);
    await app.receive({
      name: 'push',
      payload: pushPayload,
    });
    sinon.assert.notCalled(FastlyMock);
  });

  it('only acts on same branch.', async () => {
    const handler = new PurgeHandler(FastlyMock);
    const app = await createApp(handler, TEST_CONFIG_STABLE);
    await app.receive({
      name: 'push',
      payload: pushPayload,
    });
    sinon.assert.notCalled(FastlyMock);
  });

  it('needs service id.', async () => {
    const handler = new PurgeHandler(FastlyMock);
    const app = await createApp(handler, TEST_CONFIG_NO_SERVICE);
    await app.receive({
      name: 'push',
      payload: pushPayload,
    });
    sinon.assert.notCalled(FastlyMock);
  });

  it('needs token.', async () => {
    const handler = new PurgeHandler(FastlyMock);
    const app = await createApp(handler, TEST_CONFIG_NO_TOKEN);
    await app.receive({
      name: 'push',
      payload: pushPayload,
    });
    sinon.assert.notCalled(FastlyMock);
  });
});
