/*
  报名管理名单的搜索（REQ-004 §8「名单搜索」、AC-027 ～ AC-037），activity-001-admin-pc.html 的伴随脚本。
  页面结构在 activity-001-admin-pc.html 的 #registrationsView 里；这里只放搜索 / 统计 / 空态的逻辑与示例数据。
  真实系统里搜索由后端完成（AC-034），原型里用示例记录在前端模拟；接口参数名对应
  API-registration-004-admin.md：name、org_keyword、contact。
*/
var RegSearch = (function () {
  var mode = 'normal';       // normal | loading | error | overflow（原型演示条切换）
  var timer = null;
  var DEBOUNCE_MS = 300;     // 停止输入约 0.3 秒自动搜索（AC-027）
  var TYPE_LABEL = { internal: '内部员工', external: '外部人士' };

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function body() { return $('regTableBody'); }
  function allRows() { return [].slice.call(body().querySelectorAll('tr')); }

  /* ---------- 行数据：缺少元数据的行（原型里写死的几行）按展示文字补出类型与所属 ---------- */
  function ensureMeta(tr) {
    if (tr.dataset.type) return;
    var cell = tr.children[2].textContent.trim();
    var ext = / · 外部$/.test(cell);
    tr.dataset.type = ext ? 'external' : 'internal';
    tr.dataset.org = ext ? cell.replace(/ · 外部$/, '') : (cell === '—' ? '' : cell);
  }

  /* ---------- 搜索条件 ---------- */
  function conds() {
    return {
      cel: $('registrationCelFilter').value,
      name: $('regSearchName').value.trim().toLowerCase(),
      org: $('regSearchOrg').value.trim().toLowerCase(),
      phone: $('regSearchPhone').value.replace(/\D/g, '')     // 联系电话只比较数字（AC-030）
    };
  }
  function isActive(c) { return !!(c.name || c.org || c.phone); }
  function match(tr, c) {
    ensureMeta(tr);
    if (c.cel !== 'all' && tr.dataset.celebration !== c.cel) return false;
    if (c.name && tr.children[0].textContent.toLowerCase().indexOf(c.name) === -1) return false;          // 包含匹配，英文不区分大小写
    if (c.org) {                                                                                               // 同时匹配所属名称与类型名称（AC-029）
      var org = (tr.dataset.org || '').toLowerCase(), type = TYPE_LABEL[tr.dataset.type];
      if (org.indexOf(c.org) === -1 && type.indexOf(c.org) === -1) return false;
    }
    if (c.phone) {                                                                                             // 没有联系电话（「—」）的记录不命中（AC-030）
      var digits = tr.children[3].textContent.replace(/\D/g, '');
      if (!digits || digits.indexOf(c.phone) === -1) return false;
    }
    return true;
  }

  /* ---------- 渲染：名单、统计、空态 ---------- */
  function box(html) {
    var el = $('regStateBox');
    el.innerHTML = html || '';
    el.classList.toggle('hidden', !html);
  }
  function setStats(reg, chk) {
    $('statRegistered').textContent = reg;
    $('statCheckedIn').textContent = chk;
  }
  function apply() {
    var c = conds(), active = isActive(c);
    var rows = allRows();
    var table = body().closest('table');
    $('regSearchClear').classList.toggle('hidden', !active);

    if (mode === 'loading') {
      rows.forEach(function (r) { r.style.display = 'none'; });
      table.classList.add('hidden');
      box('<div class="picker-skel"></div><div class="picker-skel" style="width:70%"></div><div class="picker-skel" style="width:45%"></div>');
      setStats('…', '…');
      $('regStatHint').textContent = '';
      return;
    }
    if (mode === 'error') {
      rows.forEach(function (r) { r.style.display = 'none'; });
      table.classList.add('hidden');
      box('<div class="picker-state">名单加载失败，请检查网络后重试（搜索条件已保留）<br><button class="action-link" style="margin-top:8px" onclick="RegSearch.retry()">重试</button></div>');
      setStats('—', '—');
      $('regStatHint').textContent = '';
      return;
    }

    var visible = 0, checked = 0, inScope = 0;
    rows.forEach(function (r) {
      ensureMeta(r);
      if (c.cel === 'all' || r.dataset.celebration === c.cel) inScope++;
      var ok = match(r, c);
      r.style.display = ok ? '' : 'none';
      if (ok) { visible++; if (r.querySelector('.status-badge.approved')) checked++; }
    });
    setStats(visible, checked);                       // 已报名、已签到随搜索结果变（AC-032）；名额上限由 updateRegCapacityUI 按下拉显示，不随搜索变
    $('regStatHint').textContent = active ? '统计按当前搜索结果计算；名额上限是 Celebration 的设定值，不随搜索变化' : '';

    if (visible === 0) {
      table.classList.add('hidden');
      if (inScope === 0) {                            // 所选范围里本来就没有记录：不论是否搜索，都是「尚无人报名」（AC-033）
        box('<div class="picker-state">' + (c.cel === 'all' ? '还没有人报名' : '该 Celebration 尚无人报名') + '</div>');
      } else {
        box('<div class="picker-state">没有符合搜索条件的报名记录<br><button class="action-link" style="margin-top:8px" onclick="RegSearch.clear()">清空搜索</button></div>');
      }
    } else {
      table.classList.remove('hidden');
      box('');
    }
  }

  /* ---------- 输入：非法字符过滤、防抖 ---------- */
  function schedule() { clearTimeout(timer); timer = setTimeout(apply, DEBOUNCE_MS); }
  function bind() {
    ['regSearchName', 'regSearchOrg'].forEach(function (id) { $(id).addEventListener('input', schedule); });
    $('regSearchPhone').addEventListener('input', function () {
      var v = this.value, cleaned = v.replace(/[^0-9+\-\s]/g, '');   // 只接受数字、+、空格、连字符（§8）
      if (v !== cleaned) this.value = cleaned;
      schedule();
    });
  }
  function clear() {
    ['regSearchName', 'regSearchOrg', 'regSearchPhone'].forEach(function (id) { $(id).value = ''; });
    clearTimeout(timer); apply();
  }
  function afterAdd() { clear(); }                  // 暂按 AC-003：手动代报名成功后新记录出现在最上方，故清空搜索条件（REQ-004 §11 待行政确认）

  /* ---------- 原型演示：示例记录、状态切换 ---------- */
  var SEED = [   // celebration: sg30（新加坡总部站）；type 为 internal / external
    { id: 'r5',  name: '张伟',  org: '技术部', type: 'internal', phone: '13900139001', email: 'zhang.wei@mcc.example', at: '2026-09-11 09:10', done: true },
    { id: 'r6',  name: '赵敏',  org: '市场部', type: 'internal', phone: '13900139002', email: 'zhao.min@mcc.example', at: '2026-09-11 11:30', done: true },
    { id: 'r7',  name: '孙浩',  org: '财务部', type: 'internal', phone: '13900139003', email: 'sun.hao@mcc.example', at: '2026-09-11 15:45' },
    { id: 'r8',  name: '周婷',  org: '人力资源部', type: 'internal', phone: '13900139004', email: 'zhou.ting@mcc.example', at: '2026-09-12 10:20' },
    { id: 'r9',  name: '刘洋',  org: '产品部', type: 'internal', phone: '13900139005', email: 'liu.yang@mcc.example', at: '2026-09-12 13:05' },
    { id: 'r10', name: '吴磊',  org: '技术部', type: 'internal', phone: '13900139006', email: 'wu.lei@mcc.example', at: '2026-09-13 09:40' },
    { id: 'r11', name: 'Sarah Tan', org: 'Orchid Pte Ltd', type: 'external', phone: '+65 9123 4567', email: 'sarah@orchid.example', at: '2026-09-13 14:15' },
    { id: 'r12', name: 'Michael Lim', org: 'Lim & Co', type: 'external', phone: '', email: '', at: '2026-09-13 16:50' }
  ];
  function makeRow(d) {
    var tr = document.createElement('tr');
    tr.dataset.created = d.at; tr.dataset.celebration = 'sg30'; tr.dataset.type = d.type; tr.dataset.org = d.org;
    tr.innerHTML =
      '<td class="title-cell">' + esc(d.name) + '</td><td class="muted-cell">新加坡总部站</td>' +
      '<td>' + esc(d.org) + (d.type === 'external' ? ' · 外部' : '') + '</td>' +
      '<td>' + (d.phone ? esc(d.phone) : '—') + '</td><td>' + (d.email ? esc(d.email) : '—') + '</td><td>' + d.at + '</td>' +
      '<td><span class="status-badge draft" id="regstatus-' + d.id + '">未签到</span></td>' +
      '<td><div class="table-actions"><button class="action-link" onclick="viewRegCode(this)">查看签到码</button>' +
      '<button class="action-link" onclick="setCheckin(\'' + d.id + '\',\'done\')">签到</button>' +
      '<button class="action-link danger" onclick="cancelRegistration(\'' + d.id + '\', this)">取消报名</button></div></td>';
    return tr;
  }
  function seedRows() {
    SEED.forEach(function (d) { body().appendChild(makeRow(d)); });
    sortByCreatedDesc(body(), 'tr');                 // 默认按创建时间倒序（conventions.md）
    SEED.forEach(function (d) { if (d.done) setCheckin(d.id, 'done'); });
  }
  function setMode(m) {
    mode = m;
    var old = body().querySelector('tr[data-demo="long"]');
    if (old) old.remove();
    if (m === 'overflow') {                          // 姓名、所属很长的记录：换行显示，不撑破布局（AC-036）
      var long = makeRow({ id: 'rlong', name: '这是一位姓名非常非常非常长的外部合作伙伴代表 Alexander Bartholomew Montgomery-Featherstonehaugh', org: '某某跨国合作伙伴有限责任公司亚太区战略联盟与渠道发展部（新加坡）', type: 'external', phone: '+65 9000 0000', email: 'a.very.long.email.address.for.demo@example-company-with-long-name.example', at: '2026-09-14 08:00' });
      long.dataset.demo = 'long';
      body().insertBefore(long, body().firstChild);
      mode = 'normal';
    }
    apply();
  }
  function retry() { mode = 'normal'; apply(); }

  function init() {
    if (!$('regSearch')) return;
    seedRows(); bind(); apply();
    if (typeof updateRegCapacityUI === 'function') updateRegCapacityUI();
  }
  document.addEventListener('DOMContentLoaded', init);

  return { apply: apply, clear: clear, afterAdd: afterAdd, retry: retry, setMode: setMode };
})();
