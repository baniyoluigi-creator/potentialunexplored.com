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
  var body = new URLSearchParams({ 'form-name': formName, 'full_name': name, 'programme': prog, 'amount': amt });
  body.append(phoneField, phone);
  fetch('https://formspree.io/f/xwvdqygk', { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() }).catch(function (err) { console.warn('Form post failed:', err); });

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
  var body = new URLSearchParams({ 'form-name': 'Bank Transfer Registration', 'full_name': name, 'contact': contact, 'programme': prog });
  fetch('https://formspree.io/f/xwvdqygk', { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() }).catch(function (err) { console.warn('Form post failed:', err); });
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
