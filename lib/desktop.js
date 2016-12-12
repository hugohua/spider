/**
 * Created by hugo on 16/12/6.
 * 采集规则处理
 */
"use strict";

const debug = require('debug')('spider');
const _ = require('lodash');

class Rules {
	constructor(title) {

		this.assets = [];
		//品牌
		this.brand = '';
		//型号
		this.type = '';
		//处理器
		this.cpu = '';
		//内存
		this.memory = '';
		//硬盘
		this.disk = '';
		//系统
		this.system = '';
		//显示器
		this.display = '';
		//显卡
		this.gpu = '';

		return this.init(title);
	}


	/**
	 * 获取品牌
	 */
	getBrand() {
		const brands = ['联想', '华硕', '戴尔'];
		for (let val of this.assets) {
			for (let b of brands) {
				//完全等于品牌,则直接返回
				if (b === val) {
					this.assets = _.without(this.assets, val);
					this.brand = b;
				} else if (val.indexOf(b) !== -1) {
					//如果包含品牌,则剩下的内容 英文部分可能是型号
					this.brand = b;
					this.type = val.replace(/[^\u0000-\u00FF]/g, '');
					this.assets = _.without(this.assets, val);
				}
			}
		}
	}

	/**
	 * 获取品牌
	 */
	getType(){
		if(this.type) return;
		for (let val of this.assets) {
			//完全等于品牌,则直接返回
			if(val.indexOf('启天') !== -1){
				this.type = val;
				this.assets = _.without(this.assets, val);
			}
		}
	}


	/**
	 * 获取处理器
	 * 处理器的规则是:i打头
	 */
	getCpu() {
		//cpu的格式一般为 i 开通 跟着数字 和 -
		for (let val of this.assets) {
			const match = val.toLowerCase().match(/i\d(-\d*)?/);
			if (match) {
				this.cpu = match[0];
				this.assets = _.without(this.assets, val);
			}
		}
	}

	/**
	 * 获取显卡信息
	 * 匹配规则: 有独字和集字,同时有显字,比如独显\集显\集成显卡
	 */
	getGpu(){
		//cpu的格式一般为 i 开通 跟着数字 和 -
		for (let val of this.assets) {
			if ( (val.indexOf('独') !== -1 || val.indexOf('集') !== -1) && val.indexOf('显') !== -1 ) {
				this.gpu = val;
				this.assets = _.without(this.assets, val);
			}
		}
	}

	/**
	 * 获取内存
	 * 内存规则是: 1--2个数字+G
	 */
	getMemory() {
		for (let val of this.assets) {
			const match = val.match(/^\d{1,2}G/);
			//有些是指显存,需要排除,如2G独显
			if (match && val.indexOf('显') === -1) {
				this.memory = match[0];
				//可能存在的格式4G1BT,所以不删除
				//this.assets = _.without(this.assets, val);
			}
		}
	}

	/**
	 * 获取硬盘大小
	 * 匹配规则: 500G\1T  两个以上数字带G \ 一个数字带T
	 */
	getDisk() {
		for (let val of this.assets) {
			const match = val.match(/\d{2,3}G$|\d{1,2}TB?$/);
			if (match) {
				this.disk = match[0];
				//this.assets = _.without(this.assets, val);
			}
		}
	}

	/**
	 * 获取预装系统
	 * 匹配规则: 带 win / dos / 无系统
	 */
	getSystem() {
		for (let val of this.assets) {
			const sVal = val.toLowerCase();
			const match = sVal.match(/win|dos/);
			if (match) {
				this.system = val;
				this.assets = _.without(this.assets, val);
			} else if (sVal === '无系统') {
				this.system = 'DOS';
				this.assets = _.without(this.assets, val);
			}
		}
	}

	/**
	 * 获取显示器
	 */
	getDisplay(){
		for (let val of this.assets) {
			if (val.indexOf('寸') !== -1 || val.indexOf('屏') !== -1) {
				this.display = val;
				this.assets = _.without(this.assets, val);
			}
		}
	}

	init(title) {
		//把特殊字符去掉,如:()
			title = title.replace(/（|\(|）|\)|\+/g, ' ');
		this.assets = title.split(' ');

		for (let val of this.assets) {
			if (val.indexOf('/') !== -1) {
				const sVal = val.split('/');
				this.assets = _.without(this.assets, val);
				sVal.forEach(item => {
					this.assets.push(item);
				})
			}
		}

		debug('标题数组 = %o',this.assets);

		this.getBrand();
		this.getType();
		this.getCpu();
		this.getGpu();
		this.getMemory();
		this.getDisk();
		this.getSystem();
		this.getDisplay();
		debug('品牌 = %s', this.brand);
		debug('型号 = %s', this.type);
		debug('处理器 = %s', this.cpu);
		debug('显卡 = %s',this.gpu);
		debug('内存 = %s', this.memory);
		debug('硬盘大小 = %s', this.disk);
		debug('操作系统 = %s', this.system);
		debug('显示器 = %s',this.display)

		return {
			brand : this.brand,
			type : this.type,
			cpu : this.cpu,
			gpu : this.gpu,
			memory : this.memory,
			disk : this.disk,
			system : this.system,
			display : this.display
		}
	}
}











module.exports = Rules;

//联想 Lenovo 台式电脑套机 启天M4600-B033 21.5寸 i3-6100 4G 1T 集显 DVDRW Win7Pro64 三年上门(BAT)
//戴尔台式OptiPlex7040MT-SD00996 i7-6700/4G/1TB/DVDRW/2G独显 win7专业版
//华硕一体机电脑 A4321UKH-BB111M  G3900 4G 500G DVDRW DOS 20寸 两年上门保修服务
//联想 Lenovo 台式电脑套机 启天M4650-B058 21.5寸 i3-6300 4G 1T 1G独显 DVDRW 无系统 三年上门
//rules.desktop('联想 Lenovo 台式电脑套机 启天M4600-B033 21.5寸 i3-6100 4G 1T 集显 DVDRW Win7Pro64 三年上门(BAT)');
