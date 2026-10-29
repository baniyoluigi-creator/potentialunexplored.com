/* ---------------------------------------------------------------
   Form delivery: Google Sheet (no monthly limit)
   Paste the Google Apps Script web app link between the quotes below
   (see form-backend/SETUP-GOOGLE-SHEET-FORMS.txt). While it is empty,
   the forms keep using Formspree as before.
   --------------------------------------------------------------- */
var SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz4TA60MMwRowFJujLeX_JA_v81z8s4cZI5kKACdZQ01kZDLO1ocpqF6EOyFMQp8XGY/exec';

/* The receiving script files messages under 'contact' and everything else under 'apply'.
   Each entry is also labelled so PUL forms can be told apart in the sheet. */
var SHEET_FORM_TYPE = { 'contact': 'contact', 'support': 'contact', 'institutional': 'contact', 'mep': 'apply', 'girls-rising': 'apply', 'orders': 'apply', 'payments': 'apply' };
var SHEET_FORM_LABEL = { 'contact': 'General enquiry', 'support': 'Support enquiry', 'institutional': 'Institutional enquiry', 'mep': 'MEP Masterclass application', 'girls-rising': 'Girls Rising waiting list', 'orders': 'Book or course order', 'payments': 'Payment notice' };
function prepareSheetBody(body, key) {
  var name = body.get('Full Name') || body.get('registrant_name') || body.get('full_name') || body.get('name') ||
    (((body.get('first_name') || '') + ' ' + (body.get('last_name') || '')).trim());
  if (name) body.set('Full Name', name);
  body.set('Form', 'PUL website: ' + (SHEET_FORM_LABEL[key] || key));
  body.set('_form', SHEET_FORM_TYPE[key] || 'apply');
  body.set('_page', location.pathname);
  return body;
}


function postSmallForm(fields, formKey) {
  var body = new URLSearchParams(fields);
  if (SHEET_ENDPOINT) {
    prepareSheetBody(body, formKey);
    return fetch(SHEET_ENDPOINT, { method: 'POST', mode: 'no-cors', body: body }).catch(function (err) { console.warn('Form post failed:', err); });
  }
  return fetch('https://formspree.io/f/xwvdqygk', { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() }).catch(function (err) { console.warn('Form post failed:', err); });
}

/* Potential Unexplored Ltd — shared site JS */

function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }
function closeMenu() { document.getElementById('mobileMenu').classList.remove('open'); }

/* Dropdown nav: hover works via CSS on desktop; this handles tap-to-open on touch/mobile
   and keeps aria-expanded in sync for screen readers on both */
document.querySelectorAll('.nav-links li.has-dropdown').forEach(function (li) {
  var trigger = li.querySelector('a');
  li.addEventListener('mouseenter', function () { trigger.setAttribute('aria-expanded', 'true'); });
  li.addEventListener('mouseleave', function () { trigger.setAttribute('aria-expanded', 'false'); });
  trigger.addEventListener('focus', function () { trigger.setAttribute('aria-expanded', 'true'); });
  trigger.addEventListener('blur', function () { trigger.setAttribute('aria-expanded', 'false'); });
  trigger.addEventListener('click', function (e) {
    if (window.innerWidth <= 900) {
      e.preventDefault();
      var wasOpen = li.classList.contains('open');
      document.querySelectorAll('.has-dropdown.open').forEach(function (el) {
        el.classList.remove('open');
        var t = el.querySelector('a');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) { li.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); }
    }
  });
});
document.querySelectorAll('.mm-group-toggle').forEach(function (trigger) {
  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    var group = trigger.closest('.mm-group');
    var wasOpen = group.classList.contains('open');
    document.querySelectorAll('.mm-group.open').forEach(function (el) { el.classList.remove('open'); });
    if (!wasOpen) group.classList.add('open');
  });
});

document.addEventListener('click', function (e) {
  var menu = document.getElementById('mobileMenu');
  var ham = document.querySelector('.hamburger');
  if (menu && menu.classList.contains('open') && !menu.contains(e.target) && ham && !ham.contains(e.target)) {
    menu.classList.remove('open');
  }
});

