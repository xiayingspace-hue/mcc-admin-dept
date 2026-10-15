---
编号: REQ-008
模块: sponsor
端侧: admin
载体: shared
状态: 已确认
---

# 赞助商管理（sponsor-008-admin）

## 1. 概述

活动详情页面提供"Become a Sponsor"入口，供外部企业/合作伙伴提交赞助意向线索；行政在管理端查看全部线索并跟进联系。本需求覆盖赞助意向的提交、查看、跟进状态标记；不覆盖赞助商的付款、合同、赞助等级核算等后续商务流程。

**非目标**：不做赞助商审批（无需谁批准一条赞助线索）；不做赞助等级自动核算或额度校验；不提供赞助线索的删除能力。

## 2. 涉及角色

引用 [`ROLES.md`](../../shared/ROLES.md)：外部人士（提交赞助意向，无需系统账号）、行政（查看/跟进全部线索）。

## 3. 术语与模块归属

依赖 `activity-001-admin`（"Become a Sponsor"入口挂载在活动详情页，归属活动本身，与具体某个 `celebration-007-admin` 无关）。

## 4. 使用场景

- 外部合作伙伴访问活动详情页，看到"Become a Sponsor"入口，点击后在新标签页打开独立的填写页（不是弹窗；PC 与手机 H5 共用同一个页面），填写公司信息表达赞助意向。
- 行政打开"赞助商管理"页面，查看全部活动的赞助线索，按活动筛选查看。
- 行政把当前筛选出的赞助线索导出成 Excel 表格，用于线下汇总、转发给商务或赞助负责人。
- 行政在 2 个工作日内联系某条线索后，将其标记为"已联系"，避免重复跟进。

## 5. 业务流程与状态机

| 当前状态 | 触发动作 | 下一状态 |
|---|---|---|
| （新建）| 访客提交赞助意向表单 | `待联系` |
| `待联系` | 行政标记"已联系" | `已联系` |
| `已联系` | 行政标记回"待联系" | `待联系` |

不设审批环节，也不提供删除；状态仅在"待联系"与"已联系"之间往返流转。

## 6. 数据对象

**赞助线索（SponsorLead）**：归属某个活动的一条赞助意向记录。包含公司名称、联系人姓名、职位、邮箱、电话（以上均必填）、意向赞助等级（选填，枚举：Diamond / Platinum / Gold / Silver / Individual Seat / Custom）、席位数量（仅当等级为 Individual Seat 时填写，必填，大于等于 1 的整数）、自定义赞助说明（仅当等级为 Custom 时填写，必填，不超过 200 个字符，由访客自己描述想要的赞助方式或金额）、留言/特殊需求（选填自由文本）、提交时间、跟进状态。

## 7. 权限规则

- 任何访问活动详情页的访客（含未登录、无系统账号的外部人士）均可提交赞助线索，不做身份校验（与活动"外部可见性"设置的联动关系见 §11 已知缺口）。
- 仅行政可以查看全部赞助线索、按活动筛选、切换跟进状态、导出赞助线索；不提供删除操作。导出入口只对行政显示，后端同样校验，非行政调用导出接口被拒绝。

## 8. 校验规则

- 提交表单时，公司名称、联系人、职位、邮箱、电话为必填；邮箱需符合邮箱格式校验（含 @ 与域名，不超过 100 个字符，规则同 REQ-004 AC-006）。
- 电话只能输入数字，须为新加坡 8 位（以 8 或 9 开头）或中国大陆 11 位（以 1 开头）手机号（规则同 REQ-004 AC-014，前端拦截 + 后端二次校验）。
- 意向赞助等级、留言/特殊需求为选填。
- 意向赞助等级选 Custom 时，自定义赞助说明必填（空格不算内容），不超过 200 个字符（汉字、字母、标点、空格、换行各按 1 个计）；选其他等级或不选等级时，不显示也不提交该说明。前端实时校验，后端二次校验。
- 意向赞助等级选 Individual Seat 时，席位数量必填，须为大于等于 1 的整数（上限见 §11）；选其他等级或不选等级时，不显示也不提交席位数量。前端实时校验，后端二次校验。

