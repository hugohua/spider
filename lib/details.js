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

	if(typeof $tr !== 'undefined'){
		const $td = $tr.find('td');
		// 6行的话,才是正确的
		if ($td.length === 6) {
			buyingNum = $td.eq(0).text();
			buyingUnit = $td.eq(1).text();
			buyQuantity = $td.eq(2).text();
			buyingPrice = $td.eq(3).text();
			buyingUser = $td.eq(4).text();
			buyingDate = $td.eq(5).text();
		}
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
  // const total = urls.length;
  // let num = 0;
  const data = [];


  function handleDone($tr,obj,$,done){

  	if($tr.length < 2){
  		//无成交记录的情况
			const newObj = Object.assign({},obj,
				getTradingRecord());
			data.push(newObj);
			log.debug('单条数据为: %o', newObj);
		}else {
			$tr.each((idx, tr) => {
				if (idx === 0) return;

				const newObj = Object.assign({},obj,
					getTradingRecord($(tr)));
				data.push(newObj);
				log.debug('单条数据为: %o', newObj);
			});
		}

		done();
  }

  return new Promise((resolve, reject) => {
    const c = new Crawler({
			// 并发数
			// maxConnections: 10,
			// 请求间隔
			// rateLimit: 50,
      //请求超时
			// retryTimeout : 20000,
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

          try{
						const $ = res.$;
						const url = res.options.uri;
						// 商品名称
						const title = $('.goods_particulars h1').text();
						// 电商平台
						const platform = $('.good_if .gs input').attr('value');
						// 累计采购金额
						const totalPrice = $('.cumulativeamount').text();
						//类目
						const cate = $('.breadmain a').eq(1).text();
						// 单条完整数据
						const obj = {
							title,
							platform,
							totalPrice,
							url
						};
						log.success(`[${cate}][${ new Date().toLocaleTimeString() }] 采集商品成功 : ${title} --> ${url}`);
						// 处理成交记录
						const $tr = $('#tagContent3 table tr');
						// 如果没有成交记录的话,则只有一行
						if ($tr.length < 2) {
							// 没有成交记录
							log.warn(`${title} -> 没有成交记录,开始单独抓取价格.`);

							const match = url.match(/p_id=(\d+)/);
							if (match && match.length) {
							// if(false){
								const id = match[1];
								const priceUrl = `http://112.74.98.194/products/${id}/get_commodity_prices`;
								request.post({ url: priceUrl,timeout: 9000 }, (err, httpResponse, body) => {
									try{
										if (typeof body !== 'object') {
											body = JSON.parse(body);
										}
										log.debug('抓取价格返回数据为: %o', body);
										if (body && body.success && body.products) {
											obj.buyingPrice = body.products[id].price_html;
											log.info(`${title} -> 价格为 ${obj.buyingPrice}. --> ${priceUrl}`);
											handleDone($tr,obj,$,done);
										}else {
											handleDone($tr,obj,$,done);
										}
									}catch (e){
										log.error(`${title} 价格采集出错啦：--> ${priceUrl}`);
										log.error(body);
										log.error(e);
										handleDone($tr,obj,$,done);
									}

								});
							} else {
								done();
							}
						} else {
							// TODO 优化
							handleDone($tr,obj,$,done);
						}
          }catch (e){
						console.log('[Error] 报错啦~~~~~~~');
						console.log(e.stack || e);
            done();
          }


        }// else
      }
    });

    c.queue(urls);

		c.on('drain',function(){
			log.info('============done==========');
			resolve(data);
		});

  });
}


module.exports = {
  get: getDetail,
  getTradingRecord
};