/* Same-page anchor smooth scroll (registration tabs, in-page jumps) */
document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 74, behavior: 'smooth' });
    }
  });
});

function toggleExpand(btn) { btn.classList.toggle('open'); btn.nextElementSibling.classList.toggle('open'); }
function toggleFaq(btn) { btn.classList.toggle('open'); btn.nextElementSibling.classList.toggle('open'); }
function bookEnquiry(title) {
  var labelEl = document.getElementById('book-order-item-label');
  var fieldEl = document.getElementById('book-order-item-field');
  var subjectEl = document.getElementById('book-order-subject');
  if (!labelEl) { alert('To order ' + title + ', please WhatsApp us on +256 775 495 431 or email info@potentialunexplored.com.'); return; }
  labelEl.textContent = title;
  fieldEl.value = title;
  subjectEl.value = 'New Book/Course Order Enquiry: ' + title;
  var modal = document.getElementById('modal-book-order');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  var form = document.getElementById('book-order-form');
  var nextField = form.querySelector('input[name="_next"]');
  if (!nextField) {
    nextField = document.createElement('input');
    nextField.type = 'hidden';
    nextField.name = '_next';
    form.appendChild(nextField);
  }
  nextField.value = window.location.origin + window.location.pathname + '?success=true';
}

/* ── Registration hub: tabs + dropdown, synced ────────────────────── */
function switchProg(id) {
  document.querySelectorAll('.reg-tab').forEach(function (t) { t.classList.remove('active'); });
  document.querySelectorAll('.reg-panel').forEach(function (p) { p.style.display = 'none'; });
  var tab = document.getElementById('tab-' + id);
  var panel = document.getElementById('panel-' + id);
  var select = document.getElementById('reg-select');
  if (tab) tab.classList.add('active');
  if (panel) { panel.style.display = 'block'; panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  if (select) select.value = id;
}
function handleDistrict(sel, wrapId) {
  var wrap = document.getElementById(wrapId);
  if (!wrap) return;
  wrap.style.display = (sel.value === 'Uganda') ? 'block' : 'none';
}
function handleEnrollee(radio, wrapId) {
  var wrap = document.getElementById(wrapId);
  if (!wrap) return;
  wrap.style.display = (radio.value === 'other') ? 'block' : 'none';
}
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('panel-b2m-kla')) switchProg('b2m-kla');
});

/* Registration success banner after Formspree redirect */
(function () {
  var q = window.location.search;
  if (q.indexOf('success=') > -1) {
    var msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:var(--green);color:#fff;font-family:Arial,sans-serif;font-size:0.9rem;padding:16px 28px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,0.2);z-index:9999;';
    msg.innerHTML = '&#10003; Registration received. We will confirm within 24 hours.';
    document.body.appendChild(msg);
    setTimeout(function () { msg.remove(); }, 6000);
  }
})();

/* ── Payment flow (bank / MTN MoMo / Airtel Money modals) ─────────── */
var selectedProg = '';
var selectedAmountUGX = 0;
var selectedAmountUSD = 0;

function selectProg(el, ugx, usd) {
  document.querySelectorAll('.prog-radio-label').forEach(function (l) { l.classList.remove('selected'); });
  el.classList.add('selected');
  selectedProg = el.querySelector('input').value;
  selectedAmountUGX = ugx;
  selectedAmountUSD = usd;
  var display = document.getElementById('payAmountDisplay');
  var val = document.getElementById('payAmountVal');
  if (!display || !val) return;
  display.style.display = 'flex';
  val.textContent = ugx === 0 ? 'Contact us for pricing' : 'UGX ' + ugx.toLocaleString() + '  /  USD ' + usd;
}

