#!/usr/bin/env node
import commander from 'commander';
import pageLoader from '../src/page-loader.js';

const { program } = commander;

program
  .description('Page loader utility')
  .helpOption('-h, --help', 'display help for command')
  .version('0.0.1', '-V, --version', 'output the version number')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .arguments('url')
  .action((url, options) => pageLoader(url, options.output)
    .then((htmlFolder) => console.log(`Page was successfully downloaded into ${options.output}/${htmlFolder}`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    }));

program.parse(process.argv);
