/* PUL team building questionnaires: Team Health Check (team member and leader),
   Day Evaluation and Programme Evaluation.
   Answers go to the shared Google Apps Script (SHEET_ENDPOINT in main.js), which saves
   them in the "PUL Assessments Database" sheet and emails Banio.
   Client links: add ?c=CLIENTCODE&o=Organisation%20Name
   Optional: &d=Programmes|Finance|Field team (departments), &s=Session one|Session two (Day Evaluation sessions) */
(function () {
  'use strict';
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbz4TA60MMwRowFJujLeX_JA_v81z8s4cZI5kKACdZQ01kZDLO1ocpqF6EOyFMQp8XGY/exec';

  /* ---------------- question bank ---------------- */
  var AREAS = ['Social Cohesion', 'Trust', 'Communication', 'Healthy Conflict', 'Commitment', 'Accountability', 'Teamwork', 'Results', 'Leadership Support'];
  var ITEMS = [
    ['Social Cohesion', 'Members of this team genuinely care about one another.', 'There is a good spirit and a sense of unity in this team.', 'I make an effort to know my colleagues as people, not only as workers.', 'I help new or quiet members feel welcome and included.'],
    ['Trust', 'I trust my colleagues to do their part well.', 'People here can admit a mistake or ask for help without fear of being judged.', 'I keep my word to colleagues, even on small things.', 'I admit my mistakes and ask for help when I need it.'],
    ['Communication', 'The information we need to do our work reaches us in good time.', 'We speak to one another directly, rather than talking behind each other’s backs.', 'I listen to understand before I reply.', 'I share information others need, without waiting to be asked.'],
    ['Healthy Conflict', 'We can disagree openly in meetings without it becoming personal.', 'When there is tension between colleagues, it is talked about and settled, not left to grow.', 'I speak up when I disagree, even with someone senior to me.', 'When I am unhappy with a colleague, I go to them directly and respectfully.'],
    ['Commitment', 'Everyone understands what our team is trying to achieve this year.', 'Once a decision is made, everyone supports it, even those who disagreed.', 'I know how my work adds to the team’s goals.', 'I fully support team decisions, even ones I argued against.'],
    ['Accountability', 'Team members do what they say they will do.', 'Colleagues kindly challenge one another when standards slip.', 'I deliver what I promise, on time.', 'I own my mistakes instead of blaming others or circumstances.'],
    ['Teamwork', 'Colleagues willingly help each other, even outside their own roles.', 'Different departments or units in our organisation work well together.', 'I offer help to colleagues before they ask.', 'I share the credit for success with the people who helped.'],
    ['Results', 'We put team results ahead of personal or departmental interests.', 'We regularly check how we are doing against our targets, and learn from what we miss.', 'I care as much about the team’s results as about my own.', 'I look for ways to do my work better, not only to get it done.'],
    ['Leadership Support', 'Our leaders are approachable when we have a concern.', 'Good work is noticed and appreciated by our leaders.', 'I raise concerns with my leaders openly, rather than complaining elsewhere.', 'I make my leader’s work easier by being reliable and keeping them informed.']
  ];
  var LEAD = [
    'I make it safe for my team to disagree with me.', 'I give each team member regular feedback, both praise and correction.',
    'I explain the reasons behind my decisions.', 'I hold myself to the same standards I expect of others.',
    'I deal with conflict early, rather than hoping it will go away.', 'I recognise good work, in private and in public.',
    'I know what motivates each person on my team.', 'I hand over meaningful work, not only the tasks I do not want.',
    'I ask my team for feedback on my own leadership.'
  ];
  var REPORT = {
    'Social Cohesion': ['People may be working side by side without feeling connected, and some may feel like outsiders.', ['Who on your team might feel left out, and why?', 'How much do you really know about the lives of the people you work with?'], ['Have tea or lunch this week with a colleague you rarely talk to.', 'Greet and check on one quiet colleague each day this week.']],
    'Trust': ['People may be holding back, protecting themselves, or doing work twice because they are not sure others will deliver.', ['What would it take for you to admit a mistake in your next meeting?', 'Who on this team do you find hardest to trust, and what might you not know about them?'], ['Share one thing you are struggling with at work and ask for help this week.', 'Keep one small promise you have made to a colleague, on time.']],
    'Communication': ['Information may be arriving late, in pieces, or through the grapevine rather than straight from the source.', ['When last did you hear something important about your work from a corridor rather than a meeting?', 'Do people leave your conversations feeling heard?'], ['In your next conversation, repeat back what you heard before you reply.', 'Agree with your team one place where key updates will always be shared.']],
    'Healthy Conflict': ['Disagreements may be going underground, which often shows up as silence in meetings and complaints afterwards.', ['What is one thing the team needs to talk about but keeps avoiding?', 'How do you usually react when someone disagrees with you?'], ['Invite the quietest person in your next meeting to give their view first.', 'Have one honest, respectful conversation you have been putting off.']],
    'Commitment': ['People may be busy without being sure what matters most, or may be nodding at decisions they do not truly support.', ['Could every member of your team name the top three priorities for this year?', 'Is there a decision you agreed to in the meeting but have not fully supported since?'], ['Write down in one sentence how your work adds to the team’s goals, and share it.', 'At the end of your next meeting, ask everyone to repeat what was agreed and who will do what.']],
    'Accountability': ['Standards may slip quietly because people are not comfortable reminding one another of what was agreed.', ['What do you do when a colleague does not deliver what they promised?', 'Where are you waiting for a leader to correct something you could raise yourself?'], ['Agree with a colleague to check on each other’s commitments this week.', 'Own one mistake openly, and say what you will do differently.']],
    'Teamwork': ['People may be guarding their own work, and units may be pulling in different directions.', ['When last did you help a colleague with something outside your own role?', 'Where does work get stuck between your unit and another?'], ['Offer help to someone in another unit before they ask.', 'Thank, by name, the people who helped you deliver something this month.']],
    'Results': ['Personal or departmental interests, comfort, or busyness may be taking the place of shared results.', ['If your team’s results were posted on the wall today, would you be proud of them?', 'What gets more attention in your team, activity or results?'], ['Look at one team target this week and ask, are we on track?', 'Celebrate one win, however small, with the whole team.']],
    'Leadership Support': ['People may feel they cannot easily reach their leaders, or that good work goes unnoticed.', ['If you are a leader, what would your team say about you when you are not in the room?', 'If you are a team member, what support do you need that you have not asked for?'], ['Leaders, ask one team member this week, what is one thing I could do better?', 'Team members, book a short conversation with your supervisor about what you need.']]
  };
  var AGREE = ['Strongly disagree', 'Disagree', 'Not sure', 'Agree', 'Strongly agree'];
  var OFTEN = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
  var RATE = ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'];

  /* ---------------- helpers ---------------- */
  var qs = new URLSearchParams(location.search);
  var CLIENT = (qs.get('c') || 'GENERAL').trim().slice(0, 40);
  var ORG = (qs.get('o') || '').trim().slice(0, 80);
  var DEPTS = (qs.get('d') || '').split('|').map(function (x) { return x.trim(); }).filter(Boolean);
  if (!DEPTS.length) DEPTS = ['Management', 'Programmes or operations', 'Finance and administration', 'Field team', 'Support services'];
  var SESSIONS = (qs.get('s') || '').split('|').map(function (x) { return x.trim(); }).filter(Boolean);
  if (!SESSIONS.length) SESSIONS = ['Opening circle and introductions', 'Trust activities', 'Communication games', 'Problem solving challenges', 'Reflection sessions', 'Team commitments'];

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); });
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function avg(a) { var v = a.filter(function (x) { return typeof x === 'number'; }); return v.length ? v.reduce(function (s, x) { return s + x; }, 0) / v.length : null; }
  function r1(x) { return x === null ? '' : (Math.round(x * 10) / 10).toFixed(1); }
  function band(x) { return x >= 4.3 ? 'Thriving' : x >= 3.5 ? 'Steady' : x >= 2.5 ? 'Strained' : 'Needs Attention'; }
  function bandClass(x) { return x >= 4.3 ? 'b4' : x >= 3.5 ? 'b3' : x >= 2.5 ? 'b2' : 'b1'; }
  // Same mixed order for everyone, so statements from one area do not sit together.
  function mixed(n) { var o = [], step = 7; for (var i = 0; i < n; i++) o.push((i * step) % n); return o; }

  var answers = {};   // key -> value
  var form, root, steps = [], cur = 0, mode = '';

  /* ---------------- building blocks ---------------- */
  function scaleBlock(key, text, labels, num) {
    var w = el('div', { class: 'as-q', 'data-key': key });
    w.appendChild(el('p', { class: 'as-qt' }, (num ? '<span class="as-n">' + num + '</span>' : '') + esc(text)));
    var row = el('div', { class: 'as-scale', role: 'radiogroup', 'aria-label': text });
    labels.forEach(function (lab, i) {
      var b = el('button', { type: 'button', class: 'as-opt', role: 'radio', 'aria-checked': 'false', title: lab }, '<b>' + (i + 1) + '</b><small>' + esc(lab) + '</small>');
      b.addEventListener('click', function () {
        answers[key] = i + 1;
        row.querySelectorAll('.as-opt').forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-checked', 'true'); w.classList.remove('as-miss');
      });
      if (answers[key] === i + 1) { b.classList.add('on'); b.setAttribute('aria-checked', 'true'); }
      row.appendChild(b);
    });
    w.appendChild(row);
    return w;
  }
  function numBlock(key, text, from, to, lowLab, highLab) {
    var w = el('div', { class: 'as-q', 'data-key': key });
    w.appendChild(el('p', { class: 'as-qt' }, esc(text)));
    var row = el('div', { class: 'as-scale as-wide', role: 'radiogroup' });
    for (var i = from; i <= to; i++) (function (v) {
      var b = el('button', { type: 'button', class: 'as-opt', role: 'radio' }, '<b>' + v + '</b>');
      b.addEventListener('click', function () { answers[key] = v; row.querySelectorAll('.as-opt').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); w.classList.remove('as-miss'); });
      if (answers[key] === v) b.classList.add('on');
      row.appendChild(b);
    })(i);
    w.appendChild(row);
    if (lowLab) w.appendChild(el('p', { class: 'as-ends' }, '<span>' + esc(lowLab) + '</span><span>' + esc(highLab) + '</span>'));
    return w;
  }
  function choiceBlock(key, text, options, opts) {
    opts = opts || {};
    var w = el('div', { class: 'as-q', 'data-key': key });
    w.appendChild(el('p', { class: 'as-qt' }, esc(text) + (opts.max > 1 ? ' <span class="as-hint">Pick up to ' + opts.max + '</span>' : (opts.multi ? ' <span class="as-hint">Tick any</span>' : ''))));
    var box = el('div', { class: 'as-chips' });
    var multi = opts.multi || opts.max > 1;
    options.forEach(function (o) {
      var b = el('button', { type: 'button', class: 'as-chip' }, esc(o));
      b.addEventListener('click', function () {
        if (!multi) {
          box.querySelectorAll('.as-chip').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on'); answers[key] = o;
        } else {
          var list = (answers[key] || []).slice();
          var at = list.indexOf(o);
          if (at >= 0) { list.splice(at, 1); b.classList.remove('on'); }
          else {
            if (opts.none && o === opts.none) { list = []; box.querySelectorAll('.as-chip').forEach(function (x) { x.classList.remove('on'); }); }
            else if (opts.none && list.indexOf(opts.none) >= 0) { list.splice(list.indexOf(opts.none), 1); box.querySelectorAll('.as-chip').forEach(function (x) { if (x.textContent === opts.none) x.classList.remove('on'); }); }
            if (opts.max && list.length >= opts.max) return;
            list.push(o); b.classList.add('on');
          }
          answers[key] = list;
        }
        w.classList.remove('as-miss');
      });
      var cv = answers[key];
      if (cv === o || (Array.isArray(cv) && cv.indexOf(o) >= 0)) b.classList.add('on');
      box.appendChild(b);
    });
    w.appendChild(box);
    if (opts.optional) w.setAttribute('data-optional', '1');
    return w;
  }
  function textBlock(key, text, opts) {
    opts = opts || {};
    var w = el('div', { class: 'as-q', 'data-key': key, 'data-optional': opts.required ? '' : '1' });
    w.appendChild(el('p', { class: 'as-qt' }, esc(text) + (opts.required ? '' : ' <span class="as-hint">Optional</span>')));
    var inp = opts.line ? el('input', { type: opts.type || 'text', class: 'as-in', maxlength: '120', autocomplete: opts.ac || 'off' }) : el('textarea', { class: 'as-in', rows: '3', maxlength: '1200' });
    if (answers[key]) inp.value = answers[key];
    inp.addEventListener('input', function () { answers[key] = inp.value.trim(); w.classList.remove('as-miss'); });
    w.appendChild(inp);
    return w;
  }
  function step(title, sub, blocks, opts) {
    var s = el('div', { class: 'as-step' });
    s.appendChild(el('h2', { class: 'as-h' }, esc(title)));
    if (sub) s.appendChild(el('p', { class: 'as-sub' }, sub));
    blocks.forEach(function (b) { if (b) s.appendChild(b); });
    s._opts = opts || {};
    return s;
  }

  /* ---------------- navigation ---------------- */
  function render() {
    root.innerHTML = '';
    var bar = el('div', { class: 'as-progress' }, '<span style="width:' + Math.round((cur / steps.length) * 100) + '%"></span>');
    root.appendChild(bar);
    root.appendChild(el('p', { class: 'as-count' }, 'Step ' + (cur + 1) + ' of ' + steps.length));
    root.appendChild(steps[cur]);
    var nav = el('div', { class: 'as-nav' });
    if (cur > 0) { var back = el('button', { type: 'button', class: 'as-back' }, 'Back'); back.onclick = function () { cur--; render(); scrollTop(); }; nav.appendChild(back); }
    var last = cur === steps.length - 1 && !steps[cur]._opts.after;
    var next = el('button', { type: 'button', class: 'btn btn-primary as-next' }, last ? 'Submit and see my report' : 'Next');
    if (last && mode !== 'thc') next.textContent = 'Submit';
    next.onclick = function () {
      if (!check(steps[cur])) return;
      if (steps[cur]._opts.after) steps[cur]._opts.after();
      if (cur === steps.length - 1) { submit(); return; }
      cur++; render(); scrollTop();
    };
    nav.appendChild(next);
    root.appendChild(nav);
    root.appendChild(el('p', { class: 'as-err', id: 'asErr' }, ''));
  }
  function scrollTop() { root.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function check(s) {
    var missing = [];
    s.querySelectorAll('.as-q').forEach(function (q) {
      if (q.getAttribute('data-optional') === '1') return;
      var v = answers[q.getAttribute('data-key')];
      if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) { missing.push(q); q.classList.add('as-miss'); }
    });
    var err = document.getElementById('asErr');
    if (missing.length) {
      err.textContent = missing.length === 1 ? 'Please answer the question marked in gold.' : 'Please answer the ' + missing.length + ' questions marked in gold.';
      missing[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    var em = s.querySelector('input[type=email]');
    if (em && em.value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim())) { err.textContent = 'Please check the email address.'; em.focus(); return false; }
    err.textContent = '';
    return true;
  }

  /* ---------------- Team Health Check ---------------- */
  function teamStatements(prefix, idx, scale) {
    // idx 1,2 = team statements, 3,4 = self statements
    var list = [];
    ITEMS.forEach(function (it, a) { list.push({ key: prefix + (a * 2 + 1), text: it[idx[0]] }); list.push({ key: prefix + (a * 2 + 2), text: it[idx[1]] }); });
    return mixed(list.length).map(function (i, n) { return scaleBlock(list[i].key, list[i].text, scale, n + 1); });
  }
  function isLeader() { return /Supervisor|Manager/.test(answers.role || ''); }

  function buildTHC() {
    mode = 'thc';
    var intro = step('Before we begin', 'Thank you for taking a few minutes to help us prepare for your team building day. First you will look at your team, and then at yourself as part of it. There are no right or wrong answers, so please answer as things really are, not as they should be. Your answers are anonymous unless you choose to give your name. It takes about 8 minutes.', [
      choiceBlock('role', 'Which best describes your role?', ['Team member', 'Supervisor or team leader', 'Manager or senior leader']),
      choiceBlock('dept', 'Your department, unit or team', DEPTS)
    ], { after: buildRest });
    steps = [intro];
  }
  function buildRest() {
    var lead = isLeader();
    var about = lead
      ? step('About your leadership', null, [
        choiceBlock('people', 'How many people report to you, directly or through others?', ['1 to 5', '6 to 15', '16 to 40', 'More than 40']),
        choiceBlock('tenure', 'How long have you led this team?', ['Less than 1 year', '1 to 3 years', 'More than 3 years'])])
      : step('About you', null, [
        choiceBlock('tenure', 'How long have you been in this team?', ['Less than 1 year', '1 to 3 years', '4 to 6 years', 'More than 6 years'])]);
    var team = step('Our team', 'How much do you agree with each statement? 1 Strongly disagree, 5 Strongly agree.', teamStatements('T', [1, 2], AGREE));
    var me = step('Me in the team', 'How often is each statement true of you? 1 Never, 5 Always.', teamStatements('M', [3, 4], OFTEN));
    var list = [intro0(), about, team, me];
    if (lead) list.push(step('My leadership', 'How often is each statement true of you? 1 Never, 5 Always.', LEAD.map(function (t, i) { return scaleBlock('L' + (i + 1), t, OFTEN, i + 1); })));
    if (lead) {
      list.push(step('Quick choices', null, [
        choiceBlock('success', 'What would make the day a real success for you?', ['Stronger trust', 'More open communication', 'Clearer goals', 'Stronger accountability', 'Healing after conflict', 'Better cooperation between units', 'Higher morale', 'Stronger leadership', 'Team bonding and fun'], { max: 3 }),
        choiceBlock('challenge', 'What is the biggest challenge your team faces right now?', AREAS),
        numBlock('guess', 'Out of 10, how do you think your team will rate the overall health of the team?', 1, 10, 'Very poor', 'Excellent'),
        choiceBlock('events', 'Has the team been through any of these in the past year?', ['Restructuring or job cuts', 'Change of leadership', 'A loss or bereavement', 'Serious conflict', 'Many new members', 'Funding cuts', 'None of these'], { multi: true, none: 'None of these' })
      ]));
      list.push(step('Last step', 'Your email is needed so we can send your report. Everything else here is optional.', [
        textBlock('leaderSay', 'If your team described your leadership honestly, what do you think they would say?'),
        textBlock('sensitive', 'Is there anything sensitive the facilitator should know?'),
        textBlock('name', 'Your name', { line: true, ac: 'name' }),
        textBlock('email', 'Your email', { line: true, type: 'email', required: true, ac: 'email' })
      ]));
    } else {
      list.push(step('Quick choices', null, [
        choiceBlock('strength', 'Which area is this team’s greatest strength?', AREAS),
        choiceBlock('holdsBack', 'Which area holds this team back the most?', AREAS),
        choiceBlock('growMe', 'Which area would you most like to grow in yourself?', AREAS),
        choiceBlock('focus', 'Which areas should the team building day focus on?', AREAS, { max: 3 }),
        choiceBlock('mood', 'Which best describes the mood of the team right now?', ['Energised', 'Settled', 'Hopeful', 'Tired', 'Tense', 'Divided']),
        choiceBlock('avoid', 'Are there activities you would rather avoid on the day?', ['None', 'Physical activities', 'Holding hands or close contact', 'Speaking in front of the group', 'Other (say below)'], { multi: true, none: 'None' })
      ]));
      list.push(step('Last step, all optional', 'You can skip this page and go straight to your report.', [
        textBlock('leadersKnew', 'Is there something you wish leadership knew, but have never said? Your answer is anonymous.'),
        textBlock('facilitator', 'Is there anything else the facilitator should know before the day?'),
        textBlock('name', 'Your name, if you wish to give it', { line: true, ac: 'name' }),
        textBlock('email', 'Your email, if you would like a copy of your report', { line: true, type: 'email', ac: 'email' })
      ]));
    }
    steps = list;
  }
  function intro0() { return steps[0]; }

  function thcScores() {
    var s = { team: {}, me: {}, lead: null };
    ITEMS.forEach(function (it, a) {
      s.team[it[0]] = avg([answers['T' + (a * 2 + 1)], answers['T' + (a * 2 + 2)]]);
      s.me[it[0]] = avg([answers['M' + (a * 2 + 1)], answers['M' + (a * 2 + 2)]]);
    });
    s.overallTeam = avg(AREAS.map(function (a) { return s.team[a]; }));
    s.overallMe = avg(AREAS.map(function (a) { return s.me[a]; }));
    if (isLeader()) s.lead = avg(LEAD.map(function (x, i) { return answers['L' + (i + 1)]; }));
    return s;
  }
  function pattern(t, m) {
    if (m - t >= 1) return ['Me high, team low', 'You may be doing your part while feeling others are not. Or perhaps others see things in you that you do not. What if you asked a colleague how they experience you in this area?'];
    if (t - m >= 1) return ['Me low, team high', 'The team is doing well here, and there may be room for you to step up. What is one small thing you could do this week to match the team?'];
    if (t >= 3.5 && m >= 3.5) return ['Both high', 'This is a real strength, and you are part of the reason. Perhaps you could help others grow in this area.'];
    return ['Both low', 'This is a shared growth area. Change here may start with you, and your example could lift others.'];
  }

  function reportTHC(s) {
    var order = AREAS.slice().sort(function (a, b) { return (s.team[b] + s.me[b] * 0.0001) - (s.team[a] + s.me[a] * 0.0001); });
    var strong = order.slice(0, 2), grow = order.slice(-2).reverse();
    var h = '';
    h += '<div class="as-report">';
    h += '<p class="eyebrow">Your report</p><h2 class="as-h">Team Health Check' + (ORG ? ', ' + esc(ORG) : '') + '</h2>';
    h += '<div class="as-tiles">';
    h += '<div class="as-tile ' + bandClass(s.overallTeam) + '"><small>How you see the team</small><b>' + r1(s.overallTeam) + '</b><span>' + band(s.overallTeam) + '</span></div>';
    h += '<div class="as-tile ' + bandClass(s.overallMe) + '"><small>How you see yourself in it</small><b>' + r1(s.overallMe) + '</b><span>' + band(s.overallMe) + '</span></div>';
    if (s.lead !== null) h += '<div class="as-tile ' + bandClass(s.lead) + '"><small>Your leadership</small><b>' + r1(s.lead) + '</b><span>' + band(s.lead) + '</span></div>';
    h += '</div>';
    h += '<p class="as-note">Scores run from 1 to 5. Thriving is 4.3 and above, Steady 3.5 to 4.2, Strained 2.5 to 3.4, and Needs Attention below 2.5.</p>';
    h += '<h3 class="as-h3">The nine areas</h3><div class="as-legend"><span class="t"></span>Our team <span class="m"></span>Me in the team</div><div class="as-chart">';
    AREAS.forEach(function (a) {
      h += '<div class="as-row"><span class="as-lab">' + a + '</span><div class="as-bars">' +
        '<div class="as-bar t" style="width:' + (s.team[a] / 5 * 100) + '%"><em>' + r1(s.team[a]) + '</em></div>' +
        '<div class="as-bar m" style="width:' + (s.me[a] / 5 * 100) + '%"><em>' + r1(s.me[a]) + '</em></div></div></div>';
    });
    h += '</div>';
    h += '<h3 class="as-h3">Where your team is strongest</h3>';
    strong.forEach(function (a) {
      var p = pattern(s.team[a], s.me[a]);
      h += '<div class="as-card good"><b>' + a + '</b> <span class="as-pill ' + bandClass(s.team[a]) + '">' + band(s.team[a]) + '</span><p>' + esc(p[1]) + '</p></div>';
    });
    h += '<h3 class="as-h3">Where there is room to grow</h3>';
    grow.forEach(function (a) {
      var p = pattern(s.team[a], s.me[a]), r = REPORT[a];
      h += '<div class="as-card"><b>' + a + '</b> <span class="as-pill ' + bandClass(s.team[a]) + '">' + band(s.team[a]) + '</span>' +
        '<p><strong>What it may mean.</strong> ' + esc(r[0]) + '</p><p><strong>You and the team.</strong> ' + esc(p[1]) + '</p>' +
        '<p><strong>Questions to reflect on.</strong></p><ul>' + r[1].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        '<p><strong>Small steps for this week.</strong></p><ul>' + r[2].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    });
    if (s.lead !== null) h += '<div class="as-card"><b>A note for leaders</b><p>You guessed your team would rate its health ' + esc(answers.guess) + ' out of 10. Perhaps keep that number in mind, and notice how it compares with your own scores above.</p></div>';
    h += '<div class="as-card soft"><b>What happens next</b><p>Your answers have gone to the Potential Unexplored team and will help shape your team building day. ' + (answers.email ? 'A copy of your scores is on its way to ' + esc(answers.email) + '. ' : '') + 'If you would like to talk about your report, call or WhatsApp us on +256 775 495 431, or write to info@potentialunexplored.com.</p></div>';
    h += '<p class="as-actions"><button type="button" class="btn btn-primary" onclick="window.print()">Print or save as PDF</button></p>';
    h += '</div>';
    return h;
  }

  /* ---------------- Day Evaluation ---------------- */
  function buildDay() {
    mode = 'day';
    steps = [
      step('Rate the day', 'Thank you for being part of today. It takes about 3 minutes. 1 Very poor, 5 Excellent.', [
        ['R1', 'Overall, how valuable was today for you?'], ['R2', 'How relevant was today to the real challenges in our team?'], ['R3', 'How would you rate the facilitation?'],
        ['R4', 'How useful were the games and activities?'], ['R5', 'How useful were the reflection sessions after each activity?'],
        ['R6', 'How well was time managed during the day?'], ['R7', 'How would you rate the venue, meals and arrangements?']
      ].map(function (x, i) { return scaleBlock(x[0], x[1], RATE, i + 1); })),
      step('Looking forward', null, [
        choiceBlock('best', 'Which session or activity was most valuable to you?', SESSIONS),
        choiceBlock('workOn', 'Which area will you work on first, starting this week?', AREAS),
        choiceBlock('teamCommit', 'Which area should the whole team commit to improving?', AREAS),
        choiceBlock('better', 'What would have made today even better?', ['More time for reflection', 'More games', 'Fewer games', 'Better time keeping', 'Better venue or meals', 'More involvement of leaders', 'Nothing, it was great'], { multi: true, none: 'Nothing, it was great' }),
        numBlock('nps', 'How likely are you to recommend Potential Unexplored to a friend or another organisation?', 0, 10, 'Not at all likely', 'Extremely likely')
      ]),
      step('Last step, all optional', 'You can skip this page and submit.', [
        textBlock('testimonial', 'In a sentence or two, what would you tell someone about today?'),
        choiceBlock('quote', 'May we quote what you wrote?', ['Yes, with my name and role', 'Yes, but without my name', 'No'], { optional: true }),
        textBlock('name', 'Your name and role, if you are happy to be quoted with them', { line: true })
      ])
    ];
  }
  function reportDay() {
    return '<div class="as-report"><p class="eyebrow">Thank you</p><h2 class="as-h">Your evaluation has been received</h2>' +
      '<div class="as-card good"><b>Your commitment</b><p>You chose to work first on <strong>' + esc(answers.workOn) + '</strong>. ' + esc(REPORT[answers.workOn][2][0]) + '</p></div>' +
      '<div class="as-card soft"><p>Thank you for your energy today. We hope it is the start of something good for your team. To talk to us, call or WhatsApp +256 775 495 431, or write to info@potentialunexplored.com.</p></div></div>';
  }

  /* ---------------- Programme Evaluation ---------------- */
  function buildProg() {
    mode = 'prog';
    var teamPick = [1, 2, 2, 1, 1, 1, 1, 1, 1];
    steps = [
      step('A short health check', 'A few weeks have passed since your team building day. We would love to know what has changed, and what has not. It takes about 4 minutes. First, how much do you agree? 1 Strongly disagree, 5 Strongly agree.',
        ITEMS.map(function (it, a) { return scaleBlock('T' + (a + 1), it[teamPick[a]], AGREE, a + 1); })),
      step('Me in the team', 'How often is each statement true of you now? 1 Never, 5 Always.',
        ITEMS.map(function (it, a) { return scaleBlock('M' + (a + 1), it[3], OFTEN, a + 1); })),
      step('What has changed', null, [
        choiceBlock('compare', 'Compared with before the team building day, our team is now', ['Much worse', 'A little worse', 'About the same', 'A little better', 'Much better']),
        choiceBlock('teamKept', 'Has the team kept the commitments made on the day?', ['Yes', 'Partly', 'No', 'I am not sure']),
        choiceBlock('meKept', 'Have you kept the one thing you said you would do differently?', ['Yes', 'Partly', 'No']),
        choiceBlock('changeArea', 'In which area have you noticed the clearest change?', AREAS.concat(['No change yet'])),
        choiceBlock('blocks', 'What has got in the way of the changes we agreed?', ['Workload', 'No follow-up', 'Leaders not involved', 'Old habits', 'Staff changes', 'Nothing has got in the way'], { multi: true, none: 'Nothing has got in the way' }),
        choiceBlock('support', 'What support would help the team most now?', ['Coaching for leaders', 'A follow-up session', 'Leadership training', 'Life readiness or financial literacy session', 'Other'], { multi: true })
      ]),
      step('Last step, optional', 'You can skip this page and submit.', [
        textBlock('anythingElse', 'Is there anything else you would like to tell us about the team since the day?')
      ])
    ];
  }
  function progScores() {
    var s = { team: {}, me: {} };
    ITEMS.forEach(function (it, a) { s.team[it[0]] = answers['T' + (a + 1)]; s.me[it[0]] = answers['M' + (a + 1)]; });
    s.overallTeam = avg(AREAS.map(function (a) { return s.team[a]; }));
    s.overallMe = avg(AREAS.map(function (a) { return s.me[a]; }));
    return s;
  }
  function reportProg(s) {
    return '<div class="as-report"><p class="eyebrow">Thank you</p><h2 class="as-h">Your follow-up has been received</h2><div class="as-tiles">' +
      '<div class="as-tile ' + bandClass(s.overallTeam) + '"><small>How you see the team now</small><b>' + r1(s.overallTeam) + '</b><span>' + band(s.overallTeam) + '</span></div>' +
      '<div class="as-tile ' + bandClass(s.overallMe) + '"><small>How you see yourself</small><b>' + r1(s.overallMe) + '</b><span>' + band(s.overallMe) + '</span></div></div>' +
      '<div class="as-card soft"><p>Thank you for taking the time. Your answers help us plan the right support for your team. To talk to us, call or WhatsApp +256 775 495 431, or write to info@potentialunexplored.com.</p></div></div>';
  }

  /* ---------------- submit ---------------- */
  var LABELS = {
    role: 'Role', dept: 'Department', people: 'People Led', tenure: 'Time In Team', success: 'Day Success Would Be', challenge: 'Biggest Challenge',
    guess: 'Leader Guess Out Of 10', events: 'Past Year Events', leaderSay: 'What Team Would Say', sensitive: 'Sensitive Matters',
    strength: 'Greatest Strength', holdsBack: 'Holds Team Back', growMe: 'I Want To Grow In', focus: 'Day Should Focus On', mood: 'Team Mood',
    avoid: 'Activities To Avoid', leadersKnew: 'Wish Leadership Knew', facilitator: 'For The Facilitator', name: 'Name', email: 'Email',
    best: 'Most Valuable Session', workOn: 'I Will Work On', teamCommit: 'Team Should Commit To', better: 'Could Be Better', nps: 'Recommend 0 To 10',
    testimonial: 'Testimonial', quote: 'May Quote', compare: 'Team Compared With Before', teamKept: 'Team Kept Commitments', meKept: 'I Kept My Commitment',
    changeArea: 'Clearest Change', blocks: 'What Got In The Way', support: 'Support Needed', anythingElse: 'Anything Else'
  };
  function submit() {
    var btn = root.querySelector('.as-next'); if (btn) { btn.disabled = true; btn.textContent = 'Sending, please wait...'; }
    var err0 = document.getElementById('asErr'); if (err0) err0.textContent = 'This can take up to 15 seconds. Please keep this page open.';
    var body = new URLSearchParams();
    var formName = mode === 'thc' ? (isLeader() ? 'Leader Health Check' : 'Team Health Check') : (mode === 'day' ? 'Day Evaluation' : 'Programme Evaluation');
    body.set('_form', 'assessment'); body.set('_page', location.pathname);
    body.set('Form', formName); body.set('Client Code', CLIENT); body.set('Organisation', ORG);
    var report = '', s = null;
    if (mode === 'thc' || mode === 'prog') {
      s = mode === 'thc' ? thcScores() : progScores();
      body.set('Overall Team', r1(s.overallTeam)); body.set('Overall Me', r1(s.overallMe));
      if (s.lead !== null && s.lead !== undefined) body.set('Overall Leadership', r1(s.lead));
      AREAS.forEach(function (a) { body.set('Team: ' + a, r1(s.team[a])); });
      AREAS.forEach(function (a) { body.set('Me: ' + a, r1(s.me[a])); });
    }
    if (mode === 'day') body.set('Day Average', r1(avg([1, 2, 3, 4, 5, 6, 7].map(function (i) { return answers['R' + i]; }))));
    Object.keys(LABELS).forEach(function (k) {
      if (answers[k] === undefined || answers[k] === '') return;
      body.set(LABELS[k], Array.isArray(answers[k]) ? answers[k].join('; ') : String(answers[k]));
    });
    ['R', 'T', 'M', 'L'].forEach(function (pre) { for (var i = 1; i <= 18; i++) if (answers[pre + i] !== undefined) body.set(pre + i, String(answers[pre + i])); });
    if (mode === 'thc') report = reportTHC(s); else if (mode === 'day') report = reportDay(); else report = reportProg(s);
    var done = function () { root.innerHTML = report; scrollTop(); };
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: body }).then(done, function () {
      root.innerHTML = '<div class="as-report"><div class="as-card"><b>We could not send your answers.</b><p>Please check your internet connection and press the button again.</p><p class="as-actions"><button type="button" class="btn btn-primary" id="asRetry">Try again</button></p></div></div>';
      document.getElementById('asRetry').onclick = function () { root.innerHTML = '<p class="as-sub">Sending...</p>'; fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: body }).then(done, function () { alertFail(); }); };
    });
  }
  function alertFail() { root.innerHTML = '<div class="as-report"><div class="as-card"><b>Still no connection.</b><p>Please try again a little later, or WhatsApp us on +256 775 495 431.</p></div></div>'; }

  /* ---------------- start ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    root = document.getElementById('assessRoot');
    if (!root) return;
    var kind = root.getAttribute('data-form');
    var orgLine = document.getElementById('assessOrg');
    if (orgLine && ORG) orgLine.textContent = 'For ' + ORG;
    if (kind === 'thc') buildTHC(); else if (kind === 'day') buildDay(); else buildProg();
    render();
  });
})();
