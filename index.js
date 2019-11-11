const request = require("request-promise-native");
const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");

var dir = path.resolve("emojis");
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

function DownloadFile(name, url) {
  return new Promise(resolve => {
    let file = fs.createWriteStream(`${dir}/${name}`);
    file.on("finish", () => {
      console.log("Downloaded:", name);
      return resolve();
    });
    return request(url).pipe(file);
  });
}

let failures = 0;
let count = 0;
console.log("Requesting Emoji Listing...");
request({
  url: "https://slackmojis.com/emojis.json",
  json: true
})
  .then(list => {
    return Promise.map(
      list,
      ({ name, image_url }) => {
        console.log(`${list.length - ++count} / ${list.length} remaining...`);
        return DownloadFile(name, image_url).catch(e => {
          ++failures;
          console.log("failed to download:", name);
        });
      },
      { concurrency: process.env.CONCURRENCY || 5 }
    );
  })
  .then(() => {
    console.log("all done");
  });