---
编号: API-wall-005-admin
对应需求: REQ-005
状态: 草案
---

# 寄语墙管理 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式见 `background/conventions.md`，不在此重复。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `status` | `review`（待审核） \| `published`（已展示） \| `hidden`（已隐藏） | 见需求文档 §5 状态机；术语沿用 `conventions.md` 状态命名统一术语 |
| `author_type` | `internal`（内部员工） \| `external`（外部人士） | 见需求文档 §6 |

## 获取留言列表

`GET /mcc-api/aiis-admin/wallMessage`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 否 | 不传即跨活动查看全部；AC-002 支持与 `status` 同时生效（交集） |
| `status` | string（枚举） | 否 | 不传即全部状态 |

分页：见 `conventions.md`

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
| `status` | string（枚举） | 见枚举总表 |
| `submitted_at` | string(ISO 8601) | 提交时间 |
| `edited` | boolean | 是否被行政修改过，列表展示"已编辑"标记，AC-013 |
| `edited_by` | string \| null | 最后一次修改人（行政姓名），未修改为 `null` |
| `edited_at` | string(ISO 8601) \| null | 最后一次修改时间，未修改为 `null` |

## 代录入留言

`POST /mcc-api/aiis-admin/wallMessage`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_module_id` | string | 是 | 须为 `module_type=wall` 的活动模块，见 `module-002-admin` §6 |
| `real_author_name` | string | 是 | AC 见需求文档 §8（行政代录入路径） |
| `content` | string | 是 | |
| `image_url` | string | 是 | 配图，仅 1 张，JPG / PNG、≤5MB，缺失或不符后端拒绝，AC-008、AC-009 |
| `author_type` | string（枚举） | 否 | |

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
| `real_author_name` | string | 否 | 仅行政代录入的留言可传；员工自主提交的留言传了被后端拒绝，AC-011 |
| `author_type` | string（枚举） | 否 | 同上 |
| `author_org` | string | 否 | 同上 |

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

**权限**：见需求文档 §7
