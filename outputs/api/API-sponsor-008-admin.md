---
编号: API-sponsor-008-admin
对应需求: REQ-008
状态: 草案
---

# 赞助商管理 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式见 `background/conventions.md`，不在此重复。本清单同时包含用户端提交入口与管理端跟进入口，两者路径前缀相同（`/mcc-api/aiis-admin`），因为需求文档 §9 页面清单同时覆盖了这两个页面。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `tier` | `silver` \| `gold` \| `platinum` \| `custom` | 意向赞助等级，见需求文档 §6 |
| `follow_up_status` | `pending`（待联系） \| `contacted`（已联系） | 见需求文档 §5 状态机 |

## 提交赞助意向（用户端）

`POST /mcc-api/aiis-admin/sponsorLead`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 是 | |
| `company_name` | string | 是 | AC-001 |
| `contact_person` | string | 是 | AC-001 |
| `designation` | string | 是 | AC-001 |
| `email` | string | 是 | 需符合邮箱格式，AC-002 |
| `phone` | string | 是 | AC-001 |
| `tier` | string（枚举） | 否 | |
| `custom_tier_note` | string | `tier=custom` 时必填 | 自定义赞助说明，不超过 200 个字符（汉字 / 字母 / 标点 / 空格 / 换行各按 1 个计），空格不算内容；`tier` 不是 `custom` 时传了被忽略、不保存，AC-008、AC-011 |
| `message` | string | 否 | |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 赞助线索ID |
| `follow_up_status` | string（枚举） | 新建后固定为 `pending`，AC-003 |

**权限**：见需求文档 §7（无需登录，不做身份校验）
**校验**：见需求文档 §8

## 获取赞助线索列表（管理端）

`GET /mcc-api/aiis-admin/sponsorLead`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 否 | 不传即跨活动查看全部，AC-006 |
| `follow_up_status` | string（枚举） | 否 | 不传即全部状态 |

分页：见 `conventions.md`

**排序**：默认按创建时间倒序，没有排序参数；先应用筛选、再排序、最后分页，AC-017，规则见 `conventions.md`「列表默认排序」。按 `submitted_at` 排序，它就是该线索的创建时间。

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 赞助线索ID |
| `activity_id` | string | 所属活动ID |
| `activity_title` | string | 所属活动标题（列表展示用） |
| `company_name` | string | |
| `contact_person` | string | |
| `designation` | string | |
| `email` | string | |
| `phone` | string | |
| `tier` | string（枚举） \| null | |
| `custom_tier_note` | string \| null | 自定义赞助说明；仅 `tier=custom` 时有值，列表展示为"Custom：xxx"，AC-010 |
| `message` | string \| null | |
| `submitted_at` | string(ISO 8601) | |
| `follow_up_status` | string（枚举） | 见枚举总表，AC-004 联动导航角标数字 |

## 导出赞助线索（管理端）

`GET /mcc-api/aiis-admin/sponsorLead/export`　AC-012～AC-016

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 否 | 与列表同一筛选条件；不传即导出全部活动的所有线索，AC-013 |

不分页：返回满足条件的全部线索。后端按导出那一刻的最新数据生成，AC-015。

**响应**：Excel 文件（`.xlsx`）的文件流，文件名 `赞助商线索_<活动名或全部活动>_<导出日期>.xlsx`；列依次为所属活动、公司名称、联系人、职位、邮箱、电话、意向赞助等级、自定义赞助说明、留言 / 特殊需求、提交时间（新加坡时间，`yyyy-MM-dd HH:mm`）、跟进状态（中文），AC-014。

**权限**：见需求文档 §7（仅行政；非行政返回无权限，AC-016）
**校验**：见需求文档 §8

## 标记跟进状态

`POST /mcc-api/aiis-admin/sponsorLead/mark-contacted`　AC-005：`pending` → `contacted`
`POST /mcc-api/aiis-admin/sponsorLead/mark-pending`　AC-005：`contacted` → `pending`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 赞助线索ID |

**权限**：见需求文档 §7（仅行政可调用；本对象不提供删除接口）
