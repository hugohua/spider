
/**
 * Created by hugo on 16/12/18.
 * 获取商品详情内容
 * http://enclose.alipay.net/packages/hugo-spider-zf
 */

'use strict';


const co = require('co');
const path = require('path');
const log = require('fie-log')('spider');
const fs = require('co-fs-extra');
const inquirer = require('inquirer');
const Excel = require('./lib/excel');
const details = require('./lib/details');
const Desktop = require('./lib/desktop');
const config = require('./lib/config');
const urls = require('./data/urls.json');
/**
 * 导出通用类目
 */
function* exportOther() {
	const excel = new Excel();

	const tableHeader = [
		{ header: '商品', key: 'title', width: 100 },
		{ header: '电商平台', key: 'platform', width: 20 },
		{ header: '序号', key: 'buyingNum', width: 15 },
		{ header: '采购单位', key: 'buyingUnit', width: 20 },
		{ header: '数量', key: 'buyQuantity', width: 15 },
		{ header: '单价', key: 'buyingPrice', width: 15 },
		{ header: '累计采购金额', key: 'totalPrice', width: 15 },
		{ header: '电商', key: 'buyingUser', width: 20 },
		{ header: '采购时间', key: 'buyingDate', width: 15 },
		{ header: 'URL', key: 'url', width: 60 }

	];

	for(let i in urls){
	 let cate = config.cate[i];
	 log.info(`--> 开始抓取 ${cate} 类目....`);
	 const data = yield details.get(urls[i]);
	 excel.addWorksheet(cate, tableHeader, data);
	 log.success(`--> 成功抓取 ${cate} 类目下的${data.length}条数据....`)
	}

  return new Promise((resolve, reject) => {
    excel.save('data/file2.xlsx', () => {
      resolve();
    });
  });
}

/**
 * 导出台式机和笔记本
 */
function* exportComputer() {

	const excel = new Excel();

	const tableHeader = [
		{ header: '商品', key: 'title', width: 100 },
		{ header: '品牌', key: 'brand', width: 15 },
		{ header: '型号', key: 'type', width: 15 },
		{ header: '处理器', key: 'cpu', width: 15 },
		{ header: '显卡', key: 'gpu', width: 15 },
		{ header: '内存', key: 'memory', width: 15 },
		{ header: '硬盘大小', key: 'disk', width: 15 },
		{ header: '操作系统', key: 'system', width: 15 },
		{ header: '显示器', key: 'display', width: 15 },
		{ header: '电商平台', key: 'platform', width: 20 },
		{ header: '序号', key: 'buyingNum', width: 15 },
		{ header: '采购单位', key: 'buyingUnit', width: 20 },
		{ header: '数量', key: 'buyQuantity', width: 15 },
		{ header: '单价', key: 'buyingPrice', width: 15 },
		{ header: '累计采购金额', key: 'totalPrice', width: 15 },
		{ header: '电商', key: 'buyingUser', width: 20 },
		{ header: '采购时间', key: 'buyingDate', width: 15 },
		{ header: 'URL', key: 'url', width: 60 }

	];

	const urlComputer = ['177','178'];


	//debug
	// let data = yield details.get([
	// 	'http://112.74.98.194/commodities/24141?p_id=25473'
	// ]);
	// data = data.map( item => {
	// 	const d = new Desktop(item.title);
	// 	return Object.assign({},item,d);
	// } );
	// excel.addWorksheet('台式机', tableHeader, data);
	// log.success(`--> 成功抓取 台式机 类目下的${data.length}条数据....`)

	for(let i in urlComputer){
	  const url = urlComputer[i];
	  let cate = config.cate[url];
		log.info(`--> 开始抓取 ${cate} 类目....`);
		let data = yield details.get(urls[url]);
		data = data.map( item => {
			const d = new Desktop(item.title);
			return Object.assign({},item,d);
    } );

		excel.addWorksheet(cate, tableHeader, data);
		log.success(`--> 成功抓取 ${cate} 类目下的${data.length}条数据....`)
	}

	return new Promise((resolve, reject) => {
		excel.save('data/file2.xlsx', () => {
			resolve();
		});
	});

}


co(function* () {

	const choices = [
		'台式机/笔记本类目',
		'除了台式机/笔记本之外的所有类目'
	];

	const answers = yield inquirer.prompt([
		{
			type: 'list',
			name: 'use',
			message: '请选择你要采集的数据。',
			choices: choices
		}
	]);

	if(answers.use === choices[0]){
		yield exportComputer();
	}else if(answers.use === choices[1]){
		yield exportOther();
	}




}).catch((e) => {
	console.log('[Error]');
	console.log(e.stack || e);
	process.exit(1);
});
