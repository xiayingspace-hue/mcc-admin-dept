/*
  活动详情页的「模块配置 / 修改记录 / 编辑模块配置」部分（REQ-011）。
  数据与常量见 activity-011-admin-pc.data.js；基础信息、附件、审批进度见 activity-011-admin-pc.approval.js。
  校验规则对应 requirements/admin/shared/activity-011-admin.md §8；这里只是体验层演示，后端同样校验。
*/
var Proto011 = (function () {
  var D = window.PROTO011;
  function P() { return D.ctx; }   // 当前展示的活动（由 activity-011-admin-pc.js 载入）
  var draft = [];            // 编辑页草稿：[{module_type, enabled, display_start_time, sort_order, message_deadline}]
  var failMode = '';         // '' | conflict | ended | fail | log_write_failed（点「保存」时模拟的后端返回）
  var logPage = 1;

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function meta(t) { return D.MODULE_TYPES.filter(function (m) { return m.module_type === t; })[0]; }
  function fmtT(v) { return v ? String(v).replace('T', ' ') : '未填'; }
  function fmtVal(field, v) {
    if (field === 'enabled') return v ? '启用' : '停用';
    if (v === null || v === undefined || v === '') return '未填';
    return (field === 'display_start_time' || field === 'message_deadline') ? fmtT(v) : String(v);
  }
  function shown(m) { return m.display_start_time === null || m.display_start_time <= D.NOW; }      // 开始展示时间已到（或未填）= 用户页面已在显示
  function closed(m) { return !!m.message_deadline && m.message_deadline <= D.NOW; }
  function badge(m) { var c = meta(m.module_type || m).category; return '<span class="p-badge ' + c + '">' + D.CATEGORY_LABEL[c] + '</span>'; }
  function setPageState(group, state) { ProtoConsole.setState(group, state); }

  /* ---------- 详情页 ---------- */
  function editable() {
    if (P().status !== 'published') return { editable: false, reason: 'not_published' };
    if (P().account !== 'admin') return { editable: false, reason: 'no_permission' };
    return { editable: true };
  }
  function render() {
    var sorted = P().modules.slice().sort(function (a, c) { return a.sort_order - c.sort_order; });
    var on = {};
    var html = sorted.map(function (m) {
      on[m.module_type] = true;
      var line = '开始展示时间：' + (m.display_start_time === null ? '未填（发布后即显示）' : fmtT(m.display_start_time)) +
        (shown(m) ? '<span class="p-chip on">用户页面已显示</span>' : '<span class="p-chip">尚未开始展示</span>');
      if (m.module_type === 'wall') {
        line += '<br>留言截止时间：' + fmtT(m.message_deadline) +
          (closed(m) ? '<span class="p-chip">已截止</span>' : '<span class="p-chip on">留言开放中</span>');
      }
      return '<div class="p-module-row"><div class="p-module-summary"><div class="p-module-name">' + meta(m.module_type).name + badge(m) + '</div>' +
        '<div><span class="p-chip on">已启用</span> 排序 ' + m.sort_order + '<br>' + line + '</div></div></div>';
    }).join('');
    html += D.MODULE_TYPES.filter(function (x) { return !on[x.module_type]; }).map(function (x) {
      return '<div class="p-module-row"><div class="p-module-summary"><div class="p-module-name">' + x.name + badge(x.module_type) + '</div>' +
        '<div><span class="p-chip">未启用</span> 用户页面不显示；已有数据保留，重新启用后恢复</div></div></div>';
    }).join('');
    $('cfgList').innerHTML = html;

    var ed = editable();
    $('editEntry').classList.toggle('p-hidden', !ed.editable);             // AC-001、AC-006：不可编辑时入口直接不显示
    $('apiHint').innerHTML = '接口 GET /activityModule/adjust 返回：editable=' + ed.editable + (ed.reason ? '，uneditable_reason=' + ed.reason : '') +
      '；GET /activityModuleLog ' + (P().viewer === 'approver' ? '返回 error=forbidden_viewer（审批人视角，修改记录区块不显示，AC-021）' : '正常返回');
    $('logSection').classList.toggle('p-hidden', P().viewer === 'approver');
    renderLogs();
    renderAdjustOverflow();   // 编辑页的「超长内容」状态块不依赖是否打开过编辑页，控制台随时可切换
  }

  /* ---------- 修改记录（分页；排序在后端，倒序） ---------- */
  function changeLine(c) {
    return '<div class="p-log-change">' + meta(c.module_type).name + ' · ' + D.CHANGE_FIELD[c.field] + '：<span class="p-log-val">' + esc(fmtVal(c.field, c.before)) +
      '</span> → <span class="p-log-val">' + esc(fmtVal(c.field, c.after)) + '</span></div>';
  }
  function logHtml(all, pageable) {
    if (!all.length) return '<div class="p-empty">暂无修改记录</div>';
    var pages = Math.ceil(all.length / D.PAGE_SIZE);
    var page = pageable ? Math.min(logPage, pages) : 1;
    var items = all.slice((page - 1) * D.PAGE_SIZE, page * D.PAGE_SIZE);
    var h = items.map(function (it) {
      return '<div class="p-log-item"><div class="p-log-head"><b>' + esc(it.operator_name) + '</b><span>' + it.operated_at + '</span></div>' + it.changes.map(changeLine).join('') + '</div>';
    }).join('');
    if (pages > 1) {
      h += '<div class="p-pager"><span>共 ' + all.length + ' 条，第 ' + page + ' / ' + pages + ' 页</span>' +
        '<button class="p-link"' + (page <= 1 ? ' disabled' : ' onclick="Proto011.logGo(-1)"') + '>上一页</button>' +
        '<button class="p-link"' + (page >= pages ? ' disabled' : ' onclick="Proto011.logGo(1)"') + '>下一页</button></div>';
    }
    return h;
  }
  function renderLogs() {
    $('logNormal').innerHTML = logHtml(P().logs, false);
    $('logOverflow').innerHTML = logHtml(D.overflowLogs(), true);
    ProtoConsole.setState('log', P().logs.length ? 'normal' : 'empty');   // 没有记录时显示「暂无修改记录」
  }
  function logGo(d) { logPage += d; $('logOverflow').innerHTML = logHtml(D.overflowLogs(), true); }

  /* ---------- 编辑页 ---------- */
  function loadDraft() {
    var on = P().modules.slice().sort(function (a, b) { return a.sort_order - b.sort_order; }).map(function (m) {
      return { module_type: m.module_type, enabled: true, display_start_time: m.display_start_time, sort_order: m.sort_order, message_deadline: m.message_deadline };
    });
    var off = D.MODULE_TYPES.filter(function (x) { return !P().modules.some(function (m) { return m.module_type === x.module_type; }); }).map(function (x) {
      return { module_type: x.module_type, enabled: false, display_start_time: null, sort_order: null, message_deadline: null };
    });
    return on.concat(off);
  }
  var NOPERM_TEXT = {   // 直接进入编辑页被拦截时的原因（对应 uneditable_reason）
    no_permission: '你没有权限修改这个活动的模块配置（仅行政可以修改）',
    not_published: '这个活动当前不是「已发布」状态，不能修改模块配置'
  };
  function openAdjust() {
    var ed = editable();
    if (!ed.editable) {   // AC-006：直接进入编辑页也拦截，不依赖入口按钮被隐藏；后端对保存请求同样拒绝
      $('adjNopermMsg').textContent = NOPERM_TEXT[ed.reason];
      ProtoConsole.goto('adjust');
      setPageState('adjust', 'noperm');
      return;
    }
    draft = loadDraft();
    $('adjBanner').innerHTML = '';
    renderAdjust();
    ProtoConsole.goto('adjust');
    setPageState('adjust', 'normal');
  }
  function fieldsHtml(d) {
    if (!d.enabled) {
      return '<div class="p-hint">未启用：用户页面不显示；已有数据保留，重新启用后恢复。' +
        '<span class="anno" data-note="AC-007：停用不删除数据；重新启用后原数据恢复显示">i</span></div>';
    }
    var orig = P().modules.filter(function (m) { return m.module_type === d.module_type; })[0];
    var isShown = orig && shown(orig);
    var h = '<div><label>开始展示时间（选填）' + (isShown ? '<span class="p-chip on">用户页面已显示</span>' : '') +
      '<span class="anno" data-note="AC-009：已开始展示的模块，开始展示时间不能改到未来；想收回请停用。尚未开始展示的可自由改（仍受沿用规则约束）">a</span></label>' +
      '<input type="datetime-local" id="in-' + d.module_type + '-start" value="' + (d.display_start_time || '') + '" onchange="Proto011.edit(\'' + d.module_type + '\',\'display_start_time\',this.value)">' +
      '<div class="p-field-error p-hidden" id="err-' + d.module_type + '-display_start_time"></div></div>';
    if (d.module_type === 'wall') {
      var isClosed = orig && closed(orig);
      h += '<div><label>留言截止时间' + (isClosed ? '<span class="p-chip">已截止</span>' : '') +
        '<span class="anno" data-note="AC-008：不能改成早于保存时刻。AC-019：已截止的模块改到未来即重新开放留言">b</span></label>' +
        '<input type="datetime-local" id="in-wall-deadline" value="' + (d.message_deadline || '') + '" onchange="Proto011.edit(\'wall\',\'message_deadline\',this.value)">' +
        '<div class="p-field-error p-hidden" id="err-wall-message_deadline"></div></div>';
      if (isClosed) h += '<div class="p-hint">截止时间已过，改到晚于当前时间（演示当前时间 ' + fmtT(D.NOW) + '）即可重新开放留言。</div>';
    }
    return h;
  }
  function renderAdjust() {
    $('adjList').innerHTML = draft.map(function (d, i) {
      var m = meta(d.module_type);
      return '<div class="p-module-row"><div class="p-module-head">' +
        '<span class="p-move"><button class="p-link muted" onclick="Proto011.move(' + i + ',-1)" title="上移">▲</button><button class="p-link muted" onclick="Proto011.move(' + i + ',1)" title="下移">▼</button></span>' +
        '<div><span class="p-module-name' + (d.enabled ? '' : ' off') + '">' + m.name + '</span>' + badge(d.module_type) + '</div>' +
        '<span class="p-spacer"></span>' +
        '<label class="p-toggle"><input type="checkbox"' + (d.enabled ? ' checked' : '') + ' onchange="Proto011.toggle(' + i + ',this.checked)"><span class="p-track"></span><span class="p-thumb"></span></label></div>' +
        '<div class="p-module-config">' + fieldsHtml(d) + '</div></div>';
    }).join('');
    renderDiff();
    renderAdjustOverflow();
  }
  function renderAdjustOverflow() {
    var longTxt = '这是一段很长的说明用于演示换行不会撑破布局这是一段很长的说明用于演示换行不会撑破布局';
    var rows = [1, 2, 3, 4, 5, 6, 7, 8].map(function (i) {
      return '<div class="p-log-change">示例改动 ' + i + '：<span class="p-log-val">' + longTxt + '</span> → <span class="p-log-val">' + longTxt + longTxt + '</span></div>';
    }).join('');
    $('adjOverflow').innerHTML = '<div class="p-section-hint">本次改动很多、值很长时，列表在固定高度内滚动，不撑破页面</div><div class="p-card"><div class="p-diff">' + rows + '</div></div>';
  }
  function edit(type, field, val) {
    draft.filter(function (x) { return x.module_type === type; })[0][field] = val || null;
    clearErrors(); renderDiff();
  }
  function toggle(i, on) { draft[i].enabled = on; clearErrors(); renderAdjust(); }
  function move(i, dir) {
    var j = i + dir; if (j < 0 || j >= draft.length) return;
    var t = draft[i]; draft[i] = draft[j]; draft[j] = t;
    renderAdjust();
  }
  function finalModules() {   // 草稿 → 将提交的 modules[]：只含启用的，sort_order 按列表位置重排
    var n = 0;
    return draft.filter(function (d) { return d.enabled; }).map(function (d) {
      return { module_type: d.module_type, display_start_time: d.display_start_time, sort_order: ++n, message_deadline: d.module_type === 'wall' ? d.message_deadline : null };
    });
  }
  function changes() {
    var out = [], after = finalModules();
    D.MODULE_TYPES.forEach(function (pm) {
      var t = pm.module_type;
      var b = P().modules.filter(function (m) { return m.module_type === t; })[0];
      var a = after.filter(function (m) { return m.module_type === t; })[0];
      if (!!b !== !!a) out.push({ module_type: t, field: 'enabled', before: !!b, after: !!a });
      ['display_start_time', 'sort_order', 'message_deadline'].forEach(function (f) {
        var bv = b ? b[f] : null, av = a ? a[f] : null;
        if (b && a && bv !== av) out.push({ module_type: t, field: f, before: bv, after: av });
        else if (!b && a && av !== null) out.push({ module_type: t, field: f, before: null, after: av });
      });
    });
    return out;
  }
  function renderDiff() {
    var ch = changes();
    $('adjDiff').innerHTML = ch.length
      ? '<div class="p-section-hint">本次改动（保存后写入修改记录）</div>' + ch.map(changeLine).join('')
      : '<div class="p-section-hint">尚无改动</div>';
  }
  function clearErrors() {
    Array.prototype.forEach.call(document.querySelectorAll('#adjList .p-field-error'), function (e) { e.classList.add('p-hidden'); e.textContent = ''; });
    Array.prototype.forEach.call(document.querySelectorAll('#adjList .p-invalid'), function (e) { e.classList.remove('p-invalid'); });
    $('adjBanner').innerHTML = '';
  }
  function showFieldError(type, field, msg) {
    var e = $('err-' + type + '-' + field);
    if (e) { e.textContent = msg; e.classList.remove('p-hidden'); }
    var inp = $(field === 'message_deadline' ? 'in-wall-deadline' : 'in-' + type + '-start');
    if (inp) inp.classList.add('p-invalid');
  }
  function validate() {   // 返回第一个失败的 adjust_error，没有则 ''
    var first = '';
    function note(type, field, code, msg) { showFieldError(type, field, msg); if (!first) first = code; }
    finalModules().forEach(function (m) {
      var orig = P().modules.filter(function (x) { return x.module_type === m.module_type; })[0];
      var startChanged = !orig || orig.display_start_time !== m.display_start_time;
      var ddlChanged = m.module_type === 'wall' && (!orig || orig.message_deadline !== m.message_deadline);
      if (startChanged && orig && shown(orig) && m.display_start_time && m.display_start_time > D.NOW)
        note(m.module_type, 'display_start_time', 'display_start_in_future', D.ADJUST_ERROR.display_start_in_future);
      if (ddlChanged && m.message_deadline && m.message_deadline <= D.NOW)
        note('wall', 'message_deadline', 'deadline_in_past', D.ADJUST_ERROR.deadline_in_past);
      else if (ddlChanged && m.message_deadline && m.message_deadline <= D.PLAN_START)
        note('wall', 'message_deadline', 'validation_failed', '留言截止时间须晚于活动计划开始时间（' + fmtT(D.PLAN_START) + '）');
      if (m.display_start_time && m.message_deadline && m.display_start_time > m.message_deadline && (startChanged || ddlChanged))
        note(m.module_type, m.module_type === 'wall' ? 'message_deadline' : 'display_start_time', 'validation_failed', '开始展示时间不能晚于截止时间');
    });
    return first;
  }
  function banner(msg, code, actionHtml) {
    $('adjBanner').innerHTML = '<div class="p-banner">' + msg + '（' + code + '）' + (actionHtml ? '<br>' + actionHtml : '') + '</div>';
  }
  function save() {
    clearErrors();
    var ch = changes();
    if (!ch.length) { ProtoConsole.toast('没有改动'); return; }
    var code = validate();
    if (code) { $('adjBanner').innerHTML = '<div class="p-banner">保存失败：请先修改标红的内容（' + code + '）</div>'; return; }
    // 以下模拟后端返回
    if (failMode === 'ended') { banner(D.ADJUST_ERROR.activity_not_published, 'activity_not_published', '<button class="p-link" data-goto="detail">返回活动详情</button>'); return; }
    if (failMode === 'conflict') { banner(D.ADJUST_ERROR.config_version_conflict, 'config_version_conflict', '<button class="p-link" onclick="Proto011.refresh()">刷新并查看最新配置</button>'); return; }
    if (failMode === 'log_write_failed') { banner(D.ADJUST_ERROR.log_write_failed, 'log_write_failed', '<button class="p-link" onclick="Proto011.save()">重试</button>'); return; }
    if (failMode === 'fail') { $('adjBanner').innerHTML = '<div class="p-banner">保存失败，请检查网络后重试<br><button class="p-link" onclick="Proto011.save()">重试</button></div>'; return; }
    P().modules = finalModules();
    P().config_version = 'v' + (parseInt(P().config_version.slice(1), 10) + 1);
    P().logs.unshift({ log_id: 'L' + (P().logs.length + 1) + 'x', operator_id: 'E0001', operator_name: 'XY', operated_at: fmtT(D.NOW), changes: ch });   // 新记录出现在最前（AC-017）
    render();
    ProtoConsole.goto('detail');
    ProtoConsole.toast('已保存，用户页面立即按新配置显示');
  }
  function refresh() {   // 冲突后刷新：取到最新配置（演示：别人把寄语墙截止时间改成了 01-30）
    P().modules.forEach(function (m) { if (m.module_type === 'wall') m.message_deadline = '2027-01-30T18:00'; });
    P().config_version = 'v' + (parseInt(P().config_version.slice(1), 10) + 1);
    setFail('');
    draft = loadDraft();
    render(); renderAdjust();
    ProtoConsole.toast('已刷新为最新配置');
  }
  function setFail(k) {
    failMode = k;
    var hints = { conflict: 'error=config_version_conflict', ended: 'error=activity_not_published', fail: '网络 / 服务异常（保存失败，可重试）', log_write_failed: 'error=log_write_failed' };
    $('failHint').textContent = k ? '下一次点「保存」将返回：' + hints[k] : '';
  }

    return { render: render, openAdjust: openAdjust, edit: edit, toggle: toggle, move: move, save: save, refresh: refresh, setFail: setFail, logGo: logGo,
           _state: function () { return P(); }, _draft: function () { return draft; } };
})();
