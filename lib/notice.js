"use strict";


const Crawler = require('crawler');
const log = require('fie-log')('spider');
const fs = require('co-fs-extra');
const co = require('co');
const path = require('path');
const tidy = require('htmltidy').tidy;

const defaultForm = {
	//结果公告
	channelCode: '000809',
	sitewebId: '4028889705bebb510105bec068b00003',
	pageIndex: 1,
	pageSize: 1,
};

const HOST = 'http://www.gdgpo.gov.cn';

function unique(array){
	var n = [];//临时数组
	for(var i = 0;i < array.length; i++){
		if(n.indexOf(array[i]) == -1) n.push(array[i]);
	}
	return n;
}

/**
 * 获取总个数
 * @param form
 * @returns {Promise}
 */
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
			log.success(`[网上竞价][${ new Date().toLocaleTimeString() }] 获取竞价总条数 : ${total}`);
			resolve(total);
		});
	} )
}

/**
 * 获取网上竞价的所有数据
 */
function* getUrls(total) {

	let urls = [];

	const formData = Object.assign({},defaultForm,{
		pageSize : total
	});

	return new Promise( (resolve, reject) => {

		const c = new Crawler({
			retries : 10,
			timeout : 300000,
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
							log.success(`[网上竞价][${ new Date().toLocaleTimeString() }] 获取到新的竞价url -> ${HOST + href}`);
						}
					} );
					done();
				}
			}
		});
		c.queue(['http://www.gdgpo.gov.cn/queryMoreInfoList.do']);
		c.on('drain',function(){
			resolve(urls);
		});
	} )
}

/**
 * 组装table的数据
 * @param $table
 * @param $
 */
function getTableData($table,$) {
	let len;
	let txt;
	let cellIndex = 0;
	let tmpArray = [];

	$table.find('tr').slice(1).each( (rowIndex,tr) => {

		if (!tmpArray[rowIndex]) {
			tmpArray[rowIndex] = [];
		}
		cellIndex = 0;

		$(tr).find('td').each( (cidx, cell) => {
			const $cell = $(cell);

			// process rowspans
			if ($cell.filter('[rowspan]').length) {
				len = parseInt($cell.attr('rowspan'), 10) - 1;
				txt = $cell.text().trim();
				
				for (let i = 1; i <= len; i++) {
					if (!tmpArray[rowIndex + i]) {
						tmpArray[rowIndex + i] = [];
					}
					tmpArray[rowIndex + i][cellIndex] = txt;
				}
			}

			// skip column if already defined
			while (tmpArray[rowIndex][cellIndex]) {
				cellIndex++;
			}

			txt = tmpArray[rowIndex][cellIndex] || $cell.text().trim();
			tmpArray[rowIndex][cellIndex] = txt;
			cellIndex++;
		} )
	});
	return tmpArray;
}

/**
 * 获取
 */
function getCloseSuppliersData(tableArr) {
	let newData = [];
	const defaultData = {
		//供应商名称
		suppliersName : '',
		//商品名称
		goodsName : '',
		//品牌
		brand : '',
		//型号
		type : '',
		//数量
		number : '',
		//报价单价
		onePrice : '',
		//报价总价
		totalPrice : '',
		//报价时间
		priceTime : ''
	};
	//刚好8条数据
	if(tableArr.length && tableArr[0].length === 8){
		const suppliersName = tableArr[0][0];
		tableArr.forEach( item => {
			if(item[0] === suppliersName){
				newData.push({
					suppliersName : item[0],
					goodsName : item[1],
					brand: item[2],
					type:item[3],
					number:item[4],
					onePrice:item[5],
					totalPrice:item[6],
					priceTime:item[7]
				})
			}
		} )
	}else {
		newData.push(defaultData)
	}
	return newData;
}

/**
 * 获取详细的表格数据
 */
function getDetail(urls) {

	let data = [];

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
					const body = res.body;
					//标题
					const title = $('.zw_c_c_title').text();
					//采购类目
					let cate = '';
					//发布时间
					let publishTime = '';
					//竞价编号
					let priceNum = '';
					//采购单位
					let buyingUnit = '';
					//url
					const url = res.options.uri;
					$('.zw_c_c_qx span').each( (idx,item) => {
						const txt = $(item).text();
						
						if( txt.indexOf('采购品目') !== -1 ){
							cate = txt.replace('采购品目：','');
						}
						//TODO 这个数据暂时不需要
						if(txt.indexOf('发布日期') !== -1){
							publishTime = txt.replace('发布日期：','')
						}
					} );
					buyingUnit = title.split(cate)[0];

					//由于获取的html格式 不一定符合标准，如缺少标签闭合或漏标签，导致table解析出错
					tidy(body, function(err, html) {
						if(err){
							log.error(err);
							done()
						}else {
							log.success(`[${cate}][${ new Date().toLocaleTimeString() }] 采集竞价数据成功 : ${title} --> ${url}`);
							const $html = $(html);
							const $table = $html.find('.zw_c_c_cont table');
							$html.find('p').each( (idx,item) => {
								let txt = $(item).text();
								const match1 = txt.match(/（网上竞价编号：([A-Za-z0-9]+)）/);
								if(match1 && match1.length){
									priceNum = match1[1];
								}
							});
							if($table.length){
								const tableArr = getTableData($table.eq(0),$);
								const newData = getCloseSuppliersData(tableArr);
								newData.forEach( item => {
									const obj = Object.assign({},item,{
										title,
										cate,
										url,
										priceNum,
										buyingUnit
									});
									log.debug(`${title} 单条数据为 => %o`,obj);
									data.push(obj);
								})
							}
							done()
						}
					});



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
	getDetail,
	getTotal,
	getUrls
};




