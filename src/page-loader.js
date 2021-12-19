import path from 'path';
import { promises as fs } from 'fs';
import axios from 'axios';

const makeFileNameFromLink = (link) => {
  const { pathname, hostname } = link;
  return `${hostname.replace(/[.]/g, '-')}${pathname.replace(/[^\w.]/g, '-')}.html`;
};

export default (url, output = process.cwd()) => {
  const link = new URL(url);
  const outputPath = path.resolve(process.cwd(), output);
  const outputFilePath = path.resolve(process.cwd(), output, makeFileNameFromLink(link));
  let content;

  const loadPage = axios.get(link.href)
    .then((result) => {
      content = result.data;
      fs.mkdir(outputPath, { recursive: true });
    })
    .then(() => fs.writeFile(outputFilePath, content, 'utf-8'))
    .catch((error) => console.log(error));

  return loadPage;
};
