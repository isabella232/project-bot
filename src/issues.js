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
const BOT_CONFIG = 'org-project-bot.yaml';

/**
 * Handler that listens to creation of new issues and assigns them to the configured project
 * columns.
 */
class IssuesHandler {
  /**
   * Loader used for probot registration.
   * @returns {Function} probot loader function.
   */
  static loader() {
    const handler = new IssuesHandler();
    return handler.init.bind(handler);
  }

  /**
   * Initializes the handler. This is called by Probot
   * @param {Application} app The probot application
   * @param {Object} actionParams Additional openwhisk action params
   */
  // eslint-disable-next-line no-unused-vars
  init(app, actionParams = {}) {
    app.log('Fastly Purger loaded.');
    this._cfg = null;

    // register event handlers
    app.on('issues', this.onIssues.bind(this));
  }

  /**
   * Push event handler. Reads the config and triggers purge-all on the configured
   * Fastly service.
   */
  // eslint-disable-next-line class-methods-use-this
  async onIssues(context) {
    const { log, payload: { action, issue, repository } } = context;
    log.debug('issues event received. action=%s issue=%s', action, issue.html_url);

    if (action !== 'opened') {
      return;
    }

    const cfg = await context.config(BOT_CONFIG);
    if (!cfg || !cfg.columns) {
      log.info(`no .github/${BOT_CONFIG} or no 'columns' configured in ${repository.html_url}.`);
      return;
    }

    try {
      for (const col of cfg.columns) {
        log.debug('adding issue %s to column %s', issue.id, col);
        // eslint-disable-next-line no-await-in-loop
        const result = await context.github.projects.createCard({
          column_id: col,
          content_id: issue.id,
          content_type: 'Issue',
        });
        log.debug(result);
      }
    } catch (e) {
      log.error('error while adding issue: %s', e);
    }
  }
}

module.exports = IssuesHandler;
