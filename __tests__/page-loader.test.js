import path from 'path';
import nock from 'nock';
import { fileURLToPath } from 'url';
import { promises as fsp } from 'fs';
import os from 'os';
import pageLoader from '../src/page-loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resourceDirName = 'ru-hexlet-io-courses_files';
const getFixturePath = (filename) => path.join(__dirname, '..', '__fixtures__', filename);
const readFile = (filePath) => fsp.readFile(filePath, 'utf-8');

const inputURL = 'https://ru.hexlet.io/courses';
const pageURL = new URL(inputURL);
let tmpDir;
nock.disableNetConnect();
const scope = nock(pageURL.origin).persist();
const expectedPath = getFixturePath('ru-hexlet-io-courses.html');

const resourcePaths = [
  ['/assets/professions/nodejs.png', path.join(resourceDirName, 'ru-hexlet-io-assets-professions-nodejs.png')],
  ['/courses', path.join(resourceDirName, 'ru-hexlet-io-courses.html')],
  ['/assets/application.css', path.join(resourceDirName, 'ru-hexlet-io-assets-application.css')],
  ['/packs/js/runtime.js', path.join(resourceDirName, 'ru-hexlet-io-packs-js-runtime.js')],
];

beforeAll(() => {
  resourcePaths.forEach(([pathName, fileName]) => scope
    .get(pathName).replyWithFile(200, getFixturePath(fileName)));
});

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('tests without errors', () => {
  test('response: positive', async () => {
    await pageLoader(inputURL, tmpDir);
    expect(scope.isDone()).toBe(true);
  });

  test('downloaded succesfully', async () => {
    const modifiedContent = await readFile(expectedPath);
    const savedPath = path.join(tmpDir, 'ru-hexlet-io-courses.html');

    await pageLoader(inputURL, tmpDir);

    expect(await readFile(savedPath)).toBe(modifiedContent);
  });

  test.each(resourcePaths)('saved succesfully', async (sourceUrl, sourcePath) => {
    await pageLoader(inputURL, tmpDir);

    const savedPath = path.join(tmpDir, sourcePath);
    const fixturePath = getFixturePath(sourcePath);
    const existingContent = await readFile(fixturePath);
    const savedContent = await readFile(savedPath);

    expect(savedContent).toBe(existingContent);
  });
});

describe.each([
  404,
  502,
  504,
])('network errors', (error) => {
  test(`Get ${error} code error`, async () => {
    const errorUrl = `${pageURL.origin}/${error}`;
    await expect(pageLoader(errorUrl, tmpDir))
      .rejects
      .toThrow(`${pageURL.origin}`);
  });
});

describe.each([
  [(path.join('/var', 'lib')), 'permission denied'],
  [expectedPath, 'not a directory'],
])('Output errors', (outputPath, errorText) => {
  test(`Founded errors: "${errorText}"`, async () => {
    await expect(pageLoader(inputURL, outputPath))
      .rejects
      .toThrow(errorText);
  });
});
