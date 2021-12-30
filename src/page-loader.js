import path from 'path';
import { promises as fs } from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';
import debug from 'debug';
import Listr from 'listr';

const log = debug('page-loader');

const makeDirNameFromLink = (link) => {
  const { pathname, hostname } = link;
  return `${hostname.replace(/[.]/g, '-')}${pathname.length > 1 ? pathname.replace(/[^\w.]/g, '-') : ''}_files`;
};

export default (url, output = process.cwd()) => {
  const address = new URL(url);
  log('requested page:', url);
  const outputPath = path.resolve(process.cwd(), output);
  const outputFilesPath = path.resolve(process.cwd(), output, makeDirNameFromLink(address));
  let $;
  const downloadImgs = [];
  const downloadLinks = [];
  const downloadScripts = [];

  const loadPage = axios.get(address.href)
    .then(({ data }) => {
      $ = cheerio.load(data);
    })
    .then(() => fs.mkdir(outputPath, { recursive: true }))
    .then(() => $('img').each((i, elem) => {
      downloadImgs.push($(elem).attr('src'));
      $(elem).attr('src', `${makeDirNameFromLink(address)}/${address.hostname.replace(/[/.]/g, '-')}${$(elem)
        .attr('src')
        .replace(/[^\w.]/g, '-')}`);
    }))
    .then(() => $('link').each((i, elem) => {
      downloadLinks.push($(elem).attr('href'));
      $(elem).attr('href', `${makeDirNameFromLink(address)}/${address.hostname.replace(/[/.]/g, '-')}${$(elem)
        .attr('href')
        .replace(/[^\w.]/g, '-')}`);
    }))
    .then(() => $('script').each((i, elem) => {
      downloadScripts.push($(elem).attr('src'));
      $(elem).attr('src', `${makeDirNameFromLink(address)}/${address.hostname.replace(/[/.]/g, '-')}${$(elem)
        .attr('src')
        .replace(/[^\w.]/g, '-')}`);
    }))
    .then(() => fs.writeFile(`${outputPath}/${address.hostname.replace(/[/.]/g, '-')}${address.pathname.length > 1 ? address.pathname.replace(/[/.]/g, '-') : ''}.html`, $.html()))
    .then(() => fs.mkdir(outputFilesPath, { recursive: true }))
    .then(() => {
      const data = downloadLinks.map((el) => ({
        title: `${address.href.slice(0, -1)}${el}`,
        task: () => axios.get(`${address.href.slice(0, address.href.length - 1)}${el}`, { responseType: 'text' })
          .then((response) => fs.writeFile(`${outputPath}/${makeDirNameFromLink(address)}/${address.hostname.replace(/[/.]/g, '-')}${el
            .replace(/[^\w.]/g, '-')}`, response.data)),

      }));

      const tasks = new Listr(data, { concurrent: true, exitOnError: false });
      return tasks.run();
    })
    .then(() => {
      const data = downloadScripts.map((el) => ({
        title: `${address.href.slice(0, -1)}${el}`,
        task: () => axios.get(`${address.href.slice(0, address.href.length - 1)}${el}`, { responseType: 'text' })
          .then((response) => fs.writeFile(`${outputPath}/${makeDirNameFromLink(address)}/${address.hostname.replace(/[/.]/g, '-')}${el
            .replace(/[^\w.]/g, '-')}`, response.data)),

      }));

      const tasks = new Listr(data, { concurrent: true, exitOnError: false });
      return tasks.run();
    })
    .then(() => {
      const data = downloadImgs.map((el) => ({
        title: `${address.href.slice(0, -1)}${el}`,
        task: () => axios.get(`${address.href.slice(0, address.href.length - 1)}${el}`, { responseType: 'text' })
          .then((response) => fs.writeFile(`${outputPath}/${makeDirNameFromLink(address)}/${address.hostname.replace(/[/.]/g, '-')}${el
            .replace(/[^\w.]/g, '-')}`, response.data)),

      }));

      const tasks = new Listr(data, { concurrent: true, exitOnError: false });
      return tasks.run();
    });

  return loadPage;
};
