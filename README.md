# Organization Project Bot

> Organization Project Bot built with [Probot](https://probot.github.io)

## Status
[![CircleCI](https://circleci.com/gh/adobe-rnd/project-bot.svg?style=svg&circle-token=881af8825a77a2c88922d86d8fd6decd9047f27a)](https://circleci.com/gh/adobe-rnd/project-bot)
[![codecov](https://img.shields.io/codecov/c/github/adobe-rnd/project-bot.svg)](https://codecov.io/gh/adobe-rnd/project-bot)
[![GitHub license](https://img.shields.io/github/license/adobe-rnd/project-bot.svg)](https://github.com/adobe-rnd/project-bot/blob/main/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe-rnd/project-bot.svg)](https://github.com/adobe-rnd/project-bot/issues)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe-rnd/project-bot.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe-rnd/project-bot)

## Overview

The ProjectBot is used to manage organizational projects.
The sole task so far is to assign new issues in related repositories to 1 project.

## Installation

**TODO** 

https://github.com/apps/orgprojectbot

## Project Configuration

The Organization Project Bot app needs a configuration file `.github/org-project-bot.yaml` that contains the 
list of projects it should add new issues to:

```yaml
# specify which branch to listen for changes
columns:
  - 12345
```

The easiest way to get the column id for your project, is the click on the little menu icon of a
column and use `copy the column link`. eg:

`https://github.com/orgs/adobe-rnd/projects/1#column-4501999` -> `4501999`

## Touch Action Configuration

The touch action bot is used to trigger CI builds if a configured user pushes to a branch.

```yaml
touch:
  user: renovate-bot
  github-token: xxff==
```

The github token needs to be encrypted with the bot's publioc key. this can be done here:

https://adobeioruntime.net/api/v1/web/helix/projectbot/main@v1/encrypt.html

### Note on Secrets

Currently the `secrets` directory contains the blackbox (PGP) encrypted files for production,
which is sub-optimal. In the future a better separation needs to be done. Maybe keep the production
keys in a separate branch, or completely somewhere else.

## Installation

```bash
# Install dependencies
npm install
```

The project uses [probot-serverless-openwhisk/](https://github.com/test-user/probot-serverless-openwhisk/) to
run and its commandline tool `wskbot` for deployment. run `wskbot --help` for details.

To build the openwhisk action with details, run:

```
$ npm run build
```

To build and deploy it directly to OpenWhisk, run:

```
$ npm run deploy
```


## Contributing

If you have suggestions for how the this bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

