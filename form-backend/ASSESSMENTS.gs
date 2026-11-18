


/* ------------------------------------------------------------------ */
/* PUL ASSESSMENTS (added 18 Nov 2026)                                 */
/* Team Health Check, Leader Health Check, Day Evaluation and           */
/* Programme Evaluation, from the pages on potentialunexplored.com.     */
/* Each form has its own tab in the "PUL Assessments Database" sheet,   */
/* and a Client Summary tab puts each client's answers side by side.    */
/* Every submission emails Banio and info@. A person who gives an       */
/* email on the Team or Leader Health Check gets a copy of their scores.*/
/* ------------------------------------------------------------------ */

var ASSESS_FILE_ID = '1xh8KM8iFCgX2Xuc8EBwOWDeZ-7tr29yDL3-gee_M4NM';
var ASSESS_FORMS = ['Team Mirror', 'Team Mirror Leaders', 'Team Health Check', 'Leader Health Check', 'Day Evaluation', 'Programme Evaluation'];
var ASSESS_AREAS = ['Social Cohesion', 'Trust', 'Communication', 'Healthy Conflict', 'Commitment', 'Accountability', 'Teamwork', 'Results', 'Leadership Support', 'Wellbeing'];

function assessBand_(x) { return x >= 4.3 ? 'Thriving' : x >= 3.5 ? 'Steady' : x >= 2.5 ? 'Strained' : 'Needs Attention'; }

function assessHandle_(p) {
  var g = function (k) { return String((p[k] || [''])[0] || '').trim(); };
  var formName = g('Form');
  if (ASSESS_FORMS.indexOf(formName) < 0) return;
  var ss = SpreadsheetApp.openById(ASSESS_FILE_ID);
  var tab = ss.getSheetByName(formName) || ss.insertSheet(formName);
  var row = { 'Submitted At': now_() };
  Object.keys(p).sort(function (a, b) { return (assessRank_(a) - assessRank_(b)) || (a < b ? -1 : 1); }).forEach(function (k) {
    if (k.charAt(0) === '_') return;
    var v = p[k].join('; ').slice(0, 2000);
    row[k] = /^\d{1,2}(\.\d)?$/.test(v) ? Number(v) : v;
  });
  // The same email answering twice for one client is marked, so the repeat can be left out.
  try {
    var em = String(row['Email'] || '').toLowerCase().trim();
    if (em && tab.getLastRow() > 1) {
      var vals = tab.getDataRange().getValues(), hh = vals[0], cE = hh.indexOf('Email'), cC = hh.indexOf('Client Code');
      for (var r = 1; r < vals.length; r++) {
        if (cE >= 0 && String(vals[r][cE]).toLowerCase().trim() === em && String(vals[r][cC]) === String(row['Client Code'])) { row['Possible Repeat'] = 'Yes, this email already answered'; break; }
      }
    }
  } catch (x) {}
  writeRows_(tab, [row]);
  try { assessSummary_(ss); } catch (x) {}
  try { assessAlert_(formName, row, ss); } catch (x) {}
  try { assessReportEmail_(formName, row); } catch (x) {}
}

function assessAlert_(formName, row, ss) {
  var who = row['Organisation'] || row['Client Code'] || 'Unknown client';
  var head = formName === 'Day Evaluation' ? 'day ' + row['Day Average'] + ' of 5, recommend ' + row['Recommend 0 To 10'] + ' of 10'
    : 'team ' + row['Overall Team'] + ', me ' + row['Overall Me'] + (row['Overall Leadership'] ? ', leadership ' + row['Overall Leadership'] : '');
  var L = [formName + ' for ' + who + ' (client code ' + row['Client Code'] + ')', ''];
  Object.keys(row).forEach(function (k) {
    if (/^[TMLR]\d+$/.test(k) || k === 'Form') return;
    L.push(k + ': ' + row[k]);
  });
  L.push('', 'All answers: ' + ss.getUrl());
  MailApp.sendEmail(OWNER_EMAIL + ', ' + PUL_ALERT_EMAIL, formName + ': ' + who + ' (' + head + ')', L.join('\n'), { name: 'PUL Assessments' });
}