function initPay(method) {
  if (!selectedProg) { alert('Please select a programme first.'); return; }
  if (selectedAmountUGX === 0 && method !== 'bank' && method !== 'paypal') {
    closeAllModals();
    var c = document.getElementById('contact');
    if (c) c.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  closeAllModals();
  var modal = document.getElementById('modal-' + method);
  if (!modal) return;
  modal.querySelectorAll('input[id$="-prog"]').forEach(function (f) { f.value = selectedProg; });
  modal.querySelectorAll('input[id$="-amount"]').forEach(function (f) {
    f.value = selectedAmountUGX > 0 ? 'UGX ' + selectedAmountUGX.toLocaleString() + ' / USD ' + selectedAmountUSD : 'Contact for pricing';
  });
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
  var pin = document.getElementById(id).querySelector('.pin-prompt');
  if (pin) pin.classList.remove('show');
}

function closeAllModals() {
  document.querySelectorAll('.pay-modal').forEach(function (m) { m.classList.remove('open'); });
  document.body.style.overflow = '';
}

function submitMoMo(provider) {
  var prefix = provider === 'mtn' ? 'mtn' : 'air';
  var name = document.getElementById(prefix + '-name').value.trim();
  var phone = document.getElementById(prefix + '-phone').value.trim();
  var prog = document.getElementById(prefix + '-prog').value.trim();
  var amt = document.getElementById(prefix + '-amount').value.trim();
  if (!name || !phone) { alert('Please enter your name and phone number.'); return; }

  var formName = provider === 'mtn' ? 'MTN MoMo Registration' : 'Airtel Money Registration';
  var phoneField = provider === 'mtn' ? 'mtn_number' : 'airtel_number';
  var fields = { 'form-name': formName, 'full_name': name, 'programme': prog, 'amount': amt, '_subject': 'Payment notice: ' + formName };
  fields[phoneField] = phone;
  postSmallForm(fields, 'payments');

  var modal = document.getElementById('modal-' + provider);
  var existing = modal.querySelector('.pin-prompt');
  if (!existing) {
    var div = document.createElement('div');
    div.className = 'pin-prompt show';
    div.innerHTML = '<div class="pin-prompt-icon">&#128241;</div>' +
      '<h4>Check Your Phone</h4>' +
      '<p>A payment prompt has been sent to <strong>' + phone + '</strong>. ' +
      'Open the notification on your phone and enter your ' + (provider === 'mtn' ? 'MTN MoMo' : 'Airtel Money') + ' PIN to complete the payment.</p>' +
      '<p style="margin-top:10px;font-size:0.82rem;color:var(--light);">Did not receive a prompt? WhatsApp us on <strong>+256 775 495 431</strong> and we will assist you directly.</p>';
    modal.querySelector('.pay-modal-box').appendChild(div);
  } else {
    existing.classList.add('show');
  }
}

function confirmBankTransfer() {
  var name = document.getElementById('bank-name').value.trim();
  var contact = document.getElementById('bank-contact').value.trim();
  var prog = document.getElementById('bank-prog').value.trim();
  if (!name) { alert('Please enter your full name before confirming.'); return; }
  postSmallForm({ 'form-name': 'Bank Transfer Registration', 'full_name': name, 'contact': contact, 'programme': prog, '_subject': 'Payment notice: Bank Transfer Registration' }, 'payments');
  var waMsg = 'Hello%2C%20I%20have%20made%20a%20bank%20transfer%20payment%20for%20' +
    encodeURIComponent(prog || 'a Potential Unexplored programme') +
    '.%20My%20name%20is%20' + encodeURIComponent(name) +
    '.%20Please%20find%20my%20confirmation%20attached.';
  window.open('https://wa.me/256775495431?text=' + waMsg, '_blank');
}

document.addEventListener('click', function (e) {
  document.querySelectorAll('.pay-modal.open').forEach(function (m) {
    if (e.target === m) closeModal(m.id);
  });
});

/* Keyboard accessibility for modals: Escape closes, focus moves into the
   modal on open and returns to the button that opened it on close */
var lastFocusedBeforeModal = null;
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    var openModal = document.querySelector('.pay-modal.open');
    if (openModal) closeModal(openModal.id);
  }
});
(function () {
  var origBookEnquiry = bookEnquiry;
  bookEnquiry = function (title) {
    lastFocusedBeforeModal = document.activeElement;
    origBookEnquiry(title);
    var firstField = document.getElementById('bo-name');
    if (firstField) setTimeout(function () { firstField.focus(); }, 50);
  };
})();
var origCloseModal = closeModal;
closeModal = function (id) {
  origCloseModal(id);
  if (lastFocusedBeforeModal) { lastFocusedBeforeModal.focus(); lastFocusedBeforeModal = null; }
};


