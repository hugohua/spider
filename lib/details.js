/**
 * Created by hugo on 16/12/18.
 * 获取商品详情内容
 */

'use strict';


const Crawler = require('crawler');
const log = require('fie-log')('spider');
const request = require('request');
const config = require('./config');


/**
 * 获取单条交易记录
 */
function getTradingRecord($tr) {
  const $td = $tr.find('td');
	// 序号
  let buyingNum = '';
	// 采购单位
  let	buyingUnit = '';
	// 数量
  let	buyQuantity = '';
	// 单价
  let	buyingPrice = '';
	// 电商
  let	buyingUser = '';
	// 下单日期
  let	buyingDate = '';

	// 6行的话,才是正确的
  if ($td.length === 6) {
    buyingNum = $td.eq(0).text();
    buyingUnit = $td.eq(1).text();
    buyQuantity = $td.eq(2).text();
    buyingPrice = $td.eq(3).text();
    buyingUser = $td.eq(5).text();
    buyingDate = $td.eq(5).text();
  }

  const obj = {
    buyingNum,
    buyingUnit,
    buyQuantity,
    buyingPrice,
    buyingUser,
    buyingDate
  };

  return obj;
}

/**
 * 采集类目下所有商品数据
 * @param urls
 * @returns {Promise}
 */
function* getDetail(urls) {
  const total = urls.length;
  let num = 0;
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
          done();
          reject(error);
        } else {
          const $ = res.$;
          const url = res.options.uri;
					// 商品名称
          const title = $('h1').text();
          const platform = $('.good_if .gs input').attr('value');
					//单条完整数据
					let obj = {
            title,
            platform,
            url
          };
          log.info(`开始采集商品 : ${title} --> ${url}`);
					// 处理成交记录
          const $tr = $('#tagContent3 table tr');
					// 如果没有成交记录的话,则只有一行
          if ($tr.length < 2) {
						// 没有成交记录
            log.warn(`${title} -> 没有成交记录,开始单独抓取价格.`);

            const match = url.match(/p_id=(\d+)/);
            if(match && match.length){
              const id = match[1];
              request.post({url:`http://112.74.98.194/products/${id}/get_commodity_prices`}, function(err,httpResponse,body){
                if(typeof body !== 'object'){
                  body = JSON.parse(body)
                }
                log.debug('抓取价格返回数据为: %o',body);
                if(body && body.success && body.products){
                  obj.buyingPrice = body.products[id].price_html;
                  log.success(`${title} -> 价格为 ${obj.buyingPrice}.`);
                  //TODO 优化
                  $tr.each((idx, tr) => {
                    if (idx === 0) return;
                    Object.assign(obj,
                      getTradingRecord($(tr)))
                  });
                  log.debug('单条数据为: %o',obj);
                  data.push(obj);
                  done();

                  num += 1;
                  if (num === total) {
                    resolve(data);
                  }
                }
                done();
              })
            }else {
              done()
            }


          } else {
            $tr.each((idx, tr) => {
              if (idx === 0) return;
              Object.assign(obj,
                getTradingRecord($(tr)))
            });
            log.debug('单条数据为: %o',obj);
            data.push(obj);
            done();

            num += 1;
            if (num === total) {
              resolve(data);
            }
          }
        }//else
      }
    });

    c.queue(urls);
  });
}


module.exports = {
  get : getDetail,
  getTradingRecord
};
