
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
		{ header: '总金额', key: 'buyingTotalPrice', width: 15 },
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
	const listArr = yield notice.getPageSize();
	//再获取需要采集的url
	const urls = yield  notice.getDetailsUrl(listArr);



	//最后再获取采集的数据
	const data = yield notice.getDetail(urls);
	// const data = yield notice.getDetail([
	// 	'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015948c82cae4808.html',
	// 	'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015925870dc12201.html'
	// ]);
	log.success(`--> 成功抓取网上竞价类目下${data.length}条可用数据....`);
	const excel = new Excel();
	//标题
	const tableHeader = [
		{ header: '标题', key: 'title', width: 70 },
		{ header: '采购单位', key: 'buyingUnit', width: 20 },
		{ header: '项目编号', key: 'projectNum', width: 20 },
		{ header: '采购内容', key: 'buyingContent', width: 30 },
		{ header: '成交供应商确定日期', key: 'doneTime', width: 30 },
		{ header: '本项目采购文件发出日期', key: 'sendTime', width: 30 },
		{ header: '成交供应商名称', key: 'suppliersName', width: 15 },
		{ header: '地址', key: 'suppliersAddress', width: 30 },
		{ header: '成交金额', key: 'donePrice', width: 15 },
		{ header: '成交服务费', key: 'servicesPrice', width: 15 },
		{ header: '采购预算（最高限价）', key: 'prePrice', width: 15 },
		{ header: '联系人', key: 'contact', width: 20 },
		{ header: '单位地址', key: 'buyingAddress', width: 30},
		{ header: '联系电话', key: 'buyingPhone', width: 20},
		{ header: '传真', key: 'buyingFax', width: 20},
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
		'separator-强制节能品目' : true,
		'平板式微型计算机/掌上电脑' : [306,353],
		'普通空调/空调机/制冷设备' : [ 120,362,348 ],
		'激光/A3激光/针式打印机' : [ 296,313,315 ],
		'液晶显示器/电视设备/监控电视墙' : [307,117,351,352],
		//其他集中采购品目
		'separator-其他集中采购品目' : true,
		'计算机网络设备' : [286],
		'计算机安全设备/磁盘阵列' : [319,318],
		'移动存储设备/移动硬盘' : [214,215],
		'喷墨式打印机/打印设备' : [314,316],
		'显示设备/扫描仪' : [355,308],
		'计算机软件/复印机' : [321,403],
		'投影仪' : [309],
		'多功能一体机' : [297],
		'触控一体机/除湿设备/文印设备/传真机' : [311,125,344,108],
		'销毁设备' : [112],
		'摄影摄像器材' : [163],
		// '轿车/商务车/越野车/客车/厢式专用汽车/摩托车' : [363,365,364,341,366,367],
		// '图书档案装具/电梯' : [105,357],
		// '电冰箱/空气调节电器/洗衣机' : [118,304,119],
		// '照明设备/视频会议系统设备/执法船艇/办公家具' : [149,194,358,336],
		// '宿舍家具/教学家具/厨卫用具/制服' : [332,337,359,360],
		//办公电器
		// 'separator-办公电器' : true,
		// '电吹风/料理机/榨汁机/咖啡机/养生壶/电水壶' : [154,155,156,157,158,159],
		// '电磁炉/吸尘器/净化器/饮水机/冷或暖风机/热水器' : [160,124,322,132,323,137],
		// '电风扇/空调扇/取暖器/微波炉/饮料加工机/其他电器' : [139,161,140,141,142,126],
		//办公设备
		'separator-办公设备' : true,
		'影音电子/其他办公设备/电话机/其他货物' : [178,122,106,368],
		'数码配件' : [192],
		'其他调节设备' : [305],
		//文具耗材
		'separator-文具耗材' : true,
		'硒鼓墨盒' : [111],
		'办公文具' : [201],
		'复印纸/打印纸/生活用纸' : [199,200,326],
		//食品类
		// 'separator-食品类' : true,
		// '饮料冲调/粮油干货/饮料饮品/冲调饮品/休闲食品/茗茶/方便速食/厨房调料' : [133,218,226,234,134,135,262,132],
		//通信设备
		'separator-通信设备' : true,
		'通信设备分类' : [283,285,152,114,115,127,150,151],
		'separator-所有分类' : true,
		'除网上竞价外的所有分类1': [294,295,306,353,120,362,348,296,313,315,307,
			117,351,352,286,319,318,214,215,314,316,355
		],
		'除网上竞价外的所有分类2': [308,321,403,309,297,311,125,344,108,112,163,
			178,122,106,368,192,305,111,201,199,200,326,
			283,285,152,114,115,127,150,151
		],

	};

	let choices = Object.keys(cateData);

	choices = choices.map( (item,i) => {

		if(item.indexOf('separator') !== -1){
			return new inquirer.Separator()
		}else {
			return `${i}) ${item}`
		}

	} );

	const answers = yield inquirer.prompt([
		{
			type: 'list',
			name: 'use',
			// pageSize : 30,
			message: '请选择你要采集的数据。',
			choices: choices
		}
	]);

	if(answers.use === choices[0]){
		yield exportComputer([294,295]);
	}else if(answers.use === choices[1]){
		yield exportNotice();
	}else {
		const use = answers.use.replace(/\d+\) /,'');

		yield exportOther(cateData[use]);
	}



}).catch((e) => {
	console.log('[Error]');
	console.log(e.stack || e);
	process.exit(1);
});
