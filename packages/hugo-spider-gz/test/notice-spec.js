'use strict';

const notice = require('../lib/notice');

require('mocha-generators').install();


describe('notice', () => {
	it(' 处理多行成交记录 ', function*() {

		const data = yield notice.getDetail([
			'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015925870dc12201.html',
		]);

		expect(data).to.be.an('array');
		//3条数据
		expect(data).to.have.lengthOf(3);
		//完全等于
		expect(data).to.deep.equal([{
			suppliersName: '广州市嘉图科技有限公司',
			goodsName: '戴尔（Dell）台式计算机',
			brand: '戴尔（Dell）',
			type: 'OptiPlex 3046 MB10367',
			url: 'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015925870dc12201.html',
			number: '10.0',
			onePrice: '3,970.00',
			totalPrice: '65,520.00',
			priceTime: '2016-12-22 11:25',
			closeTime: "2016-12-22 12:00",
			title: '广东省计划生育科学技术研究所台式计算机网上竞价成交公告',
			cate: '台式计算机',
			priceNum: 'GDPX2016Z04048',
			buyingUnit: '广东省计划生育科学技术研究所'
		},
			{
				suppliersName: '广州市嘉图科技有限公司',
				goodsName: '戴尔（Dell）台式计算机',
				brand: '戴尔（Dell）',
				type: 'OptiPlex 3020 MD10034',
				url: 'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015925870dc12201.html',
				number: '2.0',
				onePrice: '3,970.00',
				totalPrice: '65,520.00',
				priceTime: '2016-12-22 11:25',
				closeTime: "2016-12-22 12:00",
				title: '广东省计划生育科学技术研究所台式计算机网上竞价成交公告',
				cate: '台式计算机',
				priceNum: 'GDPX2016Z04048',
				buyingUnit: '广东省计划生育科学技术研究所'
			},
			{
				suppliersName: '广州市嘉图科技有限公司',
				goodsName: '戴尔（Dell）台式计算机',
				brand: '戴尔（Dell）',
				type: 'OptiPlex 3046 SB10467',
				url: 'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015925870dc12201.html',
				number: '4.0',
				onePrice: '4,470.00',
				totalPrice: '65,520.00',
				priceTime: '2016-12-22 11:25',
				closeTime: "2016-12-22 12:00",
				title: '广东省计划生育科学技术研究所台式计算机网上竞价成交公告',
				cate: '台式计算机',
				priceNum: 'GDPX2016Z04048',
				buyingUnit: '广东省计划生育科学技术研究所'
			}])

	});

	it(' 处理单行成交记录 ', function*() {

		const data = yield notice.getDetail([
			'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015948c82cae4808.html',
		]);

		expect(data).to.be.an('array');
		//1条数据
		expect(data).to.have.lengthOf(1);
		//完全等于
		expect(data).to.deep.equal([{
			suppliersName: '茂名市佰得科技有限公司',
			goodsName: '惠普（HP）便携式计算机',
			brand: '惠普（HP）',
			type: 'HP 450G4',
			url: 'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015948c82cae4808.html',
			number: '75.0',
			onePrice: '6,585.00',
			totalPrice: '493,875.00',
			priceTime: '2016-12-29 11:53',
			closeTime: "2016-12-29 12:00",
			title: '信宜市人民法院便携式计算机网上竞价成交公告',
			cate: '便携式计算机',
			priceNum: 'GDPX2016Z04092',
			buyingUnit: '信宜市人民法院'
		}])


	});

});