- **导出**（后端生成，不依赖前端当前页的数据）：
  - 格式为 Excel（.xlsx）；范围为当前"按活动筛选"条件下的全部赞助线索（不是只导出当前页），不筛选则导出全部活动的所有线索；列表没有数据时，导出按钮置灰不可点。
  - 列：所属活动、公司名称、联系人、职位、邮箱、电话、意向赞助等级、自定义赞助说明（等级为 Custom 时的完整内容，单独一列）、席位数量（等级为 Individual Seat 时的数量，单独一列）、留言 / 特殊需求（全文）、提交时间、跟进状态。文字不截断，不含"操作"列。
  - 提交时间按新加坡时间，格式 `yyyy-MM-dd HH:mm`；跟进状态导出为中文"待联系""已联系"；空值导出为空，不写"—"。
  - 文件名：`赞助商线索_<活动名或全部活动>_<导出日期>.xlsx`，导出日期为新加坡日期，格式 `yyyy-MM-dd`。

## 9. 页面与状态清单

| 页面 | 需要的状态 |
|---|---|
| 活动详情页 - Become a Sponsor 入口（用户端 PC / H5） | normal（点击后在新标签页打开填写页，不弹窗） |
| Become a Sponsor 填写页（用户端 PC 与 H5 共用同一页面，响应式；新标签页打开） | normal / error(必填项缺失或邮箱格式不合法) / error(选了 Custom 但未填自定义赞助说明，或超过 200 个字符) / error(选了 Individual Seat 但席位数量缺失或不是大于等于 1 的整数) / error(提交失败，如活动不存在，已填内容保留) / error(链接缺少活动标识，不显示表单) / 提交中(提交按钮不可重复点击) / 提交成功(原地替换为感谢文案与「返回活动详情」) |
| 赞助商管理（列表，按活动筛选） | normal / loading / empty(该活动尚无赞助线索) / overflow(自定义赞助说明很长时，列表中最多 2 行加省略号) / 导出中(按钮显示导出中、不可重复点击) / 导出失败(提示失败原因，可重试) |

PC 与 H5 共用同一个填写页面，按屏宽响应式适配（AC-024），不另做 H5 版本。填写页无需拉取列表数据，因此不要求 loading / empty / noperm / overflow 状态；页面由主视觉与介绍文案、赞助等级卡片、「Sponsor Now」表单、「Contact Us」联系方式组成（内容见 AC-020、附录 A）；页面最上方有页头、最下方有页脚（内容见 AC-020、附录 A）；页头页脚的导航链接目标见 §11。

> `prototypes/activity-001-admin-pc.html` 中的 Become a Sponsor 填写页与赞助商管理页面是本需求确认前的探索性草图，字段与本文档一致但尚未经过接口清单核对，`/api` 与 `/proto` 需按标准顺序重新对齐。

## 10. 验收标准

