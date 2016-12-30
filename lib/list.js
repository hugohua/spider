/**
 * Created by hugo on 16/12/17.
 * 获取所有类目的商品列表,保存到json文件中
 */

'use strict';

const Crawler = require('crawler');
const co = require('co');
const fs = require('co-fs-extra');
const path = require('path');
const config = require('./config');
const log = require('fie-log')('spider');

const HOST = 'http://112.74.98.194';
const urls = [];


/**
 * 获取所有列表页
 * @param cate 需要抓取的分页
 * @returns {Promise}
 */
function* getPageSize(cate) {
	// 总数量
  let total = 0;
	// 已执行的次数
  let num = 0;
	// 页面列表
	// {
	//	"117" : [ urls]
	// }
  const data = {};

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
          const pageUrl = HOST + $('.pagination .last a').attr('href');
          log.success(` --> 成功抓取列表页: ${pageUrl}`);
          const match = pageUrl.match(/page=(\d+).+catalog_id_eq%5D=(\d+)/);
					// 匹配到了,则继续提取
          if (match) {
            const cate = match[2];
            const times = match[1];
            data[cate] = [];
            for (let i = 1; i <= times; i++) {
              data[cate].push(pageUrl.replace(/page=(\d+)/, `page=${i}`));
            }
          }
        }
        done();
        num += 1;
        if (num === total) {
          resolve(data);
        }
      }
    });


    cate.forEach( item => {
			urls.push(`${HOST}/channel/${item}`);
    });

    total = urls.length;
    log.info(`抓取列表页url => ${urls}` );

    c.queue(urls);
  });
}

/**
 * 获取单个商品页面url
 */
function* getDetailsUrl(list) {
	// 总数量
  const total = list.length;
	// 已执行的次数
  let num = 0;
	// 商品列表数据
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
          console.log(error);
          reject(error);
        } else {
          const $ = res.$;
          const $urls = $('.gp-list-view li .title a');
          const title = $('.filtrate h1').text().replace(' - 产品筛选', '').trim();
          if ($urls && $urls.length) {
            $urls.each((idx, item) => {
              const pageUrl = HOST + $(item).attr('href');
              data.push(pageUrl);
              log.success(` --> 成功抓取${title}分类下的商品url: ${pageUrl}`);
            });
          }
        }
        done();
        num += 1;
        if (num === total) {
          resolve(data);
        }
      }
    });

    c.queue(list);
  });
}

/**
 * 将数据写入文件
 */
function* saveDetailUrl(data) {
  const file = path.join(__dirname, '../data/urls.json');
	// 写入project文件
  yield fs.outputJson(file, data);

  log.success(`成功将数据写入: ${file}`);
}

function* get(cate) {
	const urls = {};
	const pageList = yield getPageSize(cate);

	for (const p in pageList) {
		log.info(`开始抓取分类ID : ${p}`);
		urls[p] = yield getDetailsUrl(pageList[p]);

	}
	return urls;
}


module.exports = {
	get: get
};

