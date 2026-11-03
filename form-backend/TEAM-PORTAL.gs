/**
 * Team portal for people who work with Potential Unexplored and Boys to Men.
 *
 * Staff open the Team Portal page on the website, type their own personal code,
 * and use the forms they are allowed to use. Three forms for now.
 *   1. Daily activity report. Collected all day, and sent to the owner as ONE email at 8 pm.
 *   2. Requisition. Sent to the owner at once, with Approve and Decline buttons.
 *   3. Accountability. Sent to the owner at once, tied to an approved requisition.
 *
 * Everything is kept in private tabs of this spreadsheet.
 * Team, Daily Reports, Requisitions, Accountability, Team Dashboard.
 *
 * Added to the live script together with two small changes.
 *   doPost  : one line that hands every form starting with team_ to teamHandle_
 *   doGet   : one line that handles the Approve and Decline links
 * See PASTE-TEAM-PORTAL.txt
 */

var TEAM_ADMIN_EMAIL = 'baniyoluigi@gmail.com';
var TEAM_PORTAL_URL = 'https://potentialunexplored.com/team-portal.html';
var TEAM_EXEC_URL = 'https://script.google.com/macros/s/AKfycbz4TA60MMwRowFJujLeX_JA_v81z8s4cZI5kKACdZQ01kZDLO1ocpqF6EOyFMQp8XGY/exec';
var TEAM_TZ = 'Africa/Kampala';

var TEAM_TAB = { members: 'Team', reports: 'Daily Reports', reqs: 'Requisitions', acct: 'Accountability', dash: 'Team Dashboard' };

var TEAM_HEAD = {
  members: ['ID', 'Name', 'Role', 'Email', 'Code', 'Active', 'Forms', 'Reminders', 'Added'],
  reports: ['Submitted At', 'Report Date', 'ID', 'Name', 'Role', 'Calls Made', 'Calls Answered', 'Need Second Try',
    'Spoke About Paying', 'Payments Today', 'Stuck Codes', 'Parents Asked', 'New Parent Questions', 'Families To Watch',
    'Other Work', 'Win', 'Problem', 'Tomorrow 1', 'Tomorrow 2', 'Tomorrow 3', 'Needs Help', 'Help Needed', 'In Digest'],
  reqs: ['Requisition No', 'Submitted At', 'ID', 'Name', 'Role', 'Project', 'Category', 'What Is Needed', 'Quantity',
    'Amount Requested (UGX)', 'Needed By', 'Urgency', 'Why It Is Needed', 'Pay Via', 'Pay To', 'Quote Link',
    'Status', 'Decision At', 'Decision Note', 'Accounted'],
  acct: ['Accountability No', 'Submitted At', 'ID', 'Name', 'Role', 'Requisition No', 'Amount Received (UGX)',
    'Amount Spent (UGX)', 'Balance Returned (UGX)', 'Difference (UGX)', 'Explanation', 'Receipt Links', 'Receipts', 'Reviewed']
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function teamCol_(key, name) { return TEAM_HEAD[key].indexOf(name); }

function teamTab_(ss, key) {
  var sh = ss.getSheetByName(TEAM_TAB[key]);
  if (!sh) sh = ss.insertSheet(TEAM_TAB[key]);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, TEAM_HEAD[key].length).setValues([TEAM_HEAD[key]]).setFontWeight('bold').setBackground('#e8efe9');
    sh.setFrozenRows(1);
  }
  return sh;
}

function teamEsc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function teamNum_(v) {
  var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
  return isFinite(n) ? n : 0;
}

function teamMoney_(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function teamToday_() { return Utilities.formatDate(new Date(), TEAM_TZ, 'yyyy-MM-dd'); }

function teamDay_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TEAM_TZ, 'yyyy-MM-dd');
  return String(v || '').slice(0, 10);
}

// A date saved at noon Uganda time, so it shows as the same day whatever the sheet time zone is.
function teamDateCell_(ymd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd || '')) return '';
  try { return Utilities.parseDate(ymd + ' 12:00', TEAM_TZ, 'yyyy-MM-dd HH:mm'); } catch (e) { return ymd; }
}

function teamPretty_(ymd) {
  try { return Utilities.formatDate(Utilities.parseDate(ymd + ' 12:00', TEAM_TZ, 'yyyy-MM-dd HH:mm'), TEAM_TZ, 'd MMM yyyy'); } catch (e) { return ymd; }
}

