---
编号: API-module-002-admin
对应需求: REQ-002
状态: 草案
---

# 活动模块配置与模块库 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式见 `background/conventions.md`，不在此重复。**变更说明（自 REQ-007 起）**：`doodle_vote`、`registration` 两类模块类型的挂载对象改为 Celebration，其配置接口迁移至 `API-celebration-007-admin.md`（`celebrationModule` 相关接口），本清单的 `activityModule` 接口不再包含这两类模块的字段。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `module_type` | `doodle_vote`（涂鸦展示） \| `wall`（寄语墙） \| `registration`（报名信息） \| `blog_list`（Celebrations，原名「周年博客列表」，仅改显示名称，标识不变） | 见需求文档 §1；`doodle_vote`/`registration` 仅出现在「获取模块类型清单」的只读目录中，不出现在 `activityModule` 接口。`ceo_speech`（CEO致辞）、`timeline`（历史时间轴）已下线，不再是合法取值（见需求文档 §3 变更说明、AC-006），传入会被后端拒绝 |
| `module_category` | `content`（内容型） \| `interactive`（互动型） | 见需求文档 §6，由 `module_type` 派生，只读 |
| `mount_target`（只读） | `activity` \| `celebration` | 该模块类型的挂载对象；`blog_list`/`wall` 为 `activity`，`doodle_vote`/`registration` 为 `celebration` |

## 获取模块类型清单

`GET /mcc-api/aiis-admin/moduleType`

模块库页面共用本接口，收录全部四类模块类型（含挂载在活动上与挂载在 Celebration 上的）；类型数量固定且 ≤10，不分页。

**请求参数**

无

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | string（枚举） | 见枚举总表 `module_type` |
| `name` | string | 模块类型中文名 |
| `category` | string（枚举） | 见枚举总表 `module_category` |
| `mount_target` | string（枚举，只读） | 见枚举总表；前端据此决定跳转到活动步骤二还是 Celebration 表单 |
| `configurable_attrs` | string[] | 可配置属性清单，AC-004 |
| `usage_count` | number | 已被使用的活动/Celebration 数；为 0 时前端展示"暂未被使用"，AC-004 |
| `usage_activities` | string[] | 使用过该类型的活动或 Celebration 名称列表，点击"查看使用记录"后展开，AC-004；`usage_count` 为 0 时为空数组 |

**权限**：见需求文档 §7（全员行政只读）

## 获取活动已配置的模块

`GET /mcc-api/aiis-admin/activityModule`

编辑活动（创建流程步骤二回显、或已保存活动的模块配置查看）时调用；仅返回挂载在活动上的两类模块（`blog_list`/`wall`）。

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 是 | |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `module_type` | string（枚举，限 `blog_list`/`wall`） | 见枚举总表 |
| `category` | string（枚举） | 只读，由 `module_type` 派生 |
| `display_start_time` | string(ISO 8601) \| null | 开始展示时间，未填为 `null` |
| `sort_order` | number | 排序 |
| `message_deadline` | string(ISO 8601) \| null | 仅 `wall` 使用，留言截止时间；不填视为与活动同时结束 |

未启用的 `module_type` 不出现在返回数组中。

## 保存活动模块配置（创建活动步骤二 / 编辑）

`PUT /mcc-api/aiis-admin/activityModule`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 是 | |
| `modules` | array | 是 | 仅包含本次勾选启用的模块（限 `blog_list`/`wall`，传入 `ceo_speech`/`timeline` 等已下线或其他类型整个请求被拒绝，AC-006）；取消勾选的类型不出现在数组中即视为不启用，AC-001 |
| `modules[].module_type` | string（枚举） | 是 | |
| `modules[].display_start_time` | string(ISO 8601) | 否 | 不得晚于该模块自身任何截止时间字段，AC-003 |
| `modules[].sort_order` | number | 是 | |
| `modules[].message_deadline` | string(ISO 8601) | 否，仅 `wall` | 须晚于活动计划开始时间 |

**响应字段**

同「获取活动已配置的模块」响应结构，返回保存后的 `modules[]`。

**权限**：见需求文档 §7（仅活动处于草稿/已驳回状态时可调用）
**校验**：见需求文档 §8
