# 导演学习实验室 · Director's Lab

一个场景驱动的导演方法学习 MVP。包含两部分：

- **今日片场**：从具体场景进入镜头、场面调度、声音和剪辑的选择练习，选择会写入学习档案。
- **电影语言**：覆盖「景别、机位、镜头运动、构图、光线、色彩」六个基础概念，每个概念对应一场戏（雨夜便利店、审讯室、末班站台、走廊尽头、深夜书房、夏日告别）。用户点击不同镜头方案即可看到 SVG 画面实时变化与对应的观看感受，写下自己的判断并提交后，会展示该方案的导演分析。

课程数据（概念定义、场景、镜头方案、观看感受、导演分析、画面渲染参数）全部由后端 `data/concepts.js` 统一管理，前端通过 API 获取，不把课程数据写死在前端。

## 本地运行

```bash
npm install
npm run build
npm start
```

打开 <http://localhost:3001>。开发模式可用 `npm run dev`（Vite 代理 `/api` 到 3001 端口）。

## API

- `GET /api/modules`：互动练习模块与选项
- `GET /api/progress` / `POST /api/progress`：学习进度
- `GET /api/practice` / `POST /api/practice`：练习记录
- `GET /api/film-language/concepts`：电影语言六个概念的课程数据（场景、镜头方案、观看感受、导演分析、画面参数）
- `GET /api/film-language/judgments` / `POST /api/film-language/judgments`：用户判断记录（`conceptId` + `optionId` + `note`，提交后返回导演分析对应的记录条目）

持久层为项目根目录的 `lab-data.json`（Node 20 无 `node:sqlite`，故采用 JSON 文件存储），首次启动自动创建并写入示例进度。
