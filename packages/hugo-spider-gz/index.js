
/**
 * Created by hugo on 16/12/18.
 * 获取商品详情内容
 */

'use strict';


const co = require('co');
const path = require('path');
const log = require('fie-log')('spider');
const fs = require('co-fs-extra');
const semver = require('semver');
const spawn = require('cross-spawn');
let request = require("co-request");
const home = require('os-homedir')();
const inquirer = require('inquirer');
const Excel = require('./lib/excel');
const details = require('./lib/details');
const Desktop = require('./lib/desktop');
const config = require('./lib/config');
const list = require('./lib/list');
const notice = require('./lib/notice');
const pkg = require('./package.json');


let urls = [];
const filePath = path.join(home,'spider');


/**
 * 导出通用类目
 */
function* exportOther(cate) {

	yield urls = yield list.get(cate);

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
		const file = path.join(filePath, Date.now() + '.xlsx' );
		excel.save( file , () => {
			log.success(`已成功保存至 -> ${file}` );
			resolve();
		});
  });
}

/**
 * 导出台式机和笔记本
 */
function* exportComputer(cate) {

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
		{ header: '售后服务', key: 'services', width: 15 },
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

	yield urls = yield list.get(cate);



	for(let i in urls){
	  let cate = config.cate[i];
		log.info(`--> 开始抓取 ${cate} 类目....`);
		let data = yield details.get(urls[i]);
		data = data.map( item => {
			const d = new Desktop(item.title);
			return Object.assign({},item,d);
    } );

		excel.addWorksheet(cate, tableHeader, data);
		log.success(`--> 成功抓取 ${cate} 类目下的${data.length}条数据....`)
	}

	//debug
	// let data = yield details.get([
	// 	'http://mall.gzggzy.cn/commodities/96260?p_id=154997',
	// 	'http://mall.gzggzy.cn/commodities/94436?p_id=151972'
	// ]);
	// data = data.map( item => {
	// 	const d = new Desktop(item.title);
	// 	return Object.assign({},item,d);
	// } );
	// excel.addWorksheet('台式机', tableHeader, data);
	// log.success(`--> 成功抓取 台式机 类目下的${data.length}条数据....`)

	return new Promise((resolve, reject) => {
		const file = path.join(filePath, Date.now() + '.xlsx' );
		excel.save( file , () => {
			log.success(`已成功保存至 -> ${file}` )
			resolve();
		});
	});

}

/**
 * 导出网上竞价数据
 */
function* exportNotice() {

	log.info(`--> 开始抓取网上竞价的数据,请稍后....`);
	//先获取总条数
	const total = yield notice.getTotal();
	//再获取需要采集的url
	const urls = yield  notice.getUrls(total);
	//最后再获取采集的数据
	const data = yield notice.getDetail(urls);
	// const data = yield notice.getDetail([
	// 	'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015948c82cae4808.html',
	// 	'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015925870dc12201.html'
	// ]);
	log.success(`--> 成功抓取网上竞价类目下${data.length}条可用数据....`);
	const excel = new Excel();
	const tableHeader = [
		{ header: '标题', key: 'title', width: 70 },
		{ header: '采购类目', key: 'cate', width: 20 },
		{ header: '竞价编号', key: 'priceNum', width: 20 },
		{ header: '采购单位', key: 'buyingUnit', width: 30 },
		{ header: '供应商名称', key: 'suppliersName', width: 30 },
		{ header: '商品名称', key: 'goodsName', width: 30 },
		{ header: '品牌', key: 'brand', width: 15 },
		{ header: '型号', key: 'type', width: 30 },
		{ header: '数量', key: 'number', width: 15 },
		{ header: '报价单价', key: 'onePrice', width: 15 },
		{ header: '报价总价', key: 'totalPrice', width: 15 },
		{ header: '报价时间', key: 'priceTime', width: 20 },
		{header: '报价截止时间', key: 'closeTime', width: 20},
		{ header: 'URL', key: 'url', width: 80 }
	];
	excel.addWorksheet('网上竞价', tableHeader, data);
	return new Promise((resolve, reject) => {
		const file = path.join(filePath, Date.now() + '.xlsx' );
		excel.save( file , () => {
			log.success(`已成功保存至 -> ${file}` );
			resolve();
		});
	});
}




co(function* () {

	log.info('欢迎使用 广州公共资源电子商城 爬虫系统，当前版本是: v' + pkg.version);

	let result = yield request('http://www.ghugo.com/abc.txt');
	let body = result.body;
	if(body){
		const auto = JSON.parse(body);
		if(!auto.abc){
			log.error('授权失败，请联系爬虫提供者..');
			return;
		}
	}

	let vResult = yield request('http://registry.npm.taobao.org/hugo-spider-gz/latest');
	let vBody = vResult.body;
	if(vBody){
		const latest = JSON.parse(vBody);
		//判断是否有更新
		if (semver.lt(pkg.version, latest.version)) {
			log.warn(`检测到爬虫系统有最新的版本${latest.version}, 开始自动更新，更新完毕后请重新运行`);
			spawn.sync('npm', ['install',  pkg.name ,'-g', '--registry=https://registry.npm.taobao.org'], { stdio: 'inherit' });
		}
	}

	console.log('\n');


	yield fs.mkdirs( filePath );

	const cateData = {
		'台式机/笔记本' : [294,295],
		'网上竞价' : true,
		'平板式微型计算机/掌上电脑' : [306,353],
		'普通空调/空调机/制冷设备' : [ 120,362,348 ],
		'激光打印机/A3激光打印机/针式打印机' : [ 296,313,315 ],
		'液晶显示器/普通照明用自镇流荧光灯/普通照明用双端荧光灯/电视设备/视频监控设备中的数字硬盘录像机/监控电视墙' : [307,349,350,117,351,352]

	};

	const choices = Object.keys(cateData);

	const answers = yield inquirer.prompt([
		{
			type: 'list',
			name: 'use',
			message: '请选择你要采集的数据。',
			choices: choices
		}
	]);

	if(answers.use === choices[0]){
		yield exportComputer([294,295]);
	}else if(answers.use === choices[1]){
		yield exportNotice();
	}else {
		yield exportOther(cateData[answers.use]);
	}



}).catch((e) => {
	console.log('[Error]');
	console.log(e.stack || e);
	process.exit(1);
});
