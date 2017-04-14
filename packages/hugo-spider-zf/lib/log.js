/**
 * Created by hugo on 17/4/14.
 */

const fieLog = require('fie-log')('spider');
const fs = require('fs');
const Log = require('log');
const home = require('os-homedir')();
const path = require('path');

const fileName = Date.now();
const filePath = path.join(home,'spider');

const fileLog = new Log('debug', fs.createWriteStream(path.join(filePath, fileName + '.log' )));

module.exports = {

	info : function () {
		fileLog.info.apply(fileLog,arguments);
		fieLog.info.apply(null,arguments);
	},

	success : function () {
		fileLog.notice.apply(fileLog,arguments);
		fieLog.success.apply(null,arguments);
	},

	warn : function () {
		fileLog.warning.apply(fileLog,arguments);
		fieLog.warn.apply(null,arguments);
	},

	error : function () {
		fileLog.error.apply(fileLog,arguments);
		fieLog.error.apply(null,arguments);
	},

	debug : function () {
		fileLog.debug.apply(fileLog,arguments);
		fieLog.debug.apply(null,arguments);
	},

	fileName

};