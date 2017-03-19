"use strict";

const Crawler = require('crawler');
const log = require('fie-log')('spider');
const fs = require('co-fs-extra');
const co = require('co');
const path = require('path');
const request = require('request');
// const tidy = require('htmltidy').tidy;

const HOST = 'http://wj.gzggzy.cn/';
//缓存的url列表
const noticeListCacheFile = path.join(__dirname,'../data/noticeListCache.json');
const noticeDetailCacheFile =  path.join(__dirname,'../data/noticeDetailCache.json');


/**
 * 获取所有列表页
 * @returns {Promise}
 */
function* getPageSize() {
	const data = [];
	return new Promise((resolve, reject) => {
		const c = new Crawler({
			// 并发数
			maxConnections: 10,
			// 请求间隔
			rateLimit: 10,
			// This will be called for each crawled page
			callback(error, res, done) {
				// $ is Cheerio by default
				// a lean implementation of core jQuery designed specifically for the server
				if (error) {
					log.error(error);
					reject(error);
				} else {
					const $ = res.$;
					const url = res.options.uri;
					const pagePath = $('#Pager a').last().attr('href');
					const pageUrl = HOST + pagePath;

					if(pagePath){
						log.success(` --> 成功抓取列表页: ${pageUrl}`);
						const match = pageUrl.match(/page=(\d+)/);
						// 匹配到了,则继续提取
						if (match) {
							const times = match[1];
							for (let i = 1; i <= times; i++) {
								data.push(pageUrl.replace(/page=(\d+)/, `page=${i}`));
							}
						}
					}else {
						log.warn(` ${url} --> 列表页下没有数据`)
					}

				}
				done();
			}
		});
		c.queue([
			'http://wj.gzggzy.cn/NoticeList.aspx?type=5'
		]);
		c.on('drain',function(){
			resolve(data);
		});
	});
}


/**
 * 获取单个商品页面url
 * 由于数量较大，且这里的数据基本都是固定的，不会更新，所以使用缓存
 */
function* getDetailsUrl(list,focus) {
	//是否重复抓取
	let next = true;
	let num = 0;
	// 商品列表数据
	let cacheList = {};
	try{
		cacheList = yield fs.readJson( noticeListCacheFile )
	}catch(e) {
	}

	return new Promise((resolve, reject) => {
		const c = new Crawler({
			// 并发数
			maxConnections: 10,
			// 请求间隔
			rateLimit: 10,
			// This will be called for each crawled page
			callback(error, res, done) {
				// $ is Cheerio by default
				// a lean implementation of core jQuery designed specifically for the server
				if (error) {
					console.log(error);
					reject(error);
				} else {
					const $ = res.$;
					const $trs = $('.xzpp table#test tr');
					let projectNum;
					let projectUrl;
					if ($trs && $trs.length) {
						//去掉第一行
						$trs.slice(1).each((idx, item) => {
							const $td = $(item).find('td');
							projectUrl = HOST + $td.eq(1).find('a').attr('href');
							projectNum = $td.eq(0).text().trim();
							if(cacheList[projectUrl] && !focus){
								next = false;
								log.warn(` --> ${projectNum} 在缓存中，无需继续抓取`)
							}else {
								cacheList[projectUrl] = projectNum;
								log.success(` --> 成功抓取 ${projectNum} 的竞价url: ${projectUrl}`);
							}
						});
					}
					//
				}
				done();
			}
		});

		log.info(` --> 开始抓取: ${list[num]}`);
		c.queue(list[num]);

		c.on('drain',function(){
			num += 1;
			if(next && list[num]){
				log.info(` --> 开始抓取: ${list[num]}`);
				c.queue(list[num]);
			}else {
				log.info('============done==========');
				fs.outputJsonSync(noticeListCacheFile, cacheList );
				resolve(cacheList);
			}

		});

	});
}


/**
 * 获取商品详细信息
 */
