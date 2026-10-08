/*
  activity-011-admin-pc 的演示数据与常量（只放"数据的形状和取值"，不放交互逻辑）。
  本页是「活动详情页」的唯一原型：审批进度、附件、外部可见性（REQ-001）与已发布后的模块配置 / 修改记录（REQ-011）都在这里。
  字段名 / 枚举值对应：
    outputs/api/API-activity-001-admin.md  status、external_visible、steps[]、assignees[]、viewer_role、activityAttachment
    outputs/api/API-activity-011-admin.md  editable、uneditable_reason、config_version、modules[]、activityModuleLog、adjust_error
    outputs/api/API-module-002-admin.md    module_type、display_start_time、sort_order、message_deadline
*/
window.PROTO011 = (function () {
  // 演示用的「当前时间」：让寄语墙的留言截止时间处于「已截止」，才能演示「改到未来即重新开放」（REQ-011 AC-019）
  var NOW = '2027-01-18T10:00';
  var PLAN_START = '2027-01-15T09:00';   // 活动计划开始时间（寄语墙留言截止时间须晚于它，沿用 module-002-admin §8）
  var PAGE_SIZE = 20;                    // 分页规则见 background/conventions.md
  var LIST_URL = 'activity-001-admin-pc.html';

  var STATUS_LABEL = { draft: '草稿', review: '审批中', published: '已发布', rejected: '已驳回', ended: '已结束' };
  var STATUS_BADGE = { draft: 'draft', review: 'review', published: 'approved', rejected: 'rejected', ended: 'ended' };
  var VISIBLE_LABEL = { internal_only: '仅内部可见', open_to_external: '对外部人员开放' };
  var ASSIGNEE_ST = { pending: '待处理', approved: '已通过', rejected: '已驳回', revoked: '已撤销' };

  // 员工（第三节点审批人的姓名 / 工号，数据形状同 API 的 employee）
  var EMPLOYEES = [
    { employee_id: 'E0001', name: 'XY',  employee_no: '0001' },
    { employee_id: 'E1023', name: '王芳', employee_no: '1023' },
    { employee_id: 'E2047', name: '陈静', employee_no: '2047' },
    { employee_id: 'E1188', name: '刘洋', employee_no: '1188' },
    { employee_id: 'E3012', name: '张伟', employee_no: '3012' },
    { employee_id: 'E3305', name: '张伟', employee_no: '3305' },
    { employee_id: 'E2210', name: '赵敏', employee_no: '2210' },
    { employee_id: 'E1575', name: '孙浩', employee_no: '1575' },
    { employee_id: 'E4021', name: '周婷', employee_no: '4021' },
    { employee_id: 'E0876', name: '吴磊', employee_no: '0876' },
    { employee_id: 'E2933', name: '郑凯', employee_no: '2933' },
    { employee_id: 'E1740', name: '林悦', employee_no: '1740' }
  ];

  // module_type 取自 API-module-002-admin.md；已发布活动只涉及挂载在活动上的两类（CEO 致辞、历史时间轴已下线）
  var MODULE_TYPES = [
    { module_type: 'blog_list',  name: 'Celebrations', category: 'content' },
    { module_type: 'wall',       name: '寄语墙',       category: 'interactive' }
  ];
  var CATEGORY_LABEL = { content: '内容型', interactive: '互动型' };

  var CHANGE_FIELD = {   // change_field 枚举
    enabled: '启用状态', display_start_time: '开始展示时间', sort_order: '排序', message_deadline: '留言截止时间'
  };
  var ADJUST_ERROR = {   // adjust_error 枚举 → 页面提示文案
    activity_not_published: '活动已结束，无法修改',
    field_out_of_scope: '请求包含模块配置以外的内容，已被拒绝',
    config_version_conflict: '配置已被他人修改，请刷新后重试',
    deadline_in_past: '截止时间不能早于当前时间',
    display_start_in_future: '该板块已在用户页面显示，开始展示时间不能改到未来；想收回请停用该板块',
    validation_failed: '配置校验未通过',
    no_permission: '没有权限修改模块配置',
    log_write_failed: '修改记录写入失败，本次保存未生效，请重试'
  };

  var ATTACHMENTS = [   // list[]：file_name / file_size（字节）/ uploaded_at
    { file_name: '活动方案-30周年庆典.pdf', file_size: 3.2 * 1048576, uploaded_at: '2026-09-14 10:20' },
    { file_name: '预算明细.xlsx', file_size: 860 * 1024, uploaded_at: '2026-09-14 10:24' },
    { file_name: '场地平面图-总部三楼多功能厅-含消防通道标注与设备摆放位置说明-终版-v3.pptx', file_size: 12.4 * 1048576, uploaded_at: '2026-09-14 10:30' }
  ];

  var DEMO_MODULES = [   // 已发布活动的初始模块配置：Celebrations尚未到展示时间、寄语墙已在显示且留言已截止
    { module_type: 'blog_list', display_start_time: '2027-01-25T09:00', sort_order: 1, message_deadline: null },
    { module_type: 'wall',      display_start_time: '2027-01-10T09:00', sort_order: 2, message_deadline: '2027-01-17T18:00' }
  ];
  var DEMO_LOGS = [      // 倒序：最新在最前
    { log_id: 'L3', operator_id: 'E1023', operator_name: '王芳', operated_at: '2027-01-14 16:20',
      changes: [{ module_type: 'wall', field: 'message_deadline', before: '2027-01-16T18:00', after: '2027-01-17T18:00' }] },
    { log_id: 'L2', operator_id: 'E1575', operator_name: '孙浩', operated_at: '2027-01-12 10:05',
      changes: [{ module_type: 'blog_list', field: 'display_start_time', before: null, after: '2027-01-25T09:00' }] },
    { log_id: 'L1', operator_id: 'E0001', operator_name: 'XY', operated_at: '2027-01-10 09:30',
      changes: [{ module_type: 'wall', field: 'display_start_time', before: '2027-01-15T09:00', after: '2027-01-10T09:00' }] }
  ];

  // 四种活动状态各一份演示数据，key 即 URL 参数 ?case=
  function build(key) {
    var allApproved = function () {
      return [
        { employee_id: 'E1023', status: 'approved', comment: '同意，预算说明清楚。', acted_at: '2026-09-14 14:20' },
        { employee_id: 'E2047', status: 'approved', comment: '同意。', acted_at: '2026-09-15 09:40' },
        { employee_id: 'E1188', status: 'approved', comment: '同意。', acted_at: '2026-09-15 09:40' }
      ];
    };
    var base = {
      key: key,
      account: 'admin',                 // admin | other（当前登录人是否行政）
      viewer: 'initiator',              // viewer_role：initiator | approver | viewer
      external_visible: 'open_to_external',
      attachments: ATTACHMENTS.slice(),
      dept: { name: '张伟（技术部经理）', status: 'approved', acted_at: '2026-09-14 11:05', comment: '同意，注意控制现场噪音，提前和物业报备。' },
      assignees: allApproved(),
      meId: null,
      config_version: 'v7',
      modules: DEMO_MODULES.map(function (m) { return Object.assign({}, m); }),
      logs: DEMO_LOGS.map(function (l) { return Object.assign({}, l); }),
      plan_start: PLAN_START
    };
    if (key === 'review') {
      return Object.assign(base, {
        title: '公司30周年庆典', status: 'review', submitter: 'XY', submitted_at: '2026-09-14 10:32',
        info: { type: '周年庆', time: '2026-11-20 14:00 – 17:00', place: '总部三楼多功能厅', budget: 'S$68,000', scope: '全员' },
        assignees: [
          { employee_id: 'E1023', status: 'approved', comment: '同意，预算说明清楚。', acted_at: '2026-09-14 14:20' },
          { employee_id: 'E2047', status: 'pending', comment: '', acted_at: '' },
          { employee_id: 'E1188', status: 'pending', comment: '', acted_at: '' }
        ],
        meId: 'E2047', logs: [], config_version: 'v1'
      });
    }
    if (key === 'rejected') {
      return Object.assign(base, {
        title: '中秋福利活动', status: 'rejected', submitter: 'XY', submitted_at: '2026-09-02 11:00',
        info: { type: '生日会', time: '2026-09-25 15:00 – 17:00', place: '总部一楼大堂', budget: 'S$15,000', scope: '全员' },
        external_visible: 'internal_only',
        assignees: [
          { employee_id: 'E1023', status: 'rejected', comment: '预算偏高，请调整后重新提交。', acted_at: '2026-09-03 10:12' },
          { employee_id: 'E2047', status: 'revoked', comment: '', acted_at: '' },
          { employee_id: 'E1188', status: 'revoked', comment: '', acted_at: '' }
        ],
        logs: [], config_version: 'v1'
      });
    }
    if (key === 'ended') {
      return Object.assign(base, {
        title: 'Q3部门团建', status: 'ended', submitter: '李强', submitted_at: '2026-07-10 09:15',
        info: { type: '团建', time: '2026-08-02 09:00 – 18:00', place: '圣淘沙', budget: 'S$8,000', scope: '指定部门' },
        attachments: [], external_visible: 'internal_only'
      });
    }
    return Object.assign(base, {   // published
      title: '2026年会', status: 'published', submitter: '王芳', submitted_at: '2026-09-14 10:32',
      info: { type: '年会', time: '2027-01-15 09:00 – 18:00', place: '总部三楼多功能厅', budget: 'S$120,000', scope: '全员' }
    });
  }

  // 刚从创建流程「提交审批」跳转过来：审批人与附件由创建页通过 sessionStorage 带过来
  function buildFresh(fresh) {
    var c = build('review');
    c.dept = { name: '张伟（技术部经理）', status: 'pending', acted_at: '', comment: '' };
    c.meId = null; c.logs = []; c.config_version = 'v1';
    c.assignees = (fresh.assignee_ids || []).map(function (id) { return { employee_id: id, status: 'pending', comment: '', acted_at: '' }; });
    c.attachments = (fresh.attachments || []).map(function (a) { return { file_name: a.name, file_size: a.size, uploaded_at: a.uploaded_at || '刚刚' }; });
    return c;
  }

  // 「记录很多、值很长」的演示数据：45 条，按 PAGE_SIZE 分 3 页
  function overflowLogs() {
    var longTxt = '这是一段很长的说明用于演示换行不会撑破布局这是一段很长的说明用于演示换行不会撑破布局';
    var out = [];
    for (var i = 0; i < 45; i++) {
      out.push({
        log_id: 'LO' + i, operator_id: 'E2047',
        operator_name: i % 2 ? '刘洋' : '陈静（市场部 · 活动运营组 · 高级行政专员）',
        operated_at: '2027-01-' + String(17 - Math.floor(i / 6)).padStart(2, '0') + ' ' + String(9 + i % 9).padStart(2, '0') + ':' + String((i * 7) % 60).padStart(2, '0'),
        changes: i % 3 === 0
          ? [
              { module_type: 'wall', field: 'message_deadline', before: '2027-01-16T18:00', after: '2027-01-17T18:00' },
              { module_type: 'blog_list', field: 'display_start_time', before: '2027-01-12T09:00', after: '2027-01-25T09:00' },
              { module_type: 'wall', field: 'enabled', before: true, after: false },
              { module_type: 'blog_list', field: 'enabled', before: false, after: true },
              { module_type: 'blog_list', field: 'sort_order', before: null, after: 4 }
            ]
          : [{ module_type: 'wall', field: 'message_deadline', before: longTxt, after: longTxt + longTxt }]
      });
    }
    return out;
  }

  // 「审批人很多」的演示数据：60 位第三节点审批人
  function manyAssignees() {
    var out = [];
    for (var i = 0; i < 60; i++) {
      var e = EMPLOYEES[i % EMPLOYEES.length];
      out.push({ employee_id: e.employee_id, status: i % 4 === 0 ? 'approved' : 'pending', comment: i % 4 === 0 ? '同意。' : '', acted_at: i % 4 === 0 ? '2026-09-15 10:00' : '' });
    }
    return out;
  }

  return {
    NOW: NOW, PLAN_START: PLAN_START, PAGE_SIZE: PAGE_SIZE, LIST_URL: LIST_URL,
    STATUS_LABEL: STATUS_LABEL, STATUS_BADGE: STATUS_BADGE, VISIBLE_LABEL: VISIBLE_LABEL, ASSIGNEE_ST: ASSIGNEE_ST,
    EMPLOYEES: EMPLOYEES, MODULE_TYPES: MODULE_TYPES, CATEGORY_LABEL: CATEGORY_LABEL,
    CHANGE_FIELD: CHANGE_FIELD, ADJUST_ERROR: ADJUST_ERROR,
    build: build, buildFresh: buildFresh, overflowLogs: overflowLogs, manyAssignees: manyAssignees,
    ctx: null    // 当前页面正在展示的活动，由 activity-011-admin-pc.js 载入
  };
})();
