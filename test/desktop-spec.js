'use strict';

const Desktop = require('../lib/desktop');

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
});
