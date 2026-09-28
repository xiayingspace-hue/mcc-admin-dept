---
编号: QA-registration-004-admin
对应需求: REQ-004
状态: 草稿
---

# 报名管理 测试用例

| 用例编号 | 关联 AC/校验规则 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| QA-registration-004-admin-001 | AC-001 | 某报名记录状态为"未签到" | 点击"签到" | 状态变为"已签到"，"已签到"统计数字 +1 |
| QA-registration-004-admin-002 | AC-001 | 某报名记录状态为"已签到" | 点击"撤销签到" | 状态变为"未签到"，"已签到"统计数字 -1 |
| QA-registration-004-admin-003 | AC-002 | 某报名记录状态为"未签到" | 点击"取消报名" | 原地展示二次确认提示；确认后该记录从列表移除，"已报名"统计 -1，"已签到"统计不变 |
| QA-registration-004-admin-004 | AC-002 | 某报名记录状态为"已签到" | 点击"取消报名"并确认 | 该记录从列表移除，"已报名"与"已签到"统计同时 -1 |
| QA-registration-004-admin-005 | AC-003 | 手动添加代报名表单已打开，已选择所属 Celebration | 姓名留空，点击提交 | 阻止提交并提示 |
| QA-registration-004-admin-006 | AC-003 | 手动添加代报名表单已打开，已选择所属 Celebration | 填写姓名（部门留空），提交 | 新记录出现在列表最上方并标注所属 Celebration，"已报名"统计 +1，表单自动清空并收起，该记录部门展示"—" |
| QA-registration-004-admin-007 | §8 校验 | 用户端报名表单 | 填写手机号为非 11 位数字后提交 | 服务端拒绝，报名不生效（此规则发生于用户端，本用例验证服务端校验生效） |
| QA-registration-004-admin-008 | AC-004 | 员工在用户端某个 Celebration 完成一次报名 | 打开管理端报名名单 | 该条记录可被查询到，归属正确的 Celebration，与用户端提交的信息一致（前后端数据一致） |
| QA-registration-004-admin-009 | §9 五态-loading | 模拟报名名单接口响应延迟 | 打开报名管理页面 | 展示骨架屏 |
| QA-registration-004-admin-010 | §9 五态-empty | 该 Celebration 尚无人报名 | 打开报名管理页面 | 展示"该 Celebration 尚无人报名"文案，统计数字均为 0 |
| QA-registration-004-admin-011 | AC-005 | 报名名单中存在归属不同 Celebration 的记录 | 打开报名管理列表（不筛选） | 每一行均展示其所属 Celebration 名称 |
| QA-registration-004-admin-012 | AC-005 | 报名名单已加载多条不同 Celebration 的记录 | 选择某个 Celebration 筛选 | 仅展示该 Celebration 的记录，切换筛选立即生效 |
| QA-registration-004-admin-013 | §8 校验 | 手动添加代报名表单已打开 | 未选择所属 Celebration，点击提交 | 阻止提交并提示需选择 Celebration |
| QA-registration-004-admin-014 | §6 数据对象（报名信息模块配置） | 某 Celebration 的报名信息模块已设置名额上限 | 查看该 Celebration 的报名统计区域 | 名额上限数值正确展示；报满后的拦截行为暂不校验（见 §11 已知缺口） |
