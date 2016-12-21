'use strict';

const Excel = require('../lib/excel');

describe('excel', () => {
  it('保存文件', (done) => {
    const excel = new Excel();
    const header = // 品牌	商品	类型	处理器	内存	硬盘	显卡	显示器	系统	单价	电商平台	采购单位	采购数量	采购时间
      [
				{ header: '品牌', key: 'brand' },
				{ header: '商品', key: 'title' },
				{ header: '类型', key: 'type' },
				{ header: '处理器', key: 'cpu' },
				{ header: '内存', key: 'memory' },
				{ header: '硬盘', key: 'disk' },
				{ header: '显卡', key: 'gpu' },
				{ header: '显示器', key: 'display' },
				{ header: '系统', key: 'system' },
				{ header: '单价', key: 'price' },
				{ header: '电商平台', key: 'platform' },
				{ header: '采购数量', key: 'number' },
				{ header: '采购时间', key: 'time' }
      ];
    excel.addWorksheet('台式机', header, []);
    excel.save('data/file.xlsx', () => {
      done();
    });
  });
});