// A copy of the scores for the person who filled the Team or Leader Health Check.
function assessReportEmail_(formName, row) {
  if (!/Team Mirror|Health Check/.test(formName)) return;
  var to = String(row['Email'] || '').trim();
  if (!/^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/.test(to)) return;
  var name = String(row['Name'] || '').replace(/https?:\/\/\S+|www\.\S+|[<>]/g, '').trim().slice(0, 60);
  var num = function (v) { var n = Number(v); return n >= 1 && n <= 5 ? n : null; };
  var rows = ASSESS_AREAS.map(function (a) { return [a, num(row['Team: ' + a]), num(row['Me: ' + a])]; });
  var ot = num(row['Overall Team']), om = num(row['Overall Me']), ol = num(row['Overall Leadership']);
  if (ot === null || om === null) return;
  var fmt = function (n) { return n === null ? '' : n.toFixed(1); };
  var org = String(row['Organisation'] || '').replace(/[<>]/g, '').slice(0, 80);

  var plain = ['Dear ' + (name || 'colleague') + ',', '',
    'Thank you for completing the ' + formName + (org ? ' for ' + org : '') + '. Here is a copy of your scores. They run from 1 to 5.', '',
    'How you see the team: ' + fmt(ot) + ', ' + assessBand_(ot),
    'How you see yourself in it: ' + fmt(om) + ', ' + assessBand_(om)];
  if (ol !== null) plain.push('Your leadership: ' + fmt(ol) + ', ' + assessBand_(ol));
  plain.push('');
  rows.forEach(function (r) { plain.push(r[0] + ': team ' + fmt(r[1]) + ', me ' + fmt(r[2])); });
  plain.push('', 'Your full report, with reflections and small steps, was shown on the screen when you submitted. If you would like to talk about it, call or WhatsApp us on +256 775 495 431, or reply to this email.', '', 'Warm regards,', 'Potential Unexplored Ltd');

  var cell = 'padding:6px 10px;border-bottom:1px solid #eee;';
  var html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px;">' +
    '<p>Dear ' + (name || 'colleague') + ',</p>' +
    '<p>Thank you for completing the ' + formName + (org ? ' for ' + org : '') + '. Here is a copy of your scores. They run from 1 to 5.</p>' +
    '<p style="background:#f6f1e3;border-left:4px solid #C9962A;padding:10px 14px;">How you see the team: <b>' + fmt(ot) + '</b>, ' + assessBand_(ot) +
    '<br>How you see yourself in it: <b>' + fmt(om) + '</b>, ' + assessBand_(om) + (ol !== null ? '<br>Your leadership: <b>' + fmt(ol) + '</b>, ' + assessBand_(ol) : '') + '</p>' +
    '<table style="border-collapse:collapse;width:100%;font-size:14px;"><tr style="background:#1B4332;color:#fff;"><th style="' + cell + 'text-align:left;">Area</th><th style="' + cell + '">Our team</th><th style="' + cell + '">Me in the team</th></tr>' +
    rows.map(function (r) { return '<tr><td style="' + cell + '">' + r[0] + '</td><td style="' + cell + 'text-align:center;">' + fmt(r[1]) + '</td><td style="' + cell + 'text-align:center;">' + fmt(r[2]) + '</td></tr>'; }).join('') +
    '</table><p>Your full report, with reflections and small steps, was shown on the screen when you submitted. If you would like to talk about it, call or WhatsApp us on +256 775 495 431, or reply to this email.</p>' +
    '<p>Warm regards,<br>Potential Unexplored Ltd</p></div>';
  MailApp.sendEmail({ to: to, replyTo: PUL_ALERT_EMAIL, name: 'Potential Unexplored Ltd',
    subject: 'Your ' + formName + ' scores', body: plain.join('\n'), htmlBody: html });
}

