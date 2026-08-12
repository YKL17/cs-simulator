# CS Career Simulator

**CS Career Simulator** 是一个纯前端的 Counter-Strike 职业选手生涯模拟游戏。

你会从一名职业新人开始，在现役战队生态中训练、争夺首发、处理队内关系、备战赛事、转会、冲击世界排名与 Major，并尝试在最多 10 年的职业生涯里成为真正的传奇选手。

> **Current version: 2.17**  
> 无需注册账号。存档保存在当前浏览器的 Local Storage 中。

## 🎮 在线游玩

**Live Demo:** https://ykl17.github.io/cs-simulator/
or https://cs-simulator.ykl17.workers.dev/

**Repository:** https://github.com/YKL17/cs-simulator

如果你喜欢这个项目，欢迎在 GitHub 点一个 ⭐ Star。

---

## ✨ 当前主要内容

### 🧑‍💻 职业生涯

- 多种初始出身与不同成长路线
- 枪法、战术、教练评价、心态、金币等长期属性
- 训练、团队磨合、赛事备战、打工等月度行动
- 角色从替补、轮换、首发到队内核心的变化
- 最长 **10 年**职业生涯
- 可以随时在设置中主动退役，第 10 年结束后强制退役

### 🏆 赛事系统

游戏包含完整的分层赛事体系：

- **C / B / A / S 级常规赛事**
- **Spring Major / Winter Major**
- Major 月与普通赛事分离
- 常规赛事根据世界排名决定参赛层级与邀请资格
- 玩家赛事只进行一次正式结算，避免后台与手动操作重复生成结果
- 比赛前会出现临场选择，不同决定会影响最终胜率

当前备战规则：

- **赛事备战：+10 准备度**
- **分析师加班：+5 准备度**
- **专项赛事集训：+10 准备度**
- 单项赛事准备度上限为 **20/20**
- 每项赛事拥有独立准备度，不会继承上一场赛事

### 📊 Rating 与年度 Top 20

个人赛事表现以 **Rating** 为核心，而不是累计击杀数。

- 战绩中心记录每项赛事 Rating
- 生涯统计展示平均 Rating
- 年度 Top 20 使用全年 Rating 与荣誉表现计算
- 年末 Top 20 会在 **Winter Major 完整结束后**结算
- 支持多次年度 Top 1 生涯记录与相关成就

### 🌍 战队与世界排名

- 32 支现役战队池
- 动态世界排名与赛事积分
- 不同强度战队拥有不同基础实力
- 队内采用统一关系值，而不是每名队友分别维护关系
- 团队磨合可以免费提高队内关系
- 也可以花金币进行更高收益的队友互动

### 🔁 合同与转会

- 合同会随月份减少并进入续约期
- 合同期内仍可能收到其他战队报价
- 合同到期后可以选择续约
- 如果拒绝续约，可以自由选择加入**平均能力低于自己个人 OVR**的现役战队
- 转会历史会被记录进职业生涯

### 🛒 商店与经济

商店用于恢复、训练、赛事准备和关系维护。

当前主要项目包括：

- 运动恢复包
- 分析师加班
- 专项赛事集训
- 私人教练课
- 全队聚餐
- 队友互动
- 一次性彩蛋 **“小金手指”**

经济系统已经重新平衡，付费服务价格明显高于早期版本，避免金币失去意义。

### 🏅 成就系统

当前共有 **26 项成就**，覆盖短期目标与长期王朝型成就，例如：

- 第一份合同
- 职业首秀
- 队内核心
- 世界第一
- Major Champion
- Major 二连冠
- 一年双 Major
- Major 三冠王 / Major 王朝
- 年度世界第一
- 两度 / 三度 / 五度年度 Top 1
- S 级统治者
- 奖杯收藏家
- Major 决赛常客
- 超级巨星（生涯 Rating）
- 职业常青树

### 💾 保存、载入与设置

游戏右上角提供固定的 **⚙️ 设置** 按钮。

设置中可以：

- 保存到 3 个手动存档槽
- 载入自动存档或手动存档
- 主动宣布退役

游戏每次推进月份时仍会自动保存。

设置面板与赛事、Major、转会等游戏弹窗相互独立，因此可以在重要事件过程中打开设置而不丢失当前决策。

---

## 🎯 游戏目标

这不是一个单纯堆属性就必胜的游戏。

比赛结果会综合考虑：

- 玩家个人 OVR
- 战队整体实力
- 当前世界排名
- 赛事准备度
- 队内关系
- 首发 / 轮换 / 替补身份
- 临场战术选择
- 随机状态波动

即使满属性加入顶级战队，也不会保证 Major 或 S 级赛事必定夺冠。

你可以选择成为长期效力豪门的核心，也可以在合同到期后主动加入更弱的队伍，尝试带队完成不同的职业故事。

---

## 🗓️ 一个典型赛季

常规月份主要进行 S / A / B / C 级赛事与训练。

- **6 月：Spring Major**
- **12 月：Winter Major**
- Winter Major 完成后进行年度 Top 20 评选

赛事结束后，成绩、Rating、奖金和世界排名积分会统一写入战绩系统。

---

## 🛠️ 技术栈

- HTML / CSS / JavaScript
- Vite
- TypeScript tooling
- Font Awesome
- Local Storage saves
- GitHub Actions
- GitHub Pages

项目采用“原始核心 + 模块化系统层”的结构。基础界面和部分早期逻辑仍位于 `index.html`，后续职业系统、赛事、排名、战队、存档、设置和平衡性修复位于 `public/` 下的独立脚本中。

当前版本号 **2.17** 对应最新的 v17 系统层。

---

## 🚀 本地运行

### Requirements

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/YKL17/cs-simulator.git
cd cs-simulator
npm install
npm run dev
```

默认开发地址：

```text
http://localhost:3000
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

---

## 📁 项目结构

```text
cs-simulator/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── public/
│   ├── team-system.js
│   ├── tournament-world.js
│   ├── event-system-v4.js
│   ├── competition-calibration-v6.js
│   ├── major-month-fix-v7.js
│   ├── annual-rating-v10.js
│   ├── single-event-result-v11.js
│   ├── prep-state-fix-v12.js
│   ├── economy-prep-v13.js
│   ├── career-expansion-v14.js
│   ├── retirement-choice-v15.js
│   ├── settings-system-v17.js
│   └── branding-v17.js
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🧪 项目状态

这个项目仍在持续更新，当前重点是：

- 修复复杂职业流程中的状态冲突
- 调整赛事概率与经济平衡
- 完善 Major、世界排名与年度荣誉逻辑
- 丰富长期职业生涯事件与成就
- 优化桌面端与移动端

如果试玩时发现赛事重复结算、准备度异常、存档问题、转会逻辑问题或其他 Bug，欢迎提交 GitHub Issue。

---

## 🤝 Feedback

欢迎通过 GitHub Issues 提交：

- Bug report
- 平衡性建议
- 新赛事 / 新成就想法
- UI / UX 建议

如果这个项目对你有趣，也欢迎 Star 支持后续更新。

## 📄 License

目前仓库尚未添加开源许可证。如需复用或分发代码，请先联系项目作者。
