require("dotenv").config();
// const request = require("request-promise-native");
const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");
const url = require("url");
const assert = require("assert");

function parseFilename(adr) {
  var q = url.parse(adr, true);
  const paths = q.pathname.split("/");
  return paths[paths.length - 1];
}

var dir = path.resolve("emojis");
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

const axios = require("axios");

function DownloadFile(name, url) {
  return new Promise((resolve, reject) => {
    const cancelTimer = setTimeout(() => {
      reject(new Error(`${name} failed to download TIMEOUT.`));
    }, 5000);

    let file = fs.createWriteStream(`${dir}/${name}`);
    file.on("finish", () => {
      clearTimeout(cancelTimer);
      console.log("Downloaded:", name);
      return resolve();
    });

    file.on("error", (e) => {
      clearTimeout(cancelTimer);
      reject(e);
    });

    // stream file to disk.
    // return request(url).catch(reject).pipe(file);
    return axios({ url, responseType: "stream" })
      .catch((e) => {
        clearTimeout(cancelTimer);
        reject(e);
      })
      .then((res) => {
        if(!res?.data) return reject()
        return res.data.pipe(file)
      });
  });
}

async function downloadFileRetry(filename, url, count = 0) {
  return DownloadFile(filename, url).catch((e) => {
    ++count;
    assert(count <= 5, "max retries.");
    console.error(e);
    console.log("failed to download:", filename, url);
    return downloadFileRetry(filename, url, count);
  });
}

const getPage = (index = 0) => {
  return axios({
    url: `https://slackmojis.com/emojis.json?page=${index}`,
    // json: true,
  }).then((response) => response.data);
};

function DownloadImages(list) {
  let count = 0;
  let failures = 0;

  return Promise.map(
    list,
    async ({ id, name, image_url, category }) => {
      const filename = `${id}_${parseFilename(image_url)}`

      await downloadFileRetry(filename, image_url);

      console.log(`${list.length - ++count} / ${list.length} ${filename}...`);

      const metadata = {
        id,
        filename,
        name,
        image_url,
        slug: `:${name}:`,
        category: category?.name || null,
      };

      // // write JSON string to a file
      // fs.appendFile(
      //   "metadata.json",
      //   JSON.stringify(metadata, null, 2),
      //   (err) => {
      //     if (err) {
      //       throw err;
      //     }
      //     console.log("JSON data is saved.");
      //   }
      // );

      return metadata;
    },
    { concurrency: Number(process.env.CONCURRENCY) || 25 }
  );
}

// recursively download each page until no more are found.
// could buffer results in memory, however this method is more efficient
function Run() {
  async function ProcessPage(index = 0) {
    console.log("> PROCESSING PAGE:", index);

    const list = await getPage(index);
    if (!list.length) return;

    const downloaded = await DownloadImages(list);

    var dir = path.resolve("metadata");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    // write JSON string to a file
    fs.writeFile(
      `${dir}/page_${index}.json`,
      JSON.stringify(downloaded, null, 2),
      (err) => {
        if (err) {
          throw err;
        }
        console.log("JSON data is saved.");
      }
    );

    return ProcessPage(++index);
  }

  return ProcessPage(process.env.PAGE_INDEX);
}

Run().then(() => {
  console.log("> DONE.");
});