// One row per client, rebuilt after every submission.
function assessSummary_(ss) {
  var read = function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return [];
    var v = sh.getDataRange().getValues(), h = v[0];
    return v.slice(1).map(function (r) { var o = {}; h.forEach(function (k, i) { o[k] = r[i]; }); return o; });
  };
  var clients = {}, order = [];
  var bucket = function (o) {
    var code = String(o['Client Code'] || 'GENERAL');
    if (!clients[code]) { clients[code] = { org: o['Organisation'] || '', m: [], l: [], d: [], p: [] }; order.push(code); }
    if (o['Organisation']) clients[code].org = o['Organisation'];
    return clients[code];
  };
  read('Team Mirror').concat(read('Team Health Check')).forEach(function (o) { bucket(o).m.push(o); });
  read('Team Mirror Leaders').concat(read('Leader Health Check')).forEach(function (o) { bucket(o).l.push(o); });
  read('Day Evaluation').forEach(function (o) { bucket(o).d.push(o); });
  read('Programme Evaluation').forEach(function (o) { bucket(o).p.push(o); });

  var mean = function (list, key) {
    var v = list.map(function (o) { return Number(o[key]); }).filter(function (n) { return n > 0 || n === 0; });
    return v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length * 10) / 10 : '';
  };
  var top = function (list, key) {
    var c = {};
    list.forEach(function (o) { String(o[key] || '').split('; ').forEach(function (x) { if (x) c[x] = (c[x] || 0) + 1; }); });
    var best = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0];
    return best ? best + ' (' + c[best] + ')' : '';
  };
  var nps = function (list) {
    var v = list.map(function (o) { return Number(o['Recommend 0 To 10']); }).filter(function (n) { return n >= 0 && n <= 10 && String(n) !== ''; });
    if (!v.length) return '';
    var pro = v.filter(function (n) { return n >= 9; }).length, det = v.filter(function (n) { return n <= 6; }).length;
    return Math.round((pro - det) / v.length * 100);
  };

  var head = ['Client Code', 'Organisation', 'Members Answered', 'Leaders Answered',
    'Members: Team Overall', 'Members: Me Overall', 'Leaders: Team Overall', 'Leaders: Me Overall', 'Leaders: Leadership',
    'Gap, Leaders Minus Members', 'Leader Guess Out Of 10', 'Members Say Holds Team Back', 'Members Say Focus On', 'Team Mood']
    .concat(ASSESS_AREAS.map(function (a) { return 'Members Team: ' + a; }))
    .concat(ASSESS_AREAS.map(function (a) { return 'Leaders Team: ' + a; }))
    .concat(['Day Evaluations', 'Day Average', 'Recommend Score (NPS)', 'Follow-ups', 'Follow-up: Team Overall', 'Change Since Before', 'Follow-up Says Team Is Now']);
  var out = order.map(function (code) {
    var c = clients[code];
    var mt = mean(c.m, 'Overall Team'), lt = mean(c.l, 'Overall Team'), pt = mean(c.p, 'Overall Team');
    return [code, c.org, c.m.length, c.l.length, mt, mean(c.m, 'Overall Me'), lt, mean(c.l, 'Overall Me'), mean(c.l, 'Overall Leadership'),
      (mt !== '' && lt !== '') ? Math.round((lt - mt) * 10) / 10 : '', mean(c.l, 'Leader Guess Out Of 10'),
      top(c.m, 'Holds Team Back'), top(c.m, 'Day Should Focus On'), top(c.m, 'Team Mood')]
      .concat(ASSESS_AREAS.map(function (a) { return mean(c.m, 'Team: ' + a); }))
      .concat(ASSESS_AREAS.map(function (a) { return mean(c.l, 'Team: ' + a); }))
      .concat([c.d.length, mean(c.d, 'Day Average'), nps(c.d), c.p.length, pt,
        (pt !== '' && mt !== '') ? Math.round((pt - mt) * 10) / 10 : '', top(c.p, 'Team Compared With Before')]);
  });
  var sh = ss.getSheetByName('Client Summary') || ss.insertSheet('Client Summary', 0);
  sh.clearContents();
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#1B4332').setFontColor('#FFFFFF').setWrap(true);
  sh.setFrozenRows(1); sh.setFrozenColumns(2);
  if (out.length) sh.getRange(2, 1, out.length, head.length).setValues(out);
}

// Keeps the columns in a sensible order: who and where, scores, choices, then each statement.
var ASSESS_ORDER = ['Form', 'Client Code', 'Organisation', 'Role', 'Department', 'People Led', 'Time In Team', 'Overall Team', 'Overall Me', 'Overall Leadership', 'Day Average', 'Recommend 0 To 10'];
function assessRank_(k) {
  var i = ASSESS_ORDER.indexOf(k);
  if (i >= 0) return i;
  if (/^Team: /.test(k)) return 100 + ASSESS_AREAS.indexOf(k.slice(6));
  if (/^Me: /.test(k)) return 200 + ASSESS_AREAS.indexOf(k.slice(4));
  var m = k.match(/^([RTML])(\d+)$/);
  if (m) return 1000 + 'RTML'.indexOf(m[1]) * 100 + Number(m[2]);
  if (k === 'Name') return 900;
  if (k === 'Email') return 901;
  return 300;
}
