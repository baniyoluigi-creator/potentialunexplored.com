/**
 * Potential Unexplored Ltd: website form receiver
 *
 * Saves every form submission from potentialunexplored.com into this Google
 * Sheet, one tab per form, and emails a notice. No monthly submission limit.
 *
 * Setup: see SETUP-GOOGLE-SHEET-FORMS.txt
 */

// Leave empty to send notices to the Google account that owns this script.
// Or put one or more addresses here, separated by commas.
var NOTIFY_EMAIL = '';

// One tab per form. The key is the hidden "_form" value on each website form.
// Tabs are created automatically on the first submission.
var TABS = {
  'mep':          'MEP Applications',
  'girls-rising': 'Girls Rising Waiting List',
  'institutional':'Institutional Enquiries',
  'contact':      'Contact Messages',
  'support':      'Support Enquiries',
  'orders':       'Book and Course Orders',
  'payments':     'Payment Notices'
};
var OTHER_TAB = 'Other';

// Fields used only for spam checks or email subject. They are not saved.
var SKIP_FIELDS = ['_gotcha', 'bot-field', '_subject', '_form', '_page', '_replyto', '_next'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var p = e.parameters || {};
    var formKey = first_(p._form);
    var tabName = TABS[formKey] || OTHER_TAB;

    // Spam trap: real visitors never fill these hidden fields.
    if (first_(p._gotcha) || first_(p['bot-field'])) {
      return json_({ ok: true });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);

    // One row of values keyed by field name. Checkboxes sharing a name
    // are joined with "; ".
    var row = { 'Submitted At': Utilities.formatDate(new Date(), 'Africa/Kampala', 'yyyy-MM-dd HH:mm:ss') };
    Object.keys(p).forEach(function (key) {
      if (SKIP_FIELDS.indexOf(key) !== -1) return;
      row[key] = p[key].join('; ');
    });
    row['Page'] = first_(p._page) || '';

    // Make sure every field has a column; add new columns when needed.
    var lastCol = sheet.getLastColumn();
    var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    Object.keys(row).forEach(function (name) {
      if (headers.indexOf(name) === -1) {
        headers.push(name);
        sheet.getRange(1, headers.length).setValue(name);
      }
    });
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);

    var values = headers.map(function (h) { return row[h] !== undefined ? row[h] : ''; });
    sheet.appendRow(values);

    notify_(first_(p._subject) || ('New submission: ' + tabName), row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Lets you open the web app link in a browser to confirm it is live.
function doGet() {
  return ContentService.createTextOutput('Potential Unexplored form receiver is running.');
}

function notify_(subject, row) {
  var to = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  if (!to) return;

  var lines = Object.keys(row).map(function (k) { return k + ': ' + row[k]; });

  var options = { name: 'Potential Unexplored Website' };
  var replyTo = row['email'] || row['registrant_email'] || row['Email'];
  if (replyTo && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo)) options.replyTo = replyTo;

  try {
    MailApp.sendEmail(to, subject, lines.join('\n'), options);
  } catch (err) {
    // If the daily email limit is ever reached, the entry is still safe in the sheet.
  }
}

function first_(arr) {
  return arr && arr.length ? arr[0] : '';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