function teamNextNo_(sh, prefix) {
  var last = sh.getLastRow();
  var max = 0;
  if (last >= 2) {
    sh.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) {
      var m = String(r[0]).match(/(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
  }
  return prefix + ('0000' + (max + 1)).slice(-4);
}

function teamAppend_(sh, key, obj) {
  var row = TEAM_HEAD[key].map(function (h) { return obj[h] == null ? '' : obj[h]; });
  sh.appendRow(row);
  return sh.getLastRow();
}

function teamMail_(to, subject, plain, html, replyTo) {
  if (!to) return;
  var o = { to: to, subject: subject, body: plain, name: 'PUL Team Portal' };
  if (html) o.htmlBody = html;
  if (replyTo) o.replyTo = replyTo;
  try { MailApp.sendEmail(o); } catch (e) {}
}

// Builds a tidy email from sections. Each section is {title, lines:[...]} and lines are plain strings.
function teamBuildMail_(intro, sections, buttons) {
  var plain = intro + '\n';
  var html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#222;max-width:620px;">' +
    '<p style="margin:0 0 16px;">' + teamEsc_(intro) + '</p>';
  sections.forEach(function (s) {
    if (!s.lines || !s.lines.length) return;
    plain += '\n' + s.title.toUpperCase() + '\n' + s.lines.map(function (l) { return '- ' + l; }).join('\n') + '\n';
    html += '<h3 style="margin:20px 0 6px;font-size:15px;color:#1b4332;">' + teamEsc_(s.title) + '</h3><ul style="margin:0;padding-left:20px;">' +
      s.lines.map(function (l) { return '<li style="margin:0 0 4px;">' + teamEsc_(l) + '</li>'; }).join('') + '</ul>';
  });
  if (buttons && buttons.length) {
    html += '<p style="margin:24px 0 8px;">';
    buttons.forEach(function (b) {
      plain += '\n' + b.label + ': ' + b.url + '\n';
      html += '<a href="' + b.url + '" style="display:inline-block;margin:0 10px 10px 0;background:' + (b.color || '#1b4332') +
        ';color:#fff;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:6px;">' + teamEsc_(b.label) + '</a>';
    });
    html += '</p>';
  }
  html += '</div>';
  return { plain: plain, html: html };
}

function teamFolder_(names) {
  var cur = DriveApp.getRootFolder();
  names.forEach(function (n) {
    var it = cur.getFoldersByName(n);
    cur = it.hasNext() ? it.next() : cur.createFolder(n);
  });
  return cur;
}

// Saves up to max uploaded files (File 1 Data, File 1 Name, File 1 Type ...) and returns their links.
function teamSaveFiles_(p, max, folderNames, prefix) {
  var links = [];
  for (var i = 1; i <= max; i++) {
    var data = (p['File ' + i + ' Data'] || [])[0];
    if (!data) continue;
    try {
      var type = (p['File ' + i + ' Type'] || [''])[0] || 'application/octet-stream';
      var name = (p['File ' + i + ' Name'] || [''])[0] || ('file-' + i);
      var blob = Utilities.newBlob(Utilities.base64Decode(data), type, prefix + '-' + i + '-' + name);
      links.push(teamFolder_(folderNames).createFile(blob).getUrl());
    } catch (e) {}
  }
  return links;
}

/* ------------------------------------------------------------------ */
/* People and codes                                                    */
/* ------------------------------------------------------------------ */

function teamMembers_(ss) {
  var sh = teamTab_(ss, 'members');
  var out = [];
  if (sh.getLastRow() < 2) return out;
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, TEAM_HEAD.members.length).getValues();
  vals.forEach(function (r, i) {
    if (!String(r[1]).trim()) return;
    out.push({ row: i + 2, id: String(r[0]).trim(), name: String(r[1]).trim(), role: String(r[2]).trim(), email: String(r[3]).trim(),
      code: String(r[4]).trim().toUpperCase(), active: String(r[5]).trim(), forms: String(r[6]).trim(), remind: String(r[7]).trim() });
  });
  return out;
}

function teamFindByCode_(ss, code) {
  var c = String(code || '').toUpperCase().replace(/\s+/g, '');
  if (c.length < 6) return null;
  var list = teamMembers_(ss);
  for (var i = 0; i < list.length; i++) {
    if (list[i].code && list[i].code === c && list[i].active.toLowerCase() !== 'no') return list[i];
  }
  return null;
}

function teamForms_(m) {
  var all = ['daily', 'requisition', 'accountability'];
  var f = String(m.forms || '').toLowerCase();
  if (!f.trim()) return all;
  return all.filter(function (k) { return f.indexOf(k.slice(0, 5)) >= 0; });
}

function teamMakeCode_(name, taken) {
  var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var pre = String(name).replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) || 'PUL';
  while (pre.length < 3) pre += 'X';
  for (var tries = 0; tries < 50; tries++) {
    var s = '';
    for (var i = 0; i < 6; i++) s += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    var code = pre + '-' + s;
    if (!taken[code]) { taken[code] = true; return code; }
  }
  throw new Error('Could not make a unique code');
}

// Run after adding a name (and role, email) in the Team tab. Fills in the ID, code and defaults.
function teamIssueCodes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = teamTab_(ss, 'members');
  if (sh.getLastRow() < 2) return 0;
  var rng = sh.getRange(2, 1, sh.getLastRow() - 1, TEAM_HEAD.members.length);
  var vals = rng.getValues();
  var taken = {}, maxId = 0, made = 0;
  vals.forEach(function (r) {
    if (String(r[4]).trim()) taken[String(r[4]).trim().toUpperCase()] = true;
    var m = String(r[0]).match(/(\d+)$/);
    if (m) maxId = Math.max(maxId, parseInt(m[1], 10));
  });
  vals.forEach(function (r) {
    if (!String(r[1]).trim()) return;
    if (!String(r[0]).trim()) { maxId++; r[0] = 'T' + ('000' + maxId).slice(-3); }
    if (!String(r[4]).trim()) { r[4] = teamMakeCode_(r[1], taken); made++; }
    if (!String(r[5]).trim()) r[5] = 'Yes';
    if (!String(r[7]).trim()) r[7] = 'No';
    if (!String(r[8]).trim()) r[8] = teamToday_();
  });
  rng.setNumberFormat('@');
  rng.setValues(vals);
  try { ss.toast(made + ' new code(s) made.', 'Team portal', 5); } catch (e) {}
  return made;
}

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('Team portal')
      .addItem('Create codes for new people', 'teamIssueCodes')
      .addItem('Refresh the dashboard', 'teamDashboard')
      .addToUi();
  } catch (e) {}
}

