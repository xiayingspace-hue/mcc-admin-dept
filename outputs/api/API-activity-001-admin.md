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
| `approval_step_type` | `submit` \| `dept_manager` \| `third_node` | 审批链固定三个节点：提交（发起人）、部门主管审批、第三节点审批，见需求文档 §5.2 |
| `approval_step_status` | `submitted` \| `pending` \| `approved` \| `rejected` | 节点状态；`submitted` 仅用于 `submit` 节点，表示已提交、无审批结果；其余用于两个审批节点，见需求文档 §5.2 |
| `approval_assignee_status` | `pending` \| `approved` \| `rejected` \| `revoked` | 节点下单个审批人的状态；`revoked` 表示因节点内他人驳回或发起人撤回而被撤销待办、不可再处理，见需求文档 §5.2、§5.3 |

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
| `budget` | number | 币种 S$，数值单位见 conventions.md 金额精度 |
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
| `third_node_approver_ids[]` | string[]（员工ID） | 是 | 第三节点审批人，至少 1 个、无上限、不可重复，可含发起人本人，见需求文档 §5.2、§8、AC-011；`draft` / `rejected` 状态下每次提交都可重新传，见 AC-016 |

审批链固定为提交、部门主管、第三节点三个节点；部门主管由后端按发起人自动匹配，不由本接口传入。预算金额不参与审批链匹配，AC-003 已废止。

**权限**：见需求文档 §7
**校验**：见需求文档 §8（含第三节点审批人的必选、去重与账号有效性校验）

## 搜索员工（步骤三选择第三节点审批人）

`GET /mcc-api/aiis-admin/employee`

**请求参数**

分页：见 conventions.md。

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `keyword` | string | 否 | 按姓名或工号模糊搜索；不传即返回全公司员工，对应步骤三 `empty`(搜索无结果) 状态 |

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `employee_id` | string | 员工ID，即 `third_node_approver_ids[]` 的取值 |
| `name` | string | 员工姓名 |
| `employee_no` | string | 工号，与姓名一并展示用于区分重名，AC-011；不返回部门 |

员工范围为全公司员工，不按角色过滤，见需求文档 §5.2、§9。是否复用公司已有人员目录接口由后端确定。

## 撤回申请（仅发起人可调用）

`POST /mcc-api/aiis-admin/activity/withdraw`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 活动ID |

仅 `review`（审批中）状态允许调用，不受当前审批进度限制。成功后活动状态变为 `draft`，已通过节点的审批记录被清空，见需求文档 §5.3、AC-009。当前审批节点对应的统一待办任务中所有尚未被处理的（第三节点为多人时即所有未处理审批人的任务）需联动撤销，见需求文档 §5.3、AC-010。

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
| `steps[]` | array | 固定三项，顺序为 `submit`、`dept_manager`、`third_node`，AC-012；每项含下表字段 |
| `viewer_role` | string（`initiator` \| `approver` \| `viewer`） | 前端据此决定展示发起人视角还是审批人视角，AC-008 |

`steps[]` 每项：

| 字段 | 类型 | 说明 |
|---|---|---|
| `step_id` | string | 节点ID |
| `step_type` | string（枚举） | 见枚举总表 |
| `status` | string（枚举） | `approval_step_status`，见枚举总表 |
| `acted_at` | string | 节点完成时间，ISO 8601，未完成为空 |
| `can_act` | boolean | 当前登录用户在该节点是否仍有待处理操作，前端据此在审批人视角显示通过/驳回，AC-008 |
| `assignees[]` | array | 该节点下的审批人记录；`submit` 节点只有发起人一条，`third_node` 为全部所选审批人，AC-012 |

`assignees[]` 每项：

| 字段 | 类型 | 说明 |
|---|---|---|
| `assignee_id` | string | 审批人员工ID |
| `approver_name` | string | 审批人姓名；`submit` 节点为发起人姓名 |
| `status` | string（枚举） | `approval_assignee_status`；`submit` 节点不返回 |
| `comment` | string | 审批意见，未处理为空 |
| `acted_at` | string | 该人处理时间，ISO 8601，未处理为空；`submit` 节点为提交时间 |

## 审批操作（仅当前节点审批人可调用，第三节点每位审批人各自调用一次）

`POST /mcc-api/aiis-admin/activity/approval/approve`
`POST /mcc-api/aiis-admin/activity/approval/reject`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 活动ID |
| `step_id` | string | 是 | 当前处理的审批节点ID；第三节点多人时，后端按当前登录用户定位其本人那一条记录，不能代他人处理，见需求文档 §7 |
| `comment` | string | `reject` 必填 | 见需求文档 §8 校验规则 |

第三节点全部审批人 `approve` 后活动自动变为 `published`（AC-014）；任一人 `reject` 后活动变为 `rejected`，其余未处理者的记录变为 `revoked`（AC-015）。节点内已有人驳回后再调用本接口一律拒绝，见需求文档 §8。

**权限**：见需求文档 §7
**校验**：见需求文档 §8
