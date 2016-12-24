
/**
 * Created by hugo on 16/12/18.
 * 获取商品详情内容
 */

'use strict';


const co = require('co');
const path = require('path');
const log = require('fie-log')('spider');
const Excel = require('./lib/excel');
const details = require('./lib/details');
const Desktop = require('./lib/desktop');
const config = require('./lib/config');
const urls = require('./data/urls.json');
const fs = require('co-fs-extra');
/**
 * 导出通用类目
 */
function* exportOther(){
  return new Promise( (resolve, reject) => {
    const excel = new Excel();

    const tableHeader = [
      { header: '商品', key: 'title', width : 100 },
      { header: '电商平台', key: 'platform', width : 20 },
      { header: '序号', key: 'buyingNum', width : 15 },
      { header: '采购单位', key: 'buyingUnit', width : 20 },
      { header: '数量', key: 'buyQuantity', width : 15 },
      { header: '单价', key: 'buyingPrice', width : 15 },
      { header: '累计采购金额', key: 'totalPrice', width : 15 },
      { header: '电商', key: 'buyingUser', width : 20 },
      { header: '采购时间', key: 'buyingDate', width : 15 },
      { header: 'URL', key: 'url', width : 60 }

    ];

    //TODO 抓取列表页
    //const data = yield details.get([
    //  'http://112.74.98.194/commodities/15367?p_id=16150',
    //  'http://112.74.98.194/commodities/24285?p_id=25617'
    //]);

    //const data = yield details.get(urls['117']);

    //for(let i in urls){
    //  let cate = config.cate[i];
    //  log.info(`--> 开始抓取 ${cate} 类目....`);
    //  const data = yield details.get(urls[i]);
    //  excel.addWorksheet(cate, tableHeader, data);
    //  log.success(`--> 成功抓取 ${cate} 类目下的${data.length}条数据....`)
    //}

    excel.addWorksheet('台式机', tableHeader, data);
    excel.save('data/file2.xlsx', () => {
      resolve();
    });
  })
}



co(function* () {
  const excel = new Excel();

  const tableHeader = [
    { header: '商品', key: 'title', width : 100 },
    { header: '品牌', key: 'brand', width : 15 },
    { header: '型号', key: 'type', width : 15 },
    { header: '处理器', key: 'cpu', width : 15 },
    { header: '显卡', key: 'gpu', width : 15 },
    { header: '内存', key: 'memory', width : 15 },
    { header: '硬盘大小', key: 'disk', width : 15 },
    { header: '操作系统', key: 'system', width : 15 },
    { header: '显示器', key: 'display', width : 15 },
    { header: '电商平台', key: 'platform', width : 20 },
    { header: '序号', key: 'buyingNum', width : 15 },
    { header: '采购单位', key: 'buyingUnit', width : 20 },
    { header: '数量', key: 'buyQuantity', width : 15 },
    { header: '单价', key: 'buyingPrice', width : 15 },
    { header: '累计采购金额', key: 'totalPrice', width : 15 },
    { header: '电商', key: 'buyingUser', width : 20 },
    { header: '采购时间', key: 'buyingDate', width : 15 },
    { header: 'URL', key: 'url', width : 60 }

  ];

  const data = yield details.get(urls['177']);

  const file = path.join(__dirname, '../data/177.json');
  // 写入project文件
  yield fs.outputJson(file, data);

  log.success(`成功将数据写入: ${file}`);



}).catch((e) => {
  console.log(e);
});