/* ------------------------------------------------------------------ */
/* One time setup. Safe to run again.                                  */
/* ------------------------------------------------------------------ */

function teamSetup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TEAM_HEAD).forEach(function (k) { teamTab_(ss, k); });

  var mem = teamTab_(ss, 'members');
  if (mem.getLastRow() < 2) {
    var seed = [
      ['', 'Banio Luiji Nobert', 'Founder', TEAM_ADMIN_EMAIL, '', '', '', '', ''],
      ['', 'Eduardo Fortunato Atibuni', 'Managing Director, Boys to Men', 'eduardofortunatoatibuni@gmail.com', '', '', '', '', ''],
      ['', 'Kokora Patricia', 'Coach and advocate for the boy child', 'patriciakokora95@gmail.com', '', '', '', '', '']
    ];
    mem.getRange(2, 1, seed.length, seed[0].length).setValues(seed);
  }
  teamIssueCodes();

  // Formats and drop downs.
  var rep = ss.getSheetByName(TEAM_TAB.reports);
  rep.getRange(2, teamCol_('reports', 'Submitted At') + 1, 2000, 1).setNumberFormat('@');
  rep.getRange(2, teamCol_('reports', 'Report Date') + 1, 2000, 1).setNumberFormat('yyyy-mm-dd');
  var rq = ss.getSheetByName(TEAM_TAB.reqs);
  rq.getRange(2, teamCol_('reqs', 'Submitted At') + 1, 2000, 1).setNumberFormat('@');
  rq.getRange(2, teamCol_('reqs', 'Needed By') + 1, 2000, 1).setNumberFormat('yyyy-mm-dd');
  rq.getRange(2, teamCol_('reqs', 'Amount Requested (UGX)') + 1, 2000, 1).setNumberFormat('#,##0');
  var stCol = teamCol_('reqs', 'Status') + 1;
  rq.getRange(2, stCol, 2000, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Pending', 'Approved', 'Paid', 'Declined'], true).setAllowInvalid(true).build());
  var ac = ss.getSheetByName(TEAM_TAB.acct);
  ac.getRange(2, teamCol_('acct', 'Submitted At') + 1, 2000, 1).setNumberFormat('@');
  ac.getRange(2, teamCol_('acct', 'Amount Received (UGX)') + 1, 2000, 4).setNumberFormat('#,##0');
  ac.getRange(2, teamCol_('acct', 'Reviewed') + 1, 2000, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).setAllowInvalid(true).build());

  teamDashboard();
  teamInstallTriggers_();
  try { teamFolder_(['Team Uploads']); } catch (e) {}
  Logger.log('Team portal is ready. Codes are in the Team tab.');
}

function teamInstallTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var h = t.getHandlerFunction();
    if (h === 'teamDigest' || h === 'teamRemind' || h === 'teamWeekly') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('teamRemind').timeBased().everyDays(1).atHour(19).nearMinute(30).inTimezone(TEAM_TZ).create();
  ScriptApp.newTrigger('teamDigest').timeBased().everyDays(1).atHour(20).nearMinute(0).inTimezone(TEAM_TZ).create();
  ScriptApp.newTrigger('teamWeekly').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).inTimezone(TEAM_TZ).create();
}

function teamLetter_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function teamDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TEAM_TAB.dash) || ss.insertSheet(TEAM_TAB.dash);
  sh.clear();
  var R = function (c) { return 'Requisitions!' + teamLetter_(teamCol_('reqs', c) + 1) + '2:' + teamLetter_(teamCol_('reqs', c) + 1); };
  var D = function (c) { return "'Daily Reports'!" + teamLetter_(teamCol_('reports', c) + 1) + '2:' + teamLetter_(teamCol_('reports', c) + 1); };
  var status = R('Status'), amt = R('Amount Requested (UGX)'), acc = R('Accounted');
  var rows = [
    ['Team dashboard', ''],
    ['Updates by itself. Nothing to type here.', ''],
    ['', ''],
    ['MONEY', ''],
    ['Requisitions waiting for a decision', '=COUNTIF(' + status + ',"Pending")'],
    ['Amount waiting for a decision (UGX)', '=SUMIF(' + status + ',"Pending",' + amt + ')'],
    ['Approved or paid, not yet accounted for (UGX)',
      '=SUMIFS(' + amt + ',' + status + ',"Approved",' + acc + ',"<>Yes")+SUMIFS(' + amt + ',' + status + ',"Paid",' + acc + ',"<>Yes")'],
    ['Approved or paid, all time (UGX)', '=SUMIF(' + status + ',"Approved",' + amt + ')+SUMIF(' + status + ',"Paid",' + amt + ')'],
    ['', ''],
    ['ACTIVITY', ''],
    ['Daily reports received today', '=COUNTIFS(' + D('Report Date') + ',">="&TODAY(),' + D('Report Date') + ',"<"&(TODAY()+1))'],
    ['Calls made in the last 7 days', '=SUMIFS(' + D('Calls Made') + ',' + D('Report Date') + ',">="&(TODAY()-6))'],
    ['Calls answered in the last 7 days', '=SUMIFS(' + D('Calls Answered') + ',' + D('Report Date') + ',">="&(TODAY()-6))'],
    ['Payments reported in the last 7 days', '=SUMIFS(' + D('Payments Today') + ',' + D('Report Date') + ',">="&(TODAY()-6))'],
    ['', ''],
    ['NOT YET ACCOUNTED FOR', '']
  ];
  sh.getRange(1, 1, rows.length, 2).setValues(rows.map(function (r) { return [r[0], '']; }));
  rows.forEach(function (r, i) { if (String(r[1]).charAt(0) === '=') sh.getRange(i + 1, 2).setFormula(r[1]); });
  var q = "=IFERROR(QUERY(Requisitions!A2:T,\"select A, D, H, J, K, Q where (Q = 'Approved' or Q = 'Paid') and T <> 'Yes' label A 'No', D 'Name', H 'What', J 'Amount (UGX)', K 'Needed by', Q 'Status'\",0),\"Nothing outstanding\")";
  sh.getRange(rows.length + 1, 1).setFormula(q);
  sh.getRange(1, 1).setFontSize(16).setFontWeight('bold');
  [4, 10, 16].forEach(function (r) { sh.getRange(r, 1).setFontWeight('bold').setFontColor('#1b4332'); });
  sh.getRange(5, 2, 4, 1).setNumberFormat('#,##0');
  sh.setColumnWidth(1, 360); sh.setColumnWidth(2, 160);
}

