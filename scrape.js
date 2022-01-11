import fs from 'fs';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const versionsFilePath = process.env.VERSIONS_FILE_PATH;
const artifactsUrl = process.env.ARTIFACTS_URL;
if (!versionsFilePath) {
  throw new Error("VERSIONS_FILE_PATH env var not set !");
}
if (!artifactsUrl) {
  throw new Error("ARTIFACTS_URL env var not set !");
}

let versions = JSON.parse(fs.readFileSync(versionsFilePath));
const $ = cheerio.load(await (await fetch(artifactsUrl)).text());

const recommendedFile = $('.is-primary').attr('href');
const optionalFile = $('.is-danger').attr('href');

let latestFile;
const othersArray = $('.panel-block').toArray();
for (const i in othersArray) {
  if (othersArray[i].name = 'a' && othersArray[i].attribs.href && othersArray[i].attribs.href != "..") {
    latestFile = othersArray[i].attribs.href;
    break;
  }
}

const getVersionRegex = /[0-9]+/;

const recommended = {
  version: getVersionRegex.exec(recommendedFile)[0],
  url: artifactsUrl + recommendedFile.slice(2)
};
const optional = {
  version: getVersionRegex.exec(optionalFile)[0],
  url: artifactsUrl + optionalFile.slice(2)
};
const latest = {
  version: getVersionRegex.exec(latestFile)[0],
  url: artifactsUrl + latestFile.slice(2)
};

let newVersion = false

if (versions.recommended.version != recommended.version) {
  console.log('New recommended version detected ! - ' + versions.recommended.version + ' => ' + recommended.version);
  console.log('::set-output name=recommended::' + recommended.version);
  versions.recommended = recommended;
  newVersion = true;
}
if (versions.optional.version != optional.version) {
  console.log('New optional version detected ! - ' + versions.optional.version + ' => ' + optional.version);
  console.log('::set-output name=optional::' + optional.version);
  versions.optional = optional;
  newVersion = true;
}
if (versions.latest.version != latest.version) {
  console.log('New latest version detected ! - ' + versions.latest.version + ' => ' + latest.version);
  console.log('::set-output name=latest::' + latest.version);
  versions.latest = latest;
  newVersion = true;
}

if (newVersion) {
  fs.writeFileSync(versionsFilePath, JSON.stringify(versions));
} else {
  console.log('No new version detected...');
}
