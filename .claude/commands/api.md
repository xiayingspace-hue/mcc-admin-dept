# /api — 从需求文档生成接口清单

用法：`/api <编号>`

步骤：
1. 读对应 `requirements/.../<slug>-<编号>-*.md` 的「数据对象」「页面与状态清单」章节。
2. 读 `rules/api-rules.md`、`background/conventions.md`（分页/时区/金额精度默认值）。
3. 用 `templates/api-list.md` 骨架，为每个页面需要的接口写请求/响应字段表，枚举值单列表格。
4. 写入 `outputs/api/API-<slug>-<编号>-<端侧>.md`，状态标「草案」。
5. 不新增需求文档里没有的业务规则；权限/校验只引用章节号，不复述内容。