/* ------------------------------------------------------------------ */
/* Every form from the Team Portal arrives here                        */
/* ------------------------------------------------------------------ */

function teamIsTeamForm_(p) {
  return /^team_/.test(String(first_(p._form)));
}

function teamHandle_(p) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var kind = String(first_(p._form));
  var m = teamFindByCode_(ss, first_(p['Code']));
  if (!m) {
    Utilities.sleep(1500); // slows down anyone guessing codes
    return json_({ ok: false, error: 'code' });
  }
  if (kind === 'team_verify') return json_(teamState_(ss, m));
  var needs = { team_report: 'daily', team_requisition: 'requisition', team_accountability: 'accountability' }[kind];
  if (!needs) return json_({ ok: false, error: 'form' });
  if (teamForms_(m).indexOf(needs) < 0) return json_({ ok: false, error: 'access' });
  try {
    if (kind === 'team_report') return json_(teamReport_(ss, m, p));
    if (kind === 'team_requisition') return json_(teamRequisition_(ss, m, p));
    return json_(teamAccountability_(ss, m, p));
  } catch (err) {
    try { teamMail_(TEAM_ADMIN_EMAIL, 'TEAM PORTAL ERROR | ' + kind, 'A submission from ' + m.name + ' could not be saved.\n\n' + String(err)); } catch (x) {}
    return json_({ ok: false, error: 'server' });
  }
}

// What the page needs to show after a code is accepted.
function teamState_(ss, m) {
  var sh = teamTab_(ss, 'reqs');
  var mine = [], open = [];
  if (sh.getLastRow() >= 2) {
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, TEAM_HEAD.reqs.length).getValues();
    var c = function (n) { return teamCol_('reqs', n); };
    vals.forEach(function (r) {
      if (String(r[c('ID')]) !== m.id) return;
      var item = { no: r[c('Requisition No')], what: String(r[c('What Is Needed')]).slice(0, 80), amount: teamNum_(r[c('Amount Requested (UGX)')]),
        status: r[c('Status')] || 'Pending', needed: teamDay_(r[c('Needed By')]), accounted: r[c('Accounted')] === 'Yes' };
      mine.push(item);
      if ((item.status === 'Approved' || item.status === 'Paid') && !item.accounted) open.push(item);
    });
  }
  mine.reverse();
  return { ok: true, name: m.name, role: m.role, forms: teamForms_(m), requisitions: mine.slice(0, 15), open: open };
}

/* ---------------------------- Daily report ------------------------- */

function teamReport_(ss, m, p) {
  var g = function (n) { return (p[n] || []).join('; ').trim(); };
  var num = function (n) { var v = g(n); return v === '' ? '' : teamNum_(v); };
  var d = g('Report Date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) d = teamToday_();
  var sh = teamTab_(ss, 'reports');
  teamAppend_(sh, 'reports', {
    'Submitted At': now_(), 'Report Date': teamDateCell_(d), 'ID': m.id, 'Name': m.name, 'Role': m.role,
    'Calls Made': num('Calls Made'), 'Calls Answered': num('Calls Answered'), 'Need Second Try': num('Need Second Try'),
    'Spoke About Paying': num('Spoke About Paying'), 'Payments Today': num('Payments Today'), 'Stuck Codes': g('Stuck Codes'),
    'Parents Asked': g('Parents Asked'), 'New Parent Questions': g('New Parent Questions'), 'Families To Watch': g('Families To Watch'),
    'Other Work': g('Other Work'), 'Win': g('Win'), 'Problem': g('Problem'),
    'Tomorrow 1': g('Tomorrow 1'), 'Tomorrow 2': g('Tomorrow 2'), 'Tomorrow 3': g('Tomorrow 3'),
    'Needs Help': g('Needs Help') === 'Yes' ? 'Yes' : '', 'Help Needed': g('Help Needed'), 'In Digest': ''
  });
  if (g('Needs Help') === 'Yes') {
    var body = teamBuildMail_(m.name + ' has asked for help in the daily report for ' + teamPretty_(d) + '.',
      [{ title: 'Help needed', lines: [g('Help Needed') || 'No details were written.'] }], []);
    teamMail_(TEAM_ADMIN_EMAIL, 'HELP NEEDED | ' + m.name + ' | ' + teamPretty_(d), body.plain, body.html);
  }
  return { ok: true };
}

/* ---------------------------- Requisition -------------------------- */

function teamToken_(no, decision) {
  var pr = PropertiesService.getScriptProperties();
  var secret = pr.getProperty('TEAM_SECRET');
  if (!secret) { secret = Utilities.getUuid() + Utilities.getUuid(); pr.setProperty('TEAM_SECRET', secret); }
  var sig = Utilities.computeHmacSha256Signature(no + '|' + decision, secret);
  return Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '').slice(0, 24);
}

