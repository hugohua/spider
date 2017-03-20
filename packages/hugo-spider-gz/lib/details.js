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
  // 总价
	let buyingTotalPrice = '';
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
			buyingTotalPrice = $td.eq(3).text();
			buyingUser = $td.eq(4).text();
			buyingDate = $td.eq(5).text();
			//单价为总价除以数量
			buyingPrice = parseFloat(buyingTotalPrice.replace(/¥|,/g,'')) / parseInt(buyQuantity,10);

		}
	}


  const obj = {
    buyingNum,
    buyingUnit,
    buyQuantity,
    buyingPrice,
		buyingTotalPrice,
    buyingUser,
    buyingDate
  };

  return obj;
}

/**
 * 采集商品详细信息
 * @param urls
 * @returns {Promise}
 */
function* getDetail(urls) {
  // let num = 0;
  const data = [];
	let num = 0;
	let total = urls.length;

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
						const title = $('.goodsdetail_left h1 #product_name').text().trim();
						// 电商平台，如果是一个选择框，则用右边的数据
						// 不能直接使用右边数据是因为右边有截断的可能
						let platform;
						const $gs = $('.good_if .attribute').eq(3);

						if( $gs.find('input.territory').length ){
							platform = $('.othermerchants .othor_prices .tl a font').text()
						}else {
							platform = $gs.find('.gs').text().trim();
						}
						// 累计采购金额
						const totalPrice = $('.cumulativeamount').text().trim();
						//类目
						const cate = $('.crumbs a').eq(1).text();
						// 单条完整数据
						const obj = {
							title,
							platform,
							totalPrice,
							url
						};
						log.success(`[${num}/${total}] [${cate}][${ new Date().toLocaleTimeString() }] 采集商品成功 : ${title} --> ${url}`);
						// 处理成交记录
						const $tr = $('#con_three_3 table tr');
						// 如果没有成交记录的话,则只有一行
						if($tr.length < 2){
							//无成交记录的情况
							//单独抓取一下价格
							const buyingPrice = $('.othermerchants .othor_prices .tc span').text();

							const newObj = Object.assign({},
								obj,
								getTradingRecord(),
								{
									buyingPrice
								});
							data.push(newObj);
							log.debug('无成交记录单条数据为: %o', newObj);
						}else {
							$tr.each((idx, tr) => {
								if (idx === 0) return;

								const newObj = Object.assign({},obj,
									getTradingRecord($(tr)));
								data.push(newObj);
								log.debug('有成交记录单条数据为: %o', newObj);
							});
						}
						num+=1;
						done();
          }catch (e){
						log.error('[Error] 报错啦~~~~~~~');
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
