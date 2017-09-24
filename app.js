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

request({
    url: 'https://slackmojis.com/',
    json: false
}).then(body => {
    var $ = cheerio.load(body);

    $('li .emoji').each(function(index) {
        console.log( index + ": " + $( this ).attr('title') );
        var name = $( this ).attr('title')
        var url = $( this ).find('a').attr('href')
        var filename = $( this ).find('a').attr('download')
        console.log(url)
        request(url).pipe(fs.createWriteStream(path.resolve('emojis/'+filename)))
    })
    
})