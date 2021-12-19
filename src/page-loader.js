import path from 'path';
import { promises as fs } from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';

const makeFileNameFromLink = (link) => {
  const { pathname, hostname } = link;
  return `${hostname.replace(/[.]/g, '-')}${pathname.replace(/[^\w.]/g, '-')}.html`;
};

const makeDirNameFromLink = (link) => {
  const { pathname, hostname } = link;
  return `${hostname.replace(/[.]/g, '-')}${pathname.replace(/[^\w.]/g, '-')}_files`;
};

export default (url, output = process.cwd()) => {
  const link = new URL(url);
  const outputPath = path.resolve(process.cwd(), output);
  const outputHtmlPath = path.resolve(process.cwd(), output, makeFileNameFromLink(link));
  const outputFilesPath = path.resolve(process.cwd(), output, makeDirNameFromLink(link));
  let content;
  let $;
  const downloadImgs = [];
  // const extension = (filename) => filename.substring(filename.lastIndexOf('.') + 1);

  const loadPage = axios.get(link.href)
    .then(({ data }) => {
      content = data;
      fs.mkdir(outputPath, { recursive: true });
    })
    .then(() => fs.writeFile(outputHtmlPath, content, 'utf-8'))
    .then(() => fs.mkdir(outputFilesPath, { recursive: true }))
    .then(() => {
      $ = cheerio.load(content);
    })
    .then(() => $('img').each((i, elem) => {
      downloadImgs.push($(elem).attr('src'));
    }))
    .then(() => downloadImgs.forEach((img) => {
      const file = `${link.href.slice(0, link.href.length - 1)}${img}`;
      const filename = `${link.hostname}${img}`;
      axios.get(file, {
        responseType: 'stream',
      })
        .then((response) => {
          fs.writeFile(`${outputFilesPath}/${filename.replace(/[^\w.]/g, '-')}`, response.data);
        });
    }));

  return loadPage;
};
