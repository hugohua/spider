'use strict';

const list = require('../lib/list');

require('mocha-generators').install();


describe('获取分类页面url', () => {
	it(' 成功获取台式计算机的所有分类 ', function*() {
		let data = yield list.getPageSize([294]);
		expect(data).to.be.an('object');
		expect(data).to.have.any.keys('294');
		expect(data['294']).to.be.an('array');
		expect(data['294']).to.have.length.above(57);
	});

});


describe.only('获取单个商品URL', () => {
	it(' 成功获取单个商品URL ', function*() {
		let data = yield list.getDetailsUrl([
			'http://mall.gzggzy.cn/channel/294_0_0_0_0_0_0_0_0.html?page=58&q%5Bemall_id_eq%5D=294&q%5Bs%5D=products_count+desc'
		]);
		expect(data).to.be.an('array');
		expect(data).to.have.length.above(2);
		expect(data[0]).to.contain('p_id=');
	});

});
