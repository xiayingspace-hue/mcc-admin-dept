---
编号: API-submission-003-admin
对应需求: REQ-003
状态: 草案
---

# 作品管理（涂鸦评选类模块） 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式见 `background/conventions.md`，不在此重复。**变更说明（自 REQ-007 起）**：作品归属对象从"活动模块"改为"Celebration 下挂载的涂鸦展示模块"，本清单的筛选与归属字段相应从 `activity_id`/`activity_module_id` 改为 `celebration_id`/`celebration_module_id`。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `status` | `draft`（未发布） \| `published`（已发布） \| `hidden`（已隐藏） | 见需求文档 §5 状态机；术语沿用 `conventions.md` 状态命名统一术语 |
| `author_type` | `internal`（内部员工） \| `external`（外部人士） | 见需求文档 §6 |

## 获取作品列表

`GET /mcc-api/aiis-admin/submission`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `celebration_id` | string | 否 | 不传即跨 Celebration 查看全部；AC-004 支持与 `status` 同时生效（交集） |
| `status` | string（枚举） | 否 | 不传即全部状态 |

分页：见 `conventions.md`

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 作品ID |
| `celebration_id` | string | 归属 Celebration ID |
| `celebration_site` | string | 归属 Celebration 的 Site 名称（列表展示用） |
| `activity_id` | string | 归属活动ID（经由 Celebration 派生，只读） |
| `activity_title` | string | 归属活动标题（列表展示用） |
| `celebration_module_id` | string | 归属的 CelebrationModule ID（涂鸦展示类型），见 `celebration-007-admin` §6 |
| `image_url` | string | 作品图片 |
| `description` | string \| null | 作品说明 |
| `author_type` | string（枚举） \| null | |
| `author_name` | string | |
| `author_org` | string \| null | 部门或所属机构，自由文本 |
| `status` | string（枚举） | 见枚举总表 |
| `vote_count` | number | 票数 |

## 上传作品

`POST /mcc-api/aiis-admin/submission`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `celebration_module_id` | string | 是 | 须为 `module_type=doodle_vote` 的 CelebrationModule，见 `celebration-007-admin` §6 |
| `image_url` | string | 是 | AC-001 |
| `author_name` | string | 是 | AC-001 |
| `description` | string | 否 | |
| `author_type` | string（枚举） | 否 | |
| `author_org` | string | 否 | |

**响应字段**

同「获取作品列表」单条结构，新建后 `status` 固定为 `draft`，`vote_count` 固定为 `0`。

**权限**：见需求文档 §7
**校验**：见需求文档 §8

## 发布 / 隐藏 / 恢复作品

`POST /mcc-api/aiis-admin/submission/publish`　AC-002：`draft` → `published`
`POST /mcc-api/aiis-admin/submission/hide`　AC-003：`published` → `hidden`，不清除 `vote_count`
`POST /mcc-api/aiis-admin/submission/restore`　`hidden` → `published`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 作品ID |

**权限**：见需求文档 §7

## 删除作品

`DELETE /mcc-api/aiis-admin/submission`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 作品ID |

仅 `draft` 或 `hidden` 状态允许调用；`published` 状态调用被拒绝，需先隐藏，见需求文档 §8。硬删除，见 `conventions.md` 软删除/硬删除规则。

**权限**：见需求文档 §7
