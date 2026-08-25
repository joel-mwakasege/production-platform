import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractBearerToken, slugify } from './auth.js';

test('extractBearerToken returns the token from an Authorization header', () => {
  assert.equal(extractBearerToken('Bearer abc123'), 'abc123');
  assert.equal(extractBearerToken('bearer abc123'), 'abc123');
  assert.equal(extractBearerToken('Basic abc123'), null);
  assert.equal(extractBearerToken(undefined), null);
});

test('slugify keeps an organization slug URL-safe', () => {
  assert.equal(slugify('Northstar Films'), 'northstar-films');
  assert.equal(slugify('  Studio   Binder  '), 'studio-binder');
});
