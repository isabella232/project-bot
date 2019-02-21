# Helix Bot

> Helix Bot built with [Probot](https://probot.github.io)

## Status
[![CircleCI](https://circleci.com/gh/adobe/helix-bot.svg?style=svg&circle-token=881af8825a77a2c88922d86d8fd6decd9047f27a)](https://circleci.com/gh/adobe/helix-bot)
[![Greenkeeper badge](https://badges.greenkeeper.io/adobe/helix-bot.svg?token=14b0c63e7875729e718d22494d60ec5f411d99b6bc90b8ea1a24e649ab4da5f9&ts=1539082697072)](https://greenkeeper.io/)
<!-- 
[![codecov](https://img.shields.io/codecov/c/github/adobe-rnd/project-bot.svg)](https://codecov.io/gh/adobe-rnd/project-bot)
[![CircleCI](https://img.shields.io/circleci/token/881af8825a77a2c88922d86d8fd6decd9047f27a/project/github/adobe-rnd/project-bot.svg)](https://circleci.com/gh/adobe-rnd/project-bot)
[![GitHub license](https://img.shields.io/github/license/adobe-rnd/project-bot.svg)](https://github.com/adobe-rnd/project-bot/blob/master/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe-rnd/project-bot.svg)](https://github.com/adobe-rnd/project-bot/issues)
[![Greenkeeper badge](https://badges.greenkeeper.io/adobe-rnd/project-bot.svg)](https://greenkeeper.io/)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe-rnd/project-bot.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe-rnd/project-bot)
-->

## Overview

The ProjectBot is used to manage organizational projects.
The sole task so far is to assign new issues in related repositories to 1 project.

## Installation

**TODO** 

https://github.com/apps/orgprojectbot

## Configuration

The Helix Bot app needs a configuration file `.github/org-project-bot.yaml` that contains the 
list of projects it should add new issues to:

```yaml
# specify which branch to listen for changes
columns:
  - 12345
```

### Note on Secrets

Currently the `secrets` directory contains the blackbox (PGP) encrypted files for production,
which is sub-optimal. In the future a better separation needs to be done. Maybe keep the production
keys in a separate branch, or completely somewhere else.

## Installation

```bash
# Install dependencies
npm install
```

The project uses [probot-serverless-openwhisk/](https://github.com/tripodsan/probot-serverless-openwhisk/) to
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

If you have suggestions for how the helix bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

