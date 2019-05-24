const request = require("request-promise-native");
const cheerio = require('cheerio');
const cloudscraper = require('cloudscraper');
const fs = require('fs');
const Promise = require('bluebird')
const lodash = require('lodash')
const assert = require('assert')
const highland = require('highland')
const url = require('url');
const path = require('path')

var dir = path.resolve('emojis')
if (!fs.existsSync(dir)) fs.mkdirSync(dir)

request({
    url: 'https://slackmojis.com/',
    json: false
}).then(body => {
    var $ = cheerio.load(body);
    var list = []
    $('li .emoji').each(function(index) {
        var name = $( this ).attr('title')
        var url = $( this ).find('a').attr('href')
        var filename = $( this ).find('a').attr('download')
        list.push({ name, url, filename })
    })
    return list;
}).then(list => {
    console.log("got the list, starting to download")
    return list.reduce((p, item) => {
        return p.then(() => {
            console.log("downloading", item.filename)
            return new Promise((resolve) => {
                let file = fs.createWriteStream(`${dir}/${item.filename}`);
                file.on('finish', () => resolve());
                return request(item.url).pipe(file)
            })
        });
    }, Promise.resolve());
}).then(() => {
    console.log("all done")
})