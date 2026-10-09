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
| `author_org_type` | `department`（HR 部门） \| `project`（HR 项目） \| `free_text`（手填的部门 / 机构，仅外部人士） | 见 `directory-010-admin` §6，AC-003、AC-005 |
| `check_in_status` | `pending`（未签到） \| `checked_in`（已签到） | 见需求文档 §5 状态机 |
| `check_in_result` | `success`（签到成功） \| `already_checked_in`（已签到） \| `invalid_code`（无效的签到码） \| `out_of_window`（不在签到时间内） \| `no_permission`（无签到权限） | 扫码签到的五种结果，见需求文档 §8、AC-016～AC-020 |

## 获取报名统计与名单

`GET /mcc-api/aiis-admin/registration`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `celebration_id` | string | 是 | 报名管理页面绑定单个 Celebration，AC-005 |
| `name` | string | 否 | 姓名搜索关键字，包含匹配、英文不区分大小写，匹配 `list[].author_name`；最多 50 字符，首尾空格忽略，全空格视为未传，AC-027、AC-028 |
| `org_keyword` | string | 否 | 部门 / 类型搜索关键字，包含匹配、英文不区分大小写；同时匹配 `list[].author_org` 与类型名称（`author_type` 对应的「内部员工」「外部人士」），因此传「外部」命中全部外部人士，AC-029；最多 50 字符 |
| `contact` | string | 否 | 联系电话搜索关键字，只比较数字：服务端先去掉非数字字符再做包含匹配，对 `list[].contact` 同样去掉非数字字符后比较；去掉非数字后为空视为未传；`contact` 为 `null` 的记录在传了该参数时不命中，AC-030；最多 50 字符 |

三个搜索参数同时传为「且」，并与 `celebration_id` 同时生效；都不传则不过滤，AC-031。搜索由服务端完成（不是前端在当前页内过滤），AC-034。参数校验（长度上限）见需求文档 §8。

分页：列表部分见 `conventions.md`

**排序**：默认按创建时间倒序，没有排序参数；先应用筛选、再排序、最后分页，AC-024，规则见 `conventions.md`「列表默认排序」。名单（`list[]`）按 `registered_at` 排序，它就是该记录的创建时间。

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `summary.registered_count` | number | 已报名人数：按 `celebration_id` 与搜索参数过滤后的结果统计，随搜索变化，AC-001/AC-002/AC-003、AC-032 |
| `summary.checked_in_count` | number | 已签到人数：统计口径同上，AC-032 |
| `summary.capacity` | number \| null | 名额上限，留空为不限，见 `celebration-007-admin` §6；是 Celebration 自身的设定值，**不随搜索参数变化**，AC-032 |
| `list[].id` | string | 报名记录ID |
| `list[].celebration_id` | string | 归属 Celebration ID，AC-005 |
| `list[].celebration_site` | string | 归属 Celebration 的 Site 名称（列表展示用），AC-005 |
| `list[].author_type` | string（枚举） | |
| `list[].author_name` | string | |
| `list[].author_employee_id` | string \| null | 仅 `author_type=internal`：HR 员工 ID |
| `list[].author_org` | string \| null | 所属名称：内部员工为所选部门 / 项目名称，外部人士为手填的部门或头衔；留空展示为"—"，见需求文档 §8 |
| `list[].author_org_type` | string（枚举）\| null | 见枚举总表；未填为 `null` |
| `list[].author_org_id` | string \| null | 仅 `department` / `project`：HR ID |
| `list[].contact` | string \| null | 联系电话；员工自主报名必有值（中国 11 位或新加坡 8 位手机号，AC-014），行政代报名未填为 `null`，名单展示为"—"，AC-012 |
| `list[].email` | string \| null | 邮箱地址；员工自主报名必有值，行政代报名未填为 `null`，名单展示为"—"，AC-007 |
| `list[].remark` | string \| null | 备注 |
| `list[].check_in_status` | string（枚举） | 见枚举总表 |
| `list[].registered_at` | string(ISO 8601) | 报名时间 |
| `list[].check_in_code` | string | 签到码，仅对行政返回，用于"查看签到码"发给外部人士，AC-021；不可预测、不含个人信息 |

## 手动代报名

`POST /mcc-api/aiis-admin/registration`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `celebration_module_id` | string | 是 | 须为 `module_type=registration` 的 CelebrationModule，见 `celebration-007-admin` §6，AC-003 |
| `author_name` | string | 外部人士必填 | AC-003。**内部员工不传**，姓名由后端按员工 ID 从 HR 取 |
| `author_type` | string（枚举） | 否 | |
| `author_employee_id` | string | 内部员工必填 | HR 员工 ID，AC-025；外部人士传了被拒绝，`directory-010-admin` AC-007 |
| `author_org` | string | 否 | 仅外部人士：部门 / 头衔，自由文本 |
| `author_org_type` | string（枚举） | 否 | 仅内部员工：`department` / `project`，与 `author_org_id` 同传，二选一 |
| `author_org_id` | string | 否 | 仅内部员工：HR 的部门 / 项目 ID，默认带出所选员工的 HR 部门，可改，可不传 |
| `contact` | string | 否 | 联系电话，选填，不校验格式（外部人士号码格式不一），AC-012；内部员工由页面从 `GET /hrEmployee` 的 `phone` 带出到输入框，可修改，传的是输入框里的值，AC-026 |
| `email` | string | 否 | 选填；填写则须符合邮箱格式、≤100 个字符，AC-008；内部员工由页面从 `hrEmployee.email` 带出，可修改，AC-026 |
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

身份维度：该接口外部人员仍可调用；页面先按 `GET /viewer`（见 `API-identity-009-admin.md`）判定，`viewer_type=external` 时无论 `registered`、`is_full` 取值，「立即报名」都不显示（也就不会出现「报名人数已达上限」），AC-023。`GET /registrationCode` 只允许员工调用，外部人员被拒绝（`identity_error=not_employee`）。

前端据此决定按钮文案：`registered` → 「已报名 ✓」；否则 `is_full` → 「报名人数已达上限」（置灰）；否则「立即报名」。用户端不展示名额的具体数字。

用户端员工自主报名的接口尚未在本清单中；补充时 `email` 为必填（符合邮箱格式、≤100 个字符，前端拦截 + 后端二次校验），AC-006；名额已满时须拒绝并返回「报名人数已达上限」，剩余名额竞争时由后端保证不超额，AC-011。

## 获取我的签到码（用户端）

`GET /mcc-api/aiis-admin/registrationCode`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `celebration_id` | string | 是 | |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `code` | string | 当前用户在该 Celebration 的签到码；二维码内容就是这个值；只能取到本人的，AC-015；未报名或已取消报名时返回错误 |

## 扫码签到（持签到权限的人员）

`POST /mcc-api/aiis-admin/registration/check-in-by-code`　AC-016～AC-020

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `code` | string | 是 | 扫到的（或手动输入的）签到码 |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `result` | string（枚举） | 见枚举总表 `check_in_result`；除 `no_permission` 外 HTTP 都正常返回，由前端按 `result` 展示结果页 |
| `author_name` | string \| null | 仅 `success` / `already_checked_in` 返回，供现场核对本人 |
| `author_org` | string \| null | 部门或所属机构，同上 |
| `celebration_site` | string \| null | 所属 Celebration 的 Site 名称，同上 |

签到时间窗口（开始前 6 小时起，到结束日期当天结束止，按 `Asia/Singapore`）、签到码是否有效、是否已签到、调用者是否有签到权限，全部由后端判定，AC-018。结果页不返回电话、邮箱。

**权限**：见需求文档 §7（签到权限）

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
