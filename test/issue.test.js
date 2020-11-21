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

const crypto = require('crypto');
const path = require('path');
const sinon = require('sinon');
const yaml = require('js-yaml');
const { OpenWhiskWrapper } = require('@adobe/probot-serverless-openwhisk');

const IssuesHandler = require('../src/issues.js');
const openedPayload = require('./fixtures/issue_opened.json');
const cardCreatedResposne = require('./fixtures/card_created.json');

const TEST_CONFIG = `
columns:
  - 42
  - 99
`;

const TEST_CONFIG_NO_COLUMNS = `
foo:
 - bar
`;

const TEST_CONFIG_EMPTY = '';

const TEST_GITHUB_PRIV_KEY = path.resolve(__dirname, 'fixtures', 'test-github-private-key-pem.txt');

const TEST_WEBHOOK_SECRET = 'testSecret';

const mockGithubProjects = {
  createCard: sinon.stub().returns(cardCreatedResposne),
};

async function createTestPayload(payloadJson, params = {}) {
  const payload = JSON.stringify(payloadJson);
  const signature = crypto.createHmac('sha1', TEST_WEBHOOK_SECRET).update(payload, 'utf-8').digest('hex');
  return {
    __ow_method: 'post',
    __ow_path: '/',
    __ow_body: Buffer.from(payload).toString('base64'),
    __ow_headers: {
      'content-type': 'application/json',
      'x-github-event': 'issues',
      'x-github-delivery': 1234,
      'x-hub-signature': `sha1=${signature}`,
    },
    ...params,
  };
}

function injectAppMocks(handlerInit, rawConfig) {
  return (probot, params = {}) => {
    const { app } = probot;

    const config = yaml.safeLoad(rawConfig);
    // mock github
    const github = {
      config: {
        get: async () => ({
          files: [{
            config,
          }],
          config,
        }),
      },
      projects: mockGithubProjects,
      apps: {
        getAuthenticated: async () => ({
          data: {
            events: ['push'],
          },
        }),
      },
    };

    // hijack 'on' registration to inject our github mock
    const originalOn = app.on.bind(app);
    // eslint-disable-next-line arrow-body-style,no-param-reassign
    app.on = (evt, fn) => {
      return originalOn(evt, (context) => {
        context.github = github;
        return fn(context);
      });
    };
    return handlerInit(probot, params);
  };
}

describe('Issues Tests', () => {
  beforeEach(() => {
    mockGithubProjects.createCard.resetHistory();
  });

  it('triggers create columns when issue openend event received.', async () => {
    const main = new OpenWhiskWrapper()
      .withGithubPrivateKey(TEST_GITHUB_PRIV_KEY)
      .withWebhookSecret(TEST_WEBHOOK_SECRET)
      .withApp(injectAppMocks(IssuesHandler.loader(), TEST_CONFIG))
      .withGithubToken('dummy')
      .create();

    await main(await createTestPayload(openedPayload));

    sinon.assert.calledWith(mockGithubProjects.createCard, { column_id: 42, content_id: 412796400, content_type: 'Issue' });
    sinon.assert.calledWith(mockGithubProjects.createCard, { column_id: 99, content_id: 412796400, content_type: 'Issue' });
  });

  it('requires a config.', async () => {
    const main = new OpenWhiskWrapper()
      .withGithubPrivateKey(TEST_GITHUB_PRIV_KEY)
      .withWebhookSecret(TEST_WEBHOOK_SECRET)
      .withApp(injectAppMocks(IssuesHandler.loader(), TEST_CONFIG_EMPTY))
      .withGithubToken('dummy')
      .create();

    await main(await createTestPayload(openedPayload));
    sinon.assert.notCalled(mockGithubProjects.createCard);
  });

  it('needs columns.', async () => {
    const main = new OpenWhiskWrapper()
      .withGithubPrivateKey(TEST_GITHUB_PRIV_KEY)
      .withWebhookSecret(TEST_WEBHOOK_SECRET)
      .withApp(injectAppMocks(IssuesHandler.loader(), TEST_CONFIG_NO_COLUMNS))
      .withGithubToken('dummy')
      .create();

    await main(await createTestPayload(openedPayload));
    sinon.assert.notCalled(mockGithubProjects.createCard);
  });
});
