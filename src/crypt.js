/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const crypto = require('crypto');

module.exports.middleware = (app, actionParams) => {
  const route = app.route();
  route.use((req, res, next) => {
    res.locals.publicKey = actionParams.GH_APP_PUBLIC_KEY;
    next();
  });
};

module.exports.encrypt = (publicKey, data) => crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
    oaepHash: 'sha256',
  },
  Buffer.from(data, 'utf-8'),
).toString('base64');

module.exports.decrypt = (privateKey, data) => crypto.privateDecrypt(
  {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
    oaepHash: 'sha256',
  },
  Buffer.from(data, 'base64'),
).toString('utf-8');