function teamDecisionUrl_(no, decision) {
  return TEAM_EXEC_URL + '?a=decide&n=' + encodeURIComponent(no) + '&d=' + decision + '&t=' + teamToken_(no, decision);
}

function teamRequisition_(ss, m, p) {
  var g = function (n) { return (p[n] || []).join('; ').trim(); };
  var amount = teamNum_(g('Amount Requested'));
  var needed = g('Needed By');
  if (!g('What Is Needed') || !(amount > 0) || !g('Project') || !/^\d{4}-\d{2}-\d{2}$/.test(needed)) return { ok: false, error: 'missing' };
  var sh = teamTab_(ss, 'reqs');
  var no = teamNextNo_(sh, 'REQ-');
  var links = teamSaveFiles_(p, 1, ['Team Uploads', 'Requisition Quotes'], no);
  teamAppend_(sh, 'reqs', {
    'Requisition No': no, 'Submitted At': now_(), 'ID': m.id, 'Name': m.name, 'Role': m.role, 'Project': g('Project'), 'Category': g('Category'),
    'What Is Needed': g('What Is Needed'), 'Quantity': g('Quantity'), 'Amount Requested (UGX)': amount, 'Needed By': teamDateCell_(needed),
    'Urgency': g('Urgency') || 'Normal', 'Why It Is Needed': g('Why It Is Needed'), 'Pay Via': g('Pay Via'), 'Pay To': g('Pay To'),
    'Quote Link': links.join('\n'), 'Status': 'Pending', 'Decision At': '', 'Decision Note': '', 'Accounted': ''
  });
  var urgent = g('Urgency') === 'Urgent' ? 'URGENT. ' : '';
  var mail = teamBuildMail_(urgent + m.name + ' has sent a requisition and is waiting for your decision.', [
    { title: 'Requisition ' + no, lines: [
      'What is needed: ' + g('What Is Needed'), 'Project: ' + g('Project') + (g('Category') ? ' (' + g('Category') + ')' : ''),
      'Quantity: ' + (g('Quantity') || 'not stated'), 'Amount requested: UGX ' + teamMoney_(amount),
      'Needed by: ' + teamPretty_(needed) + ' (' + (g('Urgency') || 'Normal') + ')',
      'Why: ' + (g('Why It Is Needed') || 'not stated'),
      'Pay via: ' + (g('Pay Via') || 'not stated') + (g('Pay To') ? ', ' + g('Pay To') : ''),
      links.length ? 'Quote or attachment: ' + links[0] : 'No quote attached'] }
  ], [
    { label: 'Approve', url: teamDecisionUrl_(no, 'approve'), color: '#1b6b3a' },
    { label: 'Decline', url: teamDecisionUrl_(no, 'decline'), color: '#9b2c2c' }
  ]);
  teamMail_(TEAM_ADMIN_EMAIL, 'REQUISITION ' + no + ' | ' + m.name + ' | UGX ' + teamMoney_(amount) + ' | needed ' + teamPretty_(needed),
    mail.plain, mail.html, m.email);
  return { ok: true, no: no };
}