/* ---------------------------------------------------------------
   Website forms to Google Sheet. Active only once SHEET_ENDPOINT is set.
   Spam guard: hidden trap field and a short minimum fill time.
   --------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  if (!SHEET_ENDPOINT) return;
  var THANKS = {
    'mep': ['Thank you. Your application has been received.', 'One more step to secure your place. Pay using the details below, then send us your proof of payment. We confirm your place within 24 hours of receiving it.'],
    'girls-rising': ['Thank you. You are on the waiting list.', 'We will contact you as soon as the next intake date is confirmed.'],
    'orders': ['Thank you. Your request has been received.', 'We will confirm availability and payment options within 24 hours.']
  };
  var DEFAULT_THANKS = ['Thank you. Your message has been received.', 'We will get back to you within 24 hours. For anything urgent, WhatsApp us on +256 775 495 431.'];

  document.querySelectorAll('form[action*="formspree.io"]').forEach(function (form) {
    var keyField = form.querySelector('input[name="_form"]');
    if (!keyField) return;
    var openedAt = Date.now();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var trap = form.querySelector('input[name="_gotcha"], input[name="bot-field"]');
      if (trap && trap.value) return;
      if (Date.now() - openedAt < 5000) {
        alert('Please take a moment to check your details, then press Submit again.');
        openedAt = Date.now() - 5000;
        return;
      }
      var button = form.querySelector('button[type="submit"]');
      var buttonText = button ? button.innerHTML : '';
      if (button) { button.disabled = true; button.textContent = 'Sending...'; }

      var data = new FormData(form);
      var body = new URLSearchParams();
      data.forEach(function (value, key) { body.append(key, value); });
      prepareSheetBody(body, keyField.value);

      fetch(SHEET_ENDPOINT, { method: 'POST', mode: 'no-cors', body: body })
        .then(function () {
          var msg = THANKS[keyField.value] || DEFAULT_THANKS;
          var box = document.createElement('div');
          box.setAttribute('role', 'status');
          box.style.cssText = 'background:#FFF8E8;border:1px solid var(--gold);border-radius:8px;padding:22px 24px;margin:16px 0;';
          box.innerHTML = '<h3 style="color:var(--green);margin-bottom:8px;">' + msg[0] + '</h3><p style="font-family:Arial,sans-serif;font-size:0.92rem;color:var(--mid);">' + msg[1] + '</p>';
          form.parentNode.replaceChild(box, form);
          var payPanel = document.getElementById('payPanel');
          if (keyField.value === 'mep' && payPanel) payPanel.hidden = false;
          box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .catch(function () {
          if (button) { button.disabled = false; button.innerHTML = buttonText; }
          alert('Sorry, your details could not be sent. Please check your internet connection and try again, or message us on WhatsApp on +256 775 495 431.');
        });
    });
  });
});


/* How to pay guide: tabs and copy buttons */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.htp').forEach(function (root) {
    var tabs = root.querySelectorAll('.htp-tab');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.setAttribute('aria-selected', 'false'); });
        t.setAttribute('aria-selected', 'true');
        root.querySelectorAll('.htp-panel').forEach(function (p) { p.hidden = true; });
        var panel = root.querySelector('#htp-' + t.getAttribute('data-tab'));
        if (panel) panel.hidden = false;
      });
    });
    root.querySelectorAll('.htp-copy').forEach(function (b) {
      b.addEventListener('click', function () {
        var source = root.querySelector('#' + b.getAttribute('data-copy'));
        if (!source) return;
        var text = source.textContent.trim();
        var ok = function () {
          b.textContent = 'Copied'; b.classList.add('done');
          setTimeout(function () { b.textContent = 'Copy'; b.classList.remove('done'); }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(ok, function () {});
        } else {
          var a = document.createElement('textarea');
          a.value = text; document.body.appendChild(a); a.select();
          try { document.execCommand('copy'); ok(); } catch (err) {}
          document.body.removeChild(a);
        }
      });
    });
  });
});
