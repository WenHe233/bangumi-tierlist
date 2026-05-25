# 新番 Tier Maker

为指定季度（1月/4月/7月/10月）或整年的新番做 S/A/B/C/D/F 评级的拖拽小工具。纯前端、单文件。

## 功能

- 选年份 + 季度（含「整年」），从 [bangumi-data](https://github.com/bangumi-data/bangumi-data) 自动加载番剧
- S/A/B/C/D/F 行可重命名、改色、增删、调顺
- 鼠标 / 触屏拖拽（SortableJS）
- 标题语言切换：简中 / 繁中 / English / 日本語
- 全局搜索（不受当前季度限制）
- 上传自己的图片（文件 / 拖拽 / URL / 剪贴板四种入口），存 IndexedDB
- 多套命名存档（localStorage）
- 导出 PNG（html2canvas）、生成可分享 URL、JSON 导入/导出
- 宽屏左右分栏、窄屏托盘自动停靠底部

## 使用

直接在浏览器里打开 `index.html` 即可，也可以丢到 GitHub Pages / 任意静态服务器上。

## 致谢

- 数据：[bangumi-data](https://github.com/bangumi-data/bangumi-data)
- 封面：[bgm.tv](https://bgm.tv)（经 [images.weserv.nl](https://images.weserv.nl) 代理解决 CORS）
- 拖拽：[SortableJS](https://github.com/SortableJS/Sortable)
- 截图：[html2canvas](https://github.com/niklasvh/html2canvas)
- 简繁转换：[opencc-js](https://github.com/nk2028/opencc-js)
- 姐妹项目：[新番时间表](https://bangumi-calendar.wen-he.icu/)

## License

MIT
