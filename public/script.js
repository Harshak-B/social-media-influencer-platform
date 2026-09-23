(function () {
"use strict";

/* ====================== storage ====================== */
var KEY = "beam.db.v1";
var db = null;
var ui = { view: "overview", campaignId: null, influencerId: null, filters: {}, auth: null };

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { /* storage may be unavailable; app still works in-memory */ }
}
function load() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) return parsed;
    }
  } catch (e) {}
  return null;
}
function uid(p) { return p + "_" + Math.random().toString(36).slice(2, 9); }
function now() { return Date.now(); }

/* ====================== seed ====================== */
var CATEGORIES = ["Gaming", "Skincare", "Food", "Fitness", "Tech", "Fashion", "Travel", "Outdoors", "Finance", "Home & DIY"];
var PLATFORMS = ["Instagram", "YouTube", "X", "LinkedIn"];
var CITIES = ["Hyderabad", "Bengaluru", "Mumbai", "Delhi", "Pune", "Chennai", "Kolkata", "Remote"];
var SWATCH = ["#FFC245", "#FF4F70", "#8CE0C6", "#2C1D3A", "#E63E5C", "#7FB2E5", "#C9A6F2", "#F2A65A"];

function seed() {
  var d = {
    version: 1,
    users: [], brands: [], influencers: [], campaigns: [], applications: [], notifications: [],
    session: null
  };

  var brandSeed = [
    ["Solstice Skincare", "Skincare", "Mumbai"],
    ["Northloop Coffee", "Food", "Bengaluru"],
    ["Pixel Forge", "Gaming", "Hyderabad"]
  ];
  brandSeed.forEach(function (b, i) {
    var id = "brand_" + (i + 1);
    d.brands.push({ id: id, name: b[0], industry: b[1], location: b[2], color: SWATCH[i], about: b[0] + " works with creators who actually use the product." });
    d.users.push({ id: "user_b" + (i + 1), name: b[0] + " team", email: ["dana@solstice.co", "ravi@northloop.co", "meera@pixelforge.gg"][i], password: "demo1234", role: "brand", refId: id });
  });

  var infSeed = [
    ["@harshak.plays", "Harshak", "Gaming", ["YouTube", "Instagram"], 85000, 6.2, "Chennai", 30000, "Tamil/English gaming reviews, long-form setups and rig builds."],
    ["@lunaskies", "Luna Shah", "Skincare", ["Instagram"], 212000, 6.4, "Mumbai", 60000, "Routines for oily, acne-prone skin. Nothing sponsored that I don't refill."],
    ["@theroastedhour", "Arjun Nair", "Food", ["YouTube", "Instagram"], 88000, 9.1, "Bengaluru", 35000, "Home brewing, cafe crawls, and very strong opinions about milk."],
    ["@fieldnotes.jay", "Jay Menon", "Outdoors", ["YouTube"], 340000, 5.2, "Pune", 90000, "Trail gear tested over 40km before I say a word about it."],
    ["@marnie.makes", "Marnie D'Souza", "Home & DIY", ["Instagram", "YouTube"], 54000, 7.8, "Chennai", 22000, "Rental-friendly makeovers under ₹5,000."],
    ["@code.with.tara", "Tara Iyer", "Tech", ["YouTube", "LinkedIn"], 160000, 4.6, "Bengaluru", 55000, "Dev tooling teardowns and interview prep."],
    ["@liftswithneel", "Neel Kapoor", "Fitness", ["Instagram"], 121000, 5.9, "Delhi", 40000, "Strength programming for people with desk jobs."],
    ["@rupeerani", "Sana Qureshi", "Finance", ["Instagram", "X"], 96000, 7.1, "Mumbai", 45000, "Personal finance in plain Hindi. No 'get rich' nonsense."],
    ["@thriftandthread", "Ishita Bose", "Fashion", ["Instagram"], 47000, 8.4, "Kolkata", 18000, "Thrifted fits, tailoring tricks, slow fashion."],
    ["@onewaytickets", "Vikram Rao", "Travel", ["YouTube", "Instagram"], 265000, 4.1, "Remote", 75000, "Budget itineraries across South and Southeast Asia."],
    ["@frag.nights", "Dev Sharma", "Gaming", ["Instagram", "X"], 46000, 8.9, "Pune", 16000, "Competitive FPS clips and peripheral reviews."],
    ["@glowbyrhea", "Rhea Thomas", "Skincare", ["Instagram", "YouTube"], 64000, 7.4, "Hyderabad", 25000, "Derm-checked routines for Indian summers."],
    ["@buildbytes", "Karan Malhotra", "Tech", ["YouTube"], 410000, 3.8, "Delhi", 120000, "PC builds, benchmarks, and thermals nobody else measures."],
    ["@souppotdiaries", "Aisha Khan", "Food", ["Instagram"], 33000, 10.2, "Hyderabad", 12000, "One-pot recipes for tiny kitchens."]
  ];
  infSeed.forEach(function (x, i) {
    var id = "inf_" + (i + 1);
    d.influencers.push({
      id: id, handle: x[0], name: x[1], category: x[2], platforms: x[3], followers: x[4],
      engagement: x[5], location: x[6], rate: x[7], bio: x[8], color: SWATCH[i % SWATCH.length], completed: 0
    });
  });
  d.users.push({ id: "user_i1", name: "Harshak Reddy", email: "harshak@beam.co", password: "demo1234", role: "influencer", refId: "inf_1" });
  d.users.push({ id: "user_i2", name: "Luna Shah", email: "luna@beam.co", password: "demo1234", role: "influencer", refId: "inf_2" });

  var campSeed = [
    ["brand_3", "Gaming laptop launch — Forge X16", "Gaming", "Instagram", 50000, 5, 50000, "Hyderabad", "One reel plus three stories. Show real gameplay on the machine, thermals included. Keep it unscripted.", ["1 reel (45–60s)", "3 stories", "Usage rights 30 days"]],
    ["brand_1", "Monsoon barrier serum", "Skincare", "Instagram", 40000, 6, 45000, "Mumbai", "A two-week before/after on humid-weather breakouts. We want honesty over hype.", ["2 posts", "1 reel", "Before/after carousel"]],
    ["brand_2", "Single-origin subscription push", "Food", "YouTube", 60000, 5, 60000, "Bengaluru", "A brew-along video using our Feb roast. Your method, your kitchen.", ["1 long-form video", "2 community posts"]],
    ["brand_3", "Peripherals restock — Forge Deck", "Gaming", "YouTube", 30000, 7, 25000, "Remote", "Short review of the keyboard, sound test included. Budget is firm.", ["1 video (8–12 min)", "1 short"]],
    ["brand_1", "Derm-checked summer routine", "Skincare", "YouTube", 50000, 4, 70000, "Remote", "Long-form routine breakdown with a dermatologist cameo. We cover the consult.", ["1 long-form video", "1 reel cutdown"]],
    ["brand_2", "Cafe opening — Indiranagar", "Food", "Instagram", 25000, 7, 20000, "Bengaluru", "Opening week coverage. Come hungry, bring a friend.", ["1 reel", "4 stories"]]
  ];
  campSeed.forEach(function (c, i) {
    d.campaigns.push({
      id: "camp_" + (i + 1), brandId: c[0], title: c[1], category: c[2], platform: c[3],
      minFollowers: c[4], minEngagement: c[5], budget: c[6], location: c[7], brief: c[8],
      deliverables: c[9], status: "open", createdAt: now() - (i + 1) * 86400000 * 3
    });
  });

  var appSeed = [
    ["camp_1", "inf_11", "applied", "I run Telugu FPS content and my audience buys mid-range rigs. Happy to do a thermals segment."],
    ["camp_1", "inf_1", "review", "I've built three rigs on camera this year. Can deliver in 10 days."],
    ["camp_2", "inf_12", "accepted", "Humid-weather skin is literally my whole feed. Two-week test works."],
    ["camp_3", "inf_3", "progress", "Brew-along is my format. Shooting this weekend."],
    ["camp_5", "inf_2", "completed", "Done — routine video went out with a derm cameo."],
    ["camp_6", "inf_14", "rejected", "Small but very local audience, opening week suits me."]
  ];
  appSeed.forEach(function (a, i) {
    var camp = d.campaigns.filter(function (c) { return c.id === a[0]; })[0];
    var inf = d.influencers.filter(function (f) { return f.id === a[1]; })[0];
    d.applications.push({
      id: "app_" + (i + 1), campaignId: a[0], influencerId: a[1], status: a[2], pitch: a[3],
      score: matchScore(inf, camp).total, createdAt: now() - (i + 1) * 86400000,
      history: [{ status: "applied", at: now() - (i + 1) * 86400000 }, { status: a[2], at: now() - i * 3600000 }]
    });
  });
  d.influencers[1].completed = 1;
  return d;
}

