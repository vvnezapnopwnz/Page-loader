/**
 * @jest-environment node
 */
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import nock from 'nock';
import pageLoader from '../src/page-loader.js';

nock.disableNetConnect();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);

let tempDir;
let assetsJS;
let assetsCSS;
let assetsImg;
let html;
let assetsLink;

beforeAll(async () => {
  assetsJS = await fs.readFile(getFixturePath('assets/script.js'), 'utf-8');
  assetsCSS = await fs.readFile(getFixturePath('assets/assets-application.css'), 'utf-8');
  assetsImg = await fs.readFile(getFixturePath('assets/assets-professions-nodejs.png'));
  html = await fs.readFile(getFixturePath('page-loader-hexlet-repl-co.html'), 'utf-8');
  assetsLink = await fs.readFile(getFixturePath('assets/courses.html'));
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader'));
});

test('page loader', async () => {
  nock('https://page-loader.hexlet.repl.co/')
    .get('/')
    .reply(200, html)
    .get('/script.js')
    .reply(200, assetsJS)
    .get('/assets/application.css')
    .reply(200, assetsCSS)
    .get('/assets/professions/nodejs.png')
    .reply(200, assetsImg)
    .get('/courses')
    .reply(200, assetsLink);
  const url = 'https://page-loader.hexlet.repl.co/';
  await pageLoader(url, tempDir);
  const actualHtml = await fs.readFile(path.join(tempDir, 'page-loader-hexlet-repl-co.html'), 'utf-8');
  const actualJS = await fs.readFile(path.join(tempDir, 'page-loader-hexlet-repl-co_files', 'page-loader-hexlet-repl-co-script.js'), 'utf-8');
  const actualCSS = await fs.readFile(path.join(tempDir, 'page-loader-hexlet-repl-co_files', 'page-loader-hexlet-repl-co-assets-application.css'), 'utf-8');
  const actualImg = await fs.readFile(path.join(tempDir, 'page-loader-hexlet-repl-co_files', 'page-loader-hexlet-repl-co-assets-professions-nodejs.png'));
  expect(actualHtml).toBe(html);
  expect(actualJS).toBe(assetsJS);
  expect(actualCSS).toBe(assetsCSS);
  expect(actualImg).toEqual(assetsImg);
});

afterEach(async () => {
  fs.rmdir(tempDir, { recursive: true });
});
