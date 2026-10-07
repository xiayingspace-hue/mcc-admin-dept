#!/usr/bin/env bash
# 机械可判定的一致性检查（/check 的 1～3 项）：编号唯一、命名规范、slug 受控。
# 语义类检查（字段一致性、五态、AC 追溯）仍由 /check 在本地完成。
set -u
cd "$(dirname "$0")/../.."

fail=0
err() { echo "::error::$1"; fail=1; }

# slug 受控表：取 GLOSSARY.md 中表格第一列的反引号内容
slugs=$(sed -n '/^| slug /,/^$/p' requirements/shared/GLOSSARY.md | grep -oE '^\| `[a-z-]+`' | grep -oE '[a-z-]+')
slug_count=$(echo "$slugs" | wc -l | tr -d ' ')
[ "$slug_count" -le 10 ] || err "GLOSSARY.md 登记了 $slug_count 个 slug，超过上限 10"
slug_re=$(echo "$slugs" | paste -sd'|' -)

# 1. 编号唯一
dups=$(grep -oE '^\| REQ-[0-9]{3} ' requirements/versions.md | sort | uniq -d)
[ -z "$dups" ] || err "versions.md 编号重复：$dups"

# 2/3. 命名 + slug 受控
check_names() { # <目录> <正则> <说明>
  while IFS= read -r f; do
    b=$(basename "$f")
    [[ "$b" =~ $2 ]] || { err "$f 不符合命名规范（$3）"; continue; }
  done < <(find "$1" -type f ! -name .DS_Store ! -path '*/_shared/*' 2>/dev/null)
}
sides='admin|user'; carriers='pc|h5|native'
check_names requirements/admin "^($slug_re)-[0-9]{3}-($sides)(-($carriers))?\.md$" "<模块>-<编号>-<端侧>[-<载体>].md"
check_names requirements/user  "^($slug_re)-[0-9]{3}-($sides)(-($carriers))?\.md$" "<模块>-<编号>-<端侧>[-<载体>].md"
check_names outputs/api "^API-($slug_re)-[0-9]{3}-($sides)\.md$" "API-<模块>-<编号>-<端侧>.md"
check_names outputs/qa  "^QA-($slug_re)-[0-9]{3}-($sides)\.md$" "QA-<模块>-<编号>-<端侧>.md"
check_names prototypes  "^($slug_re)-[0-9]{3}-($sides)-($carriers)(\.[a-z]+)?\.(html|js)$" "<模块>-<编号>-<端侧>-<载体>.html（附属 .js）"

# 文件名里的编号必须已登记在 versions.md
for n in $(git ls-files requirements outputs prototypes | grep -oE '\-[0-9]{3}-(admin|user)' | grep -oE '[0-9]{3}' | sort -u); do
  grep -q "REQ-$n" requirements/versions.md || err "编号 $n 出现在文件名里，但 versions.md 未登记"
done

[ $fail -eq 0 ] && echo "全部检查通过" || exit 1
