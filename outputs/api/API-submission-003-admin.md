---
编号: API-submission-003-admin
对应需求: REQ-003
状态: 草案
---

# 作品管理（涂鸦评选类模块） 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式见 `background/conventions.md`，不在此重复。**变更说明（自 REQ-007 起）**：作品归属对象从"活动模块"改为"Celebration 下挂载的涂鸦展示模块"，本清单的筛选与归属字段相应从 `activity_id`/`activity_module_id` 改为 `celebration_id`/`celebration_module_id`。
>
> 本清单只覆盖 `aiis-admin` 管理端接口；用户投票（投/取消投）本身是用户端动作，接口不在本清单内，待补充到 `activity` 用户端需求与接口文档时一并生成，见需求文档 §11。管理端这里只读取 `vote_count` 汇总结果。补充用户端投票接口时，必须只允许员工调用，外部人员被拒绝并返回 `identity_error`（见 `API-identity-009-admin.md`，AC-021）。

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

**排序**：默认按创建时间倒序，没有排序参数；先应用筛选、再排序、最后分页，AC-022，规则见 `conventions.md`「列表默认排序」。

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 作品ID |
| `celebration_id` | string | 归属 Celebration ID |
| `celebration_site` | string | 归属 Celebration 的 Site 名称（列表展示用） |
| `activity_id` | string | 归属活动ID（经由 Celebration 派生，只读） |
| `activity_title` | string | 归属活动标题（列表展示用） |
| `celebration_module_id` | string | 归属的 CelebrationModule ID（涂鸦展示类型），见 `celebration-007-admin` §6 |
| `image_urls[]` | string[] | 作品图片，有序，1 到 9 张，第一张为封面，AC-009 |
| `video_url` | string \| null | 作品视频，最多 1 个，无视频为 `null`，AC-010 |
| `description` | string \| null | 作品说明 |
| `author_type` | string（枚举） \| null | 一件作品一个类型；仅管理端使用，用户端不展示，AC-019 |
| `author_names[]` | string[] | 作者姓名，1 到 10 位，团队作品填多位，AC-018；用户端展示时不带作者类型，AC-019 |
| `author_org` | string \| null | 部门或所属机构，自由文本 |
| `status` | string（枚举） | 见枚举总表 |
| `vote_count` | number | 票数，即当前对该作品有效投票的用户数（同一用户重复投票按开关计，不累加；换票时原作品-1、新作品+1），见需求文档 §6「投票」、AC-006/AC-007/AC-008 |
| `created_at` | string(ISO 8601) | 创建时间（行政上传的时间）；列表按它倒序，AC-022 |

管理端"查看详情"（AC-017）直接使用本接口返回的同一条记录（含 `image_urls[]`、`video_url`、完整 `description`、作者信息、`status`、`vote_count`），不另设详情接口。

## 上传作品

`POST /mcc-api/aiis-admin/submission`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `celebration_module_id` | string | 是 | 须为 `module_type=doodle_vote` 的 CelebrationModule，见 `celebration-007-admin` §6 |
| `image_urls[]` | string[] | 是 | 1 到 9 张，按数组顺序展示，第一张为封面，AC-001、AC-009 |
| `video_url` | string | 否 | 最多 1 个 MP4，AC-010 |
| `author_names[]` | string[] | 是 | 至少 1 位、最多 10 位，每位 ≤30 个字符，同一作品内不重复，AC-001、AC-018；管理端由单个输入框按逗号拆分后提交 |
| `description` | string | 否 | 作品说明，不超过 200 个字符（汉字、字母、标点、空格、换行都按 1 个计），AC-014 |
| `author_type` | string（枚举） | 否 | |
| `author_org` | string | 否 | |

**响应字段**

同「获取作品列表」单条结构，新建后 `status` 固定为 `draft`，`vote_count` 固定为 `0`。

**权限**：见需求文档 §7
**校验**：见需求文档 §8

## 上传作品的图片 / 视频文件

`POST /mcc-api/aiis-admin/submissionMedia`　multipart/form-data，一次上传一个文件；返回的地址放进上传 / 编辑作品的 `image_urls[]` 或 `video_url`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `file` | file | 是 | 图片：JPG / PNG、≤5MB；视频：MP4、≤100MB，AC-009、AC-010 |
| `media_type` | string（`image` \| `video`） | 是 | |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `url` | string | 文件地址 |
| `file_name` | string | 文件名 |
| `file_size` | number | 单位：字节 |

**校验**：见需求文档 §8（前端拦截 + 后端二次校验）

## 编辑作品

`PUT /mcc-api/aiis-admin/submission`　请求体含 `id`；仅 `draft` / `hidden` 状态允许，`published` 状态后端拒绝，AC-013

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 作品ID |
| `image_urls[]` | string[] | 是 | 编辑后的完整图片名单与顺序，1 到 9 张 |
| `video_url` | string \| null | 否 | 传 `null` 表示删除视频 |
| `author_names[]` / `author_type` / `author_org` / `description` | 同上传作品 | | 同上传作品 |

**响应字段**：同「获取作品列表」单条结构；`status`、`vote_count` 不变。

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
