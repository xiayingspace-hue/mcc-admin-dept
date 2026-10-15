---
编号: API-wall-005-admin
对应需求: REQ-005
状态: 草案
---

# 寄语墙管理 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式见 `background/conventions.md`，不在此重复。用户端员工提交寄语的接口见下方「员工提交留言」，只允许员工调用，外部人员被拒绝并返回 `identity_error`（见 `API-identity-009-admin.md`，AC-015）。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `status` | `review`（待审核） \| `published`（已展示） \| `hidden`（已隐藏） | 见需求文档 §5 状态机；术语沿用 `conventions.md` 状态命名统一术语 |
| `author_type` | `internal`（内部员工） \| `external`（外部人士） | 见需求文档 §6 |
| `author_org_type` | `department`（HR 部门） \| `project`（HR 项目） \| `free_text`（手填的自由文本，仅外部人士；寄语里它就是「公司名称」，其他模块仍是部门 / 机构） | 见 `directory-010-admin` §6，AC-003、AC-005；寄语的例外见 `wall-005-admin` AC-031 |

## 获取留言列表

`GET /mcc-api/aiis-admin/wallMessage`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 否 | 不传即跨活动查看全部；AC-002 支持与 `status` 同时生效（交集） |
| `status` | string（枚举） | 否 | 不传即全部状态 |

分页：见 `conventions.md`

**邮箱**：员工自主提交的邮箱不返回（`email` 为 `null`），AC-030；行政代录入的外部人士留言，`email` 返回其邮箱地址，仅用于编辑表单回显，管理端列表不展示，AC-030、AC-034。邮箱本期只保存，不用于发送邮件。

**已删除的留言不返回**：被行政删除的留言（软删除，见「删除留言」）不出现在本接口的结果里，`status` 枚举也不包含「已删除」，不能作为筛选值，AC-020。

**排序**：默认按创建时间倒序，没有排序参数；先应用筛选、再排序、最后分页，AC-016，规则见 `conventions.md`「列表默认排序」。按 `submitted_at` 排序，它就是该留言的创建时间。

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 留言ID |
| `activity_id` | string | 归属活动ID |
| `activity_title` | string | 归属活动标题（列表展示用） |
| `activity_module_id` | string | 归属的活动模块ID（寄语墙类型），见 `module-002-admin` §6 |
| `content` | string | 留言文本；`hidden` 状态时对外展示占位文案，管理端本接口仍返回原文，见需求文档 §5 |
| `image_url` | string | 配图，必填且仅 1 张，AC-006、AC-009 |
| `is_anonymous` | boolean | |
| `display_name` | string | 列表展示用姓名；`is_anonymous=true` 时固定为"匿名员工"，AC-003 |
| `real_author_name` | string | 真实提交人姓名；是否对当前操作者展示受权限控制，见需求文档 §7 |
| `author_type` | string（枚举） | |
| `author_employee_id` | string \| null | 仅行政代录入且 `author_type=internal` 的留言：HR 员工 ID |
| `author_org` | string \| null | 所属名称（内部员工为所选部门 / 项目名称；外部人士为手填的公司名称，AC-031）；上线前没有填的历史留言为 `null` |
| `author_position` | string \| null | 职位，仅行政代录入的外部人士留言有值，AC-031、AC-032；其余为 `null` |
| `email` | string \| null | 邮箱：仅行政代录入的外部人士留言返回，见上文；其余为 `null` |
| `author_org_type` | string（枚举）\| null | 见枚举总表 |
| `author_org_id` | string \| null | 仅 `department` / `project`：HR ID |
| `status` | string（枚举） | 见枚举总表 |
| `submitted_at` | string(ISO 8601) | 提交时间 |
| `edited` | boolean | 是否被行政修改过，列表展示"已编辑"标记，AC-013 |
| `edited_by` | string \| null | 最后一次修改人（行政姓名），未修改为 `null` |
| `edited_at` | string(ISO 8601) \| null | 最后一次修改时间，未修改为 `null` |

## 员工提交留言（用户端）

`POST /mcc-api/aiis-admin/wallMessage/submit`

