/*
  管理端表格列表分页（conventions.md「分页」；活动管理 REQ-001 AC-023、报名管理 REQ-004 AC-038、赞助商线索 REQ-008 AC-018），
  activity-001-admin-pc.html 的伴随脚本。
  做法：不改各表原有的筛选 / 搜索代码——它们照旧用 style.display 隐藏不匹配的行；这里监听 tbody 的变化，
  在「匹配的行」里切出当前页，其余行加 .pg-off。真实系统里分页由后端完成（offset + limit，响应带 total），这里在前端模拟。
  下面还会补充一批示例记录，让每张表都超过 20 条。
*/
var Pager = (function () {
  var PAGE_SIZE = 20;                       // 固定 20 条，不提供每页条数切换
  var uid = 0;

  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function mount(tbody) {
    var table = tbody.closest('table'), card = table.closest('.table-card');
    var bar = document.createElement('div');
    bar.className = 'pager hidden';
    card.after(bar);
    var err = document.createElement('div');
    err.className = 'pager-error hidden';
    card.before(err);

    var st = { page: 1, sig: null, len: -1, failNext: false, busy: false, scheduled: false };

    function rows() { return [].slice.call(tbody.children).filter(function (r) { return r.tagName === 'TR'; }); }
    function matching(all) { return all.filter(function (r) { return r.style.display !== 'none'; }); }
    function idOf(r) { return r._pid || (r._pid = ++uid); }

    function pageList(cur, last) {          // 首页、末页、当前页前后各一页；其余折叠成省略号
      var keep = {}, out = [], prev = 0;
      [1, last, cur - 1, cur, cur + 1].forEach(function (p) { if (p >= 1 && p <= last) keep[p] = 1; });
      Object.keys(keep).map(Number).sort(function (a, b) { return a - b; }).forEach(function (p) {
        if (prev && p - prev > 1) out.push('…');
        out.push(p); prev = p;
      });
      return out;
    }

    function render() {
      st.scheduled = false;
      var all = rows(), m = matching(all);
      var sig = m.map(idOf).join(',');
      if (st.sig !== null && sig !== st.sig && all.length === st.len) st.page = 1;   // 筛选 / 搜索变了：回到第 1 页
      st.sig = sig; st.len = all.length;                                              // 只是增删记录：停留当前页
      var total = m.length, last = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (st.page > last) st.page = last;                                             // 超出末页：回到新的末页
      all.forEach(function (r) { r.classList.add('pg-off'); });
      m.forEach(function (r, i) {
        r.classList.toggle('pg-off', i < (st.page - 1) * PAGE_SIZE || i >= st.page * PAGE_SIZE);
      });
      // 没有数据 / 名单区在显示加载、错误、空态（表格被隐藏）时不显示分页条
      if (total === 0 || table.classList.contains('hidden')) { bar.classList.add('hidden'); return; }
      bar.classList.remove('hidden');
      var html = '<span class="pager-total">共 ' + total + ' 条</span>';
      if (last > 1) {
        html += '<span class="pager-ctrl">'
          + '<button class="pager-btn" data-go="' + (st.page - 1) + '"' + (st.page === 1 ? ' disabled' : '') + '>Previous</button>'
          + pageList(st.page, last).map(function (p) {
              return p === '…' ? '<span class="pager-gap">…</span>'
                : '<button class="pager-btn' + (p === st.page ? ' current' : '') + '" data-go="' + p + '"' + (p === st.page ? ' aria-current="page"' : '') + '>' + p + '</button>';
            }).join('')
          + '<button class="pager-btn" data-go="' + (st.page + 1) + '"' + (st.page === last ? ' disabled' : '') + '>Next</button>'
          + '</span>'
          + '<button class="pager-demo' + (st.failNext ? ' on' : '') + '" data-demo="fail">Demo: next page change fails' + (st.failNext ? ' (on)' : '') + '</button>';
      }
      bar.innerHTML = html;
    }
    function schedule() { if (!st.scheduled) { st.scheduled = true; Promise.resolve().then(render); } }

    function go(p) {
      if (st.busy) return;
      st.busy = true; err.classList.add('hidden'); card.classList.add('pg-loading');   // 翻页中：列表区 loading
      setTimeout(function () {
        card.classList.remove('pg-loading'); st.busy = false;
        if (st.failNext) {                                                              // 翻页失败：错误 + 重试，页码、筛选保持不变
          st.failNext = false;
          err.innerHTML = '加载失败，请检查网络后重试（页码与筛选条件已保留）<button class="action-link" data-retry="' + p + '">Retry</button>';
          err.classList.remove('hidden'); render(); return;
        }
        st.page = p; render();
        card.scrollIntoView({ block: 'start', behavior: 'smooth' });                    // 翻页后回到列表顶部
      }, 280);
    }

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.go) go(+b.dataset.go);
      if (b.dataset.demo) { st.failNext = !st.failNext; render(); }
    });
    err.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-retry]'); if (b) go(+b.dataset.retry);
    });
    new MutationObserver(schedule).observe(tbody, { childList: true, subtree: false });
    new MutationObserver(schedule).observe(tbody, { attributes: true, attributeFilter: ['style'], subtree: true });
    new MutationObserver(schedule).observe(table, { attributes: true, attributeFilter: ['class'] });
    render();
  }

  /* ---------- 示例数据：每张表补到 45 条左右，只用于演示分页 ---------- */
  var TYPES = ['Anniversary', 'Annual Party', 'Birthday Party', 'Team Building', 'Training'];
  var TITLES = ['新员工入职欢迎会', '季度表彰大会', '家庭日活动', '读书分享会', '志愿者服务日', '运动会', '管理层沟通会', '客户答谢晚宴', '安全培训', '开放日', '摄影比赛', '厨艺大赛'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function seedActivities() {
    var tb = document.querySelector('#listView .activity-table tbody');
    var draft = document.getElementById('row-onboarding'), pub = document.getElementById('row-annual');
    if (!tb || !draft || !pub) return;
    for (var i = 0; i < 40; i++) {
      var isDraft = i % 3 !== 0, tpl = isDraft ? draft : pub, id = 'row-gen-' + i;
      var title = TITLES[i % TITLES.length] + ' ' + (i + 1);
      var tmp = document.createElement('tbody');
      tmp.innerHTML = tpl.outerHTML.split(tpl.id).join(id);
      var tr = tmp.firstElementChild;
      tr.querySelector('.title-cell').textContent = title;
      tr.children[1].textContent = TYPES[i % TYPES.length];
      tr.dataset.created = '2026-08-' + pad(1 + (i % 28)) + ' ' + pad(9 + (i % 9)) + ':' + pad((i * 7) % 60);
      tr.querySelectorAll('[onclick]').forEach(function (el) {
        el.setAttribute('onclick', el.getAttribute('onclick').replace(/'[^']*'(?=\s*,\s*this)/, "'" + title.replace(/'/g, '') + "'"));
      });
      tb.appendChild(tr);
    }
  }
  function seedSponsors() {
    var tb = document.getElementById('sponsorTableBody');
    var first = tb && tb.querySelector('tr');
    if (!first) return;
    var cos = ['远景建设集团', '星辰科技有限公司', '蓝海贸易', 'Orchid Pte Ltd', 'Lim & Co', '恒信金融', '绿洲能源', '北辰传媒'];
    var tiers = ['Gold', 'Silver', 'Bronze', 'Custom'];
    for (var i = 0; i < 40; i++) {
      var sid = 'sg' + i, tmp = document.createElement('tbody');
      tmp.innerHTML = first.outerHTML.replace(/sponsorstatus-s1/g, 'sponsorstatus-' + sid).replace(/setSponsorStatus\('s1'/g, "setSponsorStatus('" + sid + "'");
      var tr = tmp.firstElementChild;
      tr.querySelector('.title-cell').textContent = cos[i % cos.length] + ' ' + (i + 1);
      tr.children[1].textContent = '联系人' + (i + 1) + ' · 经理';
      tr.children[2].innerHTML = 'contact' + i + '@example.com<br>+65 9' + (100000 + i * 37);
      tr.children[3].textContent = tiers[i % tiers.length];
      tr.dataset.created = '2026-09-' + pad(1 + (i % 28)) + ' ' + pad(9 + (i % 9)) + ':' + pad((i * 13) % 60);
      tr.children[5].textContent = tr.dataset.created;
      tr.dataset.activity = i % 2 ? 'annual' : '30th';
      tb.appendChild(tr);
      var badge = tr.querySelector('.status-badge');                           // 补出来的线索都标成已联系，不改变导航角标数字
      badge.className = 'status-badge approved'; badge.textContent = '已联系';
      tr.querySelector('.table-actions').innerHTML = iconBtn('标记待联系', 'tone-warn', 'clock', "setSponsorStatus('" + sid + "','pending')");
    }
  }
  function init() {
    seedActivities(); seedSponsors();
    ['#listView .activity-table tbody', '#regTableBody', '#sponsorTableBody'].forEach(function (sel) {
      var tb = document.querySelector(sel); if (tb) mount(tb);
    });
    if (typeof sortByCreatedDesc === 'function') {
      sortByCreatedDesc(document.querySelector('#listView .activity-table tbody'), 'tr');
      sortByCreatedDesc(document.getElementById('sponsorTableBody'), 'tr');
    }
  }
  window.addEventListener('load', init);
  return { mount: mount };
})();
