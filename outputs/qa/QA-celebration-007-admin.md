---
编号: QA-celebration-007-admin
对应需求: REQ-007
状态: 草稿
---

# 活动 Celebration 管理 测试用例

| 用例编号 | 关联 AC/校验规则 | 前置条件 | 操作步骤 | 预期结果 |
|---|---|---|---|---|
| QA-celebration-007-admin-001 | AC-001 | 新建 Celebration 表单已打开 | 不填任何字段，点击"保存" | 所属活动/Site名称/Celebration标题/Category/开始时间/结束时间/封面图-预告版对应字段高亮报错，阻止保存 |
| QA-celebration-007-admin-002 | AC-002 | 其余必填项已填 | 结束时间设为早于开始时间 | 独立报错"结束时间需晚于开始时间"，不因其余字段合法而放行 |
| QA-celebration-007-admin-003 | AC-003 | 某 Celebration 开始时间尚未到达 | 打开该 Celebration 详情页（用户端） | 展示预告封面 |
| QA-celebration-007-admin-004 | AC-003 | 某 Celebration 开始时间已到达，且已上传实拍封面 | 打开该 Celebration 详情页（用户端） | 自动展示实拍封面，无需人工操作 |
| QA-celebration-007-admin-005 | AC-003（边界） | 某 Celebration 开始时间已到达，但尚未上传实拍封面 | 打开该 Celebration 详情页（用户端） | 继续展示预告封面（当前暂定行为，具体是否需要占位图见需求文档 §11 已知缺口） |
| QA-celebration-007-admin-006 | AC-004 | 某活动下已创建 3 个 Celebration | 继续创建第 4、5 个 Celebration | 均可正常创建，不出现数量提示或阻止 |
| QA-celebration-007-admin-007 | AC-005 | 同一活动下有两个 Celebration，各自已有报名与作品数据 | 分别查看两个 Celebration 的报名名单与作品列表 | 两者数据互不包含，报名人数、作品数、票数均独立统计 |
| QA-celebration-007-admin-008 | AC-006 | 某 Celebration 已启用涂鸦展示模块 | 投票截止时间设为早于或等于提交截止时间 | 保存时报错阻止 |
| QA-celebration-007-admin-009 | AC-007 | 活动处于任意生命周期状态（草稿/审批中/已发布） | 为该活动创建/编辑一个 Celebration | 保存成功，不产生任何审批记录，列表立即可查询到最新内容 |
| QA-celebration-007-admin-010 | AC-008 | 员工已在 Celebration A 完成报名 | 该员工在同一活动的 Celebration B 提交报名 | 两条报名记录均成功创建，互不覆盖、互不冲突 |
| QA-celebration-007-admin-011 | §9 五态-loading | 模拟 Celebrations 管理列表接口响应延迟 | 打开 Celebrations 管理页面 | 展示骨架屏，而非空白或卡死 |
| QA-celebration-007-admin-012 | §9 五态-empty | 某活动下从未创建过 Celebration | 打开该活动的 Celebrations 管理页面 | 展示"从未创建过 Celebration"文案，而非空白列表 |
| QA-celebration-007-admin-013 | §9 五态-empty2 | 已有 Celebration，筛选条件设为不存在的组合 | 应用筛选 | 展示"没有符合筛选条件的 Celebration"文案，与 012 文案不同 |
| QA-celebration-007-admin-014 | §9 用户端-empty | 某 Celebration 尚未开始（即将开始状态） | 打开该 Celebration 详情页 | 图片相册、涂鸦展示区域展示"活动开始前暂无内容"等空态文案，而非报错或空白 |
