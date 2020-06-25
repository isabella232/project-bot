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
const crypt = require('./crypt.js');

const BOT_CONFIG = 'org-project-bot.yaml';

/**
 * Handler that listens to creation of push events and adds an empty commit to a PR to trigger
 * correct post-deploy
 */
class PushHandler {
  /**
   * Loader used for probot registration.
   * @returns {Function} probot loader function.
   */
  static loader() {
    const handler = new PushHandler();
    return handler.init.bind(handler);
  }

  /**
   * Initializes the handler. This is called by Probot
   * @param {Application} app The probot application
   * @param {Object} actionParams Additional openwhisk action params
   */
  // eslint-disable-next-line no-unused-vars
  init(app, actionParams = {}) {
    app.log.debug('push handler loaded.');
    this._privateKey = actionParams.GH_APP_PRIVATE_KEY;

    // register event handlers
    app.on('push', this.onPush.bind(this));
    this._probotApp = app;
  }

  async getAuthenticatedClient(token) {
    const app = this._probotApp;
    // hack to temporarily create a new github client
    const oldToken = await app.githubToken;
    try {
      app.githubToken = token;
      return app.auth();
    } finally {
      app.githubToken = oldToken;
    }
  }

  /**
   * Push event handler. Reads the config and triggers purge-all on the configured
   * Fastly service.
   */
  // eslint-disable-next-line class-methods-use-this
  async onPush(context) {
    const { log, payload } = context;

    let { ref } = payload;
    if (ref.startsWith('refs/heads/')) {
      ref = ref.substring(11);
    }
    log.debug('push event received on %s#%s', payload.repository.html_url, ref);
    if (ref === 'master' || ref === 'main') {
      return;
    }

    const cfg = await context.config(BOT_CONFIG);
    if (!cfg) {
      log.info(`no .github/${BOT_CONFIG} configured in ${payload.repository.html_url}.`);
      return;
    }
    const { touch = {} } = cfg;
    if (!touch.user) {
      log.info(`No 'touch.user' configured in ${payload.repository.html_url}/.github/${BOT_CONFIG}.`);
      return;
    }
    if (!touch['github-token']) {
      log.info(`No 'touch.github-token' configured in ${payload.repository.html_url}/.github/${BOT_CONFIG}.`);
      return;
    }
    const { user } = touch;
    const token = crypt.decrypt(this._privateKey, touch['github-token']);

    log.debug(`The event payload: ${JSON.stringify(payload, undefined, 2)}`);

    // check if to skip commit
    const skip = payload.commits.find((ci) => (ci.message.indexOf('[skip action]') >= 0));
    if (skip) {
      log.info(`skipping due to issue comment: ${skip.message}`);
      return;
    }

    // check if any commit is from a configured user
    const validCommit = payload.commits.find((ci) => (user === ci.author.username));
    if (!validCommit) {
      log.info(`no commit found by configured user: ${user}. skipping.`);
      return;
    }

    const client = await this.getAuthenticatedClient(token);
    const owner = payload.repository.owner.name;
    const repo = payload.repository.name;

    const opts = {
      owner,
      repo,
      message: 'chore(ci): trigger ci [skip action]',
      tree: payload.head_commit.tree_id,
      parents: [payload.head_commit.id],
    };

    // create a the commit
    log.debug('create commit with', opts);
    const res = await client.git.createCommit(opts);
    // console.log('result', res);
    log.info('created commit', res.data);

    // update reference (push)
    const updateOpts = {
      owner,
      repo,
      ref: `heads/${ref}`,
      sha: res.data.sha,
      force: false,
    };
    log.debug('pushing', updateOpts);
    try {
      const res2 = await client.git.updateRef(updateOpts);
      log.info('pushed ref:', res2.data.object.url);
    } catch (e) {
      log.error('unable to push ref:', e);
    }
  }
}

module.exports = PushHandler;