- AC-001：提交表单时，公司名称/联系人/职位/邮箱/电话任一为空，阻止提交并提示对应字段。
- AC-002：邮箱必填；格式不合法（缺少 @ 或域名）或超过 100 个字符时阻止提交，并在邮箱输入框下方提示原因、输入框标红；输入过程中有内容即实时校验，输入框失焦或点击提交时空值也提示。规则同 REQ-004 AC-006。
- AC-003：提交成功后，用户端展示感谢文案；该线索同步出现在行政的"赞助商管理"列表中，初始跟进状态为"待联系"。
- AC-004：赞助商管理左侧导航项在存在"待联系"状态的记录时显示数字角标，数字等于当前"待联系"记录总数；全部处理完毕后角标自动消失。
- AC-005：行政点击"标记已联系"后，该记录状态变为"已联系"，角标数字相应减少；可再次点击标记回"待联系"，角标数字相应增加。
- AC-006：按活动筛选后，仅显示该活动下的赞助线索；切换筛选条件立即重新应用，无需刷新页面。
- AC-007：用户端 Become a Sponsor 表单里，意向赞助等级选 Custom 时，下方出现"自定义赞助说明"输入框；选 Diamond / Platinum / Gold / Silver / Individual Seat，或回到"Please select"时，输入框隐藏。
- AC-008：选了 Custom 时，自定义赞助说明必填，留空或只有空格点击提交被阻止并提示；最多 200 个字符，恰好 200 个可提交，201 个被阻止并提示，输入框下方实时显示"已输入 / 200"。
- AC-009：把等级从 Custom 改成其他等级（或清空选择）后，自定义赞助说明输入框隐藏、之前填写的内容被清除，不随表单提交，也不保存；再次选回 Custom 时输入框是空的。
- AC-010：行政在赞助商管理列表中，Custom 线索的"意向等级"列显示为"Custom：xxx"（xxx 为访客填的说明），最多 2 行，超出以省略号截断，鼠标悬停显示全文；其他等级仍只显示等级名。
- AC-011：后端同样校验：等级为 Custom 而说明为空、只有空格或超过 200 个字符的请求被拒绝并返回明确原因；等级不是 Custom 时传来的说明被忽略、不保存。
- AC-012：赞助商管理列表右上角有"导出"按钮（仅行政可见）；点击后下载一个 Excel 文件，文件名为 `赞助商线索_<活动名或全部活动>_<导出日期>.xlsx`。列表没有数据时按钮置灰。
- AC-013：导出的范围与当前"按活动筛选"一致：选了某个活动，只含该活动的全部线索；选"全部活动"，含所有活动的全部线索；线索多于一页时，导出的仍是全部，不只是当前页。
- AC-014：导出文件的列依次为所属活动、公司名称、联系人、职位、邮箱、电话、意向赞助等级、自定义赞助说明、席位数量、留言 / 特殊需求、提交时间、跟进状态；自定义赞助说明和留言是完整全文，不截断；邮箱、电话不合并成一列；提交时间为新加坡时间；跟进状态为中文；空值为空单元格。
- AC-015：导出的数据与导出那一刻后端的最新数据一致（例如刚被标记为"已联系"的线索，导出里就是"已联系"），不依赖浏览器里当前显示的内容。
- AC-016：非行政账号看不到导出按钮；绕过页面直接调用导出接口被后端拒绝，不返回任何数据。
- AC-017：赞助商线索列表里所有线索默认按创建时间（用户提交的时间）倒序排列，最新的在最前；与按活动筛选同时生效（先筛选再排序），翻页不重复不遗漏；标记跟进状态不改变线索在列表中的位置；新提交的线索出现在最前。规则见 `conventions.md`「列表默认排序」。
- AC-018：赞助商线索列表每页 20 条，底部按 `conventions.md`「分页」显示「共 N 条」与分页条；切换「按活动筛选」后回到第 1 页；标记已联系后停留在当前页；左侧导航「待联系」角标统计全量，不随翻页变化（AC-004）；导出不受分页限制，仍导出当前筛选下的全部线索（AC-013）；翻页中显示 loading，失败显示错误与「重试」且停留在原页码。
- AC-019：用户端（PC 与 H5）活动详情页点击「Become a Sponsor」，在新标签页打开独立的 Sponsor 填写页，不再弹出对话框；原活动详情页保持原状、不受影响。
- AC-020：填写页自上而下展示：页头（左侧 MCC 标识，右侧导航 CEO Message / History / Activities / Voices）；主视觉标题（"Build the Next 30 Years. Become a Sponsor."）与中英文介绍文案；5 档赞助等级卡片（Diamond / Platinum / Gold / Silver / Individual Seat，价格与权益为页面固定文案，见附录 A）；"Sponsor Now" 表单（公司名称、联系人、职位、邮箱、电话、意向赞助等级，按所选等级出现的席位数量 / 自定义赞助说明，留言 / 特殊需求）与 "Submit Application" 按钮；"Contact Us"（咨询邮箱与电话）；页脚（红底，左侧「三十而筑 BUILDING BEYOND 30」标识，右侧同一组导航）。必填项、校验规则与 AC-001、AC-002、AC-007～AC-009 一致；必填字段（公司名称、联系人、职位、邮箱、电话，以及出现时的席位数量、自定义赞助说明）的标签后显示红色 *，选填字段（意向赞助等级、留言 / 特殊需求）不显示。
- AC-021：填写页的地址带有所属活动标识（`activity_id`），提交时随表单一并提交；地址缺少活动标识时，页面提示「链接无效，请从活动详情页进入」且不显示表单；提交时后端找不到该活动，页面提示失败原因并保留已填内容，可重试。
- AC-022：提交成功后，填写页原地把表单替换为感谢文案（同 AC-003）并提供「返回活动详情」按钮，点击在当前标签页跳转到该活动的详情页；感谢页不再显示表单，避免重复提交。提交过程中提交按钮置为不可点，防止重复提交。
- AC-023：用户未提交就返回、关闭标签页或刷新填写页，已填内容不保留、也不弹出离开确认；再次从活动详情页进入填写页，表单是空的（等级为「Please select」）。
- AC-024：填写页 PC 与 H5 共用同一个页面，按屏宽响应式：PC 宽屏居中卡片展示；手机窄屏单列、表单撑满屏宽，不出现横向滚动条，输入框与提交按钮易于点击。字段、必填、校验、提交与感谢页行为在两种屏宽下完全一致。
- AC-025：活动结束之后，Become a Sponsor 入口与填写页仍可打开、仍可提交赞助线索，不因活动状态拦截；提交后同样出现在行政「赞助商管理」列表中（所属活动为该活动）。
- AC-026：赞助等级卡片宽屏一屏展示 3 张，用左右箭头切换到其余卡片（首屏的左箭头、末屏的右箭头置灰）；窄屏一屏展示 1 张。卡片内容为固定文案，不随活动变化，也不提供后台配置。
- AC-027：意向赞助等级下拉选项为：Please select、Diamond、Platinum、Gold、Silver、Individual Seat、Custom。选 Individual Seat 时，下方出现必填的「席位数量」输入框；留空、0、负数、小数、非数字点击提交被阻止并提示；输入 1 及以上的整数可提交。改选其他等级（或回到"Please select"）后，席位数量输入框隐藏、已填内容被清除，不随表单提交、也不保存；再次选回 Individual Seat 时输入框是空的。后端同样校验：等级为 Individual Seat 而席位数量缺失或不是大于等于 1 的整数的请求被拒绝并返回明确原因；等级不是 Individual Seat 时传来的席位数量被忽略、不保存。
- AC-028：行政在赞助商管理列表中，Individual Seat 线索的"意向等级"列显示为"Individual Seat × N"（N 为席位数量）；导出文件中该线索的意向赞助等级为 Individual Seat，席位数量单独一列填 N，其他等级该列为空。
- AC-029：电话必填，只能输入数字（输入其他字符被忽略，粘贴时也只保留数字），不带国家码、空格或连字符；支持两种手机号：新加坡 8 位数字（以 8 或 9 开头，如 91234567）、中国大陆 11 位数字（以 1 开头，如 13800138000）；其他位数或开头的号码阻止提交，并在电话输入框下方提示原因、输入框标红；输入过程中有内容即实时校验，输入框失焦或点击提交时空值也提示。后端同样校验，不合格的请求被拒绝并返回明确原因。规则同 REQ-004 AC-014。

