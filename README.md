# 导演学习实验室 · Director's Lab

一个场景驱动的导演方法学习 MVP。用户从“今天片场”进入具体场景，通过镜头、场面调度、声音和剪辑的选择理解导演决策；选择会写入 SQLite 学习档案。

另有「分镜卡片生成器」页面：输入一个动作或一句简单对白（提供预设选项），自动生成包含画面内容、人物动作、景别、机位和镜头时长的镜头卡；卡片可自由拖动排序，时间轴按时长比例呈现整场戏的节奏。分镜数据以可排序数组保存在浏览器 localStorage，刷新页面后自动恢复编辑状态。

## 本地运行

```bash
npm install
npm run build
npm start
```

打开 <http://localhost:3001>。

## API

- `GET /api/modules`：互动练习模块与选项
- `GET /api/progress` / `POST /api/progress`：学习进度
- `GET /api/practice` / `POST /api/practice`：练习记录

数据库文件为项目根目录的 `lab.db`，首次启动会自动创建表结构和示例进度。
