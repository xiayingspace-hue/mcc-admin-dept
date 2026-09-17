/*
  交互运行时 —— 页面切换 / 状态切换 / 标注 / 弹窗 / Toast / 调试控制台。
  原型 HTML 只需引入本文件并使用下列 data-* 约定，不需要额外写 JS。
*/
(function () {
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  // ---- 页面跳转：data-goto ----
  function goto(id) {
    qsa('.p-screen').forEach(function (el) { el.classList.toggle('p-active', el.id === id); });
    var target = document.getElementById(id);
    if (target && target.dataset.title) {
      var crumb = document.getElementById('p-crumb');
      if (crumb) crumb.textContent = target.dataset.title;
    }
    refreshConsole();
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-goto]');
    if (btn) { goto(btn.dataset.goto); }
  });

  // ---- 弹窗：data-open / data-close ----
  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest('[data-open]');
    if (openBtn) {
      var overlay = document.getElementById(openBtn.dataset.open);
      if (overlay) overlay.classList.add('p-open');
    }
    var closeBtn = e.target.closest('[data-close]');
    if (closeBtn) {
      var overlay = closeBtn.closest('.p-modal-overlay');
      if (overlay) overlay.classList.remove('p-open');
    }
    if (e.target.classList && e.target.classList.contains('p-modal-overlay')) {
      e.target.classList.remove('p-open');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') qsa('.p-modal-overlay.p-open').forEach(function (o) { o.classList.remove('p-open'); });
  });

  // ---- Toast：data-toast ----
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-toast]');
    if (btn) showToast(btn.dataset.toast);
  });
  function showToast(msg) {
    var t = document.getElementById('p-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'p-toast';
      t.className = 'p-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('p-show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('p-show'); }, 1800);
  }

  // ---- 交互标注：.anno[data-note] ----
  document.addEventListener('click', function (e) {
    var anno = e.target.closest('.anno');
    if (!anno) { qsa('.anno.p-anno-open').forEach(function (a) { a.classList.remove('p-anno-open'); }); return; }
    var isOpen = anno.classList.contains('p-anno-open');
    qsa('.anno.p-anno-open').forEach(function (a) { a.classList.remove('p-anno-open'); });
    if (!isOpen) {
      if (!anno.querySelector('.anno-pop')) {
        var pop = document.createElement('span');
        pop.className = 'anno-pop';
        pop.textContent = anno.dataset.note || '（未填写标注说明）';
        anno.appendChild(pop);
      }
      anno.classList.add('p-anno-open');
    }
    e.stopPropagation();
  });

  // ---- 状态切换：data-when，由右下角控制台驱动 ----
  var STATES = ['normal', 'loading', 'empty', 'empty2', 'error', 'noperm', 'overflow'];
  var STATE_LABELS = { normal: '正常', loading: '加载中', empty: '空(从未有过)', empty2: '空(筛选无果)', error: '错误', noperm: '无权限', overflow: '超长内容' };

  function findStateGroups() {
    var groups = {};
    qsa('[data-when]').forEach(function (el) {
      var group = el.closest('[data-state-group]');
      var key = group ? group.dataset.stateGroup : 'default';
      groups[key] = groups[key] || [];
      groups[key].push(el);
    });
    return groups;
  }
  function setState(groupKey, state) {
    var groups = findStateGroups();
    (groups[groupKey] || []).forEach(function (el) {
      el.classList.toggle('p-active', el.dataset.when === state);
    });
  }

  function refreshConsole() {
    var box = document.getElementById('p-console-body');
    if (!box) return;
    var groups = findStateGroups();
    var keys = Object.keys(groups).filter(function (k) { return k !== 'default' || groups['default']; });
    if (keys.length === 0) { box.innerHTML = '当前页面无 data-when 状态区块'; return; }
    box.innerHTML = keys.map(function (key) {
      var opts = STATES.map(function (s) {
        return '<option value="' + s + '">' + (STATE_LABELS[s] || s) + '</option>';
      }).join('');
      return '<div style="margin-top:6px">' +
        '<span>' + (key === 'default' ? '状态区块' : key) + '：</span>' +
        '<select onchange="ProtoConsole.setState(\'' + key + '\', this.value)">' + opts + '</select>' +
        '</div>';
    }).join('');
  }

  window.ProtoConsole = { setState: setState, goto: goto, toast: showToast };

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('p-console')) {
      var box = document.createElement('div');
      box.id = 'p-console';
      box.innerHTML = '<div>调试控制台</div><div id="p-console-body"></div>';
      document.body.appendChild(box);
    }
    // 默认展开每组的第一个 normal 状态
    var groups = findStateGroups();
    Object.keys(groups).forEach(function (key) { setState(key, 'normal'); });
    refreshConsole();
  });
})();
