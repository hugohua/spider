'use strict';

const Desktop = require('../lib/desktop');
const cateData = require('../data/178.json');

describe('rules', () => {
  it(' 戴尔台式标题替换 ', () => {
    const data = new Desktop('戴尔台式OptiPlex7040MT-SD00996 i7-6700/4G/1TB/DVDRW/2G独显 win7专业版');

    expect(data).to.be.an('object');

    expect(data).to.deep.equal({
      brand: '戴尔',
      type: 'OptiPlex7040MT-SD00996',
      cpu: 'i7-6700',
      gpu: '2G独显',
      memory: '4G',
      disk: '1TB',
      system: 'win7专业版',
      display: ''
    });
  });

  it(' 戴尔台式标题替换 ', () => {
    const data = new Desktop('戴尔台式机OptiPlex3020 MD00054 i5-4590 8G1TB /集显 win7pro/23寸显示器');

    expect(data).to.be.an('object');

    expect(data).to.deep.equal({
      brand: '戴尔',
      type: 'OptiPlex3020',
      cpu: 'i5-4590',
      gpu: '集显',
      memory: '8G',
      disk: '1TB',
      system: 'win7pro',
      display: '23寸显示器'
    });
  });

  it(' 联想G系列处理器 ', () => {
    const data = new Desktop('联想 Lenovo 台式电脑套机 启天M4650-B003 19.5寸 G3900 4G 1T 集显 DVDRW 无系统 三年上门');

    expect(data).to.be.an('object');

    expect(data).to.deep.equal({
      brand: '联想',
      type: '启天M4650-B003',
      cpu: 'g3900',
      gpu: '集显',
      memory: '4G',
      disk: '1T',
      system: 'DOS',
      display: '19.5寸'
    });
  });

  it(' 联想M系列处理器 ', () => {
    const data = new Desktop('联想（Lenovo）ThinkCentreM8600t-D001台式电脑I5-6500/4G/500G/DVDRW/集成显卡/Win7Pro五年上门+21.5英寸');

    expect(data).to.be.an('object');

    expect(data).to.deep.equal({
      brand: '联想',
      type: 'M8600t-D001',
      cpu: 'i5-6500',
      gpu: '集成显卡',
      memory: '4G',
      disk: '500G',
      system: 'Win7Pro五年上门',
      display: '21.5英寸'
    });
  });


	it(' 联想带括号 ', () => {
		const data = new Desktop('联想（Lenovo）启天M4600-B032台式电脑（I3-6100/H110/4G/500G/DVDRW/集成显卡/DOS)五年上门保修+19.5宽屏');

		expect(data).to.be.an('object');

		expect(data).to.deep.equal({
			brand: '联想',
			type: '启天M4600-B032台式电脑',
			cpu: 'i3-6100',
			gpu: '集成显卡',
			memory: '4G',
			disk: '500G',
			system: 'DOS',
			display: '19.5宽屏'
		});
	});

	it.only(' 提取显卡信息 ', () => {
		const data = new Desktop('联想台式电脑 ThinkCentre M8600t-D155 i7-6700 16G 128G+2T DVDRW 2G显卡 Win7Pro64 23寸显示器 （保修：主机5年，显示器3年）');

		expect(data).to.be.an('object');

		expect(data).to.deep.equal({
			brand: '联想',
			type: '启天M4600-B032台式电脑',
			cpu: 'i3-6100',
			gpu: '集成显卡',
			memory: '4G',
			disk: '500G',
			system: 'DOS',
			display: '19.5宽屏'
		});
	});

  it('全类目处理测试', () => {
    cateData.forEach((item) => {
      console.log(item.title);
      console.log(item.url);

      const data = new Desktop(item.title);
      expect(data).to.be.an('object');
      // expect(data.brand).to.not.equal('');
      // expect(data.type).to.not.equal('');
      // expect(data.cpu).to.not.equal('');
      // expect(data.gpu).to.not.equal('');
      // expect(data.memory).to.not.equal('');
      // expect(data.disk).to.not.equal('');
      // expect(data.system).to.not.equal('');
      // expect(data.display).to.not.equal('');
    });
  });
});
