/* Analytics with consent. Off until a GA4 Measurement ID is set below. */
(function () {
  var GA_ID = 'G-7LREL7HFBC'; // e.g. 'G-ABC123XYZ'. Leave empty to keep analytics off.
  if (!GA_ID) return;
  var KEY = 'pul-consent';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function load() {
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', GA_ID, { anonymize_ip: true });
    document.addEventListener('pul:form-sent', function (e) {
      gtag('event', 'generate_lead', { form: (e.detail && e.detail.form) || 'unknown' });
    });
  }
  var c = get();
  if (c === 'yes') { load(); return; }
  if (c === 'no') return;
  var b = document.createElement('div');
  b.className = 'consent-banner'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Cookie choice');
  b.innerHTML = '<p>We use simple analytics to learn which pages help people. Is that all right with you? <a href="privacy-policy.html">Read how we handle data</a>.</p><div><button type="button" class="btn-primary" data-v="yes">Yes, that is fine</button><button type="button" class="btn-ghost" data-v="no">No, thank you</button></div>';
  b.addEventListener('click', function (e) {
    var v = e.target.getAttribute && e.target.getAttribute('data-v');
    if (!v) return; set(v); b.remove(); if (v === 'yes') load();
  });
  document.body.appendChild(b);
})();
