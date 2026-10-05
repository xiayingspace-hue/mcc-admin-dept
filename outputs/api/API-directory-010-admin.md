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

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `employee_id` | string | HR 员工 ID；作品、报名、留言的内部员工记录引用它，AC-007 |
| `name` | string | 员工姓名 |
| `employee_no` | string | 工号 |
| `department_id` | string \| null | 该员工在 HR 里的部门 ID，用于"所属默认带出"，AC-004 |
| `department_name` | string \| null | 该员工在 HR 里的部门名称 |

> 与 `API-activity-001-admin.md` 里步骤三选审批人用的 `GET /employee` 是两件事：那个接口不返回部门；本接口返回部门，仅管理端使用。

## 搜索部门（HR）

`GET /mcc-api/aiis-admin/hrDepartment`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `keyword` | string | 否 | 按名称模糊匹配，AC-003 |

分页：见 `conventions.md`

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `department_id` | string | HR 部门 ID |
| `name` | string | 部门名称；是否带层级路径见需求文档 §11 |

## 搜索项目（HR）

`GET /mcc-api/aiis-admin/hrProject`

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `keyword` | string | 否 | 按名称模糊匹配，AC-003 |

分页：见 `conventions.md`

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `project_id` | string | HR 项目 ID |
| `name` | string | 项目名称；哪些项目可选见需求文档 §11 |

## 错误

三个接口在 HR 系统查询失败 / 超时时返回错误，页面显示"重试"，不提供手动输入兜底，AC-008。

**权限**：见需求文档 §7（仅行政）
**校验**：见需求文档 §8