## 11. 已知缺口与非目标

| 缺口 | 谁来定 | 何时前定 |
|---|---|---|
| Become a Sponsor 入口是否需要遵守活动"外部可见性"设置（当前版本任何人访问活动详情页均可看到入口，不受该设置约束） | 行政 | 开发排期前 |
| 是否需要限制同一公司/邮箱重复提交（去重逻辑） | 行政 | 开发排期前 |
| "2 个工作日内跟进"是否为硬性 SLA，超时是否需要提醒或升级 | 行政 | 开发排期前 |
| 导出赞助线索是否需要记录操作日志（谁在什么时候导出了什么）；导出文件包含联系人邮箱、电话等个人信息，下载后的保管和使用规范不在系统控制范围内 | 行政 + 合规 | 开发排期前 |
| 席位数量（Individual Seat）是否设上限（当前只要求大于等于 1 的整数，不设上限） | 行政 | 开发排期前 |
| 页头 / 页脚导航（CEO Message、History、Activities、Voices）的跳转目标页；其中 CEO Message、History 对应的活动模块已在 REQ-002 下线，当前原型只画导航、点击不跳转 | 行政 / 产品 | 开发排期前 |
| 附录 A 中文介绍文案由设计稿截图转录，需校对（如"鼎力赞助"的用字）；页面所需的 MCC logo 等图片资源需设计提供 | 行政 / 设计 | 开发排期前 |
| 电话目前只接受新加坡 / 中国大陆手机号（与报名一致），座机（如新加坡 6 开头 8 位）与其他国家号码会被拦截；赞助商是外部企业，是否需要放开座机 / 海外号码 | 行政 | 开发排期前 |
| 赞助线索当前归属整个活动；若未来需要按 Celebration/site 细分归属，需另行评估数据结构调整 | 行政 | 该需求出现时 |