// Handles the Approve and Decline links. The first visit only asks "are you sure",
// so an email scanner that opens the link cannot approve anything by itself.
function teamDecide_(par) {
  var no = String(par.n || ''), d = String(par.d || ''), t = String(par.t || '');
  var page = function (title, text, button) {
    var h = '<div style="font-family:Arial,sans-serif;max-width:480px;margin:40px auto;padding:0 18px;color:#222;line-height:1.6;">' +
      '<h2 style="color:#1b4332;">' + teamEsc_(title) + '</h2><p>' + teamEsc_(text) + '</p>' + (button || '') + '</div>';
    return HtmlService.createHtmlOutput(h).setTitle('Requisition');
  };
  if ((d !== 'approve' && d !== 'decline') || !no || t !== teamToken_(no, d)) return page('This link is not valid', 'Please open the requisition in the sheet instead.');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = teamTab_(ss, 'reqs');
  var vals = sh.getLastRow() >= 2 ? sh.getRange(2, 1, sh.getLastRow() - 1, TEAM_HEAD.reqs.length).getValues() : [];
  var c = function (n) { return teamCol_('reqs', n); };
  var idx = -1;
  vals.forEach(function (r, i) { if (String(r[c('Requisition No')]) === no) idx = i; });
  if (idx < 0) return page('Requisition not found', no + ' is not in the sheet.');
  var row = vals[idx];
  var cur = String(row[c('Status')] || 'Pending');
  if (cur !== 'Pending') return page(no + ' was already decided', 'Its status is ' + cur + '. You can change it in the Requisitions tab if needed.');
  var who = row[c('Name')] + ', UGX ' + teamMoney_(teamNum_(row[c('Amount Requested (UGX)')])) + ', ' + String(row[c('What Is Needed')]).slice(0, 80);
  var word = d === 'approve' ? 'Approve' : 'Decline';
  if (String(par.c) !== '1') {
    var btn = '<p><a target="_top" href="' + teamDecisionUrl_(no, d) + '&c=1" style="display:inline-block;background:' + (d === 'approve' ? '#1b6b3a' : '#9b2c2c') +
      ';color:#fff;font-weight:bold;text-decoration:none;padding:13px 26px;border-radius:6px;">Yes, ' + word.toLowerCase() + ' ' + teamEsc_(no) + '</a></p>';
    return page(word + ' ' + no + '?', who, btn);
  }
  var r0 = idx + 2;
  sh.getRange(r0, c('Status') + 1).setValue(d === 'approve' ? 'Approved' : 'Declined');
  sh.getRange(r0, c('Decision At') + 1).setValue(now_());
  sh.getRange(r0, c('Decision Note') + 1).setValue('By email link');
  var mem = teamMembers_(ss).filter(function (x) { return x.id === String(row[c('ID')]); })[0];
  if (mem && mem.email) {
    var msg = d === 'approve'
      ? 'Your requisition ' + no + ' (' + String(row[c('What Is Needed')]).slice(0, 80) + ', UGX ' + teamMoney_(teamNum_(row[c('Amount Requested (UGX)')])) + ') has been approved. Please keep every receipt and fill in the Accountability form on the Team Portal after you spend.\n\n' + TEAM_PORTAL_URL
      : 'Your requisition ' + no + ' (' + String(row[c('What Is Needed')]).slice(0, 80) + ') was not approved this time. Please speak to Banio if you need to talk about it.';
    teamMail_(mem.email, (d === 'approve' ? 'Approved' : 'Not approved') + ' | Requisition ' + no, 'Dear ' + mem.name.split(' ')[0] + ',\n\n' + msg + '\n\nPotential Unexplored Team Portal', '', TEAM_ADMIN_EMAIL);
  }
  return page(no + (d === 'approve' ? ' approved' : ' declined'), who + (mem && mem.email ? '. ' + mem.name.split(' ')[0] + ' has been told by email.' : '.'));
}

/* ---------------------------- Accountability ----------------------- */

function teamAccountability_(ss, m, p) {
  var g = function (n) { return (p[n] || []).join('; ').trim(); };
  var no = g('Requisition No');
  var rq = teamTab_(ss, 'reqs');
  var vals = rq.getLastRow() >= 2 ? rq.getRange(2, 1, rq.getLastRow() - 1, TEAM_HEAD.reqs.length).getValues() : [];
  var c = function (n) { return teamCol_('reqs', n); };
  var idx = -1;
  vals.forEach(function (r, i) { if (String(r[c('Requisition No')]) === no && String(r[c('ID')]) === m.id) idx = i; });
  if (idx < 0) return { ok: false, error: 'req' };
  var st = String(vals[idx][c('Status')] || 'Pending');
  if ((st !== 'Approved' && st !== 'Paid') || vals[idx][c('Accounted')] === 'Yes') return { ok: false, error: 'req' };

  var received = teamNum_(g('Amount Received')), spent = teamNum_(g('Amount Spent')), returned = teamNum_(g('Balance Returned'));
  var diff = received - spent - returned;
  var explanation = g('Explanation');
  if (!(received > 0) || spent < 0) return { ok: false, error: 'missing' };
  if (Math.abs(diff) > 0.5 && !explanation) return { ok: false, error: 'explain' };

  var sh = teamTab_(ss, 'acct');
  var an = teamNextNo_(sh, 'ACC-');
  var links = teamSaveFiles_(p, 5, ['Team Uploads', 'Receipts', no], an);
  if (!links.length && !explanation) return { ok: false, error: 'receipt' };
  teamAppend_(sh, 'acct', {
    'Accountability No': an, 'Submitted At': now_(), 'ID': m.id, 'Name': m.name, 'Role': m.role, 'Requisition No': no,
    'Amount Received (UGX)': received, 'Amount Spent (UGX)': spent, 'Balance Returned (UGX)': returned, 'Difference (UGX)': diff,
    'Explanation': explanation, 'Receipt Links': links.join('\n'), 'Receipts': links.length, 'Reviewed': 'No'
  });
  rq.getRange(idx + 2, c('Accounted') + 1).setValue('Yes');

  var requested = teamNum_(vals[idx][c('Amount Requested (UGX)')]);
  var flag = Math.abs(diff) > 0.5 ? 'DOES NOT BALANCE. ' : '';
  var mail = teamBuildMail_(flag + m.name + ' has accounted for requisition ' + no + '.', [
    { title: 'Accountability ' + an, lines: [
      'Requisition: ' + no + ' (' + String(vals[idx][c('What Is Needed')]).slice(0, 80) + ')',
      'Amount requested: UGX ' + teamMoney_(requested), 'Amount received: UGX ' + teamMoney_(received),
      'Amount spent: UGX ' + teamMoney_(spent), 'Balance returned: UGX ' + teamMoney_(returned),
      'Difference: UGX ' + teamMoney_(diff), 'Explanation: ' + (explanation || 'none'),
      links.length ? links.length + ' receipt(s) saved' : 'No receipts attached'] },
    { title: 'Receipts', lines: links }
  ], []);
  teamMail_(TEAM_ADMIN_EMAIL, 'ACCOUNTABILITY ' + no + ' | ' + m.name + ' | spent UGX ' + teamMoney_(spent) + ' of ' + teamMoney_(received) +
    (Math.abs(diff) > 0.5 ? ' | CHECK' : ''), mail.plain, mail.html, m.email);
  return { ok: true, no: an };
}

