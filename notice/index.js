"use strict";


const Crawler = require('crawler');
const log = require('fie-log')('spider');
const fs = require('co-fs-extra');
const co = require('co');
const path = require('path');
const tidy = require('htmltidy').tidy;

const defaultForm = {
	//结果公告
	channelCode: '000809',
	sitewebId: '4028889705bebb510105bec068b00003',
	pageIndex: 1,
	pageSize: 1,
};

const HOST = 'http://www.gdgpo.gov.cn';

function* getTotal(form) {

	const formData = Object.assign({},defaultForm,form);

	let total;

	return new Promise( (resolve, reject) => {
		const c = new Crawler({
			retries : 10,
			timeout : 30000,
			rotateUA : true,
			method : 'POST',
			form : formData,
			userAgent : 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; SV1; Crazy Browser 9.0.04)',
			callback(error, res, done) {
				if (error) {
					log.error(error);
					done();
				} else {
					const $ = res.$;
					//获取总页数
					total = $('.m_m_c_page font').text();
					done();
				}
			}
		});
		// c.on('request',function(options){
		//
		// 	console.log(options,'--');
		//
		//
		// });
		c.queue([
			'http://www.gdgpo.gov.cn/queryMoreInfoList.do'
		]);

		c.on('drain',function(){
			resolve(total);
		});
	} )
}

/**
 * 获取网上竞价的所有数据
 */
function* getUrls(total) {

	let urls = [];
	let totalUrl;
	let noticeUrls;
	const noticePath = path.join(__dirname,'../data/noticeUrl.json');
	try{
		noticeUrls = yield fs.readJson( noticePath )
	}catch(e) {

	}

	if(noticeUrls){
		totalUrl = total - noticeUrls.length;
	}else {
		totalUrl = total
	}


	const formData = Object.assign({},defaultForm,{
		pageSize : totalUrl
	});

	return new Promise( (resolve, reject) => {

		if(totalUrl === 0){
			//TODO 数据没更新，无需采集,直接返回数据
			resolve(noticeUrls);
			return;
		}

		const c = new Crawler({
			retries : 10,
			timeout : 30000,
			rotateUA : true,
			method : 'POST',
			form : formData,
			userAgent : 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; SV1; Crazy Browser 9.0.04)',
			callback(error, res, done) {
				if (error) {
					log.error(error);
					done();
				} else {
					const $ = res.$;
					//获取总页数
					const $a = $('.m_m_c_list li a');
					$a.each( (idx, item) => {
						const href = $(item).attr('href');
						if(href.indexOf('/show/id') === 0){
							urls.push( HOST + href );
						}
					} );
					done();
				}
			}
		});
		// c.on('request',function(options){
		//
		// 	console.log(options,'--');
		//
		//
		// });
		c.queue(['http://www.gdgpo.gov.cn/queryMoreInfoList.do']);
		c.on('drain',function(){
			let array = Array.from(new Set(urls.concat(noticeUrls)));
			try{
				fs.outputJsonSync(noticePath, array );
			}catch (e){

			}
			resolve(urls);
		});
	} )
}


function getTableData($table,$) {
	let len;
	let txt;
	let cellIndex = 0;
	let tmpArray = [];

	$table.children().each( (rowIndex,tr) => {

		if (!tmpArray[rowIndex]) {
			tmpArray[rowIndex] = [];
		}
		cellIndex = 0;

		$(tr).find('td').each( (cidx, cell) => {
			const $cell = $(cell);
			// console.log(cidx,'cidx');
			
			// process rowspans
			if ($cell.filter('[rowspan]').length) {
				len = parseInt($cell.attr('rowspan'), 10) - 1;
				txt = $cell.text();
				
				for (let i = 1; i <= len; i++) {
					if (!tmpArray[rowIndex + i]) {
						tmpArray[rowIndex + i] = [];
					}
					tmpArray[rowIndex + i][cellIndex] = txt;
				}
			}

			// skip column if already defined
			while (tmpArray[rowIndex][cellIndex]) {
				cellIndex++;
			}

			txt = tmpArray[rowIndex][cellIndex] || $cell.text();
			tmpArray[rowIndex][cellIndex] = txt;
			cellIndex++;
		} )
		
	})
	console.log(JSON.stringify(tmpArray),'==tmpArray');
}

