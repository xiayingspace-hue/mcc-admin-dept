---
编号: API-activity-001-admin
对应需求: REQ-001
状态: 草案
---

# 活动创建、审批与生命周期 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式见 `background/conventions.md`，不在此重复。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `status` | `draft` \| `review` \| `published` \| `rejected` \| `ended` | 见需求文档 §5.1 状态机 |
| `external_visible` | `internal_only` \| `open_to_external` | 外部可见性，见需求文档 §7 |
| `approval_step_status` | `pending` \| `approved` \| `rejected` | 审批节点状态，见需求文档 §5.2 |

## 获取活动列表

`GET /mcc-api/aiis-admin/activity`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `status` | string（枚举） | 否 | 不传即全部状态 |
| `type` | string | 否 | 活动类型筛选 |
| `keyword` | string | 否 | 标题模糊搜索 |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 活动ID |
| `title` | string | 活动标题 |
| `type` | string | 活动类型 |
| `status` | string（枚举） | 见枚举总表 |
| `budget` | number | 单位：元，见 conventions.md 金额精度 |
| `hold_time` | string | ISO 8601 |
| `initiator` | string | 发起人姓名 |

## 创建 / 更新活动基础信息

`POST /mcc-api/aiis-admin/activity`（创建）　`PUT /mcc-api/aiis-admin/activity`（更新，请求体含 `id`）

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 更新时必填 | 创建时不传 |
| `title` | string | 是 | AC-001 |
| `type` | string | 是 | |
| `layout_template` | string（枚举，取值见 `module-002` 关联的模板受控表） | 是 | |
| `start_time` / `end_time` | string(ISO 8601) | 是 | `end_time` 须晚于 `start_time`，AC-002 |
| `location` | string | 是 | |
| `budget` | number | 是 | |
| `scope` | string（`all` \| `departments`） | 是 | 参与范围 |
| `external_visible` | string（枚举） | 是 | 默认 `internal_only` |
| `cover_image_url` | string | 否 | |
| `description_html` | string | 否 | 富文本，前端只读展示时需做 XSS 净化 |

## 提交审批

`POST /mcc-api/aiis-admin/activity/submit`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 活动ID |

审批链由后端根据 `type` 与 `budget` 自动匹配，本接口不接受审批人指定参数。触发规则：`budget > 50000` 时自动包含财务节点，见 AC-003。

## 撤回申请（仅发起人可调用）

`POST /mcc-api/aiis-admin/activity/withdraw`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 活动ID |

仅 `review`（审批中）状态允许调用，不受当前审批进度限制。成功后活动状态变为 `draft`，已通过节点的审批记录被清空，见需求文档 §5.3、AC-009。若当前审批节点对应的统一待办任务尚未被处理，需联动撤销该待办任务，见需求文档 §5.3、AC-010。

**权限**：见需求文档 §7
**校验**：见需求文档 §8（不可逆操作，前端需二次确认）

## 修改外部可见性（不触发审批）

`PATCH /mcc-api/aiis-admin/activity/visibility`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 活动ID |
| `external_visible` | string（枚举） | 是 | AC-007：仅 `published`/`ended` 状态允许调用 |

## 获取审批进度

`GET /mcc-api/aiis-admin/activity/approval`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 活动ID |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `steps[]` | array | 每项含 `step_id`、`role`、`status`、`approver_name`、`comment`、`acted_at` |
| `viewer_role` | string（`initiator` \| `approver` \| `viewer`） | 前端据此决定展示发起人视角还是审批人视角，AC-008 |

## 审批操作（仅当前节点审批人可调用）

`POST /mcc-api/aiis-admin/activity/approval/approve`
`POST /mcc-api/aiis-admin/activity/approval/reject`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 活动ID |
| `step_id` | string | 是 | 当前处理的审批节点ID |
| `comment` | string | `reject` 必填 | 见需求文档 §8 校验规则 |
