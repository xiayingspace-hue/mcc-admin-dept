# /proto — 从需求文档 + 接口清单生成可点击原型

用法：`/proto <编号>-<载体>`

前置检查：对应 `outputs/api/API-...md` 必须已存在，不存在先跑 `/api`。

步骤：
1. 读需求文档「页面与状态清单」「验收标准」章节，读对应接口清单确认字段名和枚举值。
2. 读 `rules/prototype-rules.md`、`prototypes/_shared/proto.css`、`tokens.css`、`proto.js` 的既有约定，只复用不新增样式。
3. 按载体选骨架：`pc` 用 `.p-shell`（侧栏+顶栏），`h5`/`native` 用 `.p-phone`（手机边框并排）。
4. 每个页面用 `.p-screen` 包裹，跳转用 `data-goto`，拉数据的区块补满五态 `data-when` 块。
5. 每个非平凡交互挂 `.anno`，`data-note` 回指 AC 编号。
6. 写入 `prototypes/<slug>-<编号>-<端侧>-<载体>.html`，单文件、可双击直接打开。
7. 自查：原型里的字段名/枚举值是否都能在接口清单里找到；五态是否齐全；标注是否都能回指到真实存在的 AC。
