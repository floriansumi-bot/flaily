/* Flaily showcase — tiny progressive-enhancement script */
(function () {
  "use strict";

  // Current year in footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile nav toggle
  var toggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        mobileNav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Reveal-on-scroll
  var reveals = document.querySelectorAll(".reveal");
  function revealAll() { reveals.forEach(function (el) { el.classList.add("in"); }); }

  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });

    // Safety net: if the observer never fires (e.g. page never painted),
    // make sure nothing stays invisible.
    window.addEventListener("load", function () {
      setTimeout(function () {
        if (!document.querySelector(".reveal.in")) revealAll();
      }, 1200);
    });
  }

  // ---- Interactive inbox demo ----
  var DETAILS = {
    invoice: {
      from: "Swisscom", time: "08:02", subject: "Your invoice for June is ready",
      action: { cls: "act-star", label: "★ Starred · labelled Payment" },
      note: "Flaily flagged this as a bill so the due date doesn't slip past you. No reply is needed, so it doesn't draft one — it just makes sure the invoice is on your radar."
    },
    tax: {
      from: "Service des contributions", time: "07:48", subject: "Décision de taxation 2025",
      action: { cls: "act-star", label: "★ Starred · labelled Government · Tax" },
      note: "An official tax document — surfaced immediately. Flaily never replies to or acts on sensitive government mail; it only makes sure you see it fast."
    },
    lease: {
      from: "Landlord", time: "07:31", subject: "Re: Can you send the signed lease?",
      quote: "“Hi Florian, could you send over the signed lease when you get a chance? Thanks!”",
      action: { cls: "act-draft", label: "✎ Flaily drafted 3 replies — pick the one that fits" },
      replies: [
        { label: "Send it now", body: "Hi,\n\nOf course — the signed lease is attached. Let me know if you need anything else.\n\nBest,\nFlorian", attach: "lease.pdf" },
        { label: "Ask for a day", body: "Hi,\n\nSure thing — I'll dig out the signed copy and send it over by tomorrow evening at the latest.\n\nBest,\nFlorian" },
        { label: "More formal", body: "Dear Sir or Madam,\n\nPlease find the signed lease agreement attached, as requested. Do not hesitate to contact me should you require anything further.\n\nKind regards,\nFlorian", attach: "lease.pdf" }
      ],
      note: "Flaily reads what's being asked and drafts a few replies in different directions — and attaches the file when one's requested. Pick one, tweak it, send it. It never sends on its own."
    },
    meeting: {
      from: "Marie Dubois", time: "09:15", subject: "Can we move Thursday's call to Friday?",
      quote: "“Hey! Something came up Thursday — could we push our call to Friday, same time? No worries if not.”",
      action: { cls: "act-draft", label: "✎ Flaily drafted 3 replies — pick the one that fits" },
      replies: [
        { label: "Accept Friday", body: "Hi Marie,\n\nFriday at the same time works great for me — talk then!\n\nBest,\nFlorian" },
        { label: "Suggest another slot", body: "Hi Marie,\n\nFriday's a little tight for me — could we do Friday morning, or Monday instead? Happy to work around you.\n\nBest,\nFlorian" },
        { label: "Keep Thursday", body: "Hi Marie,\n\nI'd love to keep Thursday if you can still make it — but if Friday's the only option, just say the word and we'll move it.\n\nBest,\nFlorian" }
      ],
      note: "A question that needs a personal answer. Flaily prepared a few directions you might take — accept, propose another time, or hold the slot — so you just pick and send."
    },
    news: {
      from: "Newsletter", time: "06:50", subject: "10 deals you don't want to miss",
      action: { cls: "act-skip", label: "Left alone" },
      note: "Promotional — not important and nothing to do, so Flaily leaves it untouched to keep your inbox focused."
    }
  };

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  function replySubject(d) { return /^re:/i.test(d.subject) ? d.subject : "Re: " + d.subject; }

  function composeInner(d, i) {
    var r = d.replies[i];
    var h = '<div class="compose-meta"><span><b>To:</b> ' + esc(d.from) + '</span><span><b>Subject:</b> ' + esc(replySubject(d)) + '</span></div>' +
      '<div class="compose-body">' + esc(r.body) + '</div>';
    if (r.attach) h += '<div class="attach">📎 ' + esc(r.attach) + '</div>';
    return h;
  }

  function renderDetail(d) {
    var h = '<div class="detail-head">' +
      '<div class="detail-from"><span class="from">' + esc(d.from) + '</span><span class="time">' + esc(d.time) + '</span></div>' +
      '<div class="detail-subject">' + esc(d.subject) + '</div></div>';
    if (d.quote) h += '<p class="detail-quote">' + esc(d.quote) + '</p>';
    h += '<div class="detail-action ' + d.action.cls + '">' + esc(d.action.label) + '</div>';
    if (d.replies && d.replies.length) {
      h += '<div class="reply-options" role="tablist" aria-label="Suggested replies">';
      d.replies.forEach(function (r, i) {
        h += '<button type="button" class="reply-opt' + (i === 0 ? " selected" : "") +
          '" role="tab" aria-selected="' + (i === 0 ? "true" : "false") + '" data-i="' + i + '">' + esc(r.label) + '</button>';
      });
      h += '</div>';
      h += '<div class="compose">' +
        '<div class="compose-bar">✎ Draft — waiting for your approval</div>' +
        '<div id="composeInner">' + composeInner(d, 0) + '</div>' +
        '<div class="compose-note">🔒 Flaily never sends — you press send.</div>' +
        '</div>';
    }
    if (d.note) h += '<p class="detail-note">' + esc(d.note) + '</p>';
    return h;
  }

  var inbox = document.getElementById("inbox");
  if (inbox) {
    var list = document.getElementById("mailList");
    var detail = document.getElementById("mailDetail");
    var foot = document.getElementById("inboxFoot");
    var back = document.getElementById("inboxBack");
    var title = document.getElementById("inboxTitle");

    var wireReplies = function (d) {
      var opts = detail.querySelectorAll(".reply-opt");
      var inner = detail.querySelector("#composeInner");
      opts.forEach(function (btn) {
        btn.addEventListener("click", function () {
          opts.forEach(function (b) { b.classList.remove("selected"); b.setAttribute("aria-selected", "false"); });
          btn.classList.add("selected"); btn.setAttribute("aria-selected", "true");
          inner.innerHTML = composeInner(d, parseInt(btn.getAttribute("data-i"), 10));
        });
      });
    };

    var openMail = function (key) {
      var d = DETAILS[key];
      if (!d) return;
      detail.innerHTML = renderDetail(d);
      if (d.replies) wireReplies(d);
      list.hidden = true; foot.hidden = true; title.hidden = true;
      detail.hidden = false; back.hidden = false;
      detail.scrollTop = 0;
      back.focus();
    };
    var closeMail = function () {
      detail.hidden = true; back.hidden = true;
      list.hidden = false; foot.hidden = false; title.hidden = false;
    };

    list.querySelectorAll('.mail[role="button"]').forEach(function (li) {
      var key = li.getAttribute("data-mail");
      li.addEventListener("click", function () { openMail(key); });
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openMail(key); }
      });
    });
    back.addEventListener("click", closeMail);
    inbox.addEventListener("keydown", function (e) { if (e.key === "Escape" && !detail.hidden) closeMail(); });
  }

  // Register service worker (offline shell) — non-blocking, optional
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* no-op */ });
    });
  }
})();
