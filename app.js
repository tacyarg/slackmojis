const request = require("request-promise");
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

    function downloadFile (url, filename) {
        return request(url).pipe(fs.createWriteStream(path.resolve('emojis/'+filename)))
    }

    var list = []
    $('li .emoji').each(function(index) {
        // console.log( index + ": " + $( this ).attr('title') );
        var name = $( this ).attr('title')
        var url = $( this ).find('a').attr('href')
        var filename = $( this ).find('a').attr('download')
        // console.log(url)
        list.push({ name, url, filename })
    })

    console.time('Downloads Complete.')
    return Promise.mapSeries(list, item => {
        console.log(JSON.stringify(item))
        return Promise.method(function(){
            return downloadFile(item.url, item.filename)
        })
    }).finally(function(){
        console.timeEnd('Downloads Complete.')
    })
    
})