/**
 * Created by hugo on 16/12/11.
 * excel操作相关
 */

'use strict';

const ExcelJs = require('exceljs');
const fs = require('fs');

class Excel {

  constructor() {
    this.workbook = new ExcelJs.Workbook();

    this.workbook.creator = 'Hugo';
    this.workbook.lastModifiedBy = 'hugo';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
  }

	/**
	 * 获取标题样式
	 * @returns {{fill: {type: string, pattern: string, bgColor: {rgb: string}}, font: {name: string, family: number, size: number, bold: boolean}}}
	 */
  static setHeaderStyle(ws, numbers) {
    const arr = '0ABCDEFGHIJKLMNOPQ'.split('');
    for (let i = 1; i <= numbers; i++) {
      const cell = ws.getCell(`${arr[i]}1`);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF000000' }
      };

      cell.font = {
        name: '微软雅黑',
        family: 4,
        color: { argb: 'FFFFFFFF' },
        bold: true
      };
    }
  }

  addWorksheet(sheetName, columns, rows) {
    const worksheet = this.workbook.addWorksheet(sheetName);
    Excel.setHeaderStyle(worksheet, columns.length);
    worksheet.columns = columns;
    worksheet.addRows(rows);

		//设置样式
		for(let i = 2,len = rows.length; i <= len + 1 ; i++){

			const row = worksheet.getRow(i);
			row.height = 20;
			row.font = { name: '微软雅黑', family: 4, size: 12 };
			row.alignment = { vertical: 'middle', horizontal: 'left' };
		}
	}

  save(file, callback) {
    this.workbook.xlsx.writeFile(file)
			.then(() => {
  console.log(`${file} 文件已保存`);
  callback && callback();
});
  }

}

module.exports = Excel;
