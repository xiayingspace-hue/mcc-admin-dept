---
编号: API-directory-010-admin
对应需求: REQ-010
状态: 草案
---

# 内部人员与外部人士的录入 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。分页规则、接口路径与请求方式见 `background/conventions.md`，不在此重复。这三个接口只读：数据来自 HR 系统，管理端不能在这里新增或修改。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `org_type` | `department`（部门） \| `project`（项目） | 内部员工的所属，二选一，见需求文档 §6 |

## 搜索员工（HR）

`GET /mcc-api/aiis-admin/hrEmployee`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `keyword` | string | 否 | 按姓名或工号模糊匹配，AC-002 |

分页：见 `conventions.md`

**只返回在职员工**：后端自动过滤掉离职员工，前端不再过滤，AC-002、AC-011。

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `employee_id` | string | HR 员工 ID；作品、报名、留言的内部员工记录引用它，AC-007 |
| `name` | string | 员工姓名 |
| `employee_no` | string | 工号 |
| `department_id` | string \| null | 该员工在 HR 里的部门 ID，用于"所属默认带出"，AC-004 |
| `department_name` | string \| null | 该员工在 HR 里的部门名称（末级部门名称，不带上级路径） |
| `phone` | string \| null | 联系电话；仅管理端行政可见，目前只用于报名管理代报名的自动带出，行政可修改，REQ-004 AC-026 |
| `email` | string \| null | 邮箱；同上 |

> 与 `API-activity-001-admin.md` 里步骤三选审批人用的 `GET /employee` 是两件事：那个接口不返回部门；本接口返回部门，仅管理端使用。

## 搜索部门（HR）

`GET /mcc-api/aiis-admin/hrDepartment`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `keyword` | string | 否 | 按名称模糊匹配，AC-003 |

分页：见 `conventions.md`

**只返回末级部门**：HR 的部门有层级，本接口只返回末级部门，AC-003、AC-011。

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `department_id` | string | HR 部门 ID |
| `name` | string | 末级部门自己的名称，不带上级路径，AC-003 |

## 搜索项目（HR）

`GET /mcc-api/aiis-admin/hrProject`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `keyword` | string | 否 | 按名称模糊匹配，AC-003 |

分页：见 `conventions.md`

**只返回有效项目**：HR 里已关闭的项目后端自动过滤，不返回，AC-003、AC-011。

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `project_id` | string | HR 项目 ID |
| `name` | string | 项目名称 |

## 错误

三个接口在 HR 系统查询失败 / 超时时返回错误，页面显示"重试"，不提供手动输入兜底，AC-008。

**权限**：见需求文档 §7（仅行政）
**校验**：见需求文档 §8

## 保存的是当时的值

作品 / 报名 / 留言保存内部员工记录时，姓名、所属名称（以及代报名的电话、邮箱）按提交时的值保存，之后 HR 的变化不回写；响应里的 `author_names[]`、`author_org` 等就是保存的那一份，AC-012。编辑时未改动的员工和所属原样保留，不重新按有效性校验；新选的才校验（在职员工、末级部门、有效项目），AC-013。
