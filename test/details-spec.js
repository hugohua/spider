'use strict';

const details = require('../lib/details');

require('mocha-generators').install();


describe('rules', () => {
  it(' 无成交记录的情况 ', function*() {

		let data = yield details.get([
			'http://112.74.98.194/commodities/26909?p_id=27808'
		]);
		
		console.log(data);
		

  });


});
