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

const sendNewVersionToGitlab = function(version, oldVersion, newVersion, newUrl) {
  console.log('New ' + version + ' version detected ! - ' + oldVersion + ' => ' + newVersion);
  fs.writeFileSync(process.env.GITHUB_OUTPUT, version + '=' + newVersion);
  fs.writeFileSync(process.env.GITHUB_OUTPUT, version + '_url=' + newUrl);
};

let newVersion = false

if (versions.recommended.version != recommended.version) {
  sendNewVersionToGitlab("recommended", versions.recommended.version, recommended.version, recommended.url);
  versions.recommended = recommended;
  newVersion = true;
}
if (versions.optional.version != optional.version) {
  sendNewVersionToGitlab("optional", versions.optional.version, optional.version, optional.url);
  versions.optional = optional;
  newVersion = true;
}
if (versions.latest.version != latest.version) {
  sendNewVersionToGitlab("latest", versions.latest.version, latest.version, latest.url);
  versions.latest = latest;
  newVersion = true;
}

if (newVersion) {
  fs.writeFileSync(versionsFilePath, JSON.stringify(versions));
} else {
  console.log('No new version detected...');
}
