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
      action: { cls: "act-draft", label: "✎ Draft reply prepared" },
      compose: {
        to: "Landlord", subject: "Re: Can you send the signed lease?",
        body: "Hi,\n\nOf course — the signed lease is attached. Let me know if you need anything else.\n\nBest,\nFlorian",
        attach: "lease.pdf"
      },
      note: "Flaily wrote this draft and attached the file you were asked for. It's waiting in your Drafts — nothing sends until you review it and hit send."
    },
    news: {
      from: "Newsletter", time: "06:50", subject: "10 deals you don't want to miss",
      action: { cls: "act-skip", label: "Left alone" },
      note: "Promotional — not important and nothing to do, so Flaily leaves it untouched to keep your inbox focused."
    }
  };

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  function renderDetail(d) {
    var h = '<div class="detail-head">' +
      '<div class="detail-from"><span class="from">' + esc(d.from) + '</span><span class="time">' + esc(d.time) + '</span></div>' +
      '<div class="detail-subject">' + esc(d.subject) + '</div></div>';
    if (d.quote) h += '<p class="detail-quote">' + esc(d.quote) + '</p>';
    h += '<div class="detail-action ' + d.action.cls + '">' + esc(d.action.label) + '</div>';
    if (d.compose) {
      var c = d.compose;
      h += '<div class="compose">' +
        '<div class="compose-bar">✎ Draft — waiting for your approval</div>' +
        '<div class="compose-meta"><span><b>To:</b> ' + esc(c.to) + '</span><span><b>Subject:</b> ' + esc(c.subject) + '</span></div>' +
        '<div class="compose-body">' + esc(c.body) + '</div>' +
        '<div class="attach">📎 ' + esc(c.attach) + '</div>' +
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

    var openMail = function (key) {
      var d = DETAILS[key];
      if (!d) return;
      detail.innerHTML = renderDetail(d);
      list.hidden = true; foot.hidden = true; title.hidden = true;
      detail.hidden = false; back.hidden = false;
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
