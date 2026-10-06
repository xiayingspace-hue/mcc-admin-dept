---
编号: API-activity-011-admin
对应需求: REQ-011
状态: 草案
---

# 已发布活动的模块配置修改 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式、时间格式见 `background/conventions.md`，不在此重复。活动状态 `status`、审批视角 `viewer_role` 的取值沿用 `API-activity-001-admin.md`，模块类型 `module_type` 与模块字段沿用 `API-module-002-admin.md`，本清单不重新定义。
>
> **与 `API-module-002-admin.md` 的关系**：`PUT /activityModule`（002）仍只在活动处于草稿 / 已驳回时可调用，不变；已发布后的修改走本清单新增的 `activityModule/adjust`，两条路径互不混用（需求 §5.2、§7）。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `uneditable_reason` | `not_published`（活动不是已发布，含审批中 / 草稿 / 已驳回 / 已结束） \| `no_permission`（当前用户不是行政） | 需求 §7；`editable` 为 `true` 时不返回 |
| `change_field` | `enabled`（启用状态） \| `display_start_time`（开始展示时间） \| `sort_order`（排序） \| `message_deadline`（留言截止时间，仅 `wall`） | 修改记录里「改了哪一项」，对应需求 §6 配置修改记录；取自 `API-module-002-admin.md` 里 `activityModule` 的字段，002 新增字段时这里同步增补 |
| `adjust_error` | `activity_not_published`（活动已不是已发布，如编辑期间被下线） \| `field_out_of_scope`（请求夹带了模块配置以外的内容，或带了已下线（`ceo_speech`、`timeline`）/ 挂载在 Celebration 上 / 其他不属于活动的模块类型） \| `config_version_conflict`（配置已被他人修改） \| `deadline_in_past`（截止时间早于保存时刻） \| `display_start_in_future`（已开始展示的模块把开始展示时间改到未来） \| `validation_failed`（沿用 `module-002-admin` §8 的校验未通过，如开始展示时间晚于截止时间） \| `no_permission`（非行政） \| `log_write_failed`（修改记录写入失败，本次保存整体失败，配置不变） | 保存被拒绝的原因，对应需求 §8；前端据此显示不同提示（AC-004、AC-005、AC-008、AC-009、AC-010、AC-011、AC-012） |
| `log_error` | `forbidden_viewer`（审批人视角，不返回修改记录） | 对应需求 §7、AC-021 |

## 获取可调整的模块配置（含是否可编辑）

`GET /mcc-api/aiis-admin/activityModule/adjust`

活动详情页用它判断是否显示「编辑模块配置」入口；进入编辑页时用它回显当前配置，并取得保存时需带回的配置版本。对任何状态的活动都可调用；不可编辑时仍返回当前配置供只读查看。

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 是 | |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `editable` | boolean | 当前用户在当前活动状态下是否可以修改模块配置；前端据此显示或隐藏「编辑模块配置」入口，AC-001、AC-006、AC-015 |
| `uneditable_reason` | string（枚举） | 见枚举总表 `uneditable_reason`；`editable` 为 `true` 时不返回 |
| `config_version` | string | 当前模块配置版本，保存时原样带回，用于识别并发修改，AC-011；每次成功保存后变化，具体形式由后端定 |
| `modules[]` | array | 已启用的活动模块，结构与 `API-module-002-admin.md`「获取活动已配置的模块」的响应一致（`module_type`、`category`、`display_start_time`、`sort_order`、`message_deadline`）；未启用的类型不出现 |

**权限**：见需求文档 §7

## 保存已发布活动的模块配置

`PUT /mcc-api/aiis-admin/activityModule/adjust`

