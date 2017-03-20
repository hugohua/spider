'use strict';

const details = require('../lib/details');

require('mocha-generators').install();


describe('商品详细信息抓取', () => {
	it(' 无成交记录的情况 ', function*() {

		let data = yield details.get([
			'http://mall.gzggzy.cn/commodities/94436?p_id=151972',
			//需要选择供应商的情况
			// 'http://mall.gzggzy.cn/commodities/96260?p_id=154997'
		]);
		expect(data).to.be.an('array');
		expect(data).to.have.lengthOf(1);
		expect(data[0]).to.have.property('buyingPrice').and.not.equal('');
	});

	it.only(' 有成交记录的情况 ', function*() {

		let data = yield details.get([
			//需要选择供应商的情况
			'http://mall.gzggzy.cn/commodities/96260?p_id=154997'
		]);
		console.log(data);

		expect(data).to.be.an('array');
		expect(data).to.have.lengthOf(1);
		expect(data[0]).to.have.property('buyingPrice').and.not.equal('');
		expect(data[0]).to.have.property('buyingUser').and.not.equal('');
	});

});