/* ------------------------------------------------------------------ */
/* 8 pm digest, 7.30 pm reminder, Monday summary                       */
/* ------------------------------------------------------------------ */

function teamDigest() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = teamTab_(ss, 'reports');
    var c = function (n) { return teamCol_('reports', n); };
    var vals = sh.getLastRow() >= 2 ? sh.getRange(2, 1, sh.getLastRow() - 1, TEAM_HEAD.reports.length).getValues() : [];
    var fresh = [], rowsToMark = [];
    vals.forEach(function (r, i) { if (String(r[c('In Digest')]) !== 'Yes') { fresh.push(r); rowsToMark.push(i + 2); } });
    var today = teamToday_();
    var members = teamMembers_(ss);

    var reportedToday = {};
    vals.forEach(function (r) { if (teamDay_(r[c('Report Date')]) === today) reportedToday[String(r[c('ID')])] = true; });
    var missing = members.filter(function (x) {
      return x.active.toLowerCase() !== 'no' && teamForms_(x).indexOf('daily') >= 0 && x.email.toLowerCase() !== TEAM_ADMIN_EMAIL.toLowerCase() && !reportedToday[x.id];
    }).map(function (x) { return x.name; });

    var tot = { made: 0, ans: 0, retry: 0, talked: 0, paid: 0 };
    var per = [], asked = {}, questions = [], watch = [], help = [], wins = [], work = [], tomorrow = [], stuck = [];
    fresh.forEach(function (r) {
      var name = r[c('Name')], d = teamPretty_(teamDay_(r[c('Report Date')]));
      tot.made += teamNum_(r[c('Calls Made')]); tot.ans += teamNum_(r[c('Calls Answered')]); tot.retry += teamNum_(r[c('Need Second Try')]);
      tot.talked += teamNum_(r[c('Spoke About Paying')]); tot.paid += teamNum_(r[c('Payments Today')]);
      per.push(name + ' (' + d + '): ' + (teamNum_(r[c('Calls Made')])) + ' calls, ' + teamNum_(r[c('Calls Answered')]) + ' answered, ' + teamNum_(r[c('Payments Today')]) + ' payments');
      String(r[c('Parents Asked')]).split(';').forEach(function (a) { a = a.trim(); if (a) asked[a] = (asked[a] || 0) + 1; });
      var q = String(r[c('New Parent Questions')]).trim(); if (q) questions.push(name + ': ' + q);
      var w = String(r[c('Families To Watch')]).trim(); if (w) watch.push(name + ': ' + w);
      var st = String(r[c('Stuck Codes')]).trim(); if (st) stuck.push(name + ': ' + st);
      if (String(r[c('Needs Help')]) === 'Yes') help.push(name + ': ' + (String(r[c('Help Needed')]).trim() || 'no details written'));
      var win = String(r[c('Win')]).trim(), prob = String(r[c('Problem')]).trim();
      if (win || prob) wins.push(name + (win ? '. Win: ' + win : '') + (prob ? '. Problem: ' + prob : ''));
      var ow = String(r[c('Other Work')]).trim(); if (ow) work.push(name + ': ' + ow);
      var tm = [r[c('Tomorrow 1')], r[c('Tomorrow 2')], r[c('Tomorrow 3')]].filter(function (x) { return String(x).trim(); }).join(' / ');
      if (tm) tomorrow.push(name + ': ' + tm);
    });
    var askedLines = Object.keys(asked).sort(function (a, b) { return asked[b] - asked[a]; }).map(function (k) { return k + ' (' + asked[k] + ')'; });

    var expected = members.filter(function (x) { return x.active.toLowerCase() !== 'no' && teamForms_(x).indexOf('daily') >= 0 && x.email.toLowerCase() !== TEAM_ADMIN_EMAIL.toLowerCase(); }).length;
    var doneCount = expected - missing.length;
    var subject = 'DAILY REPORTS | ' + teamPretty_(today) + ' | ' + (expected ? doneCount + ' of ' + expected + ' reported' : fresh.length + ' report(s)');
    var intro = fresh.length ? 'Here are the daily reports received since the last summary.' : 'No new daily reports have come in since the last summary.';
    var mail = teamBuildMail_(intro, [
      { title: 'Who reported', lines: per },
      { title: 'Totals', lines: fresh.length ? ['Calls made: ' + tot.made, 'Calls answered: ' + tot.ans, 'Need a second try: ' + tot.retry,
        'Families spoken to about paying: ' + tot.talked, 'Payments known of: ' + tot.paid] : [] },
      { title: 'Not yet reported today', lines: missing },
      { title: 'Help needed from you', lines: help },
      { title: 'What parents asked', lines: askedLines },
      { title: 'New questions and comments from parents', lines: questions },
      { title: 'Families to watch', lines: watch },
      { title: 'Stuck boy codes', lines: stuck },
      { title: 'Wins and problems', lines: wins },
      { title: 'Other work done', lines: work },
      { title: 'Planned for tomorrow', lines: tomorrow }
    ], [{ label: 'Open the Daily Reports tab', url: ss.getUrl() }]);
    teamMail_(TEAM_ADMIN_EMAIL, subject, mail.plain, mail.html);
    rowsToMark.forEach(function (r) { sh.getRange(r, c('In Digest') + 1).setValue('Yes'); });
  } finally {
    lock.releaseLock();
  }
}

