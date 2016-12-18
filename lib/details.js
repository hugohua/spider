/**
 * Created by hugo on 16/12/18.
 * 获取商品详情内容
 */
"use strict";


const Crawler = require("crawler");
const co = require('co');
const fs = require('co-fs-extra');
const path = require('path');
const config = require('./config');
const log = require('fie-log')('spider');


/**
 * 获取单条交易记录
 */
function getTradingRecord($tr){

	const $td = $tr.find('td');
	let buyingNum = '',
			buyingUnit = '',
			buyingPrice = '',
			buyingUser = '',
			buyingDate = '',
			buyQuantity = '';
	//6行的话,才是正确的

	if($td.length === 6) {
		buyingNum = $td.eq(0).text();
		buyingUnit = $td.eq(1).text();
		buyQuantity = $td.eq(2).text();
		buyingPrice = $td.eq(2).text();
		buyingUser = $td.eq(3).text();
		buyingDate = $td.eq(4).text();
	}

	const obj = {
		buyingNum,
		buyingUnit,
		buyQuantity,
		buyingPrice,
		buyingUser,
		buyingDate
	};

	log.debug(`单条交易 = %o`,obj);

	return obj;
}

function* getDetail(urls){

	const total = urls.length;
	let num = 0;
	let data = [];

	return new Promise( (resolve, reject) => {
		const c = new Crawler({
			//并发数
			maxConnections : 10,
			//请求间隔
			rateLimit : 10,
			// This will be called for each crawled page
			callback : function (error, res, done) {
				// $ is Cheerio by default
				//a lean implementation of core jQuery designed specifically for the server
				if(error){
					log.error(error);
					done();
					reject(error);
				}else{

					const $ = res.$;
					//商品名称
					const title = $('h1').text();

					log.info(`开始采集商品 -> ${title}`);
					//电商平台
					const platform = $('.good_if .gs input').attr('value');

					//处理成交记录
					const $tr = $('#tagContent3 table tr');
					//如果没有成交记录的话,则只有一行
					if($tr.length < 2){
						//没有成交记录
						log.warn('该商品没有成交记录.')
					}else {
						$tr.each( (idx,tr) => {
							if(idx === 0) return;
							let obj = getTradingRecord($(tr));
							obj.title = title;
							obj.platform = platform;
							data.push(obj);
						} );
					}

					done();

					num+=1;
					if(num === total){
						resolve(data);
					}
				}
			}
		});

		c.queue(urls);
	} );

}



co(function*(){


	yield getDetail([
		'http://112.74.98.194/commodities/15367?p_id=16150',
		'http://112.74.98.194/commodities/24285?p_id=25617'
	]);

}).catch( (e) => {
	console.log(e);
} );