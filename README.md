# 新番 Tier Maker

为指定季度（1月/4月/7月/10月）或整年的新番做 S/A/B/C/D/F 评级的拖拽小工具。纯前端、单文件。

## 功能

- 选年份 + 季度（含「整年」），从 [bangumi-data](https://github.com/bangumi-data/bangumi-data) 自动加载番剧
- S/A/B/C/D/F 行可重命名、改色、增删、调顺
- 为 Tier 和已排名作品添加 Markdown 注释，支持脚注展示、存档、分享与 PNG 导出
- 鼠标 / 触屏拖拽（SortableJS）
- 标题语言切换：简中 / 繁中 / English / 日本語
- 全局搜索（不受当前季度限制）
- 上传自己的图片（文件 / 拖拽 / URL / 剪贴板四种入口），存 IndexedDB
- 多套命名存档（localStorage），支持新建空白榜单、另存为、保存和删除
- 导出 PNG（html2canvas）、生成可分享 URL、JSON 导入/导出
- 导出 / 复制 PNG 可添加当前域名的半透明水印，默认关闭，自动记住选择
- 卡片标题背景随换行增高，浅色封面上的长标题也能看清
- 宽屏左右分栏、窄屏托盘自动停靠底部

## 使用

直接在浏览器里打开 `index.html` 即可，也可以丢到 GitHub Pages / 任意静态服务器上。

季度按首播时间筛选，沿用 [bangumi-data 的 GMT+8 年月约定](https://github.com/bangumi-data/bangumi-data/blob/master/CONTRIBUTING.md)。季度起止边界均提前 10 天，例如「7月」包含北京时间 6 月 21 日至 9 月 20 日首播的作品，「10月」从 9 月 21 日开始，相邻季度没有交集。「整年」为四个季度结果的并集，同一 Bangumi ID 只显示一次。缺少月份或日期无效的条目不参与筛选。

修改筛选逻辑后，可用 Node.js 运行回归测试：

```sh
node --test tests/season-filter.test.cjs
```

## 致谢

- 数据：[bangumi-data](https://github.com/bangumi-data/bangumi-data)
- 封面：[bgm.tv](https://bgm.tv)（经 [images.weserv.nl](https://images.weserv.nl) 代理解决 CORS）
- 拖拽：[SortableJS](https://github.com/SortableJS/Sortable)
- 截图：[html2canvas](https://github.com/niklasvh/html2canvas)
- 简繁转换：[opencc-js](https://github.com/nk2028/opencc-js)
- 姐妹项目：[新番时间表](https://bangumi-calendar.wen-he.icu/)

## License

MIT