/* ====================== matching algorithm ====================== */
/* Weights: category 30, platform 20, followers 20, engagement 20, budget 10 */
function matchScore(inf, camp) {
  if (!inf || !camp) return { total: 0, parts: [] };
  var parts = [];

  var cat = camp.category === "Any" || inf.category === camp.category ? 30 : 0;
  parts.push({ label: "Category fit", got: cat, max: 30, note: cat ? inf.category : inf.category + " vs " + camp.category });

  var plat = inf.platforms.indexOf(camp.platform) > -1 ? 20 : 0;
  parts.push({ label: "Platform", got: plat, max: 20, note: plat ? "Active on " + camp.platform : "Not on " + camp.platform });

  var fRatio = camp.minFollowers > 0 ? inf.followers / camp.minFollowers : 1;
  var fol = Math.round(Math.max(0, Math.min(1, fRatio)) * 20);
  parts.push({ label: "Reach", got: fol, max: 20, note: fmt(inf.followers) + " of " + fmt(camp.minFollowers) + " needed" });

  var eRatio = camp.minEngagement > 0 ? inf.engagement / camp.minEngagement : 1;
  var eng = Math.round(Math.max(0, Math.min(1, eRatio)) * 20);
  parts.push({ label: "Engagement", got: eng, max: 20, note: inf.engagement + "% of " + camp.minEngagement + "% needed" });

  var bRatio = inf.rate > 0 ? camp.budget / inf.rate : 1;
  var bud = Math.round(Math.max(0, Math.min(1, bRatio)) * 10);
  parts.push({ label: "Budget fit", got: bud, max: 10, note: bud === 10 ? "Rate " + money(inf.rate) + " fits budget" : "Asks " + money(inf.rate) + ", budget " + money(camp.budget) });

  var total = parts.reduce(function (s, p) { return s + p.got; }, 0);
  return { total: total, parts: parts };
}

