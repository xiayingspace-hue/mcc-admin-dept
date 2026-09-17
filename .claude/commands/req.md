# /req — 从一句话想法生成需求文档

用法：`/req <一句话想法> [--slug <模块slug>] [--端侧 admin|user]`

步骤：
1. 读 `CLAUDE.md`、`rules/requirement-rules.md`、`requirements/shared/ROLES.md`、`requirements/shared/GLOSSARY.md`、`background/*`。
2. 按 `requirement-rules.md` 的四类缺口检查，最多问 4 题，一次性问完。
3. 从 `requirements/versions.md` 取下一个编号。
4. 用 `templates/requirement.md` 骨架，覆盖十一个章节，写入 `requirements/<端侧>/shared/<slug>-<编号>-<端侧>.md`。
5. 若有载体差异，追加 `requirements/<端侧>/<载体>/<slug>-<编号>-<端侧>-<载体>.md`，只写差异。
6. 更新 `requirements/versions.md`：新增一行索引，标状态为「草稿」，若依赖其他编号，补进依赖树。
