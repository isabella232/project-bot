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

/* eslint-env mocha */

const path = require('path');
const assert = require('assert');
const fse = require('fs-extra');
const crypt = require('../src/crypt.js');

const TEST_PUBLIC_KEY_FILE = path.resolve(__dirname, 'fixtures', 'test-public-key.txt');
const TEST_PRIVATE_KEY_FILE = path.resolve(__dirname, 'fixtures', 'test-private-key.txt');

describe('Issues Tests', () => {
  let privateKey;
  let publicKey;

  before(async () => {
    privateKey = await fse.readFile(TEST_PRIVATE_KEY_FILE, 'utf-8');
    publicKey = await fse.readFile(TEST_PUBLIC_KEY_FILE, 'utf-8');
  });

  it('can encrypt and decrypt data.', async () => {
    const expected = 'Hello, world.';
    const encrypted = crypt.encrypt(publicKey, expected);
    // eslint-disable-next-line no-console
    console.log(encrypted); // use this value in the push.test config
    const actual = crypt.decrypt(privateKey, encrypted);
    assert.equal(actual, expected);
  });
});
