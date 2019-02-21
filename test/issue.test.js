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

const mockGithubProjects = {
  createCard: sinon.stub().returns(cardCreatedResposne),
};

// TODO: invoke openwhisk action or figure out how to test failures....
async function createApp(handler, cfg) {
  const app = new Application();

  app.load(p => handler.init(p, {}));

  // mock github
  const github = {
    repos: {
      getContents: sinon.stub().returns({
        data: {
          content: Buffer.from(cfg).toString('base64'),
        },
      }),
    },
    projects: mockGithubProjects,
  };
  // Passes the mocked out GitHub API into our app instance
  app.auth = () => Promise.resolve(github);

  return app;
}

describe('Issues Tests', () => {
  beforeEach(() => {
    mockGithubProjects.createCard.resetHistory();
  });

  it('triggers create columns when issue openend event received.', async () => {
    const handler = new IssuesHandler();
    const app = await createApp(handler, TEST_CONFIG);
    await app.receive({
      name: 'issues',
      payload: openedPayload,
    });
    sinon.assert.calledWith(mockGithubProjects.createCard, { column_id: 42, content_id: 412796400, content_type: 'Issue' });
    sinon.assert.calledWith(mockGithubProjects.createCard, { column_id: 99, content_id: 412796400, content_type: 'Issue' });
  });

  it('requires a config.', async () => {
    const handler = new IssuesHandler();
    const app = await createApp(handler, TEST_CONFIG_EMPTY);
    await app.receive({
      name: 'issues',
      payload: openedPayload,
    });
    sinon.assert.notCalled(mockGithubProjects.createCard);
  });

  it('needs columns.', async () => {
    const handler = new IssuesHandler();
    const app = await createApp(handler, TEST_CONFIG_NO_COLUMNS);
    await app.receive({
      name: 'issues',
      payload: openedPayload,
    });
    sinon.assert.notCalled(mockGithubProjects.createCard);
  });
});
