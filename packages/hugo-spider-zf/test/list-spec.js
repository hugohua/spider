"use strict";


co(function* () {
	const urls = {};

	const pageList = yield getPageSize();


	for (const p in pageList) {
		log.info(`开始抓取分类ID : ${p}`);
		urls[p] = yield getDetailsUrl(pageList[p]);
	}

	yield saveDetailUrl(urls);
}).catch((e) => {
	console.log(e);
});
