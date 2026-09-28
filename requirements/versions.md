# 需求索引 + 派生完成度 + 依赖树

## 索引

| 编号 | 模块 | 端侧 | 标题 | 状态 | API | 原型 | QA |
|---|---|---|---|---|---|---|---|
| REQ-001 | `activity` | admin | 活动创建、审批与生命周期 | 已确认 | ✅ | ✅ | ✅ |
| REQ-002 | `module` | admin | 活动模块配置与模块库 | 已确认（REQ-007 上线时修订） | ✅（已按挂载对象变更重新生成） | ⚠️需按新接口清单核对/重做（见下方说明） | ✅（已按修订后正文重新生成） |
| REQ-003 | `submission` | admin | 作品管理（涂鸦评选类） | 已确认（REQ-007 上线时修订） | ✅（依赖对象已改为 celebration） | ⚠️需按新接口清单核对/重做（见下方说明） | ✅（已按修订后正文重新生成） |
| REQ-004 | `registration` | admin | 报名管理 | 已确认（REQ-007 上线时修订） | ✅（依赖对象已改为 celebration，新增字段） | ⚠️需按新接口清单核对/重做（见下方说明） | ✅（已按修订后正文重新生成） |
| REQ-005 | `wall` | admin | 寄语墙管理 | 已确认 | ✅ | ✅（同上） | ✅ |
| REQ-006 | `stats` | admin | 数据统计看板 | 草稿 | ⬜ | ✅（同上，示例数据） | ⬜ |
| REQ-007 | `celebration` | admin | 活动 Celebration 管理 | 已确认 | ✅ | ⚠️探索性草图，字段待按本文档与新接口清单重做，见该文档 §9 | ✅ |
| REQ-008 | `sponsor` | admin | 赞助商管理 | 已确认 | ✅ | ⚠️探索性草图，字段待按本文档与新接口清单重做，见该文档 §9 | ✅ |

取新编号从 `REQ-009` 开始。

## 原型文件说明（命名约定的一处例外）

`prototypes/activity-001-admin-pc.html` 是与产品经理逐轮确认过的**成品原型**，单文件内实现了 `activity`/`module`/`submission`/`registration`/`wall`/`stats` 六个模块在管理端(pc)的全部页面与真实交互逻辑（非 `_shared` 脚手架生成的示意版）。

这是对「一个原型文件对应一个模块编号」命名约定的**有意例外**——六个模块共用同一套侧边栏导航和页面壳，拆成六个文件反而会割裂真实的导航体验、并造成六份重复的壳代码。后续：

- 需求变更影响到某个模块的页面，直接改这一个文件里对应的区块，不需要新建文件。
- 新模块如果同样要接入这套导航壳，追加到这个文件里；如果是完全独立的新端侧/新流程（不共享导航壳），再用标准的 `/proto` 走 `_shared` 脚手架单独生成。
- 本文件不依赖 `prototypes/_shared/`（自带完整样式与交互脚本），`rules/prototype-rules.md` 对它不强制适用；`_shared` 脚手架保留给未来新模块用标准流程生成时使用。

`prototypes/celebration-007-admin-pc.html`（Celebrations 管理，admin 视角）与 `prototypes/celebration-007-user-h5.html`（Celebration 详情页，用户端预览）是第二处例外：这两个文件在**先原型后需求**的探索节奏下诞生（先画草图确认交互，再回头写 REQ-007，属于 `rules/prototype-rules.md` 规则 5 明确允许但要求事后核对的情形），视觉上复用了 `activity-001-admin-pc.html` 的同一套样式以保持一致，但各自是独立文档、不共享其 SPA 状态与导航壳（互相跳转走真实的页面跳转/URL hash，而不是 JS 切换）。字段名与枚举值尚未对照 `outputs/api/` 核实，正式 `/proto` 重跑前不视为定稿。

## 依赖树

```
REQ-001 activity（活动主体与审批）
 ├─ REQ-002 module（依赖活动才能挂载模块；现仅覆盖 CEO致辞/历史时间轴/周年博客列表/寄语墙）
 │   └─ REQ-005 wall（依赖 module=寄语墙类型）
 ├─ REQ-007 celebration（依赖活动；承载报名信息、涂鸦展示两类模块，替代原先由 activity 直接承载）
 │   ├─ REQ-003 submission（依赖 celebration 承载的涂鸦展示模块）
 │   └─ REQ-004 registration（依赖 celebration 承载的报名信息模块）
 ├─ REQ-008 sponsor（依赖活动，与 celebration 无关）
 └─ REQ-006 stats（聚合 001/003/004/005/007/008 的数据，最后实现）
```

## 备注

- REQ-007 引入后，`module-002-admin` 不再承载报名信息、涂鸦展示两类模块的挂载规则（迁移至 `celebration-007-admin`），`submission-003-admin`、`registration-004-admin` 的依赖对象相应从 `module-002-admin`/`activity-001-admin` 改为 `celebration-007-admin`；三者的正文与 `outputs/api/` 已同步修订完成。
- `prototypes/activity-001-admin-pc.html`（模块库/作品管理/报名管理相关区块）与 `prototypes/celebration-007-admin-pc.html`、`prototypes/celebration-007-user-h5.html` 均建于接口清单重新生成之前，字段名/枚举值需对照上述最新 `outputs/api/` 逐一核对后重做，核对完成前不视为定稿（`rules/prototype-rules.md` 规则 5）。
- REQ-005 的接口清单/原型/QA 三项派生物已全部补齐（原型见上方说明的共用文件）。`module-002-admin` §8 的联动校验（活动仅内部可见 × 寄语墙允许外部留言）阻断方式仍是未决的已知缺口，`API-module-002-admin.md`、`QA-module-002-admin.md`、`QA-wall-005-admin.md` 均已标注待该缺口决议后细化。
- REQ-006 的业务逻辑讨论较浅（现有原型里的图表和指标是示例数据），标记「草稿」，正式排期前需要行政确认具体统计口径。
- REQ-002/003/004/007/008 的 `outputs/qa/` 已按最新正文重新生成；`QA-module-002-admin-003/004` 编号留空并加注说明，未重排后续编号。
