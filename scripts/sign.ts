#!/usr/bin/env node

/*
 * Compute the PGP signature of index.html
 *
 * This script will strip comments and minimize an html file, after which the
 * content is passed to gpg to sign the data. The resulting signature can then
 * be shared so that users can verify the authenticity of the web page, as long
 * as it also parses the html file in the same way.
 *
 * Basic verification example:
 *   > curl https://datagarden.app/index.html | grep -o '<html.*' | tr -d '\n' | gpg --verify <SIGNATURE>.asc -
 *
 * See also: https://github.com/tasn/webext-signed-pages.
 */

const fs = require('fs');
const child_process = require('child_process');
const Minimize = require('minimize');


function errorAbort(text) {
  console.error(text);
  process.exit(1);
}

function getSignature(content, callback) {
  const tmpfile = `/tmp/${process.pid}`;
  fs.writeFileSync(tmpfile, content, 'utf-8');
  const gitGpg = child_process.spawnSync('git', ['config', '--get', 'gpg.program']);
  const gpgBin = gitGpg.status == 0 ? gitGpg.stdout.toString().trim('\n') : 'gpg';
  const gpg = child_process.spawnSync(gpgBin, ['--armor', '--output', '-', '--detach-sign', tmpfile], {
    stdio: [
      0,
      'pipe',
    ]
  });

  fs.unlink(tmpfile, () => {});

  callback(gpg.stdout.toString());
}

let args = process.argv.slice(2);

const filename = args.shift();
const outfile = args.shift();

if (!filename) {
  errorAbort(`Usage: ${process.argv[1]} <infile> [outfile]`);
}

fs.readFile(filename, 'utf8', (err, data) => {
  if (err) {
    errorAbort(err);
  }

  // Minimize and strip the doctype
  const content = new Minimize({ spare:true, conditionals: true, empty: true, quotes: true }).parse(data)
    .replace(/^\s*<!doctype[^>]*>/i, '');

  getSignature(content, (signature) => {
    if (outfile) {
      fs.writeFile(outfile, signature, 'utf8', (writeErr) => {
        if (writeErr) {
          errorAbort(writeErr);
        }
      });
    } else {
      process.stdout.write(signature);
    }
  });
});
