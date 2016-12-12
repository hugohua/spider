/**
 * FIE 配置文件
 * 详细配置可查看: http://fie.alibaba.net/doc?type=fie-config
 */
module.exports = {
    tasks: {
        // 顺序执行 commands 的命令,类似于 package.json 中 的 scripts 字段
        start: [{
                //将当前目录链接到fie 本地cdn目录
                command: 'fie link'
            }],
        build: [
            {
                //同步版本号
                command: 'fie git sync'
            },
            {
                //检测dependencies中的版本依赖
                command: 'fie check'
            },
            {
                // console检测
                command: 'fie console detect --force'
            }
        ],
        publish: [],
        open: [{
                //打开当前项目的gitlab地址
                command: 'fie git open'
            }],
        test: [{ command: 'fie ci test' }]
    }
};