# 导演学习实验室 · Director's Lab

一个场景驱动的导演方法学习 MVP。用户从“今天片场”进入具体场景，通过镜头、场面调度、声音和剪辑的选择理解导演决策；选择会写入 SQLite 学习档案。

另有**「从主题到场景」导演工作台**：学习一部作品不从拍摄开始，而是从一个简单主题出发，分四步（核心表达 → 人物关系 → 冲突时刻 → 场景目标/观看体验）逐步形成具体场景。每一步只提供引导问题与 3 个参考案例，不代用户生成答案；整个创作过程（含每一步的修改）存入数据库，完成后可在场景卡与“创作过程回放”中回看想法如何从模糊变为具体。

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
- `GET /api/workbench/steps`：工作台四步的引导问题与参考案例（不含答案）
- `GET /api/workbench/projects` / `POST /api/workbench/projects`：创作列表 / 输入主题创建创作
- `GET /api/workbench/projects/:id`：一次创作的完整过程（每一步的草稿与时间）
- `PUT /api/workbench/projects/:id/theme`：修改主题
- `PUT /api/workbench/projects/:id/steps/:stepId`：保存某一步的回答（服务端逐字段校验）
- `POST /api/workbench/projects/:id/complete`：四步全部写完后形成场景卡

数据库文件为项目根目录的 `lab.db`，首次启动会自动创建表结构和示例进度。
