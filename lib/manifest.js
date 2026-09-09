(function () {
  "use strict";

  /* ==========================================================================
     ALL SEASONS LOCKSMITH — BRAND + DATA (Harrisburg, PA)
     --------------------------------------------------------------------------
     MAIN SITE data. Per-town pages get their own LOCATION block (same pattern
     as the template). Company-wide rules baked in here:
       • NO prices anywhere.  • NO exact arrival times (keep timing vague).
       • In-store visits are by appointment only (stated in the footer).
       • Contact/quote forms are sent to locksmithjobs01@gmail.com.
     ========================================================================== */

  var BRAND = {
    name: "All Seasons Locksmith",
    shortName: "All Seasons",
    phone: "(223) 240-3505",
    phoneHref: "+12232403505",
    address: "1727 N 6th St STE 301, Harrisburg, PA 17102",
    baseCity: "Harrisburg",
    region: "Central Pennsylvania",
    formEmail: "allseasonslocksmith@gmail.com",
    hours: [
      { days: "Sun – Thu", time: "7:00 AM – 10:00 PM" },
      { days: "Friday", time: "7:00 AM – 6:00 PM" },
      { days: "Saturday", time: "Closed" }
    ],
    daysOpenLabel: "6 Days a Week",
    appointmentNote: "In-store visits are by appointment only.",
    trust: [
      { k: "Licensed & Insured", d: "Fully credentialed Pennsylvania locksmiths." },
      { k: "Mobile Service", d: "We come to you — home, roadside, or business." },
      { k: "Non-Destructive Entry", d: "We open locks without breaking them." },
      { k: "Upfront Quote", d: "A clear quote by phone before any work begins." }
    ]
  };

  /* ---- SERVICES (company-wide, exact list from the brief) ---------------- */
  var SERVICES = [
    {
      id: "automotive", num: "01", title: "Automotive", lead: "Back on the road, fast.",
      items: [
        "Car Key Replacement", "Car Key Duplication", "Key Fob Programming",
        "New Fob Creation", "Transponder Key Programming", "Ignition Repair",
        "Ignition Replacement"
      ]
    },
    {
      id: "residential", num: "02", title: "Residential", lead: "Your home, properly secured.",
      items: [
        "Lock Rekeying", "Lock Replacement", "Deadbolt Installation", "Lock Repair",
        "Smart Lock Installation", "Door Lock Repair", "Mailbox Lock Replacement"
      ]
    },
    {
      id: "commercial", num: "03", title: "Commercial", lead: "Keep your business moving.",
      items: [
        "Commercial Lock Installation", "Commercial Lock Repair", "Master Key Systems",
        "Panic Bar Installation", "Commercial Lock Rekeying", "Door Closer Installation",
        "Keyless Entry Systems"
      ]
    },
    {
      id: "emergency", num: "04", title: "Emergency", lead: "Here when it can't wait.",
      items: [
        "Car Lockouts", "House Lockouts", "Business Lockouts", "Lost Car Key Replacement",
        "Broken Key Extraction", "Safe Opening Service"
      ]
    }
  ];

  var REASONS = [
    { k: "We know Central PA", d: "Local technicians who know Harrisburg and the surrounding counties, and how to reach you quickly." },
    { k: "6 days a week, every day of the year", d: "No holiday gaps — whenever we're open, we're working, weekends and evenings included." },
    { k: "Upfront quote, no surprises", d: "You get a clear quote by phone before we start. No games." },
    { k: "One visit, complete job", d: "Fully stocked mobile vans mean most jobs are finished in a single trip." },
    { k: "Non-destructive entry", d: "We're trained to open locks without damaging your door, car, or hardware." },
    { k: "Auto, home & business", d: "One trusted locksmith for every lock you own — no need to call around." }
  ];

  /* ---- REQUEST TOOL (no prices — picks a category + situation, then a
         callback form). Kept under the "estimate" key so the interactive
         wizard reuses the same code, but with NO price ranges. ------------- */
  var REQUEST = {
    categories: [
      { id: "automotive", label: "Car / Automotive", situations: [
        { id: "car-lockout", label: "Locked out of my car" },
        { id: "car-key", label: "Need a car key made or replaced" },
        { id: "fob", label: "Key fob / transponder programming" },
        { id: "ignition", label: "Ignition repair or replacement" }
      ]},
      { id: "residential", label: "Home / Residential", situations: [
        { id: "house-lockout", label: "Locked out of my house" },
        { id: "rekey", label: "Rekey or replace my locks" },
        { id: "deadbolt", label: "Install a deadbolt or smart lock" },
        { id: "lock-repair", label: "Repair a broken lock" }
      ]},
      { id: "commercial", label: "Business / Commercial", situations: [
        { id: "biz-lockout", label: "Locked out of my business" },
        { id: "master-key", label: "Master key system" },
        { id: "panic-bar", label: "Panic bar or door closer" },
        { id: "access", label: "Keyless entry / access control" }
      ]},
      { id: "emergency", label: "Emergency", situations: [
        { id: "em-lockout", label: "Urgent lockout right now" },
        { id: "em-key", label: "Lost car key replacement" },
        { id: "em-safe", label: "Safe opening / broken key" }
      ]}
    ],
    note: "Tell us what's going on and we'll call you right back with a fast, upfront quote. Every job is different, so we confirm the details with you first."
  };

  /* ---- SERVICE AREAS (3 PA counties) ------------------------------------ */
  var AREAS = [
    { county: "Dauphin County, PA", note: "Home county — Harrisburg and the river towns." },
    { county: "Cumberland County, PA", note: "West Shore — Carlisle, Mechanicsburg and beyond." },
    { county: "Lebanon County, PA", note: "East into the Lebanon Valley." }
  ];

  var LOCATION = {
    town: "Central PA",
    state: "PA",
    townState: "Harrisburg, PA",
    heroKicker: "Serving Harrisburg & Central Pennsylvania",
    nearbyTowns: ["Harrisburg", "Carlisle", "Mechanicsburg", "Hershey", "Lebanon", "Camp Hill", "Middletown", "Hummelstown"]
  };

  /* ---- FAQ (no prices, no exact times, appointment-only) ----------------- */
  var FAQS = [
    { q: "What areas do you serve?",
      a: "We're based in Harrisburg and serve all of Dauphin, Cumberland, and Lebanon counties in Central Pennsylvania — including Carlisle, Mechanicsburg, Hershey, Lebanon, and the surrounding towns." },
    { q: "How fast can you get to me?",
      a: "As quickly as we can. Our technicians work locally in fully-stocked mobile vans, so we head your way right after your call — we'll give you a time estimate when we speak, based on where you are and how busy the day is." },
    { q: "Can you make car keys without going to a dealership?",
      a: "In most cases, yes. We cut and program replacement keys, transponder keys, and key fobs on-site for a wide range of makes and models — often faster than a dealership." },
    { q: "Do you install smart locks and keyless entry?",
      a: "Yes. We install and set up smart locks for homes and keyless-entry / access-control systems for businesses, and we'll help you pick the right option." },
    { q: "Should new homeowners rekey their locks?",
      a: "We recommend it. You never really know how many copies of the old keys are out there. Rekeying is quick and means only your keys open your doors from day one." },
    { q: "Can I visit your shop?",
      a: "Our Harrisburg location handles in-store visits by appointment only, so we can give you our full attention — just call ahead and we'll set a time." },
    { q: "How much does a service cost?",
      a: "Every job is a little different, so we give you a clear, upfront quote before we begin — no surprises. The fastest way to get a number is to call us and tell us what's going on." }
  ];

  window.__BRAND__ = {
    brand: BRAND,
    services: SERVICES,
    reasons: REASONS,
    estimate: REQUEST,       // reused by the request wizard (no prices)
    areas: AREAS,
    location: LOCATION,
    faqs: FAQS
  };
})();
