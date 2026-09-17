# /new-product — 重置本仓套到下一个产品

用法：`/new-product`

用于同一套模板服务下一个产品时清空业务内容、保留骨架规则。

步骤：
1. 清空 `background/product-overview.md`、`background/conventions.md` 的正文，保留章节骨架。
2. 清空 `requirements/versions.md` 索引表，保留表头。
3. 清空 `requirements/shared/ROLES.md`、`GLOSSARY.md` 正文。
4. 删除 `requirements/admin/`、`requirements/user/`、`outputs/api/`、`outputs/qa/`、`prototypes/`（`_shared/` 保留，视觉系统跨产品复用）下的具体文件。
5. `rules/`、`templates/`、`CLAUDE.md`、`.claude/commands/` 不变——这些是跨产品复用的方法论层。
