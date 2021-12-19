/**
 * @jest-environment node
 */
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import nock from 'nock';
import pageLoader from '../src/page-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

let expected;
let tempDir;

beforeEach(async () => {
  expected = await fs.readFile(getFixturePath('ru-hexlet-io-courses.html'), 'utf-8');
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('https://hexlet.io/courses', async () => {
  nock('https://hexlet.io')
    .get('/courses')
    .reply(200, expected);
  const url = 'https://hexlet.io/courses';
  await pageLoader(url, tempDir);
  const actual = await fs.readFile(path.join(tempDir, 'hexlet-io-courses.html'), 'utf-8');
  expect(actual).toBe(expected);
});
