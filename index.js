/**
 * Created by hugo on 16/12/6.
 */
"use strict";

const Crawler = require("crawler");
const desktop = require('./data/desktop.json');

let desktopData = [];

var c = new Crawler({
	maxConnections : 10,
	// This will be called for each crawled page
	callback : function (error, result, $) {
		// $ is Cheerio by default
		//a lean implementation of core jQuery designed specifically for the server
		if(error){
			console.log(error);
		}else{
			console.log($("h1").text());
		}
	}
});

c.queue(desktop.urls);