function teamRemind() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = teamTab_(ss, 'reports');
  var c = function (n) { return teamCol_('reports', n); };
  var vals = sh.getLastRow() >= 2 ? sh.getRange(2, 1, sh.getLastRow() - 1, TEAM_HEAD.reports.length).getValues() : [];
  var today = teamToday_(), done = {};
  vals.forEach(function (r) { if (teamDay_(r[c('Report Date')]) === today) done[String(r[c('ID')])] = true; });
  teamMembers_(ss).forEach(function (m) {
    if (m.active.toLowerCase() === 'no' || m.remind.toLowerCase() !== 'yes' || !m.email || done[m.id] || teamForms_(m).indexOf('daily') < 0) return;
    teamMail_(m.email, 'Please send your daily report',
      'Dear ' + m.name.split(' ')[0] + ',\n\nA gentle reminder to fill in today\'s daily activity report. It takes about five minutes.\n\n' + TEAM_PORTAL_URL +
      '\n\nUse your personal code to open it.\n\nThank you.', '', TEAM_ADMIN_EMAIL);
  });
}

function teamWeekly() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rq = teamTab_(ss, 'reqs');
  var c = function (n) { return teamCol_('reqs', n); };
  var vals = rq.getLastRow() >= 2 ? rq.getRange(2, 1, rq.getLastRow() - 1, TEAM_HEAD.reqs.length).getValues() : [];
  var pending = [], outstanding = [], waiting = 0, owed = 0;
  var now = new Date().getTime();
  vals.forEach(function (r) {
    var st = String(r[c('Status')] || 'Pending'), amt = teamNum_(r[c('Amount Requested (UGX)')]);
    var line = r[c('Requisition No')] + ', ' + r[c('Name')] + ', UGX ' + teamMoney_(amt) + ', ' + String(r[c('What Is Needed')]).slice(0, 60);
    if (st === 'Pending') { pending.push(line + ', needed by ' + teamPretty_(teamDay_(r[c('Needed By')]))); waiting += amt; }
    if ((st === 'Approved' || st === 'Paid') && r[c('Accounted')] !== 'Yes') {
      var since = teamDay_(r[c('Decision At')]) || teamDay_(r[c('Submitted At')]);
      var days = since ? Math.max(0, Math.floor((now - Utilities.parseDate(since + ' 12:00', TEAM_TZ, 'yyyy-MM-dd HH:mm').getTime()) / 86400000)) : 0;
      outstanding.push(line + ', ' + days + ' day(s) since approval'); owed += amt;
    }
  });
  var rp = teamTab_(ss, 'reports');
  var rc = function (n) { return teamCol_('reports', n); };
  var rvals = rp.getLastRow() >= 2 ? rp.getRange(2, 1, rp.getLastRow() - 1, TEAM_HEAD.reports.length).getValues() : [];
  var cutoff = Utilities.formatDate(new Date(now - 6 * 86400000), TEAM_TZ, 'yyyy-MM-dd');
  var per = {};
  rvals.forEach(function (r) {
    if (teamDay_(r[rc('Report Date')]) < cutoff) return;
    var n = r[rc('Name')]; per[n] = per[n] || { days: 0, calls: 0, ans: 0, pay: 0 };
    per[n].days++; per[n].calls += teamNum_(r[rc('Calls Made')]); per[n].ans += teamNum_(r[rc('Calls Answered')]); per[n].pay += teamNum_(r[rc('Payments Today')]);
  });
  var perLines = Object.keys(per).map(function (n) { return n + ': ' + per[n].days + ' report(s), ' + per[n].calls + ' calls, ' + per[n].ans + ' answered, ' + per[n].pay + ' payments'; });
  var mail = teamBuildMail_('Your weekly team summary for the last 7 days.', [
    { title: 'Waiting for your decision (UGX ' + teamMoney_(waiting) + ')', lines: pending },
    { title: 'Money not yet accounted for (UGX ' + teamMoney_(owed) + ')', lines: outstanding },
    { title: 'Activity in the last 7 days', lines: perLines }
  ], [{ label: 'Open the Team Dashboard', url: ss.getUrl() }]);
  teamMail_(TEAM_ADMIN_EMAIL, 'WEEKLY TEAM SUMMARY | ' + teamPretty_(teamToday_()), mail.plain, mail.html);
}

// Removes rows made while testing. Any row with [TEST] in it is deleted.
function teamClearTests() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var removed = 0;
  ['reports', 'reqs', 'acct'].forEach(function (k) {
    var sh = ss.getSheetByName(TEAM_TAB[k]);
    if (!sh || sh.getLastRow() < 2) return;
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, TEAM_HEAD[k].length).getValues();
    for (var i = vals.length - 1; i >= 0; i--) {
      if (vals[i].join(' | ').indexOf('[TEST]') >= 0) { sh.deleteRow(i + 2); removed++; }
    }
  });
  Logger.log('Test rows removed: ' + removed);
  return removed;
}
