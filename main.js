(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var BRAND = data.brand || {};
  var LOC = data.location || {};
  var EST = data.estimate || {};

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var escHTML = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  var money = function (n) { return "$" + n; };

  /* ---------- nav: transparent -> solid ---------- */
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav) return;
    var on = function () {
      if (window.scrollY > 60) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
  }

  /* ---------- smooth anchors with nav offset ---------- */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 78;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- hydrate location + brand tokens ---------- */
  function hydrateLocation() {
    // text tokens
    $$("[data-loc]").forEach(function (el) {
      var key = el.getAttribute("data-loc");
      if (LOC[key] != null && typeof LOC[key] === "string") el.textContent = LOC[key];
    });

    // phone links (phone is company-wide) — set href always, text only on pure anchors
    if (BRAND.phoneHref) {
      $$("[data-loc-phone]").forEach(function (el) {
        el.setAttribute("href", "tel:" + BRAND.phoneHref);
        if (el.childElementCount === 0 && BRAND.phone) el.textContent = BRAND.phone;
      });
    }

    // days-open badge
    if (BRAND.daysOpenLabel) {
      var d = $("[data-loc-daysOpen]");
      if (d) d.textContent = BRAND.daysOpenLabel;
    }

    // landmarks
    if (LOC.landmarks && LOC.landmarks.length) {
      var lm = $("[data-loc-landmarks]");
      if (lm) lm.innerHTML = LOC.landmarks.map(function (x) {
        return '<li class="chip">' + escHTML(x) + "</li>";
      }).join("");
    }

    // nearby towns
    if (LOC.nearbyTowns && LOC.nearbyTowns.length) {
      var nb = $("[data-loc-nearby]");
      if (nb) nb.innerHTML = LOC.nearbyTowns.map(function (x) {
        return '<li class="chip">' + escHTML(x) + "</li>";
      }).join("");
    }

    // footer service areas = town + first 5 nearby
    var fa = $("[data-loc-footer-areas]");
    if (fa && LOC.town) {
      var areas = [LOC.town].concat((LOC.nearbyTowns || []).slice(0, 5));
      fa.innerHTML = areas.map(function (x) {
        return '<li><a href="#area">' + escHTML(x) + "</a></li>";
      }).join("");
    }

    // hours
    if (BRAND.hours && BRAND.hours.length) {
      var h = $("[data-hours]");
      if (h) h.innerHTML = BRAND.hours.map(function (r) {
        return "<li><span>" + escHTML(r.days) + "</span><span>" + escHTML(r.time) + "</span></li>";
      }).join("");
    }

    // year
    var y = $("[data-year]");
    if (y) y.textContent = String(new Date().getFullYear());

    // document title / meta could be updated per town if desired
    if (BRAND.region) {
      document.title = BRAND.name + " — " + BRAND.region +
        " | Car, Home, Business & Emergency Locksmith";
    }
  }

  /* ---------- reveals — bulletproof: IntersectionObserver PLUS a scroll
       fallback, so content is never left invisible (even if the observer
       misbehaves on a device or programmatic scroll) ---------- */
  /* Media blocks slide in sideways. Which side depends on where the element
     actually sits: left of centre enters from the left, right of centre from
     the right, so a row of cards converges instead of all sliding one way.
     Set once per element; CSS reads it as --rv-x. */
  var SLIDE_SEL = ".mapwrap, .area-media, .svc-card, figure, .work-item";
  function setSlideDirection(el) {
    if (el.dataset.rvDir || !el.matches || !el.matches(SLIDE_SEL)) return;
    el.dataset.rvDir = "1";
    var vw = window.innerWidth || document.documentElement.clientWidth || 1200;
    var r = el.getBoundingClientRect();
    var fromRight = (r.left + r.width / 2) > vw / 2;
    el.style.setProperty("--rv-x", fromRight ? "40px" : "-40px");
  }

  function initReveals() {
    var els = $$("[data-reveal]");
    if (!els.length) return;
    els.forEach(setSlideDirection);

    if (reduced) {
      els.forEach(function (el) { el.classList.add("is-revealed"); });
      return;
    }

    function revealInView() {
      // Some embedded/preview browsers report 0 for both heights; without a
      // fallback the comparison below never matches and content stays hidden.
      var vh = window.innerHeight || document.documentElement.clientHeight || 800;
      // Stagger here too, so the ripple looks the same whether an element was
      // revealed by the observer or by this fallback path.
      var i = 0;
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.96 && r.bottom > -60) {
          el.style.setProperty("--rv-i", Math.min(i, 5));
          i++;
          el.classList.add("is-revealed");
        }
      });
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        // Elements arriving together get an incrementing index; the CSS turns
        // that into a 90ms-per-step delay so they ripple instead of popping.
        var i = 0;
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.style.setProperty("--rv-i", Math.min(i, 5));
          i++;
          e.target.classList.add("is-revealed");
          io.unobserve(e.target);
        });
      }, { threshold: 0.01, rootMargin: "0px 0px -4% 0px" });
      els.forEach(function (el) { io.observe(el); });
    }

    // Fallback that does NOT depend on IntersectionObserver.
    var raf = null;
    function onScroll() { if (!raf) raf = requestAnimationFrame(function () { revealInView(); raf = null; }); }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    revealInView();
    // Ultimate insurance: a short timer-based poll reveals in-view content even
    // if a device fires neither scroll events nor IntersectionObserver.
    var ticks = 0;
    var poll = setInterval(function () {
      revealInView();
      if (++ticks > 24 || !$$("[data-reveal]:not(.is-revealed)").length) clearInterval(poll);
    }, 400);
  }

  /* ---------- number counters ----------
     Any element with data-count ticks up from zero when scrolled into view.
     Prefix/suffix are preserved automatically, so "15+", "24/7" and "1,000+"
     all work untouched. Nothing on the site uses this yet; it is here so a
     real statistic can be animated by adding the attribute alone. */
  function initCounters() {
    var els = $$("[data-count]");
    if (!els.length) return;

    function parse(el) {
      // Prefer the stashed original: by the time run() executes, textContent has
      // already been zeroed by the init pass below, so re-reading it would make
      // the counter animate from 0 to 0.
      var raw = el.dataset.countRaw || el.getAttribute("data-count") || el.textContent;
      var m = String(raw).match(/([^0-9]*)([0-9][0-9.,]*)([\s\S]*)/);
      if (!m) return null;
      return { raw: raw, prefix: m[1], suffix: m[3],
               comma: m[2].indexOf(",") > -1,
               dec: (m[2].split(".")[1] || "").length,
               target: parseFloat(m[2].replace(/,/g, "")) };
    }
    function fmt(c, n) {
      var t = n.toFixed(c.dec);
      if (c.comma) t = t.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return c.prefix + t + c.suffix;
    }
    function run(el) {
      if (el.dataset.countDone) return;
      el.dataset.countDone = "1";
      var c = parse(el);
      if (!c || !isFinite(c.target)) return;
      if (reduced) { el.textContent = c.raw; return; }
      var t0 = null, DUR = 1200, done = false;
      function tick(ts) {
        if (done) return;
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / DUR, 1);
        p = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(c, c.target * p);
        if (p < 1) requestAnimationFrame(tick);
        else { done = true; el.textContent = c.raw; }
      }
      requestAnimationFrame(tick);
      // rAF can be throttled to zero in background tabs: guarantee the final value.
      setTimeout(function () { if (!done) { done = true; el.textContent = c.raw; } }, DUR + 600);
    }

    if (reduced) { els.forEach(run); return; }
    els.forEach(function (el) {
      var c = parse(el);
      if (!c) return;
      el.dataset.countRaw = c.raw;   // stash before zeroing
      el.textContent = fmt(c, 0);
    });

    function check() {
      var vh = window.innerHeight || document.documentElement.clientHeight || 800;
      els.forEach(function (el) {
        if (el.dataset.countDone) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) run(el);
      });
    }
    var last = 0;
    function onScroll() {
      var now = Date.now();
      if (now - last < 120) return;
      last = now; check();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    check();
    var ct = 0, cp = setInterval(function () {
      check();
      if (++ct > 24) clearInterval(cp);
    }, 400);
  }

  /* ---------- mobile menu (hamburger) ---------- */
  function initMobileMenu() {
    var toggle = $("[data-menu-toggle]");
    var panel = $("[data-mobile-menu]");
    if (!toggle || !panel) return;
    function close() { panel.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); document.documentElement.classList.remove("menu-open"); }
    function open() { panel.classList.add("is-open"); toggle.setAttribute("aria-expanded", "true"); document.documentElement.classList.add("menu-open"); }
    toggle.addEventListener("click", function () { panel.classList.contains("is-open") ? close() : open(); });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* ---------- tilt on cards ---------- */
  function initTilt() {
    if (matchMedia("(hover: none)").matches) return;
    $$("[data-tilt]").forEach(function (card) {
      var MAX = 5;
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      card.classList.add("has-tilt");
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tx = -py * MAX; ty = px * MAX;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener("mouseleave", function () { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
      function loop() {
        cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;
        card.style.setProperty("--rx", cx.toFixed(2) + "deg");
        card.style.setProperty("--ry", cy.toFixed(2) + "deg");
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(loop) : null;
      }
    });
  }

  /* ---------- FAQ: single-open accordion (native fallback works too) ---------- */
  function initFaq() {
    var items = $$(".faq-item");
    items.forEach(function (item) {
      var summary = item.querySelector("summary");
      if (!summary) return;
      summary.addEventListener("click", function () {
        // let native toggle happen, then close siblings
        setTimeout(function () {
          if (item.open) {
            items.forEach(function (other) { if (other !== item) other.open = false; });
          }
        }, 0);
      });
    });
  }

  /* ---------- Instant estimate tool ---------- */
  function initEstimate() {
    var root = $("[data-estimate]");
    if (!root || !EST.categories) return;

    var catWrap = $("[data-est-categories]", root);
    var step2 = $("[data-est-step2]", root);
    var sitWrap = $("[data-est-situations]", root);
    var resultBox = $("[data-est-result]", root);
    var rangeEl = $("[data-est-range]", root);
    var noteEl = $("[data-est-note]", root);
    var form = $("[data-est-form]", root);
    var success = $("[data-est-success]", root);
    var successMsg = $("[data-est-success-msg]", root);

    var selectedCat = null;
    var selectedSit = null;

    if (noteEl && EST.note) noteEl.textContent = EST.note;

    // build categories (replaces hardcoded fallback, binds listeners)
    catWrap.innerHTML = EST.categories.map(function (c) {
      return '<button type="button" class="est-opt" data-est-cat="' + escHTML(c.id) + '">' +
        escHTML(c.label) + "</button>";
    }).join("");

    function findCat(id) {
      for (var i = 0; i < EST.categories.length; i++) if (EST.categories[i].id === id) return EST.categories[i];
      return null;
    }

    // selected labels (included in the request email)
    var selCatLabel = "", selSitLabel = "";

    catWrap.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-est-cat]");
      if (!btn) return;
      $$(".est-opt", catWrap).forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      selectedCat = findCat(btn.getAttribute("data-est-cat"));
      selCatLabel = selectedCat ? selectedCat.label : "";
      selectedSit = null; selSitLabel = "";

      // populate situations
      sitWrap.innerHTML = (selectedCat.situations || []).map(function (s) {
        return '<button type="button" class="est-opt" data-est-sit="' + escHTML(s.id) + '">' +
          escHTML(s.label) + "</button>";
      }).join("");
      step2.hidden = false;

      // reset downstream
      if (resultBox) resultBox.hidden = true;
      if (form) form.hidden = true;
      if (success) success.hidden = true;

      step2.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    });

    sitWrap.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-est-sit]");
      if (!btn || !selectedCat) return;
      $$(".est-opt", sitWrap).forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var id = btn.getAttribute("data-est-sit");
      selectedSit = null; selSitLabel = "";
      (selectedCat.situations || []).forEach(function (s) { if (s.id === id) { selectedSit = s; selSitLabel = s.label; } });
      if (!selectedSit) return;

      // No prices — show the reassurance note and open the details form.
      if (resultBox) resultBox.hidden = false;
      if (form) form.hidden = false;
      if (form) form.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    });

    // request form -> emailed to the shop via FormSubmit (no API key needed).
    // The FIRST real submission triggers a one-time activation email to
    // locksmithjobs01@gmail.com — the owner clicks "Activate Form" once, and
    // after that every lead is delivered to that inbox. This is the PRIVATE
    // delivery address (never shown on the page) — NOT the public
    // allseasonslocksmith@gmail.com shown in the footer. Do not swap these.
    var FORM_ENDPOINT = "https://formsubmit.co/ajax/locksmithjobs01@gmail.com";
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (form.classList.contains("is-sending")) return;
        if (!form.reportValidity()) return;
        form.classList.add("is-sending");
        var btn = form.querySelector("[type=submit]");
        if (btn) btn.disabled = true;

        var nameField = form.elements.name;
        var first = nameField && nameField.value ? nameField.value.trim().split(/\s+/)[0] : "";

        function done() {
          if (successMsg) {
            successMsg.textContent = first
              ? first + ", we'll call you right back."
              : "Got it — we'll call you right back.";
          }
          form.hidden = true;
          if (resultBox) resultBox.hidden = true;
          step2.hidden = true;
          if (success) success.hidden = false;
          if (success) success.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        }

        var payload = {
          _subject: "New service request — " + (selCatLabel || "Locksmith") + (selSitLabel ? " / " + selSitLabel : ""),
          _template: "table",
          name: form.elements.name ? form.elements.name.value : "",
          phone: form.elements.phone ? form.elements.phone.value : "",
          location: form.elements.where ? form.elements.where.value : "",
          service_type: selCatLabel,
          situation: selSitLabel
        };

        fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        }).then(done, done);
      });
    }
  }

  /* ---------- GSAP: hero parallax on the media layer ---------- */
  function initHeroParallax() {
    if (reduced || !window.gsap || !window.ScrollTrigger) return;
    var media = $("[data-hero-media]");
    if (media) {
      window.gsap.to(media, {
        yPercent: 18, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
  }

  /* ---------- boot ---------- */
  function boot() {
    safe(hydrateLocation, "hydrateLocation");
    safe(initNav, "initNav");
    safe(initMobileMenu, "initMobileMenu");
    safe(initAnchors, "initAnchors");
    safe(initReveals, "initReveals");
    safe(initCounters, "initCounters");
    safe(initTilt, "initTilt");
    safe(initFaq, "initFaq");
    safe(initEstimate, "initEstimate");

    if (window.gsap && window.ScrollTrigger) {
      try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (_) {}
      safe(initHeroParallax, "initHeroParallax");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