## 附录 A · 填写页固定文案（设计稿）

页面固定文案，所有活动共用；修改文案走需求变更。

**主视觉**：标题「Build the Next 30 Years.」（红色）「Become a Sponsor.」（黑色）。

**英文介绍**：
1. As MCC Singapore proudly marks its 30th Anniversary, we take this special occasion to reflect with gratitude and pride on three decades of growth, achievements and enduring partnerships.
2. Throughout these remarkable 30 years, the trust, confidence and continued support of our valued business partners have been instrumental to our journey. Together, we have contributed to shaping Singapore's built environment and creating a lasting legacy of progress and excellence.
3. To commemorate this significant milestone, we are honoured to extend a cordial invitation to your esteemed organisation to participate as a valued sponsor of our 30th Anniversary Celebration, contributing to a memorable and meaningful occasion that celebrates our collective achievements.
4. Your meaningful contribution would add special significance to this celebration, while reflecting the spirit of mutual trust, close collaboration and longstanding partnership that we have built and greatly valued over the years.
5. As we celebrate this important chapter in MCC Singapore's history, we wish to express our sincere appreciation for your continued trust and support. We look forward to strengthening our partnership and exploring new opportunities for collaboration and shared success in the years ahead.

**中文介绍**：
1. 值此中冶新加坡成立三十周年之际，我们满怀感恩与喜悦，回望三十载砥砺奋进的辉煌历程。感念各界合作伙伴的信任和支持，我们携手并进、共同谱写了新加坡城市建设与发展的精彩篇章。
2. 为庆祝这一意义非凡的重要里程碑，我们诚挚邀请贵司鼎力赞助、共襄盛举，携手呈献一场隆重而难忘的三十周年庆典。
3. 您的慷慨支持，不仅将为本次盛典增添光彩，更是双方深厚合作情谊的珍贵见证。我们期待与您并肩开创更加辉煌的未来。

**赞助等级卡片**（按此顺序）：

| 等级 | 价格 | 权益 |
|---|---|---|
| Diamond | SGD 30,000 | 1 additional table (10 pax) at our 30th appreciation dinner + 1 VIP seat；6 Anniversary Concert tickets；Logo display at Business Partner Appreciation Dinner；On-stage emcee acknowledgement during the appreciation dinner；Logo on the appreciation dinner wall & in the dinner guide；Naming rights for anniversary game |
| Platinum | SGD 20,000 | 1 additional table (10 pax) at our 30th appreciation dinner；2 Anniversary Concert tickets；Logo display at Business Partner Appreciation Dinner；On-stage emcee acknowledgement during the appreciation dinner；Logo on the appreciation dinner wall & in the dinner guide |
| Gold | SGD 10,000 | 5 additional seats at our 30th appreciation dinner；Logo display at Business Partner Appreciation Dinner；Logo on the appreciation dinner wall |
| Silver | SGD 3,000 | Logo display at Business Partner Appreciation Dinner；Logo on the appreciation dinner wall |
| Individual Seat | SGD 1,000 /Seat | No sponsorship commitment required；1 seat at our 30th Anniversary Business Partner Appreciation Dinner；Opportunity to celebrate and connect with our business partners |

**页头**：左侧 MCC 标识，右侧导航「CEO Message」「History」「Activities」「Voices」。

**页脚**：红底，左侧「三十而筑 BUILDING BEYOND 30」标识，右侧与页头相同的导航。

**表单区**：标题「Sponsor Now」；说明「We warmly invite you to join this milestone journey. Please complete the form below and our team will be in touch shortly.」；字段标签中英双语、英文在前中文在后：Company Name 公司名称 / Contact Person 联系人 / Designation 职位 / Email 邮箱 / Phone 电话 / Preferred Sponsorship Tier 意向赞助等级 / Message / Special Requests 留言 / 特殊需求（选 Individual Seat / Custom 时出现的 Number of Seats 席位数量 / Custom Details 自定义赞助说明 同样中英双语）；留言说明文案（「Tell us anything we should know – branding materials, dietary requirements, special requests...」）；按钮「Submit Application」。

**Contact Us**：「For enquiries, please contact:」admincorpculture@mccsingapore.com.sg　+65 6766 6883。
