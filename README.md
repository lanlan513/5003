# 导演学习实验室 · Director's Lab

一个场景驱动的导演方法学习 MVP。用户从“今天片场”进入具体场景，通过镜头、场面调度、声音和剪辑的选择理解导演决策；选择会写入 SQLite 学习档案。

另有**「从主题到场景」导演工作台**：学习一部作品不从拍摄开始，而是从一个简单主题出发，分四步（核心表达 → 人物关系 → 冲突时刻 → 场景目标/观看体验）逐步形成具体场景。每一步只提供引导问题与 3 个参考案例，不代用户生成答案；整个创作过程（含每一步的修改）存入数据库，完成后可在场景卡与“创作过程回放”中回看想法如何从模糊变为具体。

另有**「拍摄条件决策」片场模拟**：给定一个固定剧本《等不到的人》（6 个节拍），后端随机抽取当日的拍摄条件——演员数量、群演数量、可用场地、拍摄档期（日/夜/黄昏）、灯光设备等级、镜头上限。用户为每个节拍决定**保留原样 / 换一种拍法（具体的改编方案）/ 舍弃**，并写下整体策略；系统同时计算**执行可行度**与**表达保留度**两个维度：

- 评分**不按成本最低**：全部舍弃的方案执行可行度 100、表达保留度 0，总分垫底；超出演员/群演/镜头/灯光条件的方案直接判定“纸面上就拍不出来”，封顶 54 分。
- 高保真改编（用声音、物件、长镜头等替代原拍法且保住表达功能）有“改编巧思”加分。
- 场地与档期是**硬约束**：服务端拒绝条件之外的拍法；演员、群演、镜头、灯光是**代价约束**，允许提交但计入不可行标记。
- 限制条件只在服务端用 `crypto` 随机生成一次，以日期为种子落库；刷新页面只会取回同一条任务，不依赖前端随机数。已提交的方案可反复修改重评。

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
- `GET /api/shoot/script`：拍摄模拟的固定剧本与节拍（对前端隐去评分权重）
- `GET /api/shoot/missions/latest` / `POST /api/shoot/missions`：取回当日任务（不存在则由服务端随机生成并落库）
- `GET /api/shoot/missions` / `GET /api/shoot/missions/:id`：往期任务与单日任务详情（含已提交方案与评分）
- `PUT /api/shoot/missions/:id/decision`：提交/修改拍摄方案，服务端校验硬约束并计算双轴评分

数据库文件为项目根目录的 `lab.db`，首次启动会自动创建表结构和示例进度。