只允许活动处于 `published` 时调用。请求体只能出现本表列出的字段，出现任何其他字段（如标题、时间、地点、预算、简介、封面图、附件、布局模板、审批人）整个请求被拒绝，AC-004；`modules[].module_type` 出现 `blog_list`、`wall` 以外的取值（含已下线的 `ceo_speech`、`timeline`，以及 `doodle_vote`、`registration`）同样整个请求被拒绝，AC-023。

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 是 | |
| `config_version` | string | 是 | 进入编辑页时取得的版本；与服务端当前版本不一致时拒绝，AC-011 |
| `modules` | array | 是 | 保存后要启用的全部活动模块（限 `blog_list`/`wall`）；本次要停用的类型不出现在数组中即视为停用，停用不删除已有数据，AC-007 |
| `modules[].module_type` | string（枚举） | 是 | |
| `modules[].display_start_time` | string(ISO 8601) | 否 | 校验见需求 §8（沿用 002 规则；已开始展示的不得改到未来，AC-009） |
| `modules[].sort_order` | number | 是 | |
| `modules[].message_deadline` | string(ISO 8601) | 否，仅 `wall` | 校验见需求 §8（须晚于活动计划开始时间、不得早于保存时刻；已过期的可改到未来以重新开放，AC-019） |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `config_version` | string | 保存成功后的新版本 |
| `modules[]` | array | 保存后已启用的模块，结构同上一个接口 |

**错误**：请求被拒绝时返回的 `error`，取值见枚举总表 `adjust_error`。

**权限**：见需求文档 §7
**校验**：见需求文档 §8

## 获取修改记录（活动详情页「修改记录」区块）

`GET /mcc-api/aiis-admin/activityModuleLog`

按修改时间倒序（最新在前），分页：见 `background/conventions.md`。任何活动状态都可调用（`已结束` 后仍可查看，AC-018）；审批人视角（`viewer_role` 为 `approver`）调用被拒绝，AC-021。

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 是 | |

分页参数按 `conventions.md` 的默认规则传，不在此重复定义。

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `total` | number | 该活动的修改记录总数；为 0 时前端显示「暂无修改记录」，AC-016 |
| `items[]` | array | 当前页记录，每项含下表字段 |

`items[]` 每项：

| 字段 | 类型 | 说明 |
|---|---|---|
| `log_id` | string | 记录ID，只读 |
| `operator_id` | string | 操作行政的员工ID |
| `operator_name` | string | 操作行政姓名，AC-012、AC-016 |
| `operated_at` | string(ISO 8601) | 修改时间（保存成功时刻），AC-012 |
| `changes[]` | array | 本次保存改动的项，至少一项；每项含下表字段 |

`changes[]` 每项：

| 字段 | 类型 | 说明 |
|---|---|---|
| `module_type` | string（枚举） | 改动涉及的模块，见 `API-module-002-admin.md` 的 `module_type` |
| `field` | string（枚举） | 见枚举总表 `change_field` |
| `before` | string \| number \| boolean \| null | 改前值；`enabled` 为布尔，时间为 ISO 8601，原本未填为 `null` |
| `after` | string \| number \| boolean \| null | 改后值，同上；改为未填为 `null` |

**错误**：审批人视角被拒绝时返回的 `error` 为 `log_error` 的 `forbidden_viewer`。

**权限**：见需求文档 §7（发起人视角、只读访客视角可调用，审批人视角不可）
**校验**：无写入，不适用。修改记录由「保存已发布活动的模块配置」成功时写入，没有单独的新增、修改、删除接口（只增不改不删，需求 §6）。

## 需求覆盖对照

| 需求页面 / 状态 | 对应接口 |
|---|---|
| 「修改记录」区块（normal / empty / error / overflow / loading） | `GET /activityModuleLog`（`total=0` 对应 empty；分页对应 overflow） |
| 「编辑模块配置」入口（normal / noperm） | `GET /activityModule/adjust` 的 `editable`、`uneditable_reason` |
| 编辑模块配置页（normal / loading） | `GET /activityModule/adjust`（回显 + 取版本） |
| 编辑模块配置页的各类 error（校验不通过 / 保存失败 / 版本冲突 / 活动已不是已发布） | `PUT /activityModule/adjust` 的 `adjust_error` |
| 编辑模块配置页的 noperm（直接访问） | `GET` 返回 `editable=false`；`PUT` 返回 `no_permission` |
| 需求 AC-013（外部可见性独立保存） | 沿用 `PATCH /activity/visibility`（`API-activity-001-admin.md`），本清单不新增 |
| 需求 AC-020（寄语墙停用后管理端仍可处理历史留言） | 沿用 `API-wall-005-admin.md` 的留言接口，本清单不新增；是否需要在其接口说明里取消「模块必须启用」的限制，见 `wall-005-admin` §3 的例外说明 |
