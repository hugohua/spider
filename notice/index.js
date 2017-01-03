"use strict";


const Crawler = require('crawler');
const log = require('fie-log')('spider');
const fs = require('co-fs-extra');
const co = require('co');
const path = require('path');

const defaultForm = {
	//结果公告
	channelCode: '000809',
	sitewebId: '4028889705bebb510105bec068b00003',
	pageIndex: 1,
	pageSize: 1,
};

const HOST = 'http://www.gdgpo.gov.cn';

function* getTotal(form) {

	const formData = Object.assign({},defaultForm,form);

	let total;

	return new Promise( (resolve, reject) => {
		const c = new Crawler({
			retries : 10,
			timeout : 30000,
			rotateUA : true,
			method : 'POST',
			form : formData,
			userAgent : 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; SV1; Crazy Browser 9.0.04)',
			callback(error, res, done) {
				if (error) {
					log.error(error);
					done();
				} else {
					const $ = res.$;
					//获取总页数
					total = $('.m_m_c_page font').text();
					done();
				}
			}
		});
		// c.on('request',function(options){
		//
		// 	console.log(options,'--');
		//
		//
		// });
		c.queue([
			'http://www.gdgpo.gov.cn/queryMoreInfoList.do'
		]);

		c.on('drain',function(){
			resolve(total);
		});
	} )
}

/**
 * 获取网上竞价的所有数据
 */
function* getUrls(total) {

	let urls = [];
	let totalUrl;
	let noticeUrls;
	const noticePath = path.join(__dirname,'../data/noticeUrl.json');
	try{
		noticeUrls = yield fs.readJson( noticePath )
	}catch(e) {

	}

	if(noticeUrls){
		totalUrl = total - noticeUrls.length;
	}else {
		totalUrl = total
	}


	const formData = Object.assign({},defaultForm,{
		pageSize : totalUrl
	});

	return new Promise( (resolve, reject) => {

		if(totalUrl === 0){
			//TODO 数据没更新，无需采集,直接返回数据
			resolve(noticeUrls);
			return;
		}

		const c = new Crawler({
			retries : 10,
			timeout : 30000,
			rotateUA : true,
			method : 'POST',
			form : formData,
			userAgent : 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; SV1; Crazy Browser 9.0.04)',
			callback(error, res, done) {
				if (error) {
					log.error(error);
					done();
				} else {
					const $ = res.$;
					//获取总页数
					const $a = $('.m_m_c_list li a');
					$a.each( (idx, item) => {
						const href = $(item).attr('href');
						if(href.indexOf('/show/id') === 0){
							urls.push( HOST + href );
						}
					} );
					done();
				}
			}
		});
		// c.on('request',function(options){
		//
		// 	console.log(options,'--');
		//
		//
		// });
		c.queue(['http://www.gdgpo.gov.cn/queryMoreInfoList.do']);
		c.on('drain',function(){
			let array = Array.from(new Set(urls.concat(noticeUrls)));
			try{
				fs.outputJsonSync(noticePath, array );
			}catch (e){

			}
			resolve(urls);
		});
	} )
}

co(function* () {

	const total = yield getTotal();

	const urls = yield  getUrls(total);


}).catch((e) => {
	console.log('[Error]');
	console.log(e.stack || e);
	process.exit(1);
});