仅员工可调用，作者姓名、所属来自登录身份，不由请求传入，AC-015、`identity-009-admin`；外部人员或登录过期被拒绝并返回 `identity_error`。

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_module_id` | string | 是 | 须为 `module_type=wall` 的活动模块；已过留言截止时间的被拒绝，AC-005 |
| `content` | string | 是 | 留言文本 |
| `image_url` | string | 是 | 配图，仅 1 张，JPG / PNG、≤5MB，缺失或不符后端拒绝，AC-006、AC-009 |
| `is_anonymous` | boolean | 否 | 默认 `false` |
| `email` | string | 是 | 邮箱，必填、符合邮箱格式、≤100 个字符，缺失或不符后端拒绝并返回明确原因，不产生留言，AC-026；页面默认带出 `GET /viewer` 的 `email`，员工可改；本期只保存，不发送邮件 |

**响应字段**：同「获取留言列表」单条结构（不含邮箱）；新建后 `status` 固定为 `review`，AC-025。

**权限**：见需求文档 §7
**校验**：见需求文档 §8

## 代录入留言

`POST /mcc-api/aiis-admin/wallMessage`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_module_id` | string | 是 | 须为 `module_type=wall` 的活动模块，见 `module-002-admin` §6 |
| `real_author_name` | string | 外部人士必填 | AC 见需求文档 §8（行政代录入路径）。**内部员工不传**，姓名由后端按员工 ID 从 HR 取 |
| `author_employee_id` | string | 内部员工必填 | HR 员工 ID，AC-017；外部人士传了被拒绝，`directory-010-admin` AC-007 |
| `content` | string | 是 | |
| `image_url` | string | 是 | 配图，仅 1 张，JPG / PNG、≤5MB，缺失或不符后端拒绝，AC-008、AC-009 |
| `author_type` | string（枚举） | 否 | |
| `author_org` | string | 外部人士必填 | 仅外部人士：公司名称，自由文本（长度上限见需求文档 §11 缺口），AC-031 |
| `author_position` | string | 外部人士必填 | 仅外部人士：职位，自由文本（长度上限同上），AC-031 |
| `email` | string | 外部人士必填 | 仅外部人士：邮箱地址，符合邮箱格式、≤100 个字符，缺失或不符后端拒绝并返回明确原因，AC-031；本期只保存，不发送邮件；内部员工传了被拒绝 |
| `author_org_type` | string（枚举） | 否 | 仅内部员工：`department` / `project`，与 `author_org_id` 同传，二选一 |
| `author_org_id` | string | 否 | 仅内部员工：HR 的部门 / 项目 ID，默认带出所选员工的 HR 部门，可改，可不传 |

**响应字段**

同「获取留言列表」单条结构，新建后 `status` 固定为 `review`，`is_anonymous` 固定为 `false`。

**权限**：见需求文档 §7
**校验**：见需求文档 §8

## 编辑留言

`PUT /mcc-api/aiis-admin/wallMessage`　请求体含 `id`；仅 `review` / `hidden` 状态允许，`published` 后端拒绝，AC-010

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 留言ID |
| `content` | string | 是 | 留言文本，AC-012 |
| `image_url` | string | 是 | 配图，仅 1 张，JPG / PNG、≤5MB；原本没有配图的历史留言，保存时也必须传，AC-012 |
| `real_author_name` | string | 否 | 仅行政代录入的外部人士留言可传；员工自主提交的留言传了被后端拒绝，AC-011 |
| `author_employee_id` | string | 否 | 仅行政代录入的内部员工留言可传，AC-017 |
| `author_type` | string（枚举） | 否 | 同上 |
| `author_org` / `author_org_type` / `author_org_id` | 同代录入 | 否 | 同上，仅行政代录入的留言可传；外部人士的 `author_org` 即公司名称 |
| `author_position` / `email` | 同代录入 | 外部人士必填 | 仅行政代录入的外部人士留言可传，缺失或邮箱不合格后端拒绝，AC-031、AC-034；员工自主提交的留言传了被后端拒绝，AC-011 |

员工自主提交留言的邮箱不可通过本接口修改（传 `email` 被后端拒绝），需求文档 §7。

**响应字段**：同「获取留言列表」单条结构；`status` 不变，`is_anonymous` 与真实提交人关联不变（AC-014），`edited=true`，`edited_by`、`edited_at` 更新。

**权限**：见需求文档 §7
**校验**：见需求文档 §8

## 审核操作

`POST /mcc-api/aiis-admin/wallMessage/publish`　AC-001：`review` → `published`
`POST /mcc-api/aiis-admin/wallMessage/reject`　AC-001：`review` → `hidden`
`POST /mcc-api/aiis-admin/wallMessage/hide`　`published` → `hidden`
`POST /mcc-api/aiis-admin/wallMessage/restore`　`hidden` → `published`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 留言ID |

隐藏（含拒绝）为软删除，原文保留，见 `conventions.md`。

**不发邮件**：`publish`、`reject`、`hide`、`restore`、编辑、删除都不向任何邮箱发送邮件，审核结果不通知提交人（需求文档 §5、AC-030）。

**权限**：见需求文档 §7

## 删除留言

`DELETE /mcc-api/aiis-admin/wallMessage`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 留言ID |

仅 `review` 或 `hidden` 状态允许调用（`hidden` 包括被拒绝的和展示后被隐藏的两种，AC-020）；`published` 状态调用被拒绝，需先隐藏，AC-018。留言已被他人改为 `published`、或已被删除时同样被拒绝，返回"留言状态已变化"的明确原因，AC-023。

**软删除**：记录与匿名留言的真实提交人关联仍保留，AC-021；删除后该留言不再出现在「获取留言列表」、用户端寄语墙与数据统计的留言数里，AC-022；没有对应的恢复接口。删除时由后端同时记录删除人与删除时间（需求文档 §6、AC-021）；本期没有接口对外返回这两项，也不在任何页面展示，是否需要展示见需求文档 §11 缺口。具体的存储实现由后端定。

**响应**：成功时无业务字段，只表示已删除；列表由前端重新请求刷新，分页规则见 `conventions.md`，当前页被删空时回到新的末页，AC-019。

**权限**：见需求文档 §7（任一行政可删，员工不可）
**校验**：见需求文档 §8
