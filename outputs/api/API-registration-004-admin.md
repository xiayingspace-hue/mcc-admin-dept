---
编号: API-registration-004-admin
对应需求: REQ-004
状态: 草案
---

# 报名管理 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式见 `background/conventions.md`，不在此重复。**变更说明（自 REQ-007 起）**：报名记录归属对象从"活动模块"改为"Celebration 下挂载的报名信息模块"，本清单绑定维度从 `activity_id` 改为 `celebration_id`，同一活动下不同 Celebration 的数据互相独立。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `author_type` | `internal`（内部员工） \| `external`（外部人士） | 见需求文档 §6 |
| `check_in_status` | `pending`（未签到） \| `checked_in`（已签到） | 见需求文档 §5 状态机 |

## 获取报名统计与名单

`GET /mcc-api/aiis-admin/registration`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `celebration_id` | string | 是 | 报名管理页面绑定单个 Celebration，AC-005 |

分页：列表部分见 `conventions.md`

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `summary.registered_count` | number | 已报名总数，AC-001/AC-002/AC-003 联动的统计数字 |
| `summary.checked_in_count` | number | 已签到人数 |
| `summary.capacity` | number \| null | 名额上限，留空为不限，见 `celebration-007-admin` §6 |
| `list[].id` | string | 报名记录ID |
| `list[].celebration_id` | string | 归属 Celebration ID，AC-005 |
| `list[].celebration_site` | string | 归属 Celebration 的 Site 名称（列表展示用），AC-005 |
| `list[].author_type` | string（枚举） | |
| `list[].author_name` | string | |
| `list[].author_org` | string \| null | 部门或头衔，留空展示为"—"，见需求文档 §8 |
| `list[].contact` | string \| null | 联系电话；员工自主报名必有值（11 位手机号），行政代报名未填为 `null`，名单展示为"—"，AC-012 |
| `list[].email` | string \| null | 邮箱地址；员工自主报名必有值，行政代报名未填为 `null`，名单展示为"—"，AC-007 |
| `list[].remark` | string \| null | 备注 |
| `list[].check_in_status` | string（枚举） | 见枚举总表 |
| `list[].registered_at` | string(ISO 8601) | 报名时间 |

## 手动代报名

`POST /mcc-api/aiis-admin/registration`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `celebration_module_id` | string | 是 | 须为 `module_type=registration` 的 CelebrationModule，见 `celebration-007-admin` §6，AC-003 |
| `author_name` | string | 是 | AC-003 |
| `author_type` | string（枚举） | 否 | |
| `author_org` | string | 否 | |
| `contact` | string | 否 | 联系电话，选填，不校验格式（外部人士号码格式不一），AC-012 |
| `email` | string | 否 | 选填；填写则须符合邮箱格式、≤100 个字符，AC-008 |
| `remark` | string | 否 | |

名额上限已设置且报名人数（含代报名，不论是否已签到）达到上限时，后端拒绝本接口并返回「报名人数已达上限」，不产生记录，AC-013。

**响应字段**

同「获取报名统计与名单」`list[]` 单条结构，新建后 `check_in_status` 固定为 `pending`。

**权限**：见需求文档 §7
**校验**：见需求文档 §8

## 获取报名入口状态（用户端）

`GET /mcc-api/aiis-admin/registrationEntry`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `celebration_id` | string | 是 | |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `registered` | boolean | 当前用户是否已报名；为 `true` 时按钮显示「已报名 ✓」，优先于已满 |
| `is_full` | boolean | 名额上限已设置且报名人数（含代报名）达到上限；`capacity` 为空时恒为 `false`，AC-009 |

前端据此决定按钮文案：`registered` → 「已报名 ✓」；否则 `is_full` → 「报名人数已达上限」（置灰）；否则「立即报名」。用户端不展示名额的具体数字。

用户端员工自主报名的接口尚未在本清单中；补充时 `email` 为必填（符合邮箱格式、≤100 个字符，前端拦截 + 后端二次校验），AC-006；名额已满时须拒绝并返回「报名人数已达上限」，剩余名额竞争时由后端保证不超额，AC-011。

## 签到 / 撤销签到

`POST /mcc-api/aiis-admin/registration/check-in`　AC-001：`pending` → `checked_in`
`POST /mcc-api/aiis-admin/registration/check-out`　AC-001：`checked_in` → `pending`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 报名记录ID |

**权限**：见需求文档 §7

## 取消报名

`DELETE /mcc-api/aiis-admin/registration`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 报名记录ID |

记录直接移除；二次确认为前端交互行为，见需求文档 §8，不在本接口体现。

**权限**：见需求文档 §7
