import path from 'path';
import debug from 'debug';
import 'axios-debug-log';
import fs from 'fs/promises';
import axios from 'axios';
import cheerio from 'cheerio';
import Listr from 'listr';
import _ from 'lodash';

const log = debug('page-loader');

const makeNameFromLink = ({ host, pathname }) => {
  const newHost = host.replace(/[.]/g, '-');
  const newPathname = pathname.replace(/[^\w.]/g, '-');
  return _.trim(newHost.concat(newPathname), '-');
};

const makeAssetDirectoryName = (url) => `${makeNameFromLink(url)}_files`;
const makeHtmlName = (url) => `${makeNameFromLink(url)}.html`;

export default (requestedUrl, outputDir) => {
  const url = new URL(requestedUrl);
  const htmlFileName = makeHtmlName(url);
  const htmlFilePath = path.resolve(outputDir, htmlFileName);

  const assetDirectoryName = makeAssetDirectoryName(url);
  const assetDirectoryPath = path.resolve(outputDir, assetDirectoryName);
  const links = [];
  let changedHtml;
  const tags = [
    { tag: 'img', tagAttribute: 'src' },
    { tag: 'script', tagAttribute: 'src' },
    { tag: 'link', tagAttribute: 'href' },
  ];

  return axios.get(url.href)
    .then((response) => {
      const $ = cheerio.load(response.data, { decodeEntities: false });
      tags.forEach(({ tag, tagAttribute }) => {
        const elements = $(tag).toArray();
        elements.map((elem) => {
          const assetUrl = new URL($(elem).attr(tagAttribute), url.href);
          return { elem, assetUrl };
        })
          .filter(({ assetUrl }) => assetUrl.host === url.host)
          .forEach(({
            elem, assetUrl,
          }) => {
            let assetName = makeNameFromLink(assetUrl);
            if (!assetName.split('.')[1]) {
              $(elem).attr(tagAttribute, path.join(assetDirectoryName, `${assetName}.html`));
              assetName += '.html';
              links.push({ assetName, assetUrl });
            } else {
              $(elem).attr(tagAttribute, path.join(assetDirectoryName, assetName));
              links.push({ assetName, assetUrl });
            }
          });
      });
      changedHtml = $.html();
      return fs.mkdir(assetDirectoryPath, { recursive: true });
    })
    .then(() => fs.writeFile(htmlFilePath, changedHtml, 'utf-8'))
    .then(() => {
      const data = links.map(({ assetName, assetUrl }) => ({
        title: `${assetUrl}`,
        task: () => axios.get(assetUrl.href, { responseType: 'arraybuffer' })
          .then(({ data: response }) => {
            log(`Asset loading  ${assetName}`);
            const assetLoadingPath = path.join(assetDirectoryPath, assetName);

            return fs.writeFile(assetLoadingPath, response);
          }),

      }));
      const tasks = new Listr(data, { concurrent: true, exitOnError: false });
      return tasks.run();
    })
    .then(() => {
      log(`HtmlFileName: ${htmlFileName}`);

      return htmlFileName;
    });
};