function* getDetail(urlObj) {

	const urls = Object.keys(urlObj);

	// let num = 0;
	const data = [];
	let newUrls = [];
	let num = 0;
	let total = urls.length;

	let noticeDetailCache = {};
	try{
		noticeDetailCache = yield fs.readJson( noticeDetailCacheFile )
	}catch(e) {
		log.error(e);
	}


	//过滤一遍urls
	newUrls = urls.map(item => {
		if(noticeDetailCache[item]){
			return noticeDetailCache[item]
		}
		return item;
	});

	function handleDone(res,relativeContent) {
		const $ = res.$;
		const url = res.options.uri;
		const body = res.body;

		
		//要缓存的数据
		let $relativeContent = $(relativeContent);
		//标题
		let title = $('.note_container .title').text().trim();
		//采购单位
		let buyingUnit = '';
		//项目编号
		let projectNum = '';
		//采购内容
		let buyingContent = '';
		//成交供应商确定日期
		let doneTime = '';
		//本项目采购文件发出日期
		let sendTime = '';
		//成交供应商名称
		let suppliersName = '';
		//地址
		let suppliersAddress = '';
		//成交金额
		let donePrice = '';
		//成交服务费
		let servicesPrice = '';
		//采购预算（最高限价）
		let prePrice = '';
		//联系人
		let contact = '';
		//单位地址
		let buyingAddress = '';
		//联系电话
		let buyingPhone = '';
		//传真
		let buyingFax = '';
		//缓存一下
		noticeDetailCache[url] = {
			uri : url,
			cache : true,
			html : body,
			relativeContent
		};


		$('.note_content li,.note_content p').each( (idx,item) => {
			let txt = $(item).text().replace(' ','===');
			//获取项目编号
			let match = txt.match(/竞价文件编号：(.*)；/);
			if(match && match.length){
				projectNum = match[1];
			}
			//获取采购单位
			match = txt.match(/本项目采购人：(.*)；地址/);
			if(match && match.length){
				buyingUnit = match[1]
			}

			//获取采购内容
			match = txt.match(/采购内容：(.*)；/);
			if(match && match.length){
				buyingContent = match[1];
			}

			//获取确定时间
			match = txt.match(/成交供应商确定日期：(.*)；/);
			if(match && match.length){
				doneTime = match[1];
			}

			//发出时间
			match = txt.match(/本项目采购文件发出日期：(.*)；/);
			if(match && match.length){
				sendTime = match[1];
			}

			//供应商名称
			match = txt.match(/成交供应商名称：(.*)；地址/);
			if(match && match.length){
				suppliersName = match[1];
			}

			//地址
			match = txt.match(/地址：(.*)；/);
			if(match && match.length){
				suppliersAddress = match[1];
			}

			match = txt.match(/成交金额：(.*)；成交服务费/);
			if(match && match.length){
				donePrice = match[1];
			}

			match = txt.match(/成交服务费：(.*)；/);
			if(match && match.length){
				servicesPrice = match[1];
			}


		});

		
		if($relativeContent) {
			$relativeContent.find('.note_content li').each((idx, item) => {
				
				let txt = $(item).text().replace(' ', '===');

				let match = txt.match(/购预算（最高限价）：(.*)/);

				if (match && match.length) {
					prePrice = match[1];
				}

				match = txt.match(/联系人：(.*)/);
				if (match && match.length) {
					contact = match[1];
				}

				match = txt.match(/名称：(.*)/);
				//页面上有一个项目名称，先排除
				if (!buyingUnit && match && match.length && txt.indexOf('项目名称') !== -1) {
					buyingUnit = match[1];
				}

				match = txt.match(/地址：(.*)/);
				if (!buyingAddress && match && match.length) {
					buyingAddress = match[1];
				}

				match = txt.match(/联系电话：(.*)/);
				if (!buyingPhone && match && match.length) {
					buyingPhone = match[1];
				}

				match = txt.match(/传真：(.*)/);
				if (!buyingFax && match && match.length) {
					buyingFax = match[1];
				}
			})
		}

		const obj = {
			buyingUnit,
			projectNum,
			buyingContent,
			doneTime,
			sendTime,
			suppliersName,
			suppliersAddress,
			donePrice,
			servicesPrice,
			prePrice,
			contact,
			buyingAddress,
			buyingPhone,
			buyingFax,
			title,
			url
		};

		data.push(obj);

		log.debug('%s 采集的数据为 = %o',url,obj);
		const msg = `[${num}/${total}] [${ new Date().toLocaleTimeString() }] 采集竞价数据成功 : ${title} --> ${url}`;
		if(res.options.cache){
			log.warn(msg)
		}else {
			log.success(msg);
		}

	}

	return new Promise((resolve, reject) => {
		const c = new Crawler({
			//失败次数
			retries : 10,
			//超时时间
			timeout : 30000,
			//
			rotateUA : true,
			//设置ua
			userAgent : 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; SV1; Crazy Browser 9.0.04)',
			// This will be called for each crawled page
			callback(error, res, done) {

				// $ is Cheerio by default
				// a lean implementation of core jQuery designed specifically for the server
				if (error) {
					log.error(error);
					done();
					reject(error);
				} else {

					const $ = res.$;
					const url = res.options.uri;
					const relativeUrl = HOST + '/AjaxPage/Project/getNoticyLog.ashx';
					console.log('1');
					
					const urlArr = url.split('/');
					const name = urlArr[ urlArr.length - 1 ];
					const projectnumber = urlObj[url];

					log.debug('拉取相关页面 %s , %s',name,projectnumber)
					//拉取另外一个相关页面
					request.get({
						url : relativeUrl,
						qs : {
							type: '5',
							name,
							projectnumber
						}
					},(e, h, b) => {
						console.log(e,b);
						if(e){
							done();
							return;
						}
						const $links = $('<div>'+ b +'</div>');
						let relativeLink = $links.find('a').attr('href');

						if (noticeDetailCache[url] && noticeDetailCache[url].relativeContent) {
							// $relativeContent = $(relativeContent);
							handleDone(res,noticeDetailCache[url].relativeContent);
							done();
						} else if(relativeLink){
							relativeLink = HOST + relativeLink;

							request(relativeLink, (err, httpResponse, body) => {

								if(err){
									done();
									return;
								}

								handleDone(res,body);
								done();
							} );
						}else {
							done();
						}


					});


				}// else
			}
		});

		c.queue(newUrls);

		c.on('drain',function(){
			log.info('============done==========');
			//保存到cache文件中
			try{
				fs.outputJsonSync(noticeDetailCacheFile, noticeDetailCache );
			}catch (e){
			}
			resolve(data);
		});

	});
}

module.exports = {
	getDetail,
	getPageSize,
	getDetailsUrl
};




