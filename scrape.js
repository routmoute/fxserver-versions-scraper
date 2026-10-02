import fs from 'node:fs';

const linuxVersionsFilePath = process.env.LINUX_VERSIONS_FILE_PATH;
const windowsVersionsFilePath = process.env.WINDOWS_VERSIONS_FILE_PATH;
if (!linuxVersionsFilePath) {
  throw new Error("VERSIONS_FILE_PATH env var not set !");
}
if (!windowsVersionsFilePath) {
  throw new Error("WINDOWS_VERSIONS_FILE_PATH env var not set !");
}

let linuxVersions = JSON.parse(fs.readFileSync(linuxVersionsFilePath));
let windowsVersions = JSON.parse(fs.readFileSync(windowsVersionsFilePath));

const apiUrls = {
  linux: "https://changelogs-live.fivem.net/api/changelog/versions/linux/server",
  windows: "https://changelogs-live.fivem.net/api/changelog/versions/win32/server"
};

let newLinuxVersion = false;
let newWindowsVersion = false;

const entries = [];
for (const [os, apiUrl] of Object.entries(apiUrls)) {
  console.log(`Fetching versions for ${os} from ${apiUrl}`);
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${apiUrl}: ${response.status}`);
  }
  const data = await response.json();
  for (const versionType of ["recommended", "latest"]) {
    const version = String(data[versionType]);
    const url = data[`${versionType}_download`];
    if (!/^[0-9]+$/.test(version) || !url) {
      throw new Error(`Invalid data for ${os}-${versionType}: ${version} / ${url}`);
    }
    entries.push([`${os}-${versionType}`, versionType, version, url]);
  }
}

for (const [key, versionType, newVersion, buttonLink] of entries) {
  let lastVersion = null;
  if (key.includes("linux")) {
    lastVersion = linuxVersions[versionType].version;
  } else if (key.includes("windows")) {
    lastVersion = windowsVersions[versionType].version;
  }
  console.log(`Checking ${key}: last version = ${lastVersion}, new version = ${newVersion}`);
  if (newVersion !== lastVersion) {
    console.log(`New version detected for ${key}: ${lastVersion} => ${newVersion}`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, versionType + '=' + newVersion + '\r\n');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, versionType + '_url=' + buttonLink + '\r\n');
    if (key.includes("linux")) {
      newLinuxVersion = true;
      linuxVersions[versionType].version = newVersion;
      linuxVersions[versionType].url = buttonLink;
    } else if (key.includes("windows")) {
      newWindowsVersion = true;
      windowsVersions[versionType].version = newVersion;
      windowsVersions[versionType].url = buttonLink;
    }
  }
}

if (newLinuxVersion || newWindowsVersion) {
  if (newLinuxVersion) {
    fs.writeFileSync(linuxVersionsFilePath, JSON.stringify(linuxVersions));
  }
  if (newWindowsVersion) {
    fs.writeFileSync(windowsVersionsFilePath, JSON.stringify(windowsVersions));
  }
} else {
  console.log('No new version detected...');
}