/* ====================== helpers ====================== */
function fmt(n) {
  n = Number(n) || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "K";
  return String(n);
}
function money(n) { return "₹" + (Number(n) || 0).toLocaleString("en-IN"); }
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function ago(ts) {
  var m = Math.floor((now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  var h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}
function byId(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
function scoreColor(t) {
  if (t >= 85) return "var(--mint)";
  if (t >= 65) return "var(--gold)";
  if (t >= 40) return "rgba(255,79,112,0.35)";
  return "var(--surface-3)";
}

var STAGES = ["applied", "review", "accepted", "progress", "completed"];
var STAGE_LABEL = { applied: "Applied", review: "Under review", accepted: "Accepted", progress: "In progress", completed: "Completed", rejected: "Rejected" };

function toast(text, kind) {
  var wrap = document.getElementById("toasts");
  var el = document.createElement("div");
  el.className = "toast " + (kind || "");
  el.textContent = text;
  wrap.appendChild(el);
  setTimeout(function () { el.remove(); }, 3600);
}

function notify(userId, text) {
  db.notifications.unshift({ id: uid("n"), userId: userId, text: text, read: false, at: now() });
}
function userForInfluencer(infId) {
  for (var i = 0; i < db.users.length; i++) if (db.users[i].role === "influencer" && db.users[i].refId === infId) return db.users[i];
  return null;
}
function userForBrand(brandId) {
  for (var i = 0; i < db.users.length; i++) if (db.users[i].role === "brand" && db.users[i].refId === brandId) return db.users[i];
  return null;
}
function me() { return db.session ? byId(db.users, db.session) : null; }
function myBrand() { var u = me(); return u && u.role === "brand" ? byId(db.brands, u.refId) : null; }
function myInf() { var u = me(); return u && u.role === "influencer" ? byId(db.influencers, u.refId) : null; }
function unread() {
  var u = me(); if (!u) return 0;
  return db.notifications.filter(function (n) { return n.userId === u.id && !n.read; }).length;
}

/* ====================== small view pieces ====================== */
function avatarHTML(name, color, size) {
  var s = size || 34;
  return '<span class="avatar" style="background:' + color + ';width:' + s + 'px;height:' + s + 'px;font-size:' + (s / 2.6).toFixed(0) + 'px">' + esc((name || "?").replace("@", "").charAt(0).toUpperCase()) + "</span>";
}
function scoreHTML(total) {
  var dark = total >= 40;
  var fg = dark ? "#1F1329" : "var(--text)";
  var sub = dark ? "rgba(31,19,41,0.6)" : "var(--text-faint)";
  return '<div class="score" style="background:' + scoreColor(total) + ";color:" + fg + '"><span>' + total +
    '</span><small style="color:' + sub + '">match</small></div>';
}
function breakdownHTML(parts) {
  return '<div class="breakdown">' + parts.map(function (p) {
    return "<div><span>" + esc(p.label) + ' <span class="tiny">' + esc(p.note) + '</span></span>' +
      '<span class="bar"><i style="width:' + Math.round((p.got / p.max) * 100) + '%"></i></span>' +
      '<span class="tiny" style="text-align:right">' + p.got + "/" + p.max + "</span></div>";
  }).join("") + "</div>";
}
function timelineHTML(app) {
  if (app.status === "rejected") {
    return '<div class="timeline"><i class="done">Applied</i><i class="dead">Rejected</i></div>';
  }
  var idx = STAGES.indexOf(app.status);
  return '<div class="timeline">' + STAGES.map(function (s, i) {
    var cls = i < idx ? "done" : i === idx ? "now" : "";
    return '<i class="' + cls + '">' + STAGE_LABEL[s] + "</i>";
  }).join("") + "</div>";
}
function statusChip(status) {
  var map = { applied: "chip-plum", review: "chip-gold", accepted: "chip-mint", progress: "chip-gold", completed: "chip-mint", rejected: "chip-coral" };
  return '<span class="chip ' + map[status] + '">' + STAGE_LABEL[status] + "</span>";
}
function selectHTML(id, label, options, value, allLabel) {
  var opts = (allLabel ? '<option value="">' + esc(allLabel) + "</option>" : "") + options.map(function (o) {
    return '<option value="' + esc(o) + '"' + (String(value) === String(o) ? " selected" : "") + ">" + esc(o) + "</option>";
  }).join("");
  return '<label class="field" style="margin:0"><span>' + esc(label) + '</span><select id="' + id + '" data-act="filter">' + opts + "</select></label>";
}

/* ====================== auth ====================== */
function renderAuth() {
  var box = document.getElementById("auth");
  if (!ui.auth) { box.className = "hidden"; box.innerHTML = ""; return; }
  var mode = ui.auth.mode;
  var role = ui.auth.role || "influencer";
  box.className = "auth-wrap";
  box.innerHTML =
    '<div class="auth-card" role="dialog" aria-modal="true">' +
      '<div class="row-between"><h2>' + (mode === "login" ? "Log in" : "Create your account") + '</h2>' +
      '<button class="btn-ghost" data-act="close-auth" aria-label="Close">✕</button></div>' +
      (mode === "signup" ? '<div class="seg" style="margin-bottom:1rem">' +
        '<button data-act="auth-role" data-role="influencer" class="' + (role === "influencer" ? "on" : "") + '">I\'m a creator</button>' +
        '<button data-act="auth-role" data-role="brand" class="' + (role === "brand" ? "on" : "") + '">I\'m a brand</button></div>' : "") +
      '<form id="auth-form">' +
        (mode === "signup" ? '<label class="field"><span>' + (role === "brand" ? "Brand name" : "Your name") + '</span><input type="text" id="a-name" required></label>' : "") +
        '<label class="field"><span>Email</span><input type="email" id="a-email" required autocomplete="username"></label>' +
        '<label class="field"><span>Password</span><input type="password" id="a-pass" required autocomplete="' + (mode === "login" ? "current-password" : "new-password") + '"></label>' +
        '<p class="err" id="a-err"></p>' +
        '<button class="btn btn-coral" style="width:100%" type="submit">' + (mode === "login" ? "Log in" : "Create account") + "</button>" +
      "</form>" +
      '<p class="tiny" style="margin:0.9rem 0 0">' + (mode === "login" ? "New here? " : "Already on Beam? ") +
        '<button class="link-btn" style="font-size:0.78rem" data-act="auth-switch">' + (mode === "login" ? "Create an account" : "Log in") + "</button></p>" +
      '<div class="demo-row"><p class="tiny" style="margin:0.6rem 0 0">Or open a demo account with data already on it:</p>' +
        '<button data-act="demo" data-email="meera@pixelforge.gg"><strong>Pixel Forge</strong> — brand with two live campaigns</button>' +
        '<button data-act="demo" data-email="harshak@beam.co"><strong>@harshak.plays</strong> — gaming creator, Hyderabad</button>' +
      "</div>" +
      '<p class="tiny" style="margin-top:0.8rem">Demo only: accounts are stored in this browser, not on a server.</p>' +
    "</div>";
  var f = box.querySelector("#a-name") || box.querySelector("#a-email");
  if (f) f.focus();
}

/* ====================== shell ====================== */
function navItems() {
  var u = me();
  if (u.role === "brand") {
    return [["overview", "Overview"], ["campaigns", "Campaigns"], ["applications", "Applications"], ["discover", "Find creators"], ["notifications", "Notifications"], ["profile", "Brand profile"]];
  }
  return [["overview", "Overview"], ["board", "Find campaigns"], ["applications", "My applications"], ["notifications", "Notifications"], ["profile", "My profile"]];
}
function render() {
  var app = document.getElementById("app");
  var landing = document.getElementById("landing");
  renderAuth();
  if (!db.session) { landing.className = ""; app.className = "hidden"; app.innerHTML = ""; return; }
  landing.className = "hidden";
  app.className = "app";

  var u = me();
  var who = u.role === "brand" ? myBrand() : myInf();
  var items = navItems();
  var n = unread();

  var links = items.map(function (it) {
    var badge = it[0] === "notifications" && n ? '<span class="dot-badge">' + n + "</span>" : "";
    return '<button class="side-link ' + (ui.view === it[0] ? "active" : "") + '" data-act="nav" data-view="' + it[0] + '">' + it[1] + badge + "</button>";
  }).join("");

  app.innerHTML =
    '<aside class="side">' +
      '<span class="logo">Beam<span class="dot">.</span></span>' + links +
      '<div class="side-foot"><div class="who">' + avatarHTML(who.handle || who.name, who.color, 36) +
        "<div><strong>" + esc(who.handle || who.name) + '</strong><small>' + (u.role === "brand" ? "Brand" : "Creator") + "</small></div></div>" +
        '<div class="spread"><button class="btn-ghost" data-act="theme">Theme</button><button class="btn-ghost" data-act="logout">Log out</button><button class="btn-ghost" data-act="reset">Reset demo</button></div>' +
      "</div>" +
    "</aside>" +
    '<div><div class="mobile-bar"><span class="logo">Beam<span class="dot">.</span></span>' +
      '<div class="spread"><button class="btn-ghost" data-act="theme">Theme</button><button class="btn-ghost" data-act="logout">Log out</button></div></div>' +
      '<div class="m-tabs">' + links + "</div>" +
      '<main class="main" id="main"></main></div>';

  document.getElementById("main").innerHTML = viewHTML();
  window.scrollTo({ top: 0, behavior: "auto" });
}
function repaint() {
  var main = document.getElementById("main");
  if (!main) return render();
  var active = document.activeElement;
  var id = active && active.id, ss = active && active.selectionStart;
  main.innerHTML = viewHTML();
  if (id) {
    var el = document.getElementById(id);
    if (el) { el.focus(); try { if (ss != null) el.setSelectionRange(ss, ss); } catch (e) {} }
  }
}
function viewHTML() {
  var u = me();
  switch (ui.view) {
    case "campaign": return campaignDetail();
    case "creator": return creatorDetail();
    case "notifications": return notificationsView();
    case "profile": return u.role === "brand" ? brandProfile() : creatorProfile();
    case "applications": return u.role === "brand" ? brandApplications() : creatorApplications();
    case "campaigns": return brandCampaigns();
    case "discover": return discoverView();
    case "board": return boardView();
    default: return u.role === "brand" ? brandOverview() : creatorOverview();
  }
}
function head(title, sub, right) {
  return '<div class="page-head"><div><h1>' + esc(title) + "</h1>" + (sub ? "<p>" + esc(sub) + "</p>" : "") + "</div>" + (right || "") + "</div>";
}

/* ====================== brand views ====================== */
function brandCampaignList() {
  var b = myBrand();
  return db.campaigns.filter(function (c) { return c.brandId === b.id; });
}
function appsFor(campId) {
  return db.applications.filter(function (a) { return a.campaignId === campId; });
}
function brandOverview() {
  var b = myBrand();
  var camps = brandCampaignList();
  var apps = db.applications.filter(function (a) { return camps.some(function (c) { return c.id === a.campaignId; }); });
  var accepted = apps.filter(function (a) { return ["accepted", "progress", "completed"].indexOf(a.status) > -1; });
  var done = camps.filter(function (c) { return c.status === "closed"; });

  var perf = camps.slice(0, 5).map(function (c) {
    var ca = appsFor(c.id);
    var pct = ca.length ? Math.round(ca.reduce(function (s, a) { return s + a.score; }, 0) / ca.length) : 0;
    return '<div style="margin-bottom:0.9rem"><div class="row-between" style="margin-bottom:0.3rem"><span style="font-size:0.88rem;font-weight:600">' + esc(c.title) + '</span><span class="tiny">' + ca.length + " applicant" + (ca.length === 1 ? "" : "s") + " · avg " + pct + '%</span></div><span class="bar gold"><i style="width:' + pct + '%"></i></span></div>';
  }).join("") || '<p class="muted">No campaigns yet.</p>';

  return head("Hi, " + b.name, "Here's what the board looks like for you today.",
      '<button class="btn btn-coral" data-act="nav" data-view="campaigns">New campaign</button>') +
    '<div class="stat-grid">' +
      '<div class="stat"><b>' + camps.filter(function (c) { return c.status === "open"; }).length + "</b><span>Open campaigns</span></div>" +
      '<div class="stat"><b>' + apps.length + "</b><span>Applications</span></div>" +
      '<div class="stat accent"><b>' + accepted.length + "</b><span>Creators booked</span></div>" +
      '<div class="stat"><b>' + done.length + "</b><span>Closed campaigns</span></div>" +
    "</div>" +
    '<div class="grid-2">' +
      '<div class="card"><h3 style="font-size:1.1rem">Applicant quality by campaign</h3><p class="tiny" style="margin-bottom:1rem">Average match score of everyone who applied.</p>' + perf + "</div>" +
      '<div class="card"><h3 style="font-size:1.1rem">Needs your call</h3>' + pendingList(apps) + "</div>" +
    "</div>";
}
function pendingList(apps) {
  var pend = apps.filter(function (a) { return a.status === "applied" || a.status === "review"; })
    .sort(function (x, y) { return y.score - x.score; }).slice(0, 5);
  if (!pend.length) return '<p class="muted">Nothing waiting. Every application has an answer.</p>';
  return '<div class="list">' + pend.map(function (a) {
    var inf = byId(db.influencers, a.influencerId);
    var c = byId(db.campaigns, a.campaignId);
    return '<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:0.7rem">' +
      '<div class="row" style="gap:0.6rem">' + avatarHTML(inf.handle, inf.color, 32) +
      "<div><strong style=\"font-size:0.9rem\">" + esc(inf.handle) + '</strong><div class="tiny">' + esc(c.title) + "</div></div></div>" +
      '<div class="row" style="gap:0.5rem"><span class="chip chip-gold">' + a.score + '%</span><button class="btn btn-outline btn-sm" data-act="open-campaign" data-id="' + c.id + '">Review</button></div></div>';
  }).join("") + "</div>";
}

function brandCampaigns() {
  var camps = brandCampaignList();
  var f = ui.filters;
  var form =
    '<div class="card" style="margin-bottom:1.6rem"><h3 style="font-size:1.15rem">Post a campaign</h3>' +
    '<p class="tiny" style="margin-bottom:1rem">Beam scores every creator against these numbers, so be honest about the budget.</p>' +
    '<form id="camp-form"><div class="form-grid">' +
      '<label class="field"><span>Campaign title</span><input type="text" id="c-title" required placeholder="Gaming laptop launch"></label>' +
      '<label class="field"><span>Category</span><select id="c-cat">' + CATEGORIES.map(function (c) { return '<option>' + c + "</option>"; }).join("") + "</select></label>" +
      '<label class="field"><span>Platform</span><select id="c-plat">' + PLATFORMS.map(function (p) { return "<option>" + p + "</option>"; }).join("") + "</select></label>" +
      '<label class="field"><span>Location</span><select id="c-loc">' + CITIES.map(function (c) { return "<option>" + c + "</option>"; }).join("") + "</select></label>" +
      '<label class="field"><span>Minimum followers</span><input type="number" id="c-fol" min="0" step="1000" value="50000" required></label>' +
      '<label class="field"><span>Minimum engagement (%)</span><input type="number" id="c-eng" min="0" max="100" step="0.1" value="5" required></label>' +
      '<label class="field"><span>Budget (₹)</span><input type="number" id="c-bud" min="0" step="1000" value="50000" required></label>' +
      '<label class="field"><span>Deliverables (comma separated)</span><input type="text" id="c-del" placeholder="1 reel, 3 stories"></label>' +
    "</div>" +
    '<label class="field"><span>Brief</span><textarea id="c-brief" placeholder="What should the creator actually make?"></textarea></label>' +
    '<p class="err" id="c-err"></p><button class="btn btn-coral" type="submit">Post campaign</button></form></div>';

  var list = camps.length ? camps.map(function (c) {
    var ca = appsFor(c.id);
    var pending = ca.filter(function (a) { return a.status === "applied" || a.status === "review"; }).length;
    return '<div class="card"><div class="row-between">' +
      "<div><h3 style=\"font-size:1.15rem;margin-bottom:0.2rem\">" + esc(c.title) + "</h3>" +
      '<div class="spread" style="margin:0.5rem 0"><span class="chip chip-coral">' + esc(c.category) + '</span><span class="chip">' + esc(c.platform) + '</span><span class="chip">' + fmt(c.minFollowers) + '+ followers</span><span class="chip">' + c.minEngagement + '%+ eng.</span><span class="chip chip-gold">' + money(c.budget) + "</span></div>" +
      '<p class="muted" style="margin:0">' + ca.length + " applicant" + (ca.length === 1 ? "" : "s") + (pending ? " · " + pending + " waiting on you" : "") + " · posted " + ago(c.createdAt) + "</p></div>" +
      '<div class="spread"><span class="chip ' + (c.status === "open" ? "chip-mint" : "chip-plum") + '">' + (c.status === "open" ? "Open" : "Closed") + "</span>" +
      '<button class="btn btn-outline btn-sm" data-act="open-campaign" data-id="' + c.id + '">Open board</button></div></div></div>';
  }).join("") : '<div class="empty"><h3>No campaigns yet</h3><p class="muted">Post one above and Beam will rank every creator on the board against it within a second.</p></div>';

  return head("Campaigns", "Every brief you've posted, and who's waiting on an answer.") + form + '<div class="list">' + list + "</div>";
}

function campaignDetail() {
  var c = byId(db.campaigns, ui.campaignId);
  if (!c) return '<div class="empty"><h3>Campaign not found</h3></div>';
  var brand = byId(db.brands, c.brandId);
  var u = me();
  var isOwner = u.role === "brand" && u.refId === c.brandId;

  var facts = '<div class="spread" style="margin-bottom:1rem">' +
    '<span class="chip chip-coral">' + esc(c.category) + '</span><span class="chip">' + esc(c.platform) + '</span>' +
    '<span class="chip">' + fmt(c.minFollowers) + '+ followers</span><span class="chip">' + c.minEngagement + '%+ engagement</span>' +
    '<span class="chip chip-gold">' + money(c.budget) + '</span><span class="chip">' + esc(c.location) + "</span></div>";
  var brief = '<div class="card" style="margin-bottom:1.4rem"><div class="row" style="gap:0.7rem;margin-bottom:0.8rem">' + avatarHTML(brand.name, brand.color, 40) +
    "<div><strong>" + esc(brand.name) + '</strong><div class="tiny">' + esc(brand.industry) + " · " + esc(brand.location) + "</div></div></div>" +
    facts + "<p>" + esc(c.brief) + "</p>" +
    '<p class="tiny" style="margin:0">Deliverables: ' + c.deliverables.map(esc).join(" · ") + "</p></div>";

  var back = '<button class="btn btn-outline btn-sm" data-act="nav" data-view="' + (isOwner ? "campaigns" : "board") + '">← Back</button>';

  if (!isOwner) {
    var inf = myInf();
    var m = matchScore(inf, c);
    var mine = db.applications.filter(function (a) { return a.campaignId === c.id && a.influencerId === inf.id; })[0];
    var applyBox = mine
      ? '<div class="card"><h3 style="font-size:1.1rem">Your application</h3>' + statusChip(mine.status) + timelineHTML(mine) + '<p class="muted" style="margin-top:0.8rem">' + esc(mine.pitch) + "</p></div>"
      : '<div class="card"><h3 style="font-size:1.1rem">Pitch for this</h3>' +
        '<form id="apply-form"><label class="field"><span>Why you, in a couple of lines</span><textarea id="p-pitch" placeholder="What you\'d make, and why your audience is the right one."></textarea></label>' +
        '<p class="err" id="p-err"></p><button class="btn btn-coral" type="submit">Send application</button></form></div>';
    return head(c.title, "Posted by " + brand.name + " · " + ago(c.createdAt), back) + brief +
      '<div class="grid-2"><div class="card"><div class="row" style="gap:1rem">' + scoreHTML(m.total) +
      '<div><h3 style="font-size:1.05rem;margin:0">How you score on this brief</h3><p class="tiny" style="margin:0">Same maths the brand sees.</p></div></div>' +
      breakdownHTML(m.parts) + "</div>" + applyBox + "</div>";
  }

  /* brand side: ranked matches + applications */
  var applied = appsFor(c.id);
  var appliedIds = applied.map(function (a) { return a.influencerId; });
  var ranked = db.influencers.map(function (i) { return { inf: i, m: matchScore(i, c) }; })
    .sort(function (a, b) { return b.m.total - a.m.total; }).slice(0, 8);

  var appsHTML = applied.length ? applied.sort(function (a, b) { return b.score - a.score; }).map(function (a) {
    var inf = byId(db.influencers, a.influencerId);
    var m = matchScore(inf, c);
    return '<div class="card"><div class="row-between"><div class="row" style="gap:0.8rem">' + scoreHTML(a.score) +
      "<div><strong>" + esc(inf.handle) + '</strong><div class="tiny">' + esc(inf.name) + " · " + fmt(inf.followers) + " followers · " + inf.engagement + "% · " + esc(inf.location) + "</div>" +
      '<div style="margin-top:0.4rem">' + statusChip(a.status) + "</div></div></div>" +
      '<div class="spread">' + actionsFor(a) + '<button class="btn-ghost" data-act="open-creator" data-id="' + inf.id + '">Profile</button></div></div>' +
      '<p class="muted" style="margin:0.9rem 0 0">' + esc(a.pitch || "No pitch attached.") + "</p>" + timelineHTML(a) +
      '<details style="margin-top:0.6rem"><summary class="tiny" style="cursor:pointer">Score breakdown</summary>' + breakdownHTML(m.parts) + "</details></div>";
  }).join("") : '<div class="empty"><h3>No applications yet</h3><p class="muted">Invite someone from the ranked list — creators get a notification the moment you do.</p></div>';

  var rankHTML = ranked.map(function (r) {
    var has = appliedIds.indexOf(r.inf.id) > -1;
    return '<div class="card"><div class="row-between"><div class="row" style="gap:0.8rem">' + scoreHTML(r.m.total) +
      "<div><strong>" + esc(r.inf.handle) + '</strong><div class="tiny">' + esc(r.inf.category) + " · " + fmt(r.inf.followers) + " · " + r.inf.engagement + "% · asks " + money(r.inf.rate) + "</div></div></div>" +
      '<div class="spread">' + (has ? '<span class="chip chip-mint">Applied</span>' : '<button class="btn btn-outline btn-sm" data-act="invite" data-inf="' + r.inf.id + '" data-camp="' + c.id + '">Invite</button>') +
      '<button class="btn-ghost" data-act="open-creator" data-id="' + r.inf.id + '">Profile</button></div></div>' +
      '<details style="margin-top:0.6rem"><summary class="tiny" style="cursor:pointer">Why this score</summary>' + breakdownHTML(r.m.parts) + "</details></div>";
  }).join("");

  return head(c.title, "Your brief, your applicants, and the creators Beam would pick.", back +
      '<button class="btn btn-outline btn-sm" data-act="toggle-campaign" data-id="' + c.id + '">' + (c.status === "open" ? "Close campaign" : "Reopen") + "</button>") +
    brief +
    '<h2 style="font-size:1.3rem;margin-top:2rem">Applications (' + applied.length + ")</h2>" +
    '<div class="list" style="margin-bottom:2.4rem">' + appsHTML + "</div>" +
    '<h2 style="font-size:1.3rem">Best matches on the board</h2><p class="muted">Ranked out of 100: category 30, platform 20, reach 20, engagement 20, budget 10.</p>' +
    '<div class="list">' + rankHTML + "</div>";
}

function actionsFor(a) {
  var b = "";
  if (a.status === "applied") b += '<button class="btn btn-outline btn-sm" data-act="set-status" data-id="' + a.id + '" data-to="review">Move to review</button>';
  if (a.status === "applied" || a.status === "review") {
    b += '<button class="btn btn-coral btn-sm" data-act="set-status" data-id="' + a.id + '" data-to="accepted">Accept</button>';
    b += '<button class="btn-ghost" data-act="set-status" data-id="' + a.id + '" data-to="rejected">Reject</button>';
  }
  if (a.status === "accepted") b += '<button class="btn btn-coral btn-sm" data-act="set-status" data-id="' + a.id + '" data-to="progress">Start work</button>';
  if (a.status === "progress") b += '<button class="btn btn-coral btn-sm" data-act="set-status" data-id="' + a.id + '" data-to="completed">Mark completed &amp; pay</button>';
  return b;
}

function brandApplications() {
  var camps = brandCampaignList();
  var f = ui.filters;
  var apps = db.applications.filter(function (a) { return camps.some(function (c) { return c.id === a.campaignId; }); });
  if (f.status) apps = apps.filter(function (a) { return a.status === f.status; });
  if (f.camp) apps = apps.filter(function (a) { return a.campaignId === f.camp; });
  apps.sort(function (x, y) { return y.score - x.score; });

  var filters = '<div class="filters">' +
    '<label class="field" style="margin:0"><span>Campaign</span><select id="f-camp" data-act="filter"><option value="">All campaigns</option>' +
      camps.map(function (c) { return '<option value="' + c.id + '"' + (f.camp === c.id ? " selected" : "") + ">" + esc(c.title) + "</option>"; }).join("") + "</select></label>" +
    '<label class="field" style="margin:0"><span>Status</span><select id="f-status" data-act="filter"><option value="">Any status</option>' +
      STAGES.concat(["rejected"]).map(function (s) { return '<option value="' + s + '"' + (f.status === s ? " selected" : "") + ">" + STAGE_LABEL[s] + "</option>"; }).join("") + "</select></label>" +
    "</div>";

  if (!apps.length) return head("Applications", "Everyone who pitched, across every campaign.") + filters + '<div class="empty"><h3>Nothing here</h3><p class="muted">No applications match this filter yet.</p></div>';

  var rows = apps.map(function (a) {
    var inf = byId(db.influencers, a.influencerId);
    var c = byId(db.campaigns, a.campaignId);
    return "<tr><td><strong>" + esc(inf.handle) + '</strong><div class="tiny">' + fmt(inf.followers) + " · " + inf.engagement + "%</div></td>" +
      "<td>" + esc(c.title) + "</td><td>" + a.score + "%</td><td>" + statusChip(a.status) + "</td>" +
      '<td class="spread">' + actionsFor(a) + '<button class="btn-ghost" data-act="open-campaign" data-id="' + c.id + '">Board</button></td></tr>';
  }).join("");

  return head("Applications", "Everyone who pitched, across every campaign.") + filters +
    '<div class="card tablewrap"><table><thead><tr><th>Creator</th><th>Campaign</th><th>Match</th><th>Status</th><th>Actions</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
}

function discoverView() {
  var f = ui.filters;
  var camps = brandCampaignList();
  var against = f.against ? byId(db.campaigns, f.against) : null;
  var list = db.influencers.slice();

  if (f.q) list = list.filter(function (i) { return (i.handle + " " + i.name + " " + i.bio).toLowerCase().indexOf(f.q.toLowerCase()) > -1; });
  if (f.cat) list = list.filter(function (i) { return i.category === f.cat; });
  if (f.plat) list = list.filter(function (i) { return i.platforms.indexOf(f.plat) > -1; });
  if (f.loc) list = list.filter(function (i) { return i.location === f.loc; });
  if (f.minFol) list = list.filter(function (i) { return i.followers >= Number(f.minFol); });
  if (f.minEng) list = list.filter(function (i) { return i.engagement >= Number(f.minEng); });
  if (f.maxRate) list = list.filter(function (i) { return i.rate <= Number(f.maxRate); });

  if (against) {
    list = list.map(function (i) { return { inf: i, m: matchScore(i, against) }; }).sort(function (a, b) { return b.m.total - a.m.total; });
  } else {
    list = list.sort(function (a, b) { return b.followers - a.followers; }).map(function (i) { return { inf: i, m: null }; });
  }

  var filters = '<div class="filters">' +
    '<label class="field" style="margin:0"><span>Search</span><input type="text" id="f-q" data-act="filter" value="' + esc(f.q || "") + '" placeholder="handle, name, niche"></label>' +
    selectHTML("f-cat", "Category", CATEGORIES, f.cat, "Any category") +
    selectHTML("f-plat", "Platform", PLATFORMS, f.plat, "Any platform") +
    selectHTML("f-loc", "Location", CITIES, f.loc, "Anywhere") +
    '<label class="field" style="margin:0"><span>Min followers</span><input type="number" id="f-minFol" data-act="filter" step="5000" min="0" value="' + esc(f.minFol || "") + '"></label>' +
    '<label class="field" style="margin:0"><span>Min engagement %</span><input type="number" id="f-minEng" data-act="filter" step="0.5" min="0" value="' + esc(f.minEng || "") + '"></label>' +
    '<label class="field" style="margin:0"><span>Max rate ₹</span><input type="number" id="f-maxRate" data-act="filter" step="5000" min="0" value="' + esc(f.maxRate || "") + '"></label>' +
    '<label class="field" style="margin:0"><span>Score against</span><select id="f-against" data-act="filter"><option value="">No campaign</option>' +
      camps.map(function (c) { return '<option value="' + c.id + '"' + (f.against === c.id ? " selected" : "") + ">" + esc(c.title) + "</option>"; }).join("") + "</select></label>" +
    "</div>";

  var cards = list.length ? list.map(function (r) {
    var i = r.inf;
    return '<div class="card"><div class="row-between"><div class="row" style="gap:0.8rem">' +
      (r.m ? scoreHTML(r.m.total) : avatarHTML(i.handle, i.color, 46)) +
      "<div><strong>" + esc(i.handle) + '</strong><div class="tiny">' + esc(i.name) + " · " + esc(i.category) + " · " + esc(i.location) + "</div>" +
      '<div class="spread" style="margin-top:0.4rem"><span class="chip">' + fmt(i.followers) + ' followers</span><span class="chip chip-mint">' + i.engagement + '%</span><span class="chip chip-gold">asks ' + money(i.rate) + "</span></div></div></div>" +
      '<div class="spread"><button class="btn btn-outline btn-sm" data-act="open-creator" data-id="' + i.id + '">View profile</button></div></div>' +
      '<p class="muted" style="margin:0.8rem 0 0">' + esc(i.bio) + "</p>" +
      (r.m ? '<details style="margin-top:0.6rem"><summary class="tiny" style="cursor:pointer">Score breakdown</summary>' + breakdownHTML(r.m.parts) + "</details>" : "") + "</div>";
  }).join("") : '<div class="empty"><h3>Nobody fits those numbers</h3><p class="muted">Loosen the follower floor or the rate ceiling and try again.</p></div>';

  return head("Find creators", "Filter the roster, or pick a campaign to rank everyone against it.") + filters +
    '<p class="muted">' + list.length + " creator" + (list.length === 1 ? "" : "s") + (against ? " ranked against " + against.title : "") + "</p>" +
    '<div class="list">' + cards + "</div>";
}

function creatorDetail() {
  var i = byId(db.influencers, ui.influencerId);
  if (!i) return '<div class="empty"><h3>Creator not found</h3></div>';
  var camps = brandCampaignList();
  var rows = camps.map(function (c) {
    var m = matchScore(i, c);
    return '<div style="margin-bottom:1rem"><div class="row-between" style="margin-bottom:0.3rem"><span style="font-size:0.9rem;font-weight:600">' + esc(c.title) + '</span><span class="tiny">' + m.total + '%</span></div><span class="bar"><i style="width:' + m.total + '%"></i></span></div>';
  }).join("") || '<p class="muted">Post a campaign to see how this creator scores.</p>';

  var past = db.applications.filter(function (a) { return a.influencerId === i.id; });

  return head(i.handle, i.name + " · " + i.category, '<button class="btn btn-outline btn-sm" data-act="nav" data-view="discover">← Back</button>') +
    '<div class="grid-2"><div class="card"><div class="row" style="gap:0.8rem;margin-bottom:1rem">' + avatarHTML(i.handle, i.color, 52) +
    "<div><strong>" + esc(i.name) + '</strong><div class="tiny">' + esc(i.location) + " · " + i.platforms.join(", ") + "</div></div></div>" +
    "<p>" + esc(i.bio) + "</p>" +
    '<div class="stat-grid" style="margin:0"><div class="stat"><b>' + fmt(i.followers) + "</b><span>Followers</span></div>" +
    '<div class="stat"><b>' + i.engagement + "%</b><span>Engagement</span></div>" +
    '<div class="stat accent"><b>' + money(i.rate) + "</b><span>Expected rate</span></div>" +
    '<div class="stat"><b>' + past.filter(function (a) { return a.status === "completed"; }).length + "</b><span>Completed collabs</span></div></div></div>" +
    '<div class="card"><h3 style="font-size:1.1rem">Fit against your campaigns</h3>' + rows + "</div></div>";
}

function brandProfile() {
  var b = myBrand(), u = me();
  return head("Brand profile", "This is what creators see when they open one of your briefs.") +
    '<div class="card" style="max-width:640px"><form id="brand-form"><div class="form-grid">' +
    '<label class="field"><span>Brand name</span><input type="text" id="b-name" value="' + esc(b.name) + '" required></label>' +
    '<label class="field"><span>Industry</span><select id="b-industry">' + CATEGORIES.map(function (c) { return '<option' + (b.industry === c ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></label>" +
    '<label class="field"><span>Location</span><select id="b-loc">' + CITIES.map(function (c) { return '<option' + (b.location === c ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></label>" +
    '<label class="field"><span>Contact email</span><input type="email" id="b-email" value="' + esc(u.email) + '" required></label>' +
    "</div><label class=\"field\"><span>About</span><textarea id=\"b-about\">" + esc(b.about || "") + "</textarea></label>" +
    '<button class="btn btn-coral" type="submit">Save changes</button></form></div>';
}

/* ====================== creator views ====================== */
function myApps() {
  var i = myInf();
  return db.applications.filter(function (a) { return a.influencerId === i.id; });
}
function creatorOverview() {
  var i = myInf();
  var apps = myApps();
  var open = db.campaigns.filter(function (c) { return c.status === "open"; });
  var scored = open.map(function (c) { return { c: c, m: matchScore(i, c) }; }).sort(function (a, b) { return b.m.total - a.m.total; });
  var avg = apps.length ? Math.round(apps.reduce(function (s, a) { return s + a.score; }, 0) / apps.length) : 0;
  var earned = apps.filter(function (a) { return a.status === "completed"; })
    .reduce(function (s, a) { return s + (byId(db.campaigns, a.campaignId) || { budget: 0 }).budget; }, 0);

  var top = scored.slice(0, 3).map(function (r) {
    var brand = byId(db.brands, r.c.brandId);
    return '<div class="row-between" style="border-bottom:1px solid var(--line);padding:0.6rem 0"><div class="row" style="gap:0.7rem">' + scoreHTML(r.m.total) +
      "<div><strong style=\"font-size:0.92rem\">" + esc(r.c.title) + '</strong><div class="tiny">' + esc(brand.name) + " · " + money(r.c.budget) + "</div></div></div>" +
      '<button class="btn btn-outline btn-sm" data-act="open-campaign" data-id="' + r.c.id + '">Open</button></div>';
  }).join("") || '<p class="muted">No open campaigns right now.</p>';

  return head("Hi, " + i.name.split(" ")[0], "Your board, ranked by how well each brief actually fits you.") +
    '<div class="stat-grid">' +
      '<div class="stat"><b>' + apps.length + "</b><span>Applications</span></div>" +
      '<div class="stat"><b>' + apps.filter(function (a) { return ["accepted", "progress", "completed"].indexOf(a.status) > -1; }).length + "</b><span>Accepted</span></div>" +
      '<div class="stat accent"><b>' + avg + "%</b><span>Average match</span></div>" +
      '<div class="stat"><b>' + money(earned) + "</b><span>Earned on Beam</span></div>" +
    "</div>" +
    '<div class="grid-2"><div class="card"><h3 style="font-size:1.1rem">Best briefs for you today</h3>' + top +
    '<button class="btn btn-coral btn-sm" style="margin-top:1rem" data-act="nav" data-view="board">See the whole board</button></div>' +
    '<div class="card"><h3 style="font-size:1.1rem">Where your pitches stand</h3>' +
      (apps.length ? apps.slice(0, 4).map(function (a) {
        var c = byId(db.campaigns, a.campaignId);
        return '<div style="border-bottom:1px solid var(--line);padding:0.6rem 0"><div class="row-between"><strong style="font-size:0.9rem">' + esc(c.title) + "</strong>" + statusChip(a.status) + "</div>" + timelineHTML(a) + "</div>";
      }).join("") : '<p class="muted">Nothing pitched yet. Open the board and find a brief worth your time.</p>') + "</div></div>";
}

function boardView() {
  var i = myInf(), f = ui.filters;
  var list = db.campaigns.filter(function (c) { return c.status === "open"; });
  if (f.q) list = list.filter(function (c) { return (c.title + " " + c.brief).toLowerCase().indexOf(f.q.toLowerCase()) > -1; });
  if (f.cat) list = list.filter(function (c) { return c.category === f.cat; });
  if (f.plat) list = list.filter(function (c) { return c.platform === f.plat; });
  if (f.minBud) list = list.filter(function (c) { return c.budget >= Number(f.minBud); });
  var scored = list.map(function (c) { return { c: c, m: matchScore(i, c) }; });
  if (f.fitOnly) scored = scored.filter(function (r) { return r.m.total >= 75; });
  scored.sort(function (a, b) { return f.sort === "budget" ? b.c.budget - a.c.budget : b.m.total - a.m.total; });

  var filters = '<div class="filters">' +
    '<label class="field" style="margin:0"><span>Search</span><input type="text" id="f-q" data-act="filter" value="' + esc(f.q || "") + '" placeholder="title or brief"></label>' +
    selectHTML("f-cat", "Category", CATEGORIES, f.cat, "Any category") +
    selectHTML("f-plat", "Platform", PLATFORMS, f.plat, "Any platform") +
    '<label class="field" style="margin:0"><span>Min budget ₹</span><input type="number" id="f-minBud" data-act="filter" step="5000" min="0" value="' + esc(f.minBud || "") + '"></label>' +
    '<label class="field" style="margin:0"><span>Sort by</span><select id="f-sort" data-act="filter"><option value="match"' + (f.sort !== "budget" ? " selected" : "") + '>Match score</option><option value="budget"' + (f.sort === "budget" ? " selected" : "") + ">Budget</option></select></label>" +
    '<label class="field" style="margin:0"><span>Strong fits only</span><select id="f-fitOnly" data-act="filter"><option value="">Show everything</option><option value="1"' + (f.fitOnly ? " selected" : "") + ">75% and above</option></select></label>" +
    "</div>";

  var cards = scored.length ? scored.map(function (r) {
    var brand = byId(db.brands, r.c.brandId);
    var mine = db.applications.filter(function (a) { return a.campaignId === r.c.id && a.influencerId === i.id; })[0];
    return '<div class="card"><div class="row-between"><div class="row" style="gap:0.9rem">' + scoreHTML(r.m.total) +
      "<div><strong>" + esc(r.c.title) + '</strong><div class="tiny">' + esc(brand.name) + " · " + esc(r.c.location) + " · posted " + ago(r.c.createdAt) + "</div>" +
      '<div class="spread" style="margin-top:0.45rem"><span class="chip chip-coral">' + esc(r.c.category) + '</span><span class="chip">' + esc(r.c.platform) + '</span><span class="chip chip-gold">' + money(r.c.budget) + '</span><span class="chip">' + fmt(r.c.minFollowers) + "+ followers</span></div></div></div>" +
      '<div class="spread">' + (mine ? statusChip(mine.status) : "") +
      '<button class="btn btn-coral btn-sm" data-act="open-campaign" data-id="' + r.c.id + '">' + (mine ? "View" : "Read brief") + "</button></div></div>" +
      '<p class="muted" style="margin:0.8rem 0 0">' + esc(r.c.brief) + "</p></div>";
  }).join("") : '<div class="empty"><h3>Nothing matches yet</h3><p class="muted">Clear a filter, or widen the budget floor — new briefs land most days.</p></div>';

  return head("Find campaigns", "Every open brief, scored against your profile.") + filters + '<div class="list">' + cards + "</div>";
}

function creatorApplications() {
  var apps = myApps().sort(function (a, b) { return b.createdAt - a.createdAt; });
  if (!apps.length) return head("My applications", "Every pitch and where it stands.") +
    '<div class="empty"><h3>No pitches yet</h3><p class="muted">Open the board, pick a brief above 70%, and send a short pitch.</p><button class="btn btn-coral" style="margin-top:1rem" data-act="nav" data-view="board">Find campaigns</button></div>';
  return head("My applications", "Every pitch and where it stands.") + '<div class="list">' + apps.map(function (a) {
    var c = byId(db.campaigns, a.campaignId);
    var brand = byId(db.brands, c.brandId);
    return '<div class="card"><div class="row-between"><div class="row" style="gap:0.9rem">' + scoreHTML(a.score) +
      "<div><strong>" + esc(c.title) + '</strong><div class="tiny">' + esc(brand.name) + " · " + money(c.budget) + " · sent " + ago(a.createdAt) + "</div></div></div>" +
      '<div class="spread">' + statusChip(a.status) +
      (["applied", "review"].indexOf(a.status) > -1 ? '<button class="btn-ghost" data-act="withdraw" data-id="' + a.id + '">Withdraw</button>' : "") +
      '<button class="btn btn-outline btn-sm" data-act="open-campaign" data-id="' + c.id + '">Brief</button></div></div>' +
      timelineHTML(a) + '<p class="muted" style="margin:0.8rem 0 0">' + esc(a.pitch || "") + "</p></div>";
  }).join("") + "</div>";
}

function creatorProfile() {
  var i = myInf(), u = me();
  var checks = PLATFORMS.map(function (p) {
    return '<label class="row" style="gap:0.45rem;font-size:0.9rem"><input type="checkbox" id="p-' + p + '" ' + (i.platforms.indexOf(p) > -1 ? "checked" : "") + " style=\"width:auto\"> " + p + "</label>";
  }).join("");
  return head("My profile", "Brands score you on these numbers, so keep them current.") +
    '<div class="card" style="max-width:700px"><form id="inf-form"><div class="form-grid">' +
    '<label class="field"><span>Handle</span><input type="text" id="i-handle" value="' + esc(i.handle) + '" required></label>' +
    '<label class="field"><span>Name</span><input type="text" id="i-name" value="' + esc(i.name) + '" required></label>' +
    '<label class="field"><span>Category</span><select id="i-cat">' + CATEGORIES.map(function (c) { return "<option" + (i.category === c ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></label>" +
    '<label class="field"><span>Location</span><select id="i-loc">' + CITIES.map(function (c) { return "<option" + (i.location === c ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></label>" +
    '<label class="field"><span>Followers</span><input type="number" id="i-fol" min="0" step="1000" value="' + i.followers + '" required></label>' +
    '<label class="field"><span>Engagement rate (%)</span><input type="number" id="i-eng" min="0" max="100" step="0.1" value="' + i.engagement + '" required></label>' +
    '<label class="field"><span>Expected rate per campaign (₹)</span><input type="number" id="i-rate" min="0" step="1000" value="' + i.rate + '" required></label>' +
    '<label class="field"><span>Email</span><input type="email" id="i-email" value="' + esc(u.email) + '" required></label>' +
    "</div>" +
    '<div class="field"><span>Platforms</span><div class="spread">' + checks + "</div></div>" +
    '<label class="field"><span>Bio</span><textarea id="i-bio">' + esc(i.bio || "") + "</textarea></label>" +
    '<p class="err" id="i-err"></p><button class="btn btn-coral" type="submit">Save profile</button></form></div>';
}

/* ====================== notifications ====================== */
function notificationsView() {
  var u = me();
  var list = db.notifications.filter(function (n) { return n.userId === u.id; });
  var body = list.length ? '<div class="list">' + list.map(function (n) {
    return '<div class="card" style="' + (n.read ? "opacity:0.65" : "") + '"><div class="row-between"><span>' + esc(n.text) + '</span><span class="tiny">' + ago(n.at) + "</span></div></div>";
  }).join("") + "</div>" : '<div class="empty"><h3>Nothing yet</h3><p class="muted">Status changes and new applications land here.</p></div>';
  return head("Notifications", "Everything that moved since you were last here.",
    list.length ? '<button class="btn btn-outline btn-sm" data-act="read-all">Mark all as read</button>' : "") + body;
}

/* ====================== actions ====================== */
function setView(v) { ui.view = v; ui.filters = {}; render(); }

function openCampaign(id) { ui.campaignId = id; ui.view = "campaign"; render(); }
function openCreator(id) { ui.influencerId = id; ui.view = "creator"; render(); }

function setStatus(appId, to) {
  var a = byId(db.applications, appId);
  if (!a) return;
  a.status = to;
  a.history.push({ status: to, at: now() });
  var c = byId(db.campaigns, a.campaignId);
  var inf = byId(db.influencers, a.influencerId);
  var iu = userForInfluencer(a.influencerId);
  if (iu) notify(iu.id, "Your application for “" + c.title + "” is now: " + STAGE_LABEL[to] + ".");
  if (to === "completed") {
    inf.completed = (inf.completed || 0) + 1;
    if (iu) notify(iu.id, money(c.budget) + " released for “" + c.title + "”.");
  }
  save();
  toast(inf.handle + " → " + STAGE_LABEL[to], to === "rejected" ? "bad" : "good");
  repaint();
}

function apply(campId, pitch) {
  var i = myInf();
  var c = byId(db.campaigns, campId);
  var existing = db.applications.filter(function (a) { return a.campaignId === campId && a.influencerId === i.id; })[0];
  if (existing) { toast("You've already pitched for this one.", "bad"); return; }
  var m = matchScore(i, c);
  db.applications.push({
    id: uid("app"), campaignId: campId, influencerId: i.id, status: "applied",
    pitch: pitch, score: m.total, createdAt: now(), history: [{ status: "applied", at: now() }]
  });
  var bu = userForBrand(c.brandId);
  if (bu) notify(bu.id, i.handle + " applied to “" + c.title + "” with a " + m.total + "% match.");
  save();
  toast("Application sent — " + m.total + "% match.", "good");
  repaint();
}

function withdraw(appId) {
  db.applications = db.applications.filter(function (a) { return a.id !== appId; });
  save(); toast("Application withdrawn."); repaint();
}

function invite(infId, campId) {
  var inf = byId(db.influencers, infId);
  var c = byId(db.campaigns, campId);
  var iu = userForInfluencer(infId);
  if (iu) notify(iu.id, "Invited to pitch for “" + c.title + "” — " + money(c.budget) + ".");
  save();
  toast("Invite sent to " + inf.handle + ".", "good");
  repaint();
}

function toggleCampaign(id) {
  var c = byId(db.campaigns, id);
  c.status = c.status === "open" ? "closed" : "open";
  save(); toast("Campaign " + (c.status === "open" ? "reopened." : "closed."), "good"); repaint();
}

function logout() { db.session = null; save(); ui = { view: "overview", campaignId: null, influencerId: null, filters: {}, auth: null }; render(); }

function resetDemo() {
  if (!window.confirm("Reset everything back to the seeded demo data?")) return;
  db = seed(); save(); ui = { view: "overview", campaignId: null, influencerId: null, filters: {}, auth: null }; render();
  toast("Demo data restored.", "good");
}

function toggleTheme() {
  var r = document.documentElement;
  var cur = r.getAttribute("data-theme");
  var next = cur === "dark" ? "light" : cur === "light" ? "dark" : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark");
  r.setAttribute("data-theme", next);
  try { localStorage.setItem("beam.theme", next); } catch (e) {}
}

/* ====================== auth ====================== */
function doLogin(email, pass, errEl) {
  var u = db.users.filter(function (x) { return x.email.toLowerCase() === email.toLowerCase(); })[0];
  if (!u) { errEl.textContent = "No account with that email. Create one below."; return; }
  if (u.password !== pass) { errEl.textContent = "That password doesn't match."; return; }
  db.session = u.id; save();
  ui.auth = null; ui.view = "overview"; ui.filters = {};
  render(); toast("Welcome back, " + (u.role === "brand" ? byId(db.brands, u.refId).name : byId(db.influencers, u.refId).handle) + ".", "good");
}
function doSignup(name, email, pass, role, errEl) {
  if (db.users.some(function (x) { return x.email.toLowerCase() === email.toLowerCase(); })) {
    errEl.textContent = "That email is already on Beam. Log in instead."; return;
  }
  if (pass.length < 6) { errEl.textContent = "Use at least 6 characters for the password."; return; }
  var color = SWATCH[Math.floor(Math.random() * SWATCH.length)];
  var refId;
  if (role === "brand") {
    refId = uid("brand");
    db.brands.push({ id: refId, name: name, industry: CATEGORIES[0], location: CITIES[0], color: color, about: "" });
  } else {
    refId = uid("inf");
    var handle = "@" + name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16);
    db.influencers.push({ id: refId, handle: handle || "@newcreator", name: name, category: CATEGORIES[0], platforms: ["Instagram"], followers: 0, engagement: 0, location: CITIES[0], rate: 0, bio: "", color: color, completed: 0 });
  }
  var u = { id: uid("user"), name: name, email: email, password: pass, role: role, refId: refId };
  db.users.push(u);
  db.session = u.id;
  notify(u.id, role === "brand" ? "Welcome to Beam. Post your first campaign to see ranked creators." : "Welcome to Beam. Fill in your followers and rate so briefs can score you.");
  save();
  ui.auth = null; ui.view = role === "brand" ? "campaigns" : "profile"; ui.filters = {};
  render();
  toast(role === "brand" ? "Account created. Post a campaign to get ranked matches." : "Account created. Complete your profile to get scored.", "good");
}

/* ====================== event wiring ====================== */
function actOf(e) {
  var el = e.target.closest ? e.target.closest("[data-act]") : null;
  return el;
}
document.addEventListener("click", function (e) {
  var el = actOf(e);
  if (!el) return;
  var act = el.getAttribute("data-act");
  switch (act) {
    case "nav": setView(el.getAttribute("data-view")); break;
    case "open-campaign": openCampaign(el.getAttribute("data-id")); break;
    case "open-creator": openCreator(el.getAttribute("data-id")); break;
    case "set-status": setStatus(el.getAttribute("data-id"), el.getAttribute("data-to")); break;
    case "withdraw": withdraw(el.getAttribute("data-id")); break;
    case "invite": invite(el.getAttribute("data-inf"), el.getAttribute("data-camp")); break;
    case "toggle-campaign": toggleCampaign(el.getAttribute("data-id")); break;
    case "logout": logout(); break;
    case "reset": resetDemo(); break;
    case "theme": toggleTheme(); break;
    case "read-all":
      db.notifications.forEach(function (n) { if (n.userId === db.session) n.read = true; });
      save(); render(); break;
    case "close-auth": ui.auth = null; renderAuth(); break;
    case "auth-role": ui.auth.role = el.getAttribute("data-role"); renderAuth(); break;
    case "auth-switch": ui.auth.mode = ui.auth.mode === "login" ? "signup" : "login"; renderAuth(); break;
    case "demo":
      var em = el.getAttribute("data-email");
      var errBox = document.getElementById("a-err") || document.createElement("p");
      doLogin(em, "demo1234", errBox);
      break;
  }
});

/* landing auth buttons */
document.getElementById("landing").addEventListener("click", function (e) {
  var el = e.target.closest("[data-auth]");
  if (!el) return;
  var v = el.getAttribute("data-auth");
  ui.auth = { mode: v === "login" ? "login" : "signup", role: v === "signup-brand" ? "brand" : "influencer" };
  renderAuth();
});

/* filters */
function readFilters() {
  ["f-q", "f-cat", "f-plat", "f-loc", "f-minFol", "f-minEng", "f-maxRate", "f-against", "f-minBud", "f-sort", "f-fitOnly", "f-camp", "f-status"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var key = id.slice(2);
    ui.filters[key] = el.value;
  });
}
document.addEventListener("input", function (e) {
  if (e.target.getAttribute && e.target.getAttribute("data-act") === "filter") { readFilters(); repaint(); }
});
document.addEventListener("change", function (e) {
  if (e.target.getAttribute && e.target.getAttribute("data-act") === "filter") { readFilters(); repaint(); }
});

/* forms */
document.addEventListener("submit", function (e) {
  var form = e.target;
  if (["auth-form", "camp-form", "apply-form", "inf-form", "brand-form"].indexOf(form.id) === -1) return;
  e.preventDefault();
  var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };

  if (form.id === "auth-form") {
  var err = document.getElementById("a-err");
  err.textContent = "";

  var email = val("a-email");
  var pass = val("a-pass");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    err.textContent = "That email doesn't look right.";
    return;
  }

  if (ui.auth.mode === "login") {
  doLogin(email, pass, err);
} else {
  var nm = val("a-name");

  if (!nm) {
    err.textContent = "Please enter your name.";
    return;
  }

  if (!/^[A-Za-z ]+$/.test(nm)) {
    err.textContent = "Name can contain letters and spaces only.";
    return;
  }

  if (nm.replace(/ /g, "").length < 2) {
    err.textContent = "Name must contain at least 2 letters.";
    return;
  }

  doSignup(nm, email, pass, ui.auth.role, err);
}

  return;
}

  if (form.id === "camp-form") {
    var e2 = document.getElementById("c-err"); e2.textContent = "";
    var title = val("c-title");
    var budget = Number(val("c-bud"));
    if (!title) { e2.textContent = "Give the campaign a title creators will recognise."; return; }
    if (!(budget > 0)) { e2.textContent = "Set a budget above zero — creators filter by it."; return; }
    var dels = val("c-del").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var c = {
      id: uid("camp"), brandId: myBrand().id, title: title, category: val("c-cat"), platform: val("c-plat"),
      minFollowers: Number(val("c-fol")) || 0, minEngagement: Number(val("c-eng")) || 0, budget: budget,
      location: val("c-loc"), brief: val("c-brief") || "No brief added yet.",
      deliverables: dels.length ? dels : ["To be agreed"], status: "open", createdAt: now()
    };
    db.campaigns.push(c);
    db.users.forEach(function (u) {
      if (u.role !== "influencer") return;
      var inf = byId(db.influencers, u.refId);
      if (matchScore(inf, c).total >= 70) notify(u.id, "New brief that fits you: “" + c.title + "” · " + money(c.budget) + ".");
    });
    save();
    toast("Campaign posted. Matches are ranked already.", "good");
    openCampaign(c.id);
    return;
  }

  if (form.id === "apply-form") {
    var pe = document.getElementById("p-err"); pe.textContent = "";
    var pitch = val("p-pitch");
    if (pitch.length < 15) { pe.textContent = "Write at least a line or two — brands skip empty pitches."; return; }
    apply(ui.campaignId, pitch);
    return;
  }

  if (form.id === "inf-form") {
    var ie = document.getElementById("i-err"); ie.textContent = "";
    var i = myInf(), u = me();
    var plats = PLATFORMS.filter(function (p) { var el = document.getElementById("p-" + p); return el && el.checked; });
    if (!plats.length) { ie.textContent = "Pick at least one platform you actually post on."; return; }
    var handle = val("i-handle");
    i.handle = handle.charAt(0) === "@" ? handle : "@" + handle;
    i.name = val("i-name"); i.category = val("i-cat"); i.location = val("i-loc");
    i.followers = Number(val("i-fol")) || 0;
    i.engagement = Number(val("i-eng")) || 0;
    i.rate = Number(val("i-rate")) || 0;
    i.platforms = plats; i.bio = val("i-bio"); u.email = val("i-email");
    db.applications.forEach(function (a) {
      if (a.influencerId === i.id) a.score = matchScore(i, byId(db.campaigns, a.campaignId)).total;
    });
    save(); toast("Profile saved. Your scores were recalculated.", "good"); render();
    return;
  }

  if (form.id === "brand-form") {
    var b = myBrand(), bu = me();
    b.name = val("b-name"); b.industry = val("b-industry"); b.location = val("b-loc"); b.about = val("b-about");
    bu.email = val("b-email");
    save(); toast("Brand profile saved.", "good"); render();
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && ui.auth) { ui.auth = null; renderAuth(); }
});

/* ====================== boot ====================== */
try {
  var t = localStorage.getItem("beam.theme");
  if (t) document.documentElement.setAttribute("data-theme", t);
} catch (e) {}

db = load() || seed();
save();
render();
})();
