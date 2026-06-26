/* Flaily — interactive "watch it triage" demo.
   100% client-side, canned data, no Gmail, no API. Deterministic so it always
   works. Press Run → Flaily reads a sample inbox one message at a time, decides
   what matters, drafts replies, flags a sender to block, then shows a summary.
   Open any triaged email to see the reasoning + act on it (all simulated). */
(function () {
  "use strict";

  var stage = document.getElementById("demoStage");
  if (!stage) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- sample inbox (raw / untriaged) -------------------------------------
  // decision: 'star' (surface only) | 'draft' (reply) | 'block' | 'ignore'
  var INBOX = [
    { id: "invoice", from: "Swisscom", time: "08:02", subject: "Your invoice for June is ready",
      decision: "star", icon: "★", tagCls: "money", tagLabel: "Payment",
      reason: "A bill with a due date, surfaced so it can't slip past you.",
      note: "Flaily flags bills so the due date stays on your radar. No reply is needed, so it doesn't draft one." },

    { id: "tax", from: "Service des contributions", time: "07:48", subject: "Décision de taxation 2025",
      decision: "star", icon: "★", tagCls: "gov", tagLabel: "Government · Tax", sensitive: true,
      reason: "Official tax document, surfaced immediately, never acted on.",
      note: "Sensitive government mail is surfaced fast but never replied to, forwarded, or acted on." },

    { id: "lease", from: "Landlord", time: "07:31", subject: "Re: Can you send the signed lease?",
      decision: "draft", icon: "✎", tagCls: "drafted", tagLabel: "Draft ready · lease.pdf",
      quote: "“Hi Florian, could you send over the signed lease when you get a chance? Thanks!”",
      reason: "A direct request, drafted a reply and attached the file asked for.",
      replies: [
        { label: "Send it now", body: "Hi,\n\nOf course, the signed lease is attached. Let me know if you need anything else.\n\nBest,\nFlorian", attach: "lease.pdf" },
        { label: "Ask for a day", body: "Hi,\n\nSure thing. I'll dig out the signed copy and send it over by tomorrow evening at the latest.\n\nBest,\nFlorian" },
        { label: "More formal", body: "Dear Sir or Madam,\n\nPlease find the signed lease agreement attached, as requested.\n\nKind regards,\nFlorian", attach: "lease.pdf" }
      ],
      note: "Flaily reads what's being asked, drafts a few directions, and attaches the requested file. You pick one and send." },

    { id: "security", from: "PostFinance", time: "07:12", subject: "Unusual sign-in to your account",
      decision: "star", icon: "★", tagCls: "gov", tagLabel: "Security", sensitive: true,
      reason: "A security alert, surfaced at the top so you see it at once.",
      note: "Security and bank alerts are surfaced immediately. Flaily never clicks links or acts on them; it just makes sure you notice." },

    { id: "payslip", from: "Payroll", time: "06:58", subject: "Your June payslip is available",
      decision: "star", icon: "★", tagCls: "money", tagLabel: "Payroll", sensitive: true,
      reason: "Payroll / HR, surfaced and labelled, left for you to open.",
      note: "Money, HR and payroll mail is always surfaced so it doesn't get buried." },

    { id: "meeting", from: "Marie Dubois", time: "09:15", subject: "Can we move Thursday's call to Friday?",
      decision: "draft", icon: "✎", tagCls: "appt", tagLabel: "Appointment · 3 drafts",
      quote: "“Hey! Something came up Thursday, could we push our call to Friday, same time? No worries if not.”",
      reason: "A question that needs a personal answer, drafted a few options.",
      replies: [
        { label: "Accept Friday", body: "Hi Marie,\n\nFriday at the same time works great for me. Talk then!\n\nBest,\nFlorian" },
        { label: "Suggest a slot", body: "Hi Marie,\n\nFriday's a little tight. Could we do Friday morning, or Monday instead?\n\nBest,\nFlorian" },
        { label: "Keep Thursday", body: "Hi Marie,\n\nI'd love to keep Thursday if you can, but if Friday's the only option, just say the word.\n\nBest,\nFlorian" }
      ],
      note: "A personal question. Flaily prepared a few directions: accept, propose another time, or hold the slot." },

    { id: "appointment", from: "Doctolib", time: "09:40", subject: "Reminder: appointment Tuesday 14:00",
      decision: "star", icon: "★", tagCls: "appt", tagLabel: "Appointment",
      reason: "A dated appointment, surfaced so the time doesn't get missed.",
      note: "Appointments and anything time-sensitive get surfaced so the date stays in view." },

    { id: "recruiter", from: "Léa @ Hirefield", time: "10:05", subject: "A frontend role that fits your profile",
      decision: "draft", icon: "✎", tagCls: "drafted", tagLabel: "Draft ready",
      quote: "“Hi Florian, I came across your portfolio and have a frontend role I think you'd like. Open to a quick chat this week?”",
      reason: "A real person, a real question, drafted a friendly reply.",
      replies: [
        { label: "Keen, share details", body: "Hi Léa,\n\nThanks for reaching out! I'd be happy to hear more. Could you send the role details and the company?\n\nBest,\nFlorian" },
        { label: "Politely pass", body: "Hi Léa,\n\nThanks for thinking of me! I'm not looking right now, but I'd be glad to stay in touch for the future.\n\nBest,\nFlorian" }
      ],
      note: "Outreach that deserves a human reply. Flaily drafts it; you decide whether to send." },

    { id: "news", from: "DealsWeekly", time: "06:50", subject: "🔥 10 deals you don't want to miss",
      decision: "ignore", icon: "", tagCls: "skip", tagLabel: "Left alone",
      reason: "Promotional, nothing to do, left untouched to keep the inbox calm.",
      note: "Marketing is left exactly as it is. Flaily never deletes; it just doesn't clutter your attention with it." },

    { id: "linkedin", from: "LinkedIn", time: "06:30", subject: "5 new jobs for “frontend developer”",
      decision: "ignore", icon: "", tagCls: "skip", tagLabel: "Left alone",
      reason: "Automated digest, not important, left alone.",
      note: "Routine notification digests are left untouched." },

    { id: "spam", from: "rewards-claim@win-prizes.info", time: "05:11", subject: "CONGRATULATIONS!! You WON a FREE iPhone 16 🎁",
      decision: "block", icon: "🚫", tagCls: "skip", tagLabel: "Suggested: block sender",
      quote: "“You have been selected! Click here within 24 hours to claim your FREE iPhone 16. Limited offer!!!”",
      reason: "Classic junk from a throwaway address, suggested for blocking.",
      blockable: true,
      note: "Flaily can block a noisy or scammy sender so their future mail skips your inbox, but only when you say so. It's the one outbound action it ever takes." }
  ];

  // ---- helpers ------------------------------------------------------------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function replySubject(d) { return /^re:/i.test(d.subject) ? d.subject : "Re: " + d.subject; }

  var els = {
    list: document.getElementById("dList"),
    detail: document.getElementById("dDetail"),
    ticker: document.getElementById("dTicker"),
    foot: document.getElementById("dFoot"),
    report: document.getElementById("dReport"),
    run: document.getElementById("runTriage"),
    reset: document.getElementById("resetTriage"),
    status: document.getElementById("demoStatus"),
    title: document.getElementById("dTitle"),
    back: document.getElementById("dBack")
  };

  var triaged = false;     // has a run completed?
  var blocked = {};        // ids the user chose to block

  // ---- render the raw / triaged list --------------------------------------
  function rowHTML(d) {
    var done = triaged;
    var cls = "mail";
    if (done && d.decision === "star") cls += " starred";
    if (done && d.decision === "draft") cls += " draft";
    if (done && d.decision === "ignore") cls += " muted";
    if (blocked[d.id]) cls += " blocked";
    var star = done && d.icon ? '<span class="star" aria-hidden="true">' + d.icon + '</span>' : '<span class="star ghost" aria-hidden="true">·</span>';
    var tag = done
      ? '<div class="tags"><span class="tag ' + d.tagCls + '">' + esc(blocked[d.id] ? "Blocked, won't reach you" : d.tagLabel) + '</span></div>'
      : '<div class="tags"><span class="tag raw">unread</span></div>';
    var role = done ? ' role="button" tabindex="0"' : '';
    return '<li class="' + cls + '" data-mail="' + d.id + '"' + role + ' aria-label="' + esc(d.from + ": " + d.subject) + '">' +
      star +
      '<div class="mail-body">' +
        '<div class="mail-top"><span class="from">' + esc(d.from) + '</span><span class="time">' + esc(d.time) + '</span></div>' +
        '<div class="subject">' + esc(d.subject) + '</div>' +
        tag +
      '</div>' +
      (done ? '<span class="chev" aria-hidden="true">›</span>' : '') +
    '</li>';
  }

  function renderList() {
    els.list.innerHTML = INBOX.map(rowHTML).join("");
    if (triaged) wireRows();
  }

  function counts() {
    var c = { star: 0, draft: 0, block: 0, ignore: 0 };
    INBOX.forEach(function (d) { c[d.decision]++; });
    return c;
  }

  function updateFoot() {
    var c = counts();
    if (!triaged) {
      els.foot.innerHTML = '<span>' + INBOX.length + ' unread · waiting to be triaged</span><span class="hint-click">press Run ↑</span>';
    } else {
      els.foot.innerHTML = '<span><strong>' + c.star + '</strong> surfaced · <strong>' + c.draft + '</strong> drafts · <strong>' + c.block + '</strong> to block · <strong>' + c.ignore + '</strong> left alone</span><span class="hint-click">tap an email ↑</span>';
    }
  }

  // ---- detail view --------------------------------------------------------
  function composeInner(d, i) {
    var r = d.replies[i];
    var h = '<div class="compose-meta"><span><b>To:</b> ' + esc(d.from) + '</span><span><b>Subject:</b> ' + esc(replySubject(d)) + '</span></div>' +
      '<div class="compose-body">' + esc(r.body) + '</div>';
    if (r.attach) h += '<div class="attach">📎 ' + esc(r.attach) + '</div>';
    return h;
  }

  function renderDetail(d) {
    var actLabel, actCls;
    if (d.decision === "star") { actCls = "act-star"; actLabel = "★ Starred · labelled " + d.tagLabel; }
    else if (d.decision === "draft") { actCls = "act-draft"; actLabel = "✎ Draft" + (d.replies.length > 1 ? "s" : "") + " ready. Pick the one that fits"; }
    else if (d.decision === "block") { actCls = "act-block"; actLabel = blocked[d.id] ? "🚫 Sender blocked. Future mail skips your inbox" : "🚫 Flaily suggests blocking this sender"; }
    else { actCls = "act-skip"; actLabel = "Left alone"; }

    var h = '<div class="detail-head">' +
      '<div class="detail-from"><span class="from">' + esc(d.from) + '</span><span class="time">' + esc(d.time) + '</span></div>' +
      '<div class="detail-subject">' + esc(d.subject) + '</div></div>';
    if (d.quote) h += '<p class="detail-quote">' + esc(d.quote) + '</p>';
    h += '<div class="detail-action ' + actCls + '">' + esc(actLabel) + '</div>';

    if (d.decision === "draft") {
      h += '<div class="reply-options" role="tablist" aria-label="Suggested replies">';
      d.replies.forEach(function (r, i) {
        h += '<button type="button" class="reply-opt' + (i === 0 ? " selected" : "") + '" role="tab" aria-selected="' + (i === 0 ? "true" : "false") + '" data-i="' + i + '">' + esc(r.label) + '</button>';
      });
      h += '</div>';
      h += '<div class="compose">' +
        '<div class="compose-bar">✎ Draft, waiting for your approval</div>' +
        '<div id="dComposeInner">' + composeInner(d, 0) + '</div>' +
        '<div class="compose-actions"><button type="button" class="btn primary sm" data-send="1">Approve &amp; send</button>' +
        '<span class="compose-note">🔒 Flaily never sends; you press send.</span></div>' +
        '</div>';
    }
    if (d.decision === "block") {
      h += '<div class="block-actions">' +
        (blocked[d.id]
          ? '<span class="block-done">🚫 Blocked. You won\'t see this sender again.</span>'
          : '<button type="button" class="btn primary sm" data-block="1">Block this sender</button><span class="compose-note">Only happens when you ask.</span>') +
        '</div>';
    }
    if (d.note) h += '<p class="detail-note">' + esc(d.note) + '</p>';
    return h;
  }

  function openMail(id) {
    var d = find(id);
    if (!d || !triaged) return;
    els.detail.innerHTML = renderDetail(d);
    wireDetail(d);
    els.list.hidden = true; els.foot.hidden = true; els.title.hidden = true;
    els.detail.hidden = false; els.back.hidden = false;
    els.detail.scrollTop = 0;
    els.back.focus();
  }
  function closeMail() {
    els.detail.hidden = true; els.back.hidden = true;
    els.list.hidden = false; els.foot.hidden = false; els.title.hidden = false;
  }
  function find(id) { for (var i = 0; i < INBOX.length; i++) if (INBOX[i].id === id) return INBOX[i]; return null; }

  function wireDetail(d) {
    var opts = els.detail.querySelectorAll(".reply-opt");
    var inner = els.detail.querySelector("#dComposeInner");
    opts.forEach(function (btn) {
      btn.addEventListener("click", function () {
        opts.forEach(function (b) { b.classList.remove("selected"); b.setAttribute("aria-selected", "false"); });
        btn.classList.add("selected"); btn.setAttribute("aria-selected", "true");
        inner.innerHTML = composeInner(d, parseInt(btn.getAttribute("data-i"), 10));
      });
    });
    var sendBtn = els.detail.querySelector("[data-send]");
    if (sendBtn) sendBtn.addEventListener("click", function () {
      var box = els.detail.querySelector(".compose");
      box.innerHTML = '<div class="sent-ok">✓ Sent, by you. Flaily only ever prepared the draft; the send was your call.</div>';
    });
    var blockBtn = els.detail.querySelector("[data-block]");
    if (blockBtn) blockBtn.addEventListener("click", function () {
      blocked[d.id] = true;
      els.detail.innerHTML = renderDetail(d);
      wireDetail(d);
      renderList();   // so the inbox row greys out when you go back
    });
  }

  function wireRows() {
    els.list.querySelectorAll('.mail[role="button"]').forEach(function (li) {
      var id = li.getAttribute("data-mail");
      li.addEventListener("click", function () { openMail(id); });
      li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openMail(id); } });
    });
  }

  // ---- the triage animation ----------------------------------------------
  function tick(msg, kind) {
    var line = document.createElement("div");
    line.className = "tk-line" + (kind ? " " + kind : "");
    line.innerHTML = msg;
    els.ticker.appendChild(line);
    // keep only the last few lines visible
    while (els.ticker.children.length > 4) els.ticker.removeChild(els.ticker.firstChild);
    els.ticker.scrollTop = els.ticker.scrollHeight;
  }

  var DECISION_LINE = {
    star: function (d) { return '→ <b>★ surfaced</b> · ' + esc(d.tagLabel); },
    draft: function (d) { return '→ <b>✎ drafted ' + d.replies.length + ' repl' + (d.replies.length > 1 ? "ies" : "y") + '</b>'; },
    block: function (d) { return '→ <b>🚫 flagged to block</b>'; },
    ignore: function (d) { return '→ <span class="tk-skip">left alone</span>'; }
  };

  function rowEl(id) { return els.list.querySelector('.mail[data-mail="' + id + '"]'); }

  async function runTriage() {
    if (els.run.disabled) return;
    els.run.disabled = true;
    els.run.textContent = "Flaily is reading…";
    els.report.hidden = true;
    els.ticker.hidden = false;
    els.ticker.innerHTML = "";
    els.status.textContent = "Triaging " + INBOX.length + " emails…";

    for (var i = 0; i < INBOX.length; i++) {
      var d = INBOX[i];
      var li = rowEl(d.id);
      if (li) { li.classList.add("scanning"); li.scrollIntoView({ block: "nearest" }); }
      tick('Reading <i>“' + esc(d.subject.slice(0, 38)) + (d.subject.length > 38 ? "…" : "") + '”</i>, ' + esc(d.from));
      await wait(420);
      // apply the decision to the row
      if (li) {
        li.classList.remove("scanning");
        if (d.decision === "star") li.classList.add("starred");
        else if (d.decision === "draft") li.classList.add("draft");
        else if (d.decision === "ignore") li.classList.add("muted");
        var starEl = li.querySelector(".star");
        if (starEl && d.icon) { starEl.classList.remove("ghost"); starEl.textContent = d.icon; }
        var tagEl = li.querySelector(".tag");
        if (tagEl) { tagEl.className = "tag " + d.tagCls; tagEl.textContent = d.tagLabel; }
        li.classList.add("just-done");
      }
      tick(DECISION_LINE[d.decision](d), "tk-decided");
      await wait(260);
    }

    triaged = true;
    els.ticker.hidden = true;
    renderList();              // re-render as fully-triaged + clickable
    updateFoot();
    showReport();
    els.run.hidden = true;
    els.reset.hidden = false;
    els.status.textContent = "Done. Tap any email to see what Flaily did.";
  }

  function showReport() {
    var c = counts();
    els.report.innerHTML =
      '<div class="report-head"><span class="report-spark" aria-hidden="true">✦</span> Triage complete</div>' +
      '<p class="report-body">Flaily read <b>' + INBOX.length + '</b> emails and: ' +
        '<span class="rp star">★ surfaced ' + c.star + '</span> that matter, ' +
        '<span class="rp draft">✎ drafted ' + c.draft + '</span> replies, ' +
        '<span class="rp block">🚫 flagged ' + c.block + '</span> to block, and ' +
        '<span class="rp skip">left ' + c.ignore + ' alone</span>. ' +
        '<b>Nothing was sent or deleted.</b> Every action is yours to approve.</p>';
    els.report.hidden = false;
    if (!reduce) els.report.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function reset() {
    triaged = false; blocked = {};
    closeMail();
    renderList();
    updateFoot();
    els.report.hidden = true;
    els.ticker.hidden = true;
    els.reset.hidden = true;
    els.run.hidden = false;
    els.run.disabled = false;
    els.run.textContent = "▶ Run Flaily triage";
    els.status.textContent = INBOX.length + " unread · not triaged yet";
  }

  // ---- init ---------------------------------------------------------------
  renderList();
  updateFoot();
  els.status.textContent = INBOX.length + " unread · not triaged yet";
  els.run.addEventListener("click", runTriage);
  els.reset.addEventListener("click", reset);
  els.back.addEventListener("click", closeMail);
  stage.addEventListener("keydown", function (e) { if (e.key === "Escape" && !els.detail.hidden) closeMail(); });
})();
