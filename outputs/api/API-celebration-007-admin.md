---
编号: API-celebration-007-admin
对应需求: REQ-007
状态: 草案
---

# 活动 Celebration 管理 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式见 `background/conventions.md`，不在此重复。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `status`（只读，由后端按当前时间与 `start_time`、`end_time` 的新加坡日期计算，不接受前端传入） | `upcoming`（即将开始） \| `ongoing`（进行中） \| `ended`（已结束） | 见需求文档 §5.2；决定封面（§5.2.1）与用户端左侧内容区（§5.2.2）的展示 |
| `celebration_module_type` | `registration`（报名信息） \| `doodle_vote`（涂鸦展示） | 复用 `module-002-admin` 枚举总表 `module_type` 的子集 |

## 获取 Celebration 列表

`GET /mcc-api/aiis-admin/celebration`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `activity_id` | string | 否 | 不传即跨活动查看全部 |
| `status` | string（枚举） | 否 | 按 `upcoming` / `ongoing` / `ended` 筛选，AC-026 |

分页：见 `conventions.md`

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | Celebration ID |
| `activity_id` | string | 所属活动ID |
| `activity_title` | string | 所属活动标题（列表展示用） |
| `site` | string | Site / 地点名称 |
| `title` | string | Celebration 标题 |
| `start_time` / `end_time` | string(ISO 8601) | 管理端分别展示；用户端详情页与 Celebrations 卡片列表合并显示，格式见需求文档 §5.4、AC-009/AC-010/AC-012 |
| `status` | string（枚举，只读） | 见枚举总表，AC-003、AC-024～AC-026 |
| `poster_url` | string | 预告海报 |
| `cover_image_before_url` | string | 封面图·预告版 |
| `cover_image_after_url` | string \| null | 封面图·实拍版，未上传为 `null` |
| `registered_count` | number | 该 Celebration 下报名信息模块的报名人数，AC-005 |
| `submission_count` | number | 该 Celebration 下涂鸦展示模块的作品数，AC-005 |

## 创建 / 更新 Celebration

`POST /mcc-api/aiis-admin/celebration`（创建）　`PUT /mcc-api/aiis-admin/celebration`（更新，请求体含 `id`）

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 更新时必填 | 创建时不传 |
| `activity_id` | string | 是 | AC-001 |
| `site` | string | 是 | AC-001 |
| `title` | string | 是 | AC-001 |
| `start_time` / `end_time` | string(ISO 8601) | 是 | `end_time` 须晚于 `start_time`，AC-002 |
| `cover_image_before_url` | string | 是 | AC-001 |
| `poster_url` | string | 是 | 预告海报，JPG / PNG、≤5MB，新建和编辑都必填，AC-001、AC-023 |
| `cover_image_after_url` | string | 否 | 上传后按 §5.2 规则自动展示，AC-003 |
| `description_html` | string | 是 | 文字描述，富文本，新建和编辑都必填、不能为空，AC-001、AC-028；前端只读展示时需做 XSS 净化 |
| `gallery_image_urls` | string[] | 否 | 图片相册，数量上限见需求文档 §11 已知缺口 |
| `highlights` | string[] | 否 | 每项对应一条 Highlights 文案，见需求文档 §11 是否需结构化的已知缺口 |

**响应字段**：同「获取 Celebration 列表」单条结构。

**权限**：见需求文档 §7
**校验**：见需求文档 §8

## 获取 Celebration 已挂载的模块

`GET /mcc-api/aiis-admin/celebrationModule`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `celebration_id` | string | 是 | |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `module_type` | string（枚举） | 见枚举总表 `celebration_module_type` |
| `visible` | boolean | 展示开关；`true` 时用户端显示该模块，`false` 时用户端不显示、无入口，配置与数据保留，AC-016～AC-019；不再有 `display_start_time`，AC-020 |
| `registration_deadline` | string(ISO 8601) \| null | 仅 `registration` 使用，报名截止时间，见 `registration-004-admin` §6 |
| `capacity` | number \| null | 仅 `registration` 使用，名额上限，留空不限，见 `registration-004-admin` §6 |
| `submission_deadline` | string(ISO 8601) \| null | 仅 `doodle_vote` 使用，提交截止时间，须晚于 Celebration 的 `end_time`，AC-027 |
| `vote_deadline` | string(ISO 8601) \| null | 仅 `doodle_vote` 使用，投票截止时间，须晚于 `submission_deadline`，AC-006 |

保存过配置的模块（含 `visible=false`）都会返回；从未保存过配置的 `module_type` 不出现在数组中，前端按 `visible=false` 展示。

## 保存 Celebration 挂载的模块

`PUT /mcc-api/aiis-admin/celebrationModule`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `celebration_id` | string | 是 | |
| `modules` | array | 是 | 本次要保存配置的模块（含展示开关为关闭的） |
| `modules[].module_type` | string（枚举） | 是 | |
| `modules[].visible` | boolean | 是 | 展示开关，新建 Celebration 时默认 `false`，AC-016 |
| `modules[].registration_deadline` | string(ISO 8601) | 否，仅 `registration` | 见 `registration-004-admin` §8 |
| `modules[].capacity` | number | 否，仅 `registration` | 见 `registration-004-admin` §8 |
| `modules[].submission_deadline` | string(ISO 8601) | `doodle_vote` 且 `visible=true` 时必填 | 须晚于 Celebration 的 `end_time`（填写了即校验，不论 `visible`），AC-021、AC-027 |
| `modules[].vote_deadline` | string(ISO 8601) | `doodle_vote` 且 `visible=true` 时必填 | 须晚于 `submission_deadline`，AC-006、AC-021 |

**响应字段**：同「获取 Celebration 已挂载的模块」，返回保存后的 `modules[]`。

`visible=false` 时，后端拒绝员工 / 外部人士针对该 Celebration 对应模块的报名、投票请求（AC-022）；这些用户端接口分别归 `API-registration-004-admin.md`、`API-submission-003-admin.md`（用户端投票接口尚待补充，补充时需带上这条校验，AC-022）。

**权限**：见需求文档 §7（不受活动生命周期状态限制）
**校验**：见需求文档 §8
