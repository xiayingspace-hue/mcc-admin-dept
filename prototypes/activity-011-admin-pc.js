/*
  活动详情页入口：决定展示哪一个活动、串起各部分。
  URL 参数（列表、待办通知、创建流程提交审批后跳转到本页时带上）：
    ?case=review | rejected | published | ended    要展示的活动状态，默认 published
    ?viewer=initiator | viewer | approver          查看者视角（viewer_role），审批人视角从统一待办进入
    ?fresh=1                                       刚从创建流程提交审批过来，审批人与附件从 sessionStorage 取
    ?account=admin | other                         当前账号是否行政（演示非行政访问）
    ?screen=adjust                                 直接进入「编辑模块配置」页（演示无权限 / 状态不允许时的拦截）
  各部分：approval.js（基础信息 / 附件 / 审批进度 / 操作）、modules.js（模块配置 / 修改记录 / 编辑页）。
*/
var Detail = (function () {
  var D = window.PROTO011;

  function params() {
    var out = {};
    (location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return out;
  }
  function renderAll() {
    Approval011.render();
    Proto011.render();
  }
  function load(key) {                 // 演示条切换活动状态：换一份数据，保留账号与查看者视角
    var prev = D.ctx;
    D.ctx = D.build(key);
    D.ctx.account = prev.account;
    D.ctx.viewer = prev.viewer;
    renderAll();
  }
  function set(k, v) {                 // 演示条切换账号 / 查看者视角
    D.ctx[k] = v;
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var p = params();
    var fresh = null;
    if (p.fresh) {
      try { fresh = JSON.parse(sessionStorage.getItem('proto011_fresh') || 'null'); } catch (e) { fresh = null; }
    }
    D.ctx = fresh ? D.buildFresh(fresh) : D.build(p.case || 'published');
    if (p.viewer) D.ctx.viewer = p.viewer;
    if (p.account) D.ctx.account = p.account;
    renderAll();
    if (p.screen === 'adjust') Proto011.openAdjust();   // 模拟「直接输入地址进入编辑页」，用来验证无权限拦截（REQ-011 AC-006）
  });

  return { load: load, set: set };
})();
