/*
  活动详情页的「基础信息 / 附件 / 审批进度 / 审批与撤回操作」部分（REQ-001）。
  数据与常量见 activity-011-admin-pc.data.js；模块配置与修改记录（REQ-011）见 activity-011-admin-pc.modules.js。
*/
var Approval011 = (function () {
  var D = window.PROTO011;

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function emp(id) { return D.EMPLOYEES.filter(function (e) { return e.employee_id === id; })[0]; }
  function fmtSize(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function ctx() { return D.ctx; }

  /* ---------- 头部与基础信息 ---------- */
  function renderHeader() {
    var c = ctx();
    $('detailTitle').textContent = c.title;
    var b = $('detailBadge');
    b.className = 'p-badge ' + D.STATUS_BADGE[c.status];
    b.textContent = D.STATUS_LABEL[c.status];
    $('detailMeta').textContent = '由 ' + c.submitter + ' 提交于 ' + c.submitted_at;
  }
  function renderInfo() {
    var c = ctx(), i = c.info;
    $('infoKv').innerHTML =
      '<div><label>活动类型</label>' + esc(i.type) + '</div>' +
      '<div><label>计划举办时间</label>' + esc(i.time) + '</div>' +
      '<div><label>举办地点</label>' + esc(i.place) + '</div>' +
      '<div><label>预算</label>' + esc(i.budget) + '</div>' +
      '<div><label>参与范围</label>' + esc(i.scope) + '</div>' +
      '<div><label>外部可见性</label><span id="visDisplay"></span></div>';
    renderVisibility();
  }
  // 外部可见性：仅已发布 / 已结束且当前是行政时显示「修改」入口，保存不触发审批（activity-001 AC-007）
  function renderVisibility() {
    var c = ctx();
    var canEdit = (c.status === 'published' || c.status === 'ended') && c.account === 'admin';
    $('visDisplay').innerHTML = esc(D.VISIBLE_LABEL[c.external_visible]) +
      (canEdit ? ' <button class="p-link" onclick="Approval011.editVisibility()">修改</button>' : '');
    $('visEdit').classList.add('p-hidden');
  }
  function editVisibility() {
    var c = ctx();
    $('visOptions').innerHTML = ['internal_only', 'open_to_external'].map(function (v) {
      return '<button class="p-scope-btn' + (c.external_visible === v ? ' selected' : '') + '" data-v="' + v + '" onclick="Approval011.pickVisibility(this)">' + D.VISIBLE_LABEL[v] + '</button>';
    }).join('');
    $('visEdit').classList.remove('p-hidden');
  }
  function pickVisibility(btn) {
    Array.prototype.forEach.call($('visOptions').children, function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  }
  function saveVisibility() {
    var sel = $('visOptions').querySelector('.selected');
    ctx().external_visible = sel ? sel.dataset.v : ctx().external_visible;
    renderVisibility();
    ProtoConsole.toast('外部可见性已更新，无需审批');
  }
  function cancelVisibility() { $('visEdit').classList.add('p-hidden'); }

  /* ---------- 附件（五态） ---------- */
  function attachRows(list) {
    return list.map(function (a) {
      return '<div class="p-attach"><span class="p-attach-name" title="' + esc(a.file_name) + '">' + esc(a.file_name) + '</span>' +
        '<span class="p-attach-size">' + fmtSize(a.file_size) + (a.uploaded_at ? ' · ' + esc(a.uploaded_at) : '') + '</span>' +
        '<button class="p-link" data-toast="原型演示：下载 ' + esc(a.file_name).slice(0, 20) + '">下载</button></div>';
    }).join('');
  }
  function renderAttachments() {
    var list = ctx().attachments;
    $('attNormal').innerHTML = '<div class="p-attach-list">' + attachRows(list) + '</div>';
    var many = [];
    for (var i = 0; i < 12; i++) many.push({ file_name: '场地平面图-总部三楼多功能厅-含消防通道标注与设备摆放位置说明-终版-v' + (i + 1) + '.pptx', file_size: (i + 3) * 1048576, uploaded_at: '2026-09-14 10:30' });
    $('attOverflow').innerHTML = '<div class="p-attach-list">' + attachRows(many) + '</div>';
    ProtoConsole.setState('attach', list.length ? 'normal' : 'empty');   // 没有附件时显示「暂无附件」
  }

  /* ---------- 审批进度（固定三节点：提交 / 部门主管审批 / 第三节点审批） ---------- */
  function thirdStatus(c) {
    if (c.assignees.some(function (a) { return a.status === 'rejected'; })) return 'rejected';
    if (c.assignees.length && c.assignees.every(function (a) { return a.status === 'approved'; })) return 'approved';
    return c.dept.status === 'approved' ? 'current' : 'waiting';
  }
  function stepRow(numCls, numText, title, subHtml, stCls, stText, extraHtml) {
    return '<div class="p-step"><div class="p-step-num ' + numCls + '">' + numText + '</div>' +
      '<div class="p-step-info"><div class="p-step-title">' + title + '</div>' + subHtml + (extraHtml || '') + '</div>' +
      '<div class="p-step-status ' + stCls + '">' + stText + '</div></div>';
  }
  function timelineHtml(c, assignees) {
    var third = thirdStatus({ dept: c.dept, assignees: assignees });
    var html = stepRow('done', '✓', '提交', '<div class="p-step-sub">' + esc(c.submitter) + ' · ' + esc(c.submitted_at) + '</div>', 'done', '已提交');
    html += c.dept.status === 'approved'
      ? stepRow('done', '✓', '部门主管审批', '<div class="p-step-sub">' + esc(c.dept.name) + ' · ' + esc(c.dept.acted_at) + '</div>', 'done', '已通过',
          c.dept.comment ? '<div class="p-note">' + esc(c.dept.comment) + '</div>' : '')
      : stepRow('current', '2', '部门主管审批', '<div class="p-step-sub">' + esc(c.dept.name) + ' · 待处理</div>', 'current', '进行中');
    var rows = assignees.map(function (a) {
      var e = emp(a.employee_id);
      return '<div class="p-assignee"><div class="p-assignee-main"><span class="p-assignee-name">' + esc(e.name) + '</span><span class="p-assignee-no">工号 ' + e.employee_no + '</span>' +
        (a.employee_id === c.meId ? '<span class="p-me">我</span>' : '') +
        (a.comment ? '<div class="p-assignee-note">' + esc(a.comment) + (a.acted_at ? ' · ' + esc(a.acted_at) : '') + '</div>' : '') + '</div>' +
        '<span class="p-assignee-st ' + a.status + '">' + D.ASSIGNEE_ST[a.status] + '</span></div>';
    }).join('');
    var done = assignees.filter(function (a) { return a.status === 'approved'; }).length;
    var numCls = third === 'approved' ? 'done' : third === 'rejected' ? 'rejected' : third === 'current' ? 'current' : '';
    var numTxt = third === 'approved' ? '✓' : third === 'rejected' ? '✕' : '3';
    var stTxt = third === 'approved' ? '已通过' : third === 'rejected' ? '已驳回' : third === 'current' ? '进行中 ' + done + '/' + assignees.length : '待处理';
    html += stepRow(numCls, numTxt, '第三节点审批',
      '<div class="p-step-sub">共 ' + assignees.length + ' 位审批人并行处理，全部通过才算通过</div>',
      numCls === 'current' || numCls === 'done' || numCls === 'rejected' ? numCls : '', stTxt, '<div class="p-assignees">' + rows + '</div>');
    return html;
  }
  function renderApproval() {
    var c = ctx();
    $('apvNormal').innerHTML = '<div class="p-timeline">' + timelineHtml(c, c.assignees) + '</div>';
    $('apvOverflow').innerHTML = '<div class="p-timeline">' + timelineHtml(c, D.manyAssignees()) + '</div>';
  }

  /* ---------- 操作区：发起人撤回 / 审批人通过驳回 ---------- */
  function me() { var c = ctx(); return c.assignees.filter(function (a) { return a.employee_id === c.meId; })[0]; }
  function renderActions() {
    var c = ctx(), m = me();
    var showApprover = c.viewer === 'approver' && c.status === 'review' && m && m.status === 'pending';
    $('initiatorActions').classList.toggle('p-hidden', !(c.viewer === 'initiator' && c.status === 'review'));
    $('rejectedActions').classList.toggle('p-hidden', !(c.viewer === 'initiator' && c.status === 'rejected'));
    $('approverActions').classList.toggle('p-hidden', !showApprover);
    $('actionDoneMsg').classList.add('p-hidden');
    $('demoOthers').classList.add('p-hidden');
  }
  function afterStatusChange() {
    renderHeader(); renderVisibility(); renderApproval(); renderActions();
    Proto011.render();   // 状态变了，模块配置的编辑入口随之变化
  }
  function done(msg, showOthers) {
    $('approverActions').classList.add('p-hidden');
    var el = $('actionDoneMsg'); el.textContent = msg; el.classList.remove('p-hidden');
    $('demoOthers').classList.toggle('p-hidden', !showOthers);
  }
  function publishIfAllApproved() {
    var c = ctx();
    if (thirdStatus(c) !== 'approved') return false;
    c.status = 'published';
    return true;
  }
  function approve() {
    var c = ctx(), m = me();
    m.status = 'approved'; m.comment = $('approverComment').value.trim() || '同意，符合流程要求。'; m.acted_at = '刚刚';
    if (publishIfAllApproved()) {
      afterStatusChange();
      done('第三节点全部通过，活动已自动发布。', false);
    } else {
      renderApproval();
      var left = c.assignees.filter(function (a) { return a.status === 'pending'; }).length;
      done('已通过，还有 ' + left + ' 位审批人未处理，全部通过后活动将自动发布。', true);
    }
  }
  function othersApprove() {
    var c = ctx();
    c.assignees.forEach(function (a) { if (a.status === 'pending') { a.status = 'approved'; a.comment = '同意。'; a.acted_at = '刚刚'; } });
    publishIfAllApproved();
    afterStatusChange();
    done('第三节点全部通过，活动已自动发布。', false);
  }
  function reject() {
    var c = ctx(), comment = $('approverComment').value.trim();
    if (!comment) { $('approverCommentErr').classList.remove('p-hidden'); return; }
    $('approverCommentErr').classList.add('p-hidden');
    var m = me();
    m.status = 'rejected'; m.comment = comment; m.acted_at = '刚刚';
    c.assignees.forEach(function (a) { if (a.status === 'pending') a.status = 'revoked'; });
    c.status = 'rejected';
    afterStatusChange();
    done('已驳回，其余审批人的待办已同步撤销，活动退回发起人修改。', false);
  }
  function withdraw() {   // 二次确认后撤回：活动回到草稿，回到列表
    ProtoConsole.toast('已撤回，活动退回草稿');
    setTimeout(function () { location.href = D.LIST_URL; }, 900);
  }

  function render() {
    renderHeader(); renderInfo(); renderAttachments(); renderApproval(); renderActions();
    $('approverComment').value = '';
    $('approverCommentErr').classList.add('p-hidden');
  }

  return { render: render, renderActions: renderActions, renderHeader: renderHeader, renderVisibility: renderVisibility,
           editVisibility: editVisibility, pickVisibility: pickVisibility, saveVisibility: saveVisibility, cancelVisibility: cancelVisibility,
           approve: approve, reject: reject, othersApprove: othersApprove, withdraw: withdraw };
})();
