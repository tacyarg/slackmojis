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



const getPage = (index=0) => request({
  url: `https://slackmojis.com/emojis.json?page=${index}`,
  json: true
})


function DownloadImages (list) {
  let count = 0;
  let failures = 0;
    
  return Promise.map(
      list,
      async ({ name, image_url }) => {
        await DownloadFile(name, image_url).catch(e => {
          ++failures;
          console.log("failed to download:", name, image_url);
        });

        console.log(`${list.length - ++count} / ${list.length} remaining...`);
      },
      { concurrency: process.env.CONCURRENCY || 5 }
    );
}


// recursively download each page until no more are found.
// could buffer results in memory, however this method is more efficient
function Run() {

  async function ProcessPage(index = 0) {
    console.log("Requesting Page:", index);
    
    const list = await getPage(index)
    if(!list.length) return

    await DownloadImages(list)
    return ProcessPage(++index)
  }

  return ProcessPage(process.env.PAGE_INDEX)
}

Run().then(() => {
  console.log("all done");
});
