'use strict';

const notice = require('../lib/notice');

require('mocha-generators').install();


describe('notice', () => {

	it(' 成功获取所有分类页面 ', function*() {
		let data = yield notice.getPageSize();
		expect(data).to.be.an('array');
		expect(data).to.have.length.above(655);
	});


	it(' 成功获取商品详情url ', function*() {
		let data = yield notice.getDetailsUrl([
			'http://wj.gzggzy.cn/NoticeList.aspx?type=5&page=1',
			'http://wj.gzggzy.cn/NoticeList.aspx?type=5&page=2',
			'http://wj.gzggzy.cn/NoticeList.aspx?type=5&page=3'
		]);
		expect(data).to.be.an('object');
	});

	it(' 成功获取商品详情内容 ', function*() {
		let data = yield notice.getDetail({
			'http://wj.gzggzy.cn/Announcement/success/CX2017-04317-2.html' : 'CX2017-04317'
		});
		console.log(data);

		expect(data).to.be.an('array');
	});


});