/**
 * 获取详细的表格数据
 */
function getDetail(urls) {

	let data = [];

	return new Promise((resolve, reject) => {
		const c = new Crawler({
			//失败次数
			retries : 10,
			//超时时间
			timeout : 30000,
			//
			rotateUA : true,
			//设置ua
			userAgent : 'Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.0; SV1; Crazy Browser 9.0.04)',
			// This will be called for each crawled page
			callback(error, res, done) {
				// $ is Cheerio by default
				// a lean implementation of core jQuery designed specifically for the server
				if (error) {
					log.error(error);
					done();
					reject(error);
				} else {

					const $ = res.$;
					const body = res.body;
					//由于获取的html格式 不一定符合标准，如缺少标签闭合或漏标签，导致table解析出错
					tidy(body, function(err, html) {
						if(err){
							log.error(err);
							done()
						}else {
							const $html = $(html);
							//供应商名称
							const $table = $html.find('.zw_c_c_cont table');
							if($table.length){
								getTableData($table.eq(0),$)
							}
							done()
						}
					});



				}// else
			}
		});

		c.queue(urls);

		c.on('drain',function(){
			log.info('============done==========');
			resolve(data);
		});

	});
}

co(function* () {

	// const total = yield getTotal();
	//
	// const urls = yield  getUrls(total);

	const data = yield getDetail([
		// 'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015948c82cae4808.html',
		'http://www.gdgpo.gov.cn/show/id/40288ba958fe0fc3015925870dc12201.html',
// 		{
// 			html : `
// <div class="zw_c_c_cont">
//             <h2 style="text-align:center;">广东省计划生育科学技术研究所台式计算机网上竞价成交公告</h2><p style="text-indent:2em;font-size:20px;font-family:FangSong_GB2312">广东省计划生育科学技术研究所台式计算机网上竞价项目（网上竞价编号：GDPX2016Z04048），于（北京时间） 2016年12月16日在广东省政府采购网发布网上竞价公告，采用网上竞价方式进行采购，报价截止时间为2016年12月22日 12:00。现将本次网上竞价结果公布如下： </p><p style="text-indent:2em;font-size:20px;font-family:FangSong_GB2312">一、报价情况(按照价格从低到高、报价时间从先到后排序)：</p><table border="0" cellpadding="0" cellspacing="1" style="background: none repeat scroll 0 0 #c4d6e4;width: 860px;color: blue;border: 1px"><tbody><tr><th align="center" height="30" style="background: #d9f3f3;border: 1px">供应商名称</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">商品名称</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">品牌</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">规格型号</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">数量</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">报价单价（元）</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">报价金额（元）</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">报价时间</th></tr><tr><td align="center" height="30" style="background: #f6f7fa;border: 1px" rowspan="3">广州市嘉图科技有限公司</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">戴尔（Dell）台式计算机</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">戴尔（Dell）</td><td align="center" height="30" style="background: #f6f8fa;text-decoration: underline;border: 1px"><a href="http://www.gdgpo.gov.cn/ebg/showProduct/productID/40288ba8569c052e01569cba3147364f.html" target="_block">OptiPlex 3046 MB10367</a></td><td align="center" height="30" style="background: #f6f8fa;border: 1px">10.0</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">3,970.00</td><td align="center" height="30" style="background: #f6f8fa;border: 1px" rowspan="3">65,520.00</td><td align="center" height="30" style="background: #f6f8fa;border: 1px" rowspan="3">2016-12-22 11:25</td></tr><tr><td align="center" height="30" style="background: #f6f8fa;border: 1px">戴尔（Dell）台式计算机</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">戴尔（Dell）</td><td align="center" height="30" style="background: #f6f8fa;text-decoration: underline;border: 1px"><a href="http://www.gdgpo.gov.cn/ebg/showProduct/productID/40288ba8516a16c601517c5463c016e1.html" target="_block">OptiPlex 3020 MD10034</a></td><td align="center" height="30" style="background: #f6f8fa;border: 1px">2.0</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">3,970.00</td></tr><tr><td align="center" height="30" style="background: #f6f8fa;border: 1px">戴尔（Dell）台式计算机</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">戴尔（Dell）</td><td align="center" height="30" style="background: #f6f8fa;text-decoration: underline;border: 1px"><a href="http://www.gdgpo.gov.cn/ebg/showProduct/productID/40288ba857a9adc50157ac3a3a481388.html" target="_block">OptiPlex 3046 SB10467</a></td><td align="center" height="30" style="background: #f6f8fa;border: 1px">4.0</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">4,470.00</td></tr><tr><td align="center" height="30" style="background: #f6f7fa;border: 1px" rowspan="3">广州斯利文信息科技发展有限公司</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">惠普（HP）台式计算机</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">惠普（HP）</td><td align="center" height="30" style="background: #f6f8fa;text-decoration: underline;border: 1px"><a href="http://www.gdgpo.gov.cn/ebg/showProduct/productID/40288ba852120f92015214b2045d18fc.html" target="_block">HP EliteDesk 800 G1 SFF Business PC- 86021000053</a></td><td align="center" height="30" style="background: #f6f8fa;border: 1px">10.0</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">3,985.00</td><td align="center" height="30" style="background: #f6f8fa;border: 1px" rowspan="3">65,760.00</td><td align="center" height="30" style="background: #f6f8fa;border: 1px" rowspan="3">2016-12-22 09:52</td></tr><tr><td align="center" height="30" style="background: #f6f8fa;border: 1px">惠普（HP）台式计算机</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">惠普（HP）</td><td align="center" height="30" style="background: #f6f8fa;text-decoration: underline;border: 1px"><a href="http://www.gdgpo.gov.cn/ebg/showProduct/productID/40288ba8529d4b620152a015f72d1816.html" target="_block">HP ProDesk 480 G2 MT Business PC- 86024010083</a></td><td align="center" height="30" style="background: #f6f8fa;border: 1px">2.0</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">3,985.00</td></tr><tr><td align="center" height="30" style="background: #f6f8fa;border: 1px">惠普（HP）台式计算机</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">惠普（HP）</td><td align="center" height="30" style="background: #f6f8fa;text-decoration: underline;border: 1px"><a href="http://www.gdgpo.gov.cn/ebg/showProduct/productID/40288ba8525f6690015262e205c6292c.html" target="_block">HP ProDesk 480 G2 MT Business PC- 86021011053</a></td><td align="center" height="30" style="background: #f6f8fa;border: 1px">4.0</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">4,485.00</td></tr><tr><td align="center" height="30" style="background: #f6f7fa;border: 1px" rowspan="3">广州佳同信息科技有限公司</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">清华同方台式计算机</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">清华同方</td><td align="center" height="30" style="background: #f6f8fa;text-decoration: underline;border: 1px"><a href="http://www.gdgpo.gov.cn/ebg/showProduct/productID/40288ba850c27fca0150c65148cf3a68.html" target="_block">超翔Z8000-2037</a></td><td align="center" height="30" style="background: #f6f8fa;border: 1px">10.0</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">3,990.00</td><td align="center" height="30" style="background: #f6f8fa;border: 1px" rowspan="3">65,840.00</td><td align="center" height="30" style="background: #f6f8fa;border: 1px" rowspan="3">2016-12-22 09:13</td></tr><tr><td align="center" height="30" style="background: #f6f8fa;border: 1px">清华同方台式计算机</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">清华同方</td><td align="center" height="30" style="background: #f6f8fa;text-decoration: underline;border: 1px"><a href="http://www.gdgpo.gov.cn/ebg/showProduct/productID/40288ba850c27fca0150c649b1fe386e.html" target="_block">超翔Z7000-1014</a></td><td align="center" height="30" style="background: #f6f8fa;border: 1px">2.0</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">3,990.00</td></tr><tr><td align="center" height="30" style="background: #f6f8fa;border: 1px">清华同方台式计算机</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">清华同方</td><td align="center" height="30" style="background: #f6f8fa;text-decoration: underline;border: 1px"><a href="http://www.gdgpo.gov.cn/ebg/showProduct/productID/40288ba850c27fca0150c653ceb13ae4.html" target="_block">超越E500-2036</a></td><td align="center" height="30" style="background: #f6f8fa;border: 1px">4.0</td><td align="center" height="30" style="background: #f6f8fa;border: 1px">4,490.00</td></tr></tbody></table><p style="text-indent:2em;font-size:20px;font-family:FangSong_GB2312">二、成交信息：</p><p style="font-size:20px;font-family:FangSong_GB2312">成交供应商：广州市嘉图科技有限公司</p><p style="font-size:20px;font-family:FangSong_GB2312">成交金额：人民币陆万伍仟伍佰贰拾 元 （￥65,520.00）</p><p style="text-indent:2em;font-size:20px;font-family:FangSong_GB2312">成交详细配置：</p><table border="0" cellpadding="0" cellspacing="1" style="background: none repeat scroll 0 0 #c4d6e4;width: 860px;color: blue;border: 1px"><tbody><tr><th align="center" height="30" style="background: #d9f3f3;border: 1px">商品名称</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">品牌</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">规格型号</th></tr><tr><td align="center" height="30" style="background: #f6f7fa;border: 1px">戴尔（Dell）台式计算机</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">戴尔（Dell）</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">OptiPlex 3020 MD10034</td></tr></tbody></table><br><table border="0" cellpadding="0" cellspacing="1" style="background: none repeat scroll 0 0 #c4d6e4;width: 860px;color: blue;border: 1px"><tbody><tr><th align="center" height="30" width="20%" style="background: #d9f3f3;border: 1px">技术指标名称</th><th align="center" height="30" width="20%" style="background: #d9f3f3;border: 1px">技术指标</th><th align="center" height="30" width="20%" style="background: #d9f3f3;border: 1px">响应指标</th><th align="center" height="30" width="10%" style="background: #d9f3f3;border: 1px">是否响应</th></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px"> 类型</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">分体机</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">分体机</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">标配内存容量</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">4GB</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">4GB</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">光驱</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">DVD-RW</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">DVD-RW</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">网卡</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">1000Mb</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">1000Mb</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">特殊需求</th><td align="center" height="30" style="background: #f6f7fa;text-align: left;border: 1px">首先，必须兼容XP系统。<br><br>1、网站：产品必须在厂商官方网站上直接可以查询，非公开发售的特供机、专用机等不得参与； <br>2、主板：Intel 芯片组，不低于H81；电源，主板，机箱，显示器，键盘鼠标有原厂商统一品牌标志； <br>4、处理器：≥英特尔 G3250 处理器<br>5、内存：≥4GB 1600MHz, <br>6、硬盘：≥500GB SATA 7200转硬盘； <br>7、显示器：≥19.5英寸显示器；与主机同一品牌; VGA +DP双接口，带高清DP数据线； <br>8、显卡：同等或优于英特尔？ HD核心显卡<br>9、光驱：DVD-RW <br>10、网卡：千兆以太网卡,可选第二块网卡、可选无线网卡； <br>11、接口： 8个或以上USB，至少2个USB3.0，VGA，1个高清DP接口；耳机扬声器前置接口<br>12、扩展插槽：3个PCIe×1，1个PCIe×16； <br>13、机箱：高效散热静音，带有安全锁孔，整机防盗线缆锁设计，带硬盘防震托架，免工具开箱和部件维护，内存、硬盘、扩展卡、光驱无螺钉设计，带硬盘防震托架，后置电源故障诊断灯； <br>14、机箱大小：机箱容量小于等于15升； <br>15、电源：功率≥290W，可选80PLUS高能效电源；电源铭牌与主机同品牌；后置电源诊断灯（不启动检查电源） <br>16、键鼠：USB防水键盘和USB鼠标； <br>17、保修：三年整机保修，包括键盘、鼠标、显示器等周边设备； <br>18、服务：三年第2个工作日上门服务，三年原厂专业技术支持服务，原厂提供三年内每周7天24小时热线支持服务； <br>19、资产标签服务：准确标明1.MAC地址 2.主机序列号3.机器生产日期 4.主要配置，必须原厂商出厂前完成； <br>20、定制服务：硬盘分区、定制开机画面、丝网印刷公司标志； <br>21、认证：中国节能产品认证证书；中国环境标志产品认证证书； <br>22、其他要求：要求提供原厂售后服务承诺函原件。要求厂家直接发货到用户单位，并且出厂标签上注明用户单位全称。所有部件只接受原厂原配件，否则视为不满足拒绝收货。 <br>23、供应商不得变更、调整、减少参数需求，必须对技术参数及服务条款作一一响应。响应不规范，内容不完整，表述不清晰、不准确、有歧义，响应时照抄参数，或者所响应产品型号、参数与其官网上信息不相符，或者经核实所响应产品型号与其参数不相符者,采购人有权视其为报价无效处理。供应商要特别注意，必须完全满足技术参数及服务条款要求,如若中标后再与我单位谈判，我单位不给予回复，并追究因此所带来的一切后果和责任。<br></td><td align="center" height="30" style="background: #f6f7fa;text-align: left;border: 1px">符合招标要求</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr></tbody></table><br><table border="0" cellpadding="0" cellspacing="1" style="background: none repeat scroll 0 0 #c4d6e4;width: 860px;color: blue;border: 1px"><tbody><tr><th align="center" height="30" style="background: #d9f3f3;border: 1px">商品名称</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">品牌</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">规格型号</th></tr><tr><td align="center" height="30" style="background: #f6f7fa;border: 1px">戴尔（Dell）台式计算机</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">戴尔（Dell）</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">OptiPlex 3046 MB10367</td></tr></tbody></table><br><table border="0" cellpadding="0" cellspacing="1" style="background: none repeat scroll 0 0 #c4d6e4;width: 860px;color: blue;border: 1px"><tbody><tr><th align="center" height="30" width="20%" style="background: #d9f3f3;border: 1px">技术指标名称</th><th align="center" height="30" width="20%" style="background: #d9f3f3;border: 1px">技术指标</th><th align="center" height="30" width="20%" style="background: #d9f3f3;border: 1px">响应指标</th><th align="center" height="30" width="10%" style="background: #d9f3f3;border: 1px">是否响应</th></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px"> 类型</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">分体机</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">分体机</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">标配内存容量</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">4GB</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">4GB</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">显卡类型</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">集成显卡</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">集成显卡</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">标配硬盘容量</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">1000G</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">1000G</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">光驱</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">DVD-RW</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">DVD-RW</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">网卡</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">1000Mb</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">1000Mb</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">特殊需求</th><td align="center" height="30" style="background: #f6f7fa;text-align: left;border: 1px">1、关于本次所有技术参数响应的参照标准均以所投产品厂商的产品彩页为准，如不能提供所投产品厂商的产品彩页视为不符合技术要求；<br>2、网站：产品必须在厂商官方网站上直接可以查询，非公开发售的特供机、专用机等不得参与；<br>3、主板：Intel 芯片组，不低于H110；电源，主板，机箱，显示器，键盘鼠标有原厂商统一品牌标志；<br>4、处理器：≥第六代英特尔奔腾 G4400 处理器 (双核, 3MB, 2T, 3.3GHz, 65W)；<br>5、内存：≥4GB 1600MHz DDR4,<br>6、硬盘：≥1TB SATA 7200转硬盘 RPM SATA 6Gbps Entry 3.5英寸硬盘；<br>7、显示器：≥19.5英寸 LED背光宽屏显示器，与主机同一品牌;HDMI +DP双接口，可选VGA，带高清DP数据线；<br>8、显卡：≥相当于或优于集成核芯显卡530 ；<br>9、光驱：DVD-RW；<br>10、网卡：千兆以太网卡,可选第二块网卡、可选无线网卡；<br>11、接口：8 个外置 USB 端口 ：4个3.0端口（正面2个/ 背面 2个）和4个2.0端口（正面2个/ 背面2个），1个内置USB 2.0端口，1个RJ-45 端口，1个Display Port 1.2端口， 1个HDMI 1.4端口，1个UAJ端口、1个输出端口，1个VGA 端口（可选），1个并口（可选）；<br>12、扩展插槽：3个PCIe×1，1个PCIe×16；<br>13、机箱：微塔式机箱容量小于或等于15升；省空间设计，高效散热静音，带有安全锁孔，整机防盗线缆锁、防震减噪设计，带硬盘防震托架，免工具开箱和部件维护，内存、硬盘、扩展卡、光驱无螺钉设计，后置电源故障诊断灯；<br>14、机箱大小：机箱容量小于等于15升；<br>15、电源：功率≥240W，可选80PLUS高能效电源；电源铭牌与主机同品牌；后置电源诊断灯（不启动检查电源）；<br>16、键鼠：USB防水键盘和USB鼠标；<br>17、保修：三年整机保修，包括键盘、鼠标、显示器等周边设备；<br>18、服务：三年第2个工作日上门服务，三年原厂专业技术支持服务，原厂提供三年内每周7天24小时热线支持服务；<br>19、资产标签服务：准确标明1.MAC地址 2.主机序列号3.机器生产日期 4.主要配置，必须原厂商出厂前完成；<br>20、定制服务：硬盘分区、定制开机画面、丝网印刷公司标志；<br>21、认证：中国节能产品认证证书；中国环境标志产品认证证书；<br>22、其他要求： 硬盘、光驱、外壳、扩展卡免工具拆卸； 要求提供本项目原厂售后服务承诺函原件。要求厂家直接发货到用户单位，并且出厂标签上注明用户单位全称。所有部件只接受原厂原配件，否则视为不满足拒绝收货。<br>23、供应商不得变更、调整、减少参数需求，必须对技术参数及服务条款作一一响应。响应不规范，内容不完整，表述不清晰、不准确、有歧义，响应时照抄参数，或者所响应产品型号、参数与其官网上信息不相符，或者经核实所响应产品型号与其参数不相符者,采购人有权视其为报价无效处理。供应商要特别注意，必须完全满足技术参数及服务条款要求,如若中标后再与我单位谈判，我单位不给予回复，并追究因此所带来的一切后果和责任。<br></td><td align="center" height="30" style="background: #f6f7fa;text-align: left;border: 1px">符合招标要求</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr></tbody></table><br><table border="0" cellpadding="0" cellspacing="1" style="background: none repeat scroll 0 0 #c4d6e4;width: 860px;color: blue;border: 1px"><tbody><tr><th align="center" height="30" style="background: #d9f3f3;border: 1px">商品名称</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">品牌</th><th align="center" height="30" style="background: #d9f3f3;border: 1px">规格型号</th></tr><tr><td align="center" height="30" style="background: #f6f7fa;border: 1px">戴尔（Dell）台式计算机</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">戴尔（Dell）</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">OptiPlex 3046 SB10467</td></tr></tbody></table><br><table border="0" cellpadding="0" cellspacing="1" style="background: none repeat scroll 0 0 #c4d6e4;width: 860px;color: blue;border: 1px"><tbody><tr><th align="center" height="30" width="20%" style="background: #d9f3f3;border: 1px">技术指标名称</th><th align="center" height="30" width="20%" style="background: #d9f3f3;border: 1px">技术指标</th><th align="center" height="30" width="20%" style="background: #d9f3f3;border: 1px">响应指标</th><th align="center" height="30" width="10%" style="background: #d9f3f3;border: 1px">是否响应</th></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px"> 类型</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">分体机</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">分体机</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">标配内存容量</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">4GB</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">4GB</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">显卡类型</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">独立显卡</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">独立显卡</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">标配硬盘容量</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">1000G</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">1000G</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">光驱</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">DVD-RW</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">DVD-RW</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">网卡</th><td align="center" height="30" style="background: #f6f7fa;border: 1px">1000Mb</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">1000Mb</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr><tr><th align="center" height="30" width="200px" style="background: #f6f7fa;border: 1px">特殊需求</th><td align="center" height="30" style="background: #f6f7fa;text-align: left;border: 1px">1、关于本次所有技术参数响应的参照标准均以所投产品厂商的产品彩页为准，如不能提供所投产品厂商的产品彩页视为不符合技术要求；<br>2、网站：产品必须在厂商官方网站上直接可以查询，非公开发售的特供机、专用机等不得参与；<br>3、主板：Intel 芯片组，不低于H110；电源，主板，机箱，显示器，键盘鼠标有原厂商统一品牌标志；<br>4、处理器：≥第六代英特尔奔腾 G4400 处理器 (双核, 3MB, 2T, 3.3GHz, 65W)；<br>5、内存：≥4GB 1600MHz DDR4,<br>6、硬盘：≥1TB SATA 7200转硬盘 RPM SATA 6Gbps Entry 3.5英寸硬盘；<br>7、显示器：≥19.5英寸 LED背光宽屏显示器，与主机同一品牌;HDMI +DP双接口，可选VGA，带高清DP数据线；<br>8、显卡：≥相当于或优于AMD Radeon R5 340X 2GB (DP/DVI-I) ；<br>9、光驱：DVD-RW；<br>10、网卡：千兆以太网卡,可选第二块网卡、可选无线网卡；<br>11、接口：8 个外置 USB 端口 ：4个3.0端口（正面2个/ 背面 2个）和4个2.0端口（正面2个/ 背面2个），1个内置USB 2.0端口，1个RJ-45 端口，1个Display Port 1.2端口， 1个HDMI 1.4端口，1个UAJ端口、1个输出端口，1个VGA 端口（可选），1个并口（可选）；<br>12、扩展插槽：3个PCIe×1，1个PCIe×16；<br>13、机箱：微塔式机箱容量小于或等于15升；省空间设计，高效散热静音，带有安全锁孔，整机防盗线缆锁、防震减噪设计，带硬盘防震托架，免工具开箱和部件维护，内存、硬盘、扩展卡、光驱无螺钉设计，后置电源故障诊断灯；<br>14、机箱大小：机箱容量小于等于15升；<br>15、电源：功率≥240W，可选80PLUS高能效电源；电源铭牌与主机同品牌；后置电源诊断灯（不启动检查电源）；<br>16、键鼠：USB防水键盘和USB鼠标；<br>17、保修：三年整机保修，包括键盘、鼠标、显示器等周边设备；<br>18、服务：三年第2个工作日上门服务，三年原厂专业技术支持服务，原厂提供三年内每周7天24小时热线支持服务；<br>19、资产标签服务：准确标明1.MAC地址 2.主机序列号3.机器生产日期 4.主要配置，必须原厂商出厂前完成；<br>20、定制服务：硬盘分区、定制开机画面、丝网印刷公司标志；<br>21、认证：中国节能产品认证证书；中国环境标志产品认证证书；<br>22、其他要求： 硬盘、光驱、外壳、扩展卡免工具拆卸； 要求提供本项目原厂售后服务承诺函原件。要求厂家直接发货到用户单位，并且出厂标签上注明用户单位全称。所有部件只接受原厂原配件，否则视为不满足拒绝收货。<br>23、供应商不得变更、调整、减少参数需求，必须对技术参数及服务条款作一一响应。响应不规范，内容不完整，表述不清晰、不准确、有歧义，响应时照抄参数，或者所响应产品型号、参数与其官网上信息不相符，或者经核实所响应产品型号与其参数不相符者,采购人有权视其为报价无效处理。供应商要特别注意，必须完全满足技术参数及服务条款要求,如若中标后再与我单位谈判，我单位不给予回复，并追究因此所带来的一切后果和责任。<br></td><td align="center" height="30" style="background: #f6f7fa;text-align: left;border: 1px">符合招标要求</td><td align="center" height="30" style="background: #f6f7fa;border: 1px">是</td></tr></tbody></table><br><p style="TEXT-INDENT: 2em; FONT-FAMILY: FangSong_GB2312; FONT-SIZE: 20px">&nbsp;</p><p style="TEXT-INDENT: 2em; FONT-FAMILY: FangSong_GB2312; FONT-SIZE: 14px">&nbsp;</p><p style="TEXT-ALIGN: right"><span style="font-family:仿宋_GB2312;FONT-SIZE: 14pt">广东省政府采购中心</span></p><p style="TEXT-ALIGN: right"><span style="font-family:仿宋_GB2312;FONT-SIZE: 14pt">2016年12月22日</span></p><p style="FONT-FAMILY: FangSong_GB2312; FONT-SIZE: 10px">&nbsp;</p>
//         </div>`
// 		}
	])

}).catch((e) => {
	console.log('[Error]');
	console.log(e.stack || e);
	process.exit(1);
});




