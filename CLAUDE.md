# CLAUDE.md · Agent 入口

每次在本仓库里工作前先读完本文件。本文件是铁律，`README.md` 是背景说明，两者冲突时以本文件为准。

## 铁律

1. **单一事实源。** `requirements/` 是唯一权威。写 `outputs/api`、`outputs/qa`、`prototypes/` 之前必须先读对应需求文档；三者与需求冲突时，改需求，不在下游打补丁。
2. **先提问，再落笔。** 执行 `/req` 时，若一句话想法缺角色、缺异常路径、缺权限分支、缺非功能要求，最多问 4 个问题一次性问完，不要边写边问。缺口问不出答案的，写进需求文档的「已知缺口」章节并注明谁来定、何时前定——不允许假设后直接写死。
3. **原型只填内容，不做设计。** 一切样式来自 `prototypes/_shared/`。原型 HTML 里不允许出现新的颜色值、新的组件结构；缺组件先扩展 `_shared`，不要在单个原型文件里私自发明。
4. **五态硬性要求。** 任何拉数据的原型页面必须有 `normal / loading / empty / error / noperm / overflow` 六个（含两种 empty）`data-when` 状态块，只画 `normal` 视为未完成。
5. **字段名以接口清单为准。** 原型里出现的字段名、枚举值必须能在 `outputs/api/` 对应文档里找到；先跑 `/api` 再跑 `/proto`，反过来做的原型要重做。
6. **编号只增不减。** `requirements/versions.md` 里的三位编号全局递增、永不复用。新增需求前先看 `versions.md` 取下一个编号。
7. **跨角色才入仓。** 只有一个角色会读的内容（前端组件实现、表结构、部署脚本）不要往这几个目录里塞，参见 `README.md` 的「什么不进本仓」。
8. **可重复执行。** 相同的需求文档，任何 agent 在任何时间生成的 API 清单 / 原型 / QA 用例都应指向同一组字段和同一组 AC，不依赖对话历史里没落盘的信息。

## 命令表

| 命令 | 输入 | 输出 | 对应规则 |
|---|---|---|---|
| `/req <一句话想法>` | 一句话 + 必要时的追问 | `requirements/<端侧>/shared/<模块>-<编号>-<端侧>.md`（载体差异另建） | `rules/requirement-rules.md` |
| `/api <编号>` | 已存在的需求文档 | `outputs/api/API-<模块>-<编号>-<端侧>.md` | `rules/api-rules.md` |
| `/proto <编号>-<载体>` | 需求文档 + 对应接口清单 | `prototypes/<模块>-<编号>-<端侧>-<载体>.html` | `rules/prototype-rules.md` |
| `/qa <编号>` | 需求文档里的 AC 列表 | `outputs/qa/QA-<模块>-<编号>-<端侧>.md` | `rules/qa-rules.md` |
| `/check` | 全仓 | 命名/编号/引用一致性检查报告（终端输出，不落盘） | `rules/global-rules.md` |
| `/new-product` | 无 | 重置 `background/`、清空 `requirements/versions.md`，用于本仓套到下一个产品 | — |

## 本仓当前产品

公司活动运营系统（行政部门内部管理后台 + 员工/外部访客访问的活动页面）。详见 `background/product-overview.md`。
