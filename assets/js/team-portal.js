/* Team Portal. Private forms for people who work with Potential Unexplored and Boys to Men.
   Every person signs in with their own personal code. The Google Apps Script checks the code,
   saves the form in a private sheet and emails Banio. Nothing is kept on this page except the
   code, for this browser tab only, so a refresh does not sign the person out. */
(function () {
  var EP = (typeof SHEET_ENDPOINT !== 'undefined') ? SHEET_ENDPOINT : '';
  var state = null, code = '';

  var $ = function (id) { return document.getElementById(id); };
  function show(id) { var e = $(id); if (!e) return; e.hidden = false; e.style.display = (id === 'tpGate' || id === 'tpFormWrap' || id === 'tpDone') ? 'block' : ''; }
  function hide(id) { var e = $(id); if (!e) return; e.hidden = true; e.style.display = 'none'; }
  function view(name) {
    ['tpGate', 'tpHub', 'tpFormWrap', 'tpDone'].forEach(hide);
    show(name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function store(v) { try { if (v) sessionStorage.setItem('tp_code', v); else sessionStorage.removeItem('tp_code'); } catch (e) {} }
  function stored() { try { return sessionStorage.getItem('tp_code') || ''; } catch (e) { return ''; } }
  function money(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function num(v) { var n = parseFloat(String(v || '').replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function el(tag, attrs, html) { var e = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------- talking to the script ---------- */
  function call(kind, fields) {
    var body = new URLSearchParams();
    body.append('_form', kind);
    body.append('Code', code);
    Object.keys(fields || {}).forEach(function (k) {
      var v = fields[k];
      if (Array.isArray(v)) v.forEach(function (x) { body.append(k, x); }); else body.append(k, v);
    });
    return fetch(EP, { method: 'POST', body: body }).then(function (r) { return r.json(); });
  }

  /* ---------- sign in ---------- */
  function openWith(c, silent) {
    code = c;
    var err = $('tpGateError'), btn = $('tpGateBtn');
    err.hidden = true; btn.disabled = true; btn.textContent = 'Checking...';
    return call('team_verify', {}).then(function (res) {
      btn.disabled = false; btn.innerHTML = 'Open my forms &rarr;';
      if (!res || !res.ok) {
        store(''); code = '';
        if (!silent) { err.textContent = 'That code was not recognised. Please check it and try again, or ask Banio.'; err.hidden = false; }
        view('tpGate');
        return;
      }
      state = res; store(c); renderHub();
    }).catch(function () {
      btn.disabled = false; btn.innerHTML = 'Open my forms &rarr;';
      if (!silent) { err.textContent = 'We could not connect. Please check your internet and try again.'; err.hidden = false; }
      view('tpGate');
    });
  }

  $('tpGateForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var c = $('tpCode').value.toUpperCase().replace(/\s+/g, '');
    if (c.length < 6) { var er = $('tpGateError'); er.textContent = 'Please enter your code.'; er.hidden = false; return; }
    openWith(c, false);
  });
  $('tpOut').addEventListener('click', function () { store(''); code = ''; state = null; $('tpCode').value = ''; view('tpGate'); });
  $('tpBack').addEventListener('click', function () { refresh(); });

  function refresh() {
    return call('team_verify', {}).then(function (res) { if (res && res.ok) { state = res; renderHub(); } else { view('tpGate'); } }).catch(function () { renderHub(); });
  }

  /* ---------- hub ---------- */
  var FORM_INFO = {
    daily: { title: 'Daily activity report', text: 'Fill this in at the end of your working day. Five minutes or less.' },
    requisition: { title: 'Requisition', text: 'Ask for money or items for the camp, a project or your work.' },
    accountability: { title: 'Accountability', text: 'Account for money you received. Add your receipts.' }
  };

  function renderHub() {
    $('tpHello').textContent = 'Hello, ' + String(state.name).split(' ')[0] + '.';
    $('tpRole').textContent = state.role || '';
    var owed = state.open || [];
    var o = $('tpOwed');
    if (owed.length) {
      var total = owed.reduce(function (s, r) { return s + r.amount; }, 0);
      o.innerHTML = '<b>' + owed.length + ' requisition' + (owed.length > 1 ? 's' : '') + ' to account for</b> (UGX ' + money(total) + '). Please fill in the Accountability form once you have spent the money.';
      o.hidden = false;
    } else { o.hidden = true; }
    var tiles = $('tpTiles'); tiles.innerHTML = '';
    (state.forms || []).forEach(function (k) {
      var info = FORM_INFO[k]; if (!info) return;
      var b = el('button', { type: 'button', 'class': 'tp-tile' }, '<b>' + esc(info.title) + '</b><span>' + esc(info.text) + '</span>');
      b.addEventListener('click', function () { openForm(k); });
      tiles.appendChild(b);
    });
    var mine = state.requisitions || [], body = $('tpMineBody'); body.innerHTML = '';
    if (mine.length) {
      mine.forEach(function (r) {
        var tr = el('tr', {}, '<td>' + esc(r.no) + '</td><td>' + esc(r.what) + '</td><td>' + money(r.amount) + '</td><td><span class="tp-chip ' + esc(r.status) + '">' + esc(r.status) + '</span>' + (r.accounted ? '<br><small>Accounted</small>' : '') + '</td>');
        body.appendChild(tr);
      });
      show('tpMine');
    } else { hide('tpMine'); }
    view('tpHub');
  }

  /* ---------- form helpers ---------- */
  function field(label, inner, hint) { return '<div class="reg-field"><label class="reg-label">' + label + '</label>' + inner + (hint ? '<p class="tp-hint">' + hint + '</p>' : '') + '</div>'; }
  function input(id, type, extra) { return '<input class="reg-input" id="' + id + '" type="' + (type || 'text') + '" ' + (extra || '') + '>'; }
  function select(id, opts, first) { return '<select class="reg-input" id="' + id + '">' + (first ? '<option value="">' + first + '</option>' : '') + opts.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>'; }
  function head(title, sub) { return '<div class="tp-top"><div><p class="reg-step-label">' + esc(sub) + '</p><h2 style="font-size:1.3rem;margin:0;color:var(--green);">' + esc(title) + '</h2></div><button type="button" class="tp-link" id="tpCancel">Back</button></div>'; }
  function wrapForm(inner, btnText) {
    return '<form id="tpForm" novalidate autocomplete="off">' + inner +
      '<p class="tp-error" id="tpError" role="alert" hidden></p>' +
      '<div class="reg-submit-bar"><div><p class="reg-submit-title">Ready to send?</p><p class="reg-submit-sub">Banio receives it as soon as you send.</p></div>' +
      '<button type="submit" class="reg-submit-btn" id="tpSend">' + btnText + ' &rarr;</button></div></form>';
  }
  function val(id) { var e = $(id); return e ? String(e.value).trim() : ''; }
  function fail(msg) { var e = $('tpError'); e.textContent = msg; e.hidden = false; var b = $('tpSend'); b.disabled = false; b.innerHTML = b.getAttribute('data-t'); e.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  function bindMoney(id) { var e = $(id); if (!e) return; e.addEventListener('blur', function () { var n = num(e.value); e.value = e.value.trim() ? money(n) : ''; }); }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject('We could not read that file. Please try another one.'); };
      if (file.type === 'application/pdf') {
        if (file.size > 2 * 1024 * 1024) return reject('A PDF is too large. Please use a photo or screenshot instead.');
        reader.onload = function () { resolve({ name: file.name, type: file.type, data: String(reader.result).split(',')[1] }); };
        reader.readAsDataURL(file);
      } else if (file.type.indexOf('image/') === 0) {
        reader.onload = function () {
          var img = new Image();
          img.onerror = function () { reject('We could not read one of the pictures. Please try a JPG or PNG, or take a screenshot of it.'); };
          img.onload = function () {
            var ratio = Math.min(1, 1400 / Math.max(img.width, img.height));
            var c = document.createElement('canvas');
            c.width = Math.round(img.width * ratio); c.height = Math.round(img.height * ratio);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            resolve({ name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.72).split(',')[1] });
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      } else { reject('Please upload photos, screenshots or PDFs only.'); }
    });
  }
  function readFiles(list) { return Promise.all(Array.prototype.slice.call(list).map(readFile)); }
  function addFiles(fields, files) { files.forEach(function (f, i) { fields['File ' + (i + 1) + ' Name'] = f.name; fields['File ' + (i + 1) + ' Type'] = f.type; fields['File ' + (i + 1) + ' Data'] = f.data; }); }

  function submit(kind, buildFields, doneTitle, doneText) {
    var f = $('tpForm'), btn = $('tpSend');
    btn.setAttribute('data-t', btn.innerHTML);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      $('tpError').hidden = true;
      Promise.resolve(buildFields()).then(function (fields) {
        if (typeof fields === 'string') return fail(fields);
        btn.disabled = true; btn.textContent = 'Sending...';
        return call(kind, fields).then(function (res) {
          if (res && res.ok) {
            $('tpDoneTitle').textContent = doneTitle;
            $('tpDoneText').textContent = typeof doneText === 'function' ? doneText(res) : doneText;
            view('tpDone');
          } else {
            var m = { code: 'Your code was not accepted. Please sign in again.', access: 'You do not have access to this form.',
              missing: 'Please fill in all the required fields.', req: 'That requisition is not open for accountability.',
              explain: 'The amounts do not balance. Please explain the difference.', receipt: 'Please attach at least one receipt, or explain why there is none.' };
            fail(m[res && res.error] || 'Something went wrong. Please try again, or tell Banio.');
          }
        });
      }).catch(function (m) { fail(typeof m === 'string' ? m : 'We could not send it. Please check your internet and try again.'); });
    });
    $('tpCancel').addEventListener('click', function () { renderHub(); });
  }

  function openForm(k) {
    var wrapBody = $('tpFormBody');
    if (k === 'daily') wrapBody.innerHTML = dailyHtml(); else if (k === 'requisition') wrapBody.innerHTML = requisitionHtml(); else wrapBody.innerHTML = accountabilityHtml();
    view('tpFormWrap');
    if (k === 'daily') dailyInit(); else if (k === 'requisition') requisitionInit(); else accountabilityInit();
  }

  /* ---------- 1. daily report ---------- */
  var ASKED = ['Safety', 'Fee and payment', 'Daily programme', 'Younger boys', 'Travel and transport', 'What to carry', 'WhatsApp group', 'Refunds and withdrawal'];
  function dailyHtml() {
    return head('Daily activity report', 'Daily report') + '<p class="tp-sub">Most answers are numbers or ticks, and one short line is enough for the rest.</p>' + wrapForm(
      '<div class="tp-grid3">' + field('Date', input('dDate', 'date')) + '</div>' +
      '<div class="tp-block"><h3>1. Calls to parents</h3><p class="tp-sub">Numbers only. Put 0 if there were none.</p><div class="tp-grid3">' +
      field('Calls made', input('dCalls', 'number', 'min="0" inputmode="numeric"')) + field('Answered', input('dAns', 'number', 'min="0" inputmode="numeric"')) + field('Need a second try', input('dRetry', 'number', 'min="0" inputmode="numeric"')) + '</div></div>' +
      '<div class="tp-block"><h3>2. Payments and registrations</h3><div class="reg-grid-2">' +
      field('Families you spoke to about paying', input('dTalked', 'number', 'min="0" inputmode="numeric"')) + field('Payments you know of today', input('dPaid', 'number', 'min="0" inputmode="numeric"')) + '</div>' +
      '<div style="margin-top:14px;">' + field('Boy codes that are stuck (optional)', input('dStuck', 'text', 'placeholder="e.g. BTM-2655 paid but no receipt yet"')) + '</div></div>' +
      '<div class="tp-block"><h3>3. What parents asked today</h3><p class="tp-sub">Tick everything that came up.</p><div class="reg-check-grid">' +
      ASKED.map(function (a) { return '<label class="reg-check-label"><input type="checkbox" name="dAsked" value="' + esc(a) + '"> ' + esc(a) + '</label>'; }).join('') + '</div>' +
      '<div style="margin-top:14px;">' + field('Anything new a parent asked, or said about their son (optional)', '<textarea class="reg-input" id="dNew" rows="2" placeholder="One or two lines, in the parent\'s own words if you can"></textarea>') + '</div></div>' +
      '<div class="tp-block"><h3>4. Families to watch</h3>' + field('Boy codes and one line on why (optional)', '<textarea class="reg-input" id="dWatch" rows="2" placeholder="e.g. BTM-2660, worried about his age, needs a second call"></textarea>', 'Anyone who sounds unsure, or may withdraw.') + '</div>' +
      '<div class="tp-block"><h3>5. Other work today</h3>' + field('What else did you do? (optional)', '<textarea class="reg-input" id="dOther" rows="3" placeholder="Posts and content, creators, institutional enquiries, mentors, venue, documents and so on"></textarea>') + '</div>' +
      '<div class="tp-block"><h3>6. One win and one problem</h3><div class="reg-grid-2">' + field('One win', input('dWin')) + field('One problem', input('dProb')) + '</div></div>' +
      '<div class="tp-block"><h3>7. Tomorrow</h3>' + field('Top three things for tomorrow', input('dT1', 'text', 'placeholder="First"') + '<div style="height:8px"></div>' + input('dT2', 'text', 'placeholder="Second"') + '<div style="height:8px"></div>' + input('dT3', 'text', 'placeholder="Third"')) +
      '<div style="margin-top:14px;"><label class="reg-check-label"><input type="checkbox" id="dHelp"> I need help from Banio</label></div>' +
      '<div id="dHelpBox" style="margin-top:10px;" hidden>' + field('What do you need, and by when?', '<textarea class="reg-input" id="dHelpText" rows="2"></textarea>') + '</div></div>',
      'Send my report');
  }
  function dailyInit() {
    $('dDate').value = today(); $('dDate').max = today();
    $('dHelp').addEventListener('change', function () { $('dHelpBox').hidden = !this.checked; });
    submit('team_report', function () {
      if (val('dCalls') === '') return 'Please fill in the number of calls made, even if it is 0.';
      var asked = Array.prototype.slice.call(document.querySelectorAll('input[name="dAsked"]:checked')).map(function (x) { return x.value; });
      return { 'Report Date': val('dDate'), 'Calls Made': val('dCalls'), 'Calls Answered': val('dAns'), 'Need Second Try': val('dRetry'),
        'Spoke About Paying': val('dTalked'), 'Payments Today': val('dPaid'), 'Stuck Codes': val('dStuck'), 'Parents Asked': asked,
        'New Parent Questions': val('dNew'), 'Families To Watch': val('dWatch'), 'Other Work': val('dOther'), 'Win': val('dWin'), 'Problem': val('dProb'),
        'Tomorrow 1': val('dT1'), 'Tomorrow 2': val('dT2'), 'Tomorrow 3': val('dT3'),
        'Needs Help': $('dHelp').checked ? 'Yes' : '', 'Help Needed': $('dHelp').checked ? val('dHelpText') : '' };
    }, 'Thank you. Your report has been received.', 'It will be included in the evening summary. You can close this page.');
  }

  /* ---------- 2. requisition ---------- */
  var PROJECTS = ['Boys to Men Kampala, December 2026', 'Boys to Men Arua, January 2027', 'Boys to Men Summer Camp, July 2027', 'MEP Masterclass',
    'Content and marketing', 'PUL organisational work', 'Office and general', 'Other'];
  var CATS = ['Transport', 'Food and refreshments', 'Printing and materials', 'Airtime and data', 'Venue', 'Equipment', 'Allowance', 'Professional fees', 'Other'];
  function requisitionHtml() {
    return head('Requisition', 'Requisition') + '<p class="tp-sub">Tell us what you need and why. Banio will approve or decline, and you will be told by email.</p>' + wrapForm(
      '<div class="reg-grid-2">' + field('Project *', select('rProject', PROJECTS, 'Choose one')) + field('Category', select('rCat', CATS, 'Choose one')) + '</div>' +
      '<div style="margin-top:14px;">' + field('What is needed *', '<textarea class="reg-input" id="rWhat" rows="2" placeholder="e.g. Printing of 200 registration forms"></textarea>') + '</div>' +
      '<div class="reg-grid-2" style="margin-top:14px;">' + field('Quantity', input('rQty', 'text', 'placeholder="e.g. 200"')) + field('Amount requested (UGX) *', input('rAmt', 'text', 'inputmode="numeric" placeholder="e.g. 350,000"')) + '</div>' +
      '<div class="reg-grid-2" style="margin-top:14px;">' + field('Needed by *', input('rBy', 'date')) + field('How urgent?', select('rUrg', ['Normal', 'Urgent'])) + '</div>' +
      '<div style="margin-top:14px;">' + field('Why it is needed', '<textarea class="reg-input" id="rWhy" rows="2" placeholder="One or two lines"></textarea>') + '</div>' +
      '<div class="reg-grid-2" style="margin-top:14px;">' + field('Send the money by', select('rVia', ['Mobile money', 'Bank transfer', 'Cash', 'Not sure'], 'Choose one')) + field('Number or account to send to', input('rTo', 'text', 'placeholder="e.g. +256 7XX XXX XXX"')) + '</div>' +
      '<div style="margin-top:14px;">' + field('Quote or picture (optional)', '<input class="reg-input" id="rFile" type="file" accept="image/*,application/pdf">', 'A photo of a quote or price list helps Banio decide faster.') + '</div>',
      'Send requisition');
  }
  function requisitionInit() {
    $('rBy').min = today(); bindMoney('rAmt');
    submit('team_requisition', function () {
      if (!val('rProject') || !val('rWhat') || !(num(val('rAmt')) > 0) || !val('rBy')) return 'Please fill in the project, what is needed, the amount and the date it is needed by.';
      var fields = { 'Project': val('rProject'), 'Category': val('rCat'), 'What Is Needed': val('rWhat'), 'Quantity': val('rQty'), 'Amount Requested': String(num(val('rAmt'))),
        'Needed By': val('rBy'), 'Urgency': val('rUrg'), 'Why It Is Needed': val('rWhy'), 'Pay Via': val('rVia'), 'Pay To': val('rTo') };
      var f = $('rFile').files;
      if (!f.length) return fields;
      return readFiles(f).then(function (files) { addFiles(fields, files); return fields; });
    }, 'Thank you. Your requisition has been sent.', function (res) { return 'Its number is ' + res.no + '. Banio has it now, and you will be told by email when it is decided.'; });
  }

  /* ---------- 3. accountability ---------- */
  function accountabilityHtml() {
    var open = state.open || [];
    if (!open.length) {
      return head('Accountability', 'Accountability') + '<p class="tp-sub">You have no approved requisition waiting to be accounted for. Once a requisition is approved, it will appear here after you spend the money.</p>';
    }
    return head('Accountability', 'Accountability') + '<p class="tp-sub">Choose the requisition, say how much you received and spent, and add your receipts.</p>' + wrapForm(
      field('Requisition *', '<select class="reg-input" id="aReq"><option value="">Choose one</option>' + open.map(function (r) { return '<option value="' + esc(r.no) + '" data-a="' + r.amount + '">' + esc(r.no + '  |  ' + r.what + '  |  UGX ' + money(r.amount)) + '</option>'; }).join('') + '</select>') +
      '<div class="tp-grid3" style="margin-top:14px;">' + field('Amount received (UGX) *', input('aRec', 'text', 'inputmode="numeric"')) + field('Amount spent (UGX) *', input('aSpent', 'text', 'inputmode="numeric"')) + field('Balance returned (UGX)', input('aRet', 'text', 'inputmode="numeric" placeholder="0"')) + '</div>' +
      '<p class="tp-diff" id="aDiff"></p>' +
      '<div style="margin-top:14px;">' + field('Explanation <span id="aExpStar"></span>', '<textarea class="reg-input" id="aExp" rows="2" placeholder="Needed if the amounts do not balance, or if you have no receipt"></textarea>') + '</div>' +
      '<div style="margin-top:14px;">' + field('Receipts (up to 5 photos or PDFs)', '<input class="reg-input" id="aFiles" type="file" accept="image/*,application/pdf" multiple>', 'Take clear photos of every receipt. If something has no receipt, say so in the explanation.') + '</div>',
      'Send accountability');
  }
  function accountabilityInit() {
    if (!(state.open || []).length) { $('tpCancel').addEventListener('click', function () { renderHub(); }); return; }
    ['aRec', 'aSpent', 'aRet'].forEach(bindMoney);
    function diff() {
      var rec = num(val('aRec')), sp = num(val('aSpent')), rt = num(val('aRet'));
      var d = $('aDiff');
      if (!val('aRec') || !val('aSpent')) { d.textContent = ''; d.className = 'tp-diff'; return; }
      var x = rec - sp - rt;
      if (Math.abs(x) < 0.5) { d.textContent = 'This balances.'; d.className = 'tp-diff ok'; $('aExpStar').textContent = ''; }
      else { d.textContent = 'Difference of UGX ' + money(Math.abs(x)) + (x > 0 ? ' not yet accounted for.' : ' more than received.') + ' Please explain below.'; d.className = 'tp-diff bad'; $('aExpStar').textContent = '*'; }
    }
    ['aRec', 'aSpent', 'aRet'].forEach(function (id) { $(id).addEventListener('input', diff); $(id).addEventListener('blur', diff); });
    $('aReq').addEventListener('change', function () {
      var o = this.options[this.selectedIndex], a = o ? parseFloat(o.getAttribute('data-a')) : 0;
      if (a && !val('aRec')) { $('aRec').value = money(a); diff(); }
    });
    $('aSpent').addEventListener('blur', function () { if (val('aSpent') && !val('aRet')) { var r = num(val('aRec')) - num(val('aSpent')); if (r > 0) { $('aRet').value = money(r); diff(); } } });
    submit('team_accountability', function () {
      if (!val('aReq') || !(num(val('aRec')) > 0) || !val('aSpent')) return 'Please choose the requisition and fill in the amounts received and spent.';
      var d = num(val('aRec')) - num(val('aSpent')) - num(val('aRet'));
      if (Math.abs(d) > 0.5 && !val('aExp')) return 'The amounts do not balance. Please explain the difference.';
      var f = $('aFiles').files;
      if (f.length > 5) return 'Please attach at most 5 files. You can put several receipts in one photo.';
      if (!f.length && !val('aExp')) return 'Please attach at least one receipt, or explain why there is none.';
      var fields = { 'Requisition No': val('aReq'), 'Amount Received': String(num(val('aRec'))), 'Amount Spent': String(num(val('aSpent'))), 'Balance Returned': String(num(val('aRet'))), 'Explanation': val('aExp') };
      if (!f.length) return fields;
      return readFiles(f).then(function (files) { addFiles(fields, files); return fields; });
    }, 'Thank you. Your accountability has been sent.', function (res) { return 'Its number is ' + res.no + '. Banio has it now. Please keep your original receipts until he tells you otherwise.'; });
  }

  /* ---------- start ---------- */
  var s = stored();
  if (s) openWith(s, true); else view('tpGate');
  window.scrollTo(0, 0);
})();
