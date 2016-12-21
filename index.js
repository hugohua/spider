
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
const config = require('./lib/config');
const urls = require('./data/urls.json');

co(function* () {
  const excel = new Excel();

  const tableHeader = [
		{ header: '商品', key: 'title', width : 100 },
		{ header: '序号', key: 'buyingNum', width : 15 },
		{ header: '采购单位', key: 'buyingUnit', width : 20 },
		{ header: '数量', key: 'buyQuantity', width : 15 },
		{ header: '单价', key: 'buyingPrice', width : 15 },
		{ header: '电商', key: 'buyingUser', width : 20 },
		{ header: '采购时间', key: 'buyingDate', width : 15 }
  ];

	//TODO 抓取列表页
  const data = yield details.get([
    'http://112.74.98.194/commodities/15367?p_id=16150',
    'http://112.74.98.194/commodities/24285?p_id=25617'
  ]);

  excel.addWorksheet('台式机', tableHeader, data);
  excel.save('data/file2.xlsx', () => {
  });
}).catch((e) => {
  console.log(e);
});
