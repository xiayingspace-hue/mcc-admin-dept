---
编号: API-identity-009-admin
对应需求: REQ-009
状态: 草案
---

# 员工身份识别 接口清单（草案）

> 字段名、类型、枚举由后端最终确认；实现后有出入，回来改成实际的样子。接口路径与请求方式见 `background/conventions.md`，不在此重复。

## 枚举值总表

| 枚举 | 取值 | 说明 |
|---|---|---|
| `viewer_type` | `employee`（员工） \| `external`（外部人员） | 见需求文档 §6；没有令牌、令牌无效、或令牌对应的员工在 HR 系统中不是在职状态（`on the job` / `probation` 之外），一律为 `external`；每次请求实时向 HR 系统核对 |
| `identity_error` | `not_employee`（不是员工） \| `session_expired`（登录已过期） \| `identity_unavailable`（身份确认失败：向 HR 系统查询在职状态时查不到 / 超时） | 参与类接口被拒绝时的错误原因，见下方「受身份限制的接口」；两者页面提示不同，AC-005、AC-007 |

## 获取当前访问者（用户端）

`GET /mcc-api/aiis-admin/viewer`

**请求参数**：无。身份由请求携带的登录状态（内部访问令牌换取而来）判定，不从请求参数里取，AC-006。

**响应字段**

| 字段 | 类型 | 说明 |
|---|---|---|
| `viewer_type` | `viewer_type` | `employee` 时三个参与入口按原有规则显示；`external` 时三个入口不显示，AC-001、AC-002 |
| `name` | string | 仅 `employee` 返回，员工姓名 |

页面打开时调用一次；后端向 HR 系统查询超时 / 查不到时，本接口返回错误（不是 `external`，也不是 `employee`），AC-014。请求失败时页面按「确认失败」处理，入口不显示、在原位置提供重试，不得默认放开，AC-009。官网访问（无令牌）返回 `viewer_type=external`，不返回错误。

用令牌换取登录状态的方式（一次性 / 有效期 / 校验方式）尚未确定，见需求文档 §11；确定后在此补充对应接口。换取完成后令牌不应继续留在地址栏，AC-008。

## 受身份限制的接口

下列用户端动作的接口都必须要求有效的员工身份，规则见需求文档 §8、AC-005～AC-007。这些接口大多尚未在各自清单中，补充时须带上：

| 动作 | 所在清单 | 说明 |
|---|---|---|
| 员工自主报名 / 取消报名 | `API-registration-004-admin.md`（提交接口待补充） | 另有邮箱、电话、名额校验 |
| 查看我的签到码 `GET /registrationCode`、报名入口状态 `GET /registrationEntry` | `API-registration-004-admin.md` | 外部人员调用 `registrationCode` 被拒绝（`not_employee`）；`registrationEntry` 对外部人员仍可调用，页面据 `viewer` 的结果决定是否显示入口 |
| 涂鸦投票 / 取消投票 / 换票 | `API-submission-003-admin.md`（用户端投票接口待补充） | |
| 提交寄语 | `API-wall-005-admin.md`（用户端提交接口待补充） | |

被拒绝时返回的错误里带 `identity_error`：

| 情形 | `identity_error` |
|---|---|
| 无令牌 / 令牌无效 / 员工在 HR 系统中不是在职状态，或请求里只有工号等参数 | `not_employee` |
| 向 HR 系统查询在职状态时查不到 / 超时（一律拒绝，不放行） | `identity_unavailable` |
| 令牌过期或失效 | `session_expired` |

**权限**：见需求文档 §7
**校验**：见需求文档 §8
