---
编号: API-module-002-admin
对应需求: REQ-002
状态: 草案
---

# 活动模块配置与模块库 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式见 `background/conventions.md`，不在此重复。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `module_type` | `ceo_speech`（CEO致辞） \| `timeline`（历史时间轴） \| `doodle_vote`（涂鸦评选） \| `wall`（寄语墙） \| `registration`（报名信息） \| `blog_list`（周年博客列表） | 见需求文档 §1 |
| `module_category` | `content`（内容型） \| `interactive`（互动型） | 见需求文档 §6，由 `module_type` 派生，只读 |

## 获取模块类型清单

`GET /mcc-api/aiis-admin/moduleType`

模块库页面、创建活动步骤二的勾选列表共用本接口；类型数量固定且 ≤10，不分页。

**请求参数**

无

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `type` | string（枚举） | 见枚举总表 `module_type` |
| `name` | string | 模块类型中文名 |
| `category` | string（枚举） | 见枚举总表 `module_category` |
| `configurable_attrs` | string[] | 可配置属性清单，AC-004 |
| `usage_count` | number | 已被使用的活动数；为 0 时前端展示"暂未被使用"，AC-004 |
| `usage_activities` | string[] | 使用过该类型的活动名称列表，点击"查看使用记录"后展开，AC-004；`usage_count` 为 0 时为空数组 |

**权限**：见需求文档 §7（全员行政只读）

## 获取活动已配置的模块

`GET /mcc-api/aiis-admin/activityModule`

编辑活动（创建流程步骤二回显、或已保存活动的模块配置查看）时调用。

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 是 | |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `module_type` | string（枚举） | 见枚举总表 |
| `category` | string（枚举） | 只读，由 `module_type` 派生 |
| `display_start_time` | string(ISO 8601) \| null | 开始展示时间，未填为 `null` |
| `sort_order` | number | 排序 |
| `submission_deadline` | string(ISO 8601) \| null | 仅 `doodle_vote` 使用，提交截止时间（当前版本含义为"行政编辑作品列表截止"，见需求文档 §5.2） |
| `vote_deadline` | string(ISO 8601) \| null | 仅 `doodle_vote` 使用，投票截止时间 |
| `message_deadline` | string(ISO 8601) \| null | 仅 `wall` 使用，留言截止时间；不填视为与活动同时结束 |
| `allow_external_message` | boolean \| null | 仅 `wall` 使用，是否允许外部人士留言 |

未启用的 `module_type` 不出现在返回数组中。

## 保存活动模块配置（创建活动步骤二 / 编辑）

`PUT /mcc-api/aiis-admin/activityModule`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 是 | |
| `modules` | array | 是 | 仅包含本次勾选启用的模块；取消勾选的类型不出现在数组中即视为不启用，AC-001 |
| `modules[].module_type` | string（枚举） | 是 | |
| `modules[].display_start_time` | string(ISO 8601) | 否 | 不得晚于该模块自身任何截止时间字段，AC-003 |
| `modules[].sort_order` | number | 是 | |
| `modules[].submission_deadline` | string(ISO 8601) | `doodle_vote` 必填 | |
| `modules[].vote_deadline` | string(ISO 8601) | `doodle_vote` 必填 | 须晚于 `submission_deadline`，AC-002 |
| `modules[].message_deadline` | string(ISO 8601) | 否，仅 `wall` | 须晚于活动开始时间 |
| `modules[].allow_external_message` | boolean | `wall` 必填 | 与活动 `external_visible=internal_only` 冲突时的处理方式见需求文档 §11 已知缺口 |

**响应字段**

同「获取活动已配置的模块」响应结构，返回保存后的 `modules[]`。

**权限**：见需求文档 §7（仅活动处于草稿/已驳回状态时可调用）
**校验**：见需求文档 §8
