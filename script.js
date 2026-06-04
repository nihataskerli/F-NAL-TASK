const OPENSKY_URL = "https://opensky-network.org/api";
const IPAPI_URL   = "https://ipapi.co/json";

async function getUserLocation() {
  try {
    const res  = await fetch(IPAPI_URL);
    const data = await res.json();
    const city = data.city || "";
    const fromFields = ["aFrom", "rFrom", "supName"];
    ["aFrom", "rFrom"].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = city;
    });
  } catch(e) {
    console.log("Məkan tapılmadı:", e);
  }
}

async function loadRealFlights() {
  const el = document.getElementById("realFlightsStatus");
  if (el) el.style.display = "flex";
  try {
    const now   = Math.floor(Date.now() / 1000);
    const begin = now - 7200;
    const url   = `${OPENSKY_URL}/flights/departure?airport=UBBB&begin=${begin}&end=${now}`;
    const res   = await fetch(url);

    if (!res.ok) throw new Error("API cavab vermədi");

    const data = await res.json();
    if (!data || !data.length) {
      if (el) el.innerHTML = `<i class="ti ti-info-circle"></i> Hazırda aktiv uçuş məlumatı yoxdur.`;
      setTimeout(() => { if(el) el.style.display="none"; }, 4000);
      return;
    }

    const realFlights = data.slice(0, 6).map((f, i) => ({
      id:          9000 + i,
      uid:         "opensky",
      name:        "OpenSky Məlumatı",
      initials:    "OS",
      phone:       "—",
      from:        f.estDepartureAirport || "UBBB",
      to:          f.estArrivalAirport   || "—",
      date:        new Date(f.firstSeen * 1000).toISOString().split("T")[0],
      time:        new Date(f.firstSeen * 1000).toTimeString().slice(0,5),
      ticket:      f.callsign ? f.callsign.trim() : "—",
      weight:      0,
      types:       [],
      note:        "Bu məlumat OpenSky Network API-dən real vaxtda alınır.",
      rating:      0,
      ratingCount: 0,
      isReal:      true
    }));

    realFlights.forEach(f => {
      if (!flights.find(x => x.ticket === f.ticket)) flights.push(f);
    });

    if (el) el.innerHTML = `<i class="ti ti-circle-check"></i> ${realFlights.length} real uçuş məlumatı yükləndi (OpenSky API)`;
    setTimeout(() => { if(el) el.style.display="none"; }, 4000);
    renderFlights();
    updateCounters();
  } catch(e) {
    if (el) el.innerHTML = `<i class="ti ti-alert-circle"></i> Real uçuş məlumatı yüklənmədi (CORS məhdudiyyəti)`;
    setTimeout(() => { if(el) el.style.display="none"; }, 4000);
  }
}

let currentUser = null;
let flights = [
  { id:1, uid:"demo", name:"Kamran Nəsirov", initials:"KN", phone:"+994 50 211 45 67", from:"Bakı", to:"İstanbul", date:"2025-06-04", time:"19:00", ticket:"TK 198", weight:7, types:["Geyim","Sənəd","Dərman"], note:"Kiçik bağlamalar götürə bilərəm.", rating:4.7, ratingCount:12 },
  { id:2, uid:"u2", name:"Leyla Məmmədova", initials:"LM", phone:"+994 55 334 89 01", from:"Bakı", to:"Moskva", date:"2025-06-05", time:"14:30", ticket:"S7 742", weight:5, types:["Sənəd","Elektronika"], note:"Kövrək əşyaları götürə bilərəm.", rating:4.2, ratingCount:8 },
  { id:3, uid:"u3", name:"Rauf Quliyev", initials:"RQ", phone:"+994 70 456 12 34", from:"Bakı", to:"Dubay", date:"2025-06-07", time:"22:15", ticket:"FZ 329", weight:10, types:["Geyim","Ərzaq","Digər"], note:"5 kq-ya qədər götürə bilərəm.", rating:5.0, ratingCount:3 },
  { id:4, uid:"u4", name:"Nərmin Hüseynova", initials:"NH", phone:"+994 51 789 01 23", from:"Bakı", to:"London", date:"2025-06-10", time:"07:45", ticket:"BA 722", weight:8, types:["Sənəd","Geyim"], note:"", rating:0, ratingCount:0 },
  { id:5, uid:"u5", name:"Tural Babayev", initials:"TB", phone:"+994 55 612 33 21", from:"Bakı", to:"Berlin", date:"2025-06-11", time:"10:20", ticket:"LH 693", weight:6, types:["Elektronika","Geyim"], note:"Yalnız kiçik qutu və ya zərf götürə bilərəm.", rating:4.5, ratingCount:6 },
  { id:6, uid:"u6", name:"Aytən Rzayeva", initials:"AR", phone:"+994 70 881 44 56", from:"Bakı", to:"Paris", date:"2025-06-12", time:"08:55", ticket:"AF 875", weight:4, types:["Sənəd","Dərman"], note:"Dərman və sənəd göndərənlərə üstünlük verirəm.", rating:4.8, ratingCount:15 },
  { id:7, uid:"u7", name:"Elvin Həsənov", initials:"EH", phone:"+994 51 320 77 90", from:"Bakı", to:"Amsterdam", date:"2025-06-13", time:"16:40", ticket:"KL 456", weight:9, types:["Geyim","Ərzaq","Digər"], note:"Hər növ əşya götürə bilərəm, çox ağır olmasın.", rating:3.9, ratingCount:4 }
];
let requests = [];
let uploadedFiles = { idFront:null, idBack:null, itemImg:null };
let chatMessages = {};

function switchAuthTab(tab) {
  document.getElementById("atab-login").classList.toggle("active", tab === "login");
  document.getElementById("atab-signup").classList.toggle("active", tab === "signup");
  document.getElementById("loginForm").style.display = tab === "login" ? "block" : "none";
  document.getElementById("signupForm").style.display = tab === "signup" ? "block" : "none";
}

function doLogin() {
  const email = document.getElementById("lEmail").value.trim();
  const pass  = document.getElementById("lPass").value;
  if (!email || !pass) { showToast("E-poçt və şifrəni daxil edin", "warn"); return; }
  if (email === "demo@test.com" && pass === "123456") {
    currentUser = { uid:"demo", name:"Kamran Nəsirov", email, phone:"+994 50 211 45 67", initials:"KN", verified:true };
    enterApp(); return;
  }
  const saved = localStorage.getItem("bf_users");
  if (saved) {
    const found = JSON.parse(saved).find(u => u.email === email && u.pass === pass);
    if (found) { currentUser = found; enterApp(); return; }
  }
  showToast("E-poçt və ya şifrə yanlışdır", "danger");
}

function doSignup() {
  const ad    = document.getElementById("sAd").value.trim();
  const soyad = document.getElementById("sSoyad").value.trim();
  const email = document.getElementById("sEmail").value.trim();
  const phone = document.getElementById("sPhone").value.trim();
  const pass  = document.getElementById("sPass").value;
  const pass2 = document.getElementById("sPass2").value;
  const agree = document.getElementById("agreeTerms").checked;

  if (!ad || !soyad || !email || !phone || !pass) { showToast("Bütün məcburi sahələri doldurun", "warn"); return; }

  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
    showToast("Yalnız @gmail.com e-poçt qəbul edilir", "warn"); return;
  }
  if (pass !== pass2) { showToast("Şifrələr uyğun gəlmir", "danger"); return; }
  if (pass.length < 6) { showToast("Şifrə ən az 6 simvol olmalıdır", "warn"); return; }
  if (!uploadedFiles.idFront || !uploadedFiles.idBack) {
    showToast("Şəxsiyyət vəsiqənizin hər iki üzünü yükləyin", "warn"); return;
  }
  if (uploadedFiles.idFront.name === uploadedFiles.idBack.name) {
    showToast("Ön üz və arxa üz üçün fərqli şəkillər yükləyin", "warn"); return;
  }
  if (!agree) { showToast("Məlumatların işlənməsinə razılıq verin", "warn"); return; }

  const initials = (ad[0] + (soyad[0] || "")).toUpperCase();
  const newUser  = { uid:"u_"+Date.now(), name:ad+" "+soyad, email, phone, pass, initials, verified:true };

  const saved = localStorage.getItem("bf_users");
  const list  = saved ? JSON.parse(saved) : [];
  if (list.find(u => u.email === email)) { showToast("Bu e-poçt artıq qeydiyyatdadır", "danger"); return; }
  list.push(newUser);
  localStorage.setItem("bf_users", JSON.stringify(list));
  currentUser = newUser;
  showToast("Qeydiyyat uğurla tamamlandı!", "success");
  setTimeout(enterApp, 800);
}

function enterApp() {
  document.getElementById("authScreen").style.display = "none";
  document.getElementById("appScreen").classList.add("visible");
  document.getElementById("topbarAvatar").textContent = currentUser.initials;
  document.getElementById("topbarName").textContent   = currentUser.name.split(" ")[0];
  document.getElementById("profAvatar").textContent   = currentUser.initials;
  document.getElementById("profName").textContent     = currentUser.name;
  document.getElementById("profEmail").textContent    = currentUser.email;
  document.getElementById("profPhone").textContent    = currentUser.phone || "";
  updateCounters();
  renderFlights();
  getUserLocation();
  loadRealFlights();
}

function doLogout() {
  currentUser = null;
  document.getElementById("appScreen").classList.remove("visible");
  document.getElementById("authScreen").style.display = "flex";
  switchTab("browse");
  showToast("Hesabdan çıxdınız");
}

function switchTab(name) {
  ["browse","add","send","myRequests","profile","support"].forEach(t => {
    const tab   = document.getElementById("tab-" + t);
    const panel = document.getElementById("panel-" + t);
    if (tab)   tab.classList.toggle("active", t === name);
    if (panel) panel.classList.toggle("active", t === name);
  });
  if (name === "myRequests") renderRequests();
}

async function lookupFlight() {
  const raw = document.getElementById("aTicket").value.trim().toUpperCase();
  if (raw.length < 4) return;
  showLookupStatus("loading", "Axtarılır...");
  const match = raw.match(/^([A-Z]{2,3})\s*(\d+)$/);
  if (!match) { showLookupStatus("error", "Yanlış format. Nümunə: TK198"); return; }
  try {
    const res  = await fetch(`${API_URL}?access_key=${API_KEY}&flight_iata=${match[1]}${match[2]}&limit=1`);
    const data = await res.json();
    if (data.error) { showLookupStatus("error", "API xətası: " + data.error.info); return; }
    const f = data.data && data.data[0];
    if (!f) { showLookupStatus("error", "Bu reys tapılmadı."); return; }
    document.getElementById("aFrom").value = f.departure?.airport || f.departure?.iata || "";
    document.getElementById("aTo").value   = f.arrival?.airport   || f.arrival?.iata   || "";
    if (f.departure?.scheduled) {
      const d = new Date(f.departure.scheduled);
      document.getElementById("aDate").value = d.toISOString().split("T")[0];
      document.getElementById("aTime").value = d.toTimeString().slice(0,5);
    }
    showLookupStatus("success", "Uçuş məlumatları tapıldı!");
  } catch(e) {
    showLookupStatus("error", "Sorğu uğursuz oldu. API açarını yoxlayın.");
  }
}

function showLookupStatus(type, msg) {
  const el = document.getElementById("flightLookupStatus");
  if (!el) return;
  const map = { loading:["#eff6ff","#1d4ed8","ti-loader-2 spin"], success:["#f0fdf4","#15803d","ti-circle-check"], error:["#fef2f2","#dc2626","ti-alert-circle"] };
  const [bg, color, icon] = map[type];
  el.style.cssText = `display:flex;background:${bg};color:${color};border:1px solid ${color}40;padding:8px 12px;border-radius:8px;font-size:13px;margin-top:6px;align-items:center;gap:8px`;
  el.innerHTML = `<i class="ti ${icon}"></i> ${msg}`;
  if (type !== "loading") setTimeout(() => { if(el) el.style.display="none"; }, 5000);
}

function clearLookupStatus() {
  const el = document.getElementById("flightLookupStatus");
  if (el) el.style.display = "none";
}

function validatePhone(input) {
  input.value = input.value.replace(/[^0-9+ ]/g, "");
}

function fileChosen(input, key, areaId, prevId) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5*1024*1024) { showToast("Fayl 5 MB-dan böyükdür", "warn"); input.value=""; return; }
  if (key === "idBack"   && uploadedFiles.idFront && file.name === uploadedFiles.idFront.name) {
    showToast("Ön üz və arxa üz üçün fərqli şəkillər yükləyin", "warn"); input.value=""; return;
  }
  if (key === "idFront"  && uploadedFiles.idBack  && file.name === uploadedFiles.idBack.name) {
    showToast("Ön üz və arxa üz üçün fərqli şəkillər yükləyin", "warn"); input.value=""; return;
  }
  uploadedFiles[key] = file;
  document.getElementById(prevId+"name").textContent = file.name;
  document.getElementById(prevId).classList.add("show");
  document.getElementById(areaId).style.borderColor = "var(--green)";
}

function clearFile(key, areaId, prevId) {
  uploadedFiles[key] = null;
  document.getElementById(prevId).classList.remove("show");
  document.getElementById(areaId).style.borderColor = "";
}

function dragOver(e, id) { e.preventDefault(); document.getElementById(id).classList.add("drag"); }
function dragLeave(id)   { document.getElementById(id).classList.remove("drag"); }
function dropFile(e, key, areaId, prevId) {
  e.preventDefault();
  document.getElementById(areaId).classList.remove("drag");
  const file = e.dataTransfer.files[0];
  if (file) {
    uploadedFiles[key] = file;
    document.getElementById(prevId+"name").textContent = file.name;
    document.getElementById(prevId).classList.add("show");
    document.getElementById(areaId).style.borderColor = "var(--green)";
  }
}

function chk(el) {
  el.closest(".check-item").classList.toggle("on", el.checked);
}

function addFlight() {
  const from   = document.getElementById("aFrom").value.trim();
  const to     = document.getElementById("aTo").value.trim();
  const date   = document.getElementById("aDate").value;
  const time   = document.getElementById("aTime").value;
  const ticket = document.getElementById("aTicket").value.trim();
  const weight = parseFloat(document.getElementById("aWeight").value);
  const note   = document.getElementById("aNote").value.trim();
  const types  = [...document.querySelectorAll("#typeChecks input:checked")].map(c => c.value);
  if (!from||!to||!date||!time||!ticket||!weight) { showToast("Bütün məcburi sahələri doldurun","warn"); return; }
  if (!types.length) { showToast("Ən az 1 əşya növü seçin","warn"); return; }
  flights.unshift({ id:Date.now(), uid:currentUser.uid, name:currentUser.name, initials:currentUser.initials, phone:currentUser.phone, from, to, date, time, ticket, weight, types, note, rating:0, ratingCount:0 });
  ["aFrom","aTo","aDate","aTime","aTicket","aWeight","aNote"].forEach(id => document.getElementById(id).value="");
  document.querySelectorAll("#typeChecks input").forEach(cb => { cb.checked=false; cb.closest(".check-item").classList.remove("on"); });
  clearLookupStatus();
  updateCounters();
  showToast("Uçuşunuz əlavə edildi! ✈️","success");
  switchTab("browse");
  renderFlights();
}

function sendRequest() {
  const from   = document.getElementById("rFrom").value.trim();
  const to     = document.getElementById("rTo").value.trim();
  const type   = document.getElementById("rType").value;
  const weight = document.getElementById("rWeight").value;
  const desc   = document.getElementById("rDesc").value.trim();
  if (!from||!to||!type||!weight||!desc) { showToast("Bütün məcburi sahələri doldurun","warn"); return; }
  requests.push({ id:Date.now(), uid:currentUser.uid, name:currentUser.name, initials:currentUser.initials, phone:currentUser.phone, from, to, type, weight, desc, createdAt:new Date().toISOString() });
  ["rFrom","rTo","rWeight","rDesc"].forEach(id => document.getElementById(id).value="");
  document.getElementById("rType").value="";
  clearFile("itemImg","ua3","prev3");
  updateCounters();
  renderRequests();
  showToast("Tələbiniz göndərildi!","success");
  switchTab("myRequests");
}

function renderFlights() {
  const city   = (document.getElementById("fCity").value || "").toLowerCase();
  const type   = document.getElementById("fType").value;
  const sortBy = document.getElementById("fSort").value;
  let list = flights.filter(f => {
    const cm = !city || f.to.toLowerCase().includes(city) || f.from.toLowerCase().includes(city);
    const tm = !type || f.types.includes(type);
    return cm && tm;
  });
  if (sortBy==="weight") list.sort((a,b) => b.weight-a.weight);
  else if (sortBy==="rating") list.sort((a,b) => b.rating-a.rating);
  else list.sort((a,b) => new Date(a.date)-new Date(b.date));
  const el = document.getElementById("flightList");
  if (!list.length) { el.innerHTML=`<div class="empty-state"><i class="ti ti-mood-empty"></i><p>Uyğun uçuş tapılmadı.</p></div>`; return; }
  el.innerHTML = list.map(f => buildCard(f)).join("");
}

function buildCard(f) {
  const isOwner    = currentUser && f.uid === currentUser.uid;
  const isReal     = f.isReal === true;
  const typeBadges = f.types.map(t => `<span class="badge badge-gray">${t}</span>`).join("");
  const ratingBadge = f.rating > 0 ? `<span class="badge badge-amber">⭐ ${f.rating.toFixed(1)}</span>` : "";
  const realBadge  = isReal ? `<span class="badge badge-purple"><i class="ti ti-satellite"></i> Canlı OpenSky</span>` : "";
  const noteHTML   = f.note ? `<div class="flight-note">"${f.note}"</div>` : "";
  const ownerBadge = isOwner ? `<span class="badge badge-purple" style="font-size:11px">Siz</span>` : "";
  const footerBtn  = isOwner
    ? `<button class="btn-delete" onclick="deleteFlight(${f.id})"><i class="ti ti-trash"></i> Sil</button>`
    : isReal
      ? `<span style="font-size:12px;color:var(--text-light);font-style:italic">Bu real uçuş məlumatıdır</span>`
      : `<button class="contact-btn" onclick="openContact(${f.id})"><i class="ti ti-phone"></i> Əlaqə saxla</button>`;
  return `
    <div class="flight-card">
      <div class="flight-top">
        <div class="flight-route">
          <span class="city">${f.from}</span>
          <div class="route-arrow"><hr/><i class="ti ti-plane"></i><hr/></div>
          <span class="city">${f.to}</span>
        </div>
        <div class="flight-time">
          <div class="time">${f.time}</div>
          <div class="date">${formatDate(f.date)}</div>
        </div>
      </div>
      <div class="badge-list">
        <span class="badge badge-blue"><i class="ti ti-ticket"></i> ${f.ticket}</span>
        ${!isReal ? `<span class="badge badge-green"><i class="ti ti-weight"></i> ${f.weight} kq boş</span>` : ""}
        ${typeBadges} ${ratingBadge} ${realBadge}
      </div>
      ${noteHTML}
      <div class="flight-bottom">
        <div class="user-row">
          <div class="user-avatar-sm">${f.initials}</div>
          <div>
            <div class="user-name">${f.name} ${ownerBadge}</div>
            <div class="user-verified"><i class="ti ti-shield-check"></i> Yoxlanılmış istifadəçi</div>
          </div>
        </div>
        ${footerBtn}
      </div>
    </div>`;
}

function deleteFlight(id) {
  flights = flights.filter(f => f.id !== id);
  updateCounters(); renderFlights();
  showToast("Uçuş silindi");
}

function renderRequests() {
  const el     = document.getElementById("requestList");
  const myReqs = requests.filter(r => r.uid === currentUser.uid);
  if (!myReqs.length) { el.innerHTML=`<div class="empty-state"><i class="ti ti-inbox"></i><p>Hələ heç bir tələb göndərməmisiniz.</p></div>`; return; }
  el.innerHTML = myReqs.map(r => `
    <div class="flight-card">
      <div class="flight-top">
        <div class="flight-route">
          <span class="city">${r.from}</span>
          <div class="route-arrow"><hr/><i class="ti ti-package" style="color:var(--green)"></i><hr/></div>
          <span class="city">${r.to}</span>
        </div>
        <div class="flight-time">
          <div class="time" style="font-size:14px;color:var(--green)">${r.type}</div>
          <div class="date">${r.weight} kq</div>
        </div>
      </div>
      <div class="badge-list">
        <span class="badge badge-green">${r.type}</span>
        <span class="badge badge-gray">${r.weight} kq</span>
        <span class="badge badge-blue">${r.from} → ${r.to}</span>
      </div>
      <div class="flight-note">${r.desc}</div>
      <div class="flight-bottom">
        <div class="user-row">
          <div class="user-avatar-sm" style="background:#dcfce7;color:var(--green)">${r.initials}</div>
          <div>
            <div class="user-name">${r.name}</div>
            <div class="user-verified">${formatDate(r.createdAt.split("T")[0])}</div>
          </div>
        </div>
        <button class="btn-delete" onclick="deleteRequest(${r.id})"><i class="ti ti-trash"></i> Sil</button>
      </div>
    </div>`).join("");
}

function deleteRequest(id) {
  requests = requests.filter(r => r.id !== id);
  updateCounters(); renderRequests();
  showToast("Tələb silindi");
}

function openContact(id) {
  const f = flights.find(x => x.id === id);
  if (!f) return;
  if (!chatMessages[f.id]) chatMessages[f.id] = [];

  document.getElementById("modTitle").textContent = f.name;
  document.getElementById("modBody").innerHTML = `
    <div class="modal-row"><i class="ti ti-user"></i> <strong>${f.name}</strong></div>
    <div class="modal-row"><i class="ti ti-phone"></i> ${f.phone}</div>
    <div class="modal-row"><i class="ti ti-plane"></i> ${f.from} → ${f.to}</div>
    <div class="modal-row"><i class="ti ti-calendar"></i> ${formatDate(f.date)} — saat ${f.time}</div>
    <div class="modal-row"><i class="ti ti-ticket"></i> Bilet: <strong>${f.ticket}</strong></div>
    <div class="modal-row"><i class="ti ti-weight"></i> Boş çəki: <strong>${f.weight} kq</strong></div>
    <div class="modal-row"><i class="ti ti-package"></i> Qəbul edir: ${f.types.join(", ")}</div>
    ${f.note ? `<div style="padding:8px 12px;background:var(--bg-gray);border-radius:8px;font-size:13px;color:var(--text-gray);border-left:3px solid var(--blue-mid);margin:8px 0">"${f.note}"</div>` : ""}
    ${f.rating > 0 ? `<div class="modal-row"><i class="ti ti-star"></i> Reytinq: <strong>⭐ ${f.rating.toFixed(1)}</strong></div>` : ""}

    <div id="contactActions" style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary" style="flex:1" onclick="startChat(${f.id})">
        <i class="ti ti-message"></i> Əlaqə saxla
      </button>
      <button class="btn btn-outline" style="flex:1" onclick="closeModal()">
        <i class="ti ti-x"></i> Bağla
      </button>
    </div>

    <div id="chatSection" style="display:none;margin-top:14px">
      <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:10px">
        <div id="chatMessages" style="padding:12px;max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;background:var(--bg-gray);min-height:80px"></div>
        <div style="display:flex;gap:8px;padding:8px;border-top:1px solid var(--border);background:white">
          <input type="text" id="chatInput" placeholder="Mesajınızı yazın..."
            style="flex:1;border:1px solid var(--border);border-radius:6px;padding:8px 10px;font-size:13px;font-family:inherit"
            onkeydown="if(event.key==='Enter')sendChatMsg(${f.id})">
          <button onclick="sendChatMsg(${f.id})"
            style="background:var(--blue);color:white;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;font-size:16px">
            <i class="ti ti-send"></i>
          </button>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" style="flex:1" onclick="endChatAndRate(${f.id})">
          <i class="ti ti-star"></i> Bitir və qiymətləndir
        </button>
        <button class="btn btn-outline" style="flex:1" onclick="closeModal()">
          <i class="ti ti-x"></i> Bağla
        </button>
      </div>
    </div>

    <div id="ratingSection" style="display:none;margin-top:14px">
      <p style="font-size:14px;font-weight:600;margin-bottom:8px">Daşıyıcını qiymətləndir:</p>
      <div id="ratingStars" style="display:flex;gap:6px;margin-bottom:14px"></div>
      <button class="btn btn-primary" onclick="closeModal()">
        <i class="ti ti-check"></i> Bağla
      </button>
    </div>`;

  renderChatMessages(f.id);
  document.getElementById("contactModal").classList.add("open");
}

function startChat(fid) {
  document.getElementById("contactActions").style.display = "none";
  document.getElementById("chatSection").style.display    = "block";
  renderChatMessages(fid);
}

function sendChatMsg(fid) {
  const input = document.getElementById("chatInput");
  const text  = input.value.trim();
  if (!text) return;
  if (!chatMessages[fid]) chatMessages[fid] = [];
  chatMessages[fid].push({
    from:     currentUser.name,
    initials: currentUser.initials,
    text,
    time: new Date().toLocaleTimeString("az", { hour:"2-digit", minute:"2-digit" })
  });
  input.value = "";
  renderChatMessages(fid);
}

function renderChatMessages(fid) {
  const el = document.getElementById("chatMessages");
  if (!el) return;
  const msgs = chatMessages[fid] || [];
  if (!msgs.length) {
    el.innerHTML = `<p style="text-align:center;font-size:12px;color:var(--text-light);padding:10px">Hələ mesaj yoxdur. Salam deyin! 👋</p>`;
    return;
  }
  el.innerHTML = msgs.map(m => {
    const isMe = m.from === currentUser.name;
    return `
      <div style="display:flex;gap:8px;align-items:flex-end;${isMe ? "flex-direction:row-reverse" : ""}">
        <div style="width:26px;height:26px;border-radius:50%;background:${isMe?"var(--blue)":"var(--blue-mid)"};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:${isMe?"white":"var(--blue)"};flex-shrink:0">${m.initials}</div>
        <div style="max-width:72%">
          <div style="background:${isMe?"var(--blue)":"white"};color:${isMe?"white":"var(--text)"};padding:8px 12px;border-radius:${isMe?"12px 4px 12px 12px":"4px 12px 12px 12px"};font-size:13px;border:${isMe?"none":"1px solid var(--border)"};">${m.text}</div>
          <div style="font-size:11px;color:var(--text-light);margin-top:2px;text-align:${isMe?"right":"left"}">${m.time}</div>
        </div>
      </div>`;
  }).join("");
  el.scrollTop = el.scrollHeight;
}

function endChatAndRate(fid) {
  document.getElementById("chatSection").style.display   = "none";
  document.getElementById("ratingSection").style.display = "block";
  buildRatingStars(fid, 0);
}

function buildRatingStars(fid, hover) {
  const el = document.getElementById("ratingStars");
  if (!el) return;
  el.innerHTML = [1,2,3,4,5].map(i =>
    `<span style="font-size:32px;cursor:pointer;color:${i<=hover?"#f59e0b":"var(--border)"};transition:color .1s"
      onmouseover="buildRatingStars(${fid},${i})"
      onmouseout="buildRatingStars(${fid},0)"
      onclick="submitRating(${fid},${i})">★</span>`
  ).join("");
}

function submitRating(fid, val) {
  const f = flights.find(x => x.id === fid);
  if (!f) return;
  f.rating      = parseFloat(((f.rating * f.ratingCount + val) / (f.ratingCount + 1)).toFixed(1));
  f.ratingCount += 1;
  showToast("Reytinqiniz üçün təşəkkür! ⭐","success");
  closeModal();
  renderFlights();
}

function closeModal() {
  document.getElementById("contactModal").classList.remove("open");
}

function submitSupport() {
  const name    = document.getElementById("supName").value.trim();
  const email   = document.getElementById("supEmail").value.trim();
  const subject = document.getElementById("supSubject").value;
  const msg     = document.getElementById("supMsg").value.trim();
  if (!name||!email||!subject||!msg) { showToast("Bütün sahələri doldurun","warn"); return; }
  ["supName","supEmail","supMsg"].forEach(id => document.getElementById(id).value="");
  document.getElementById("supSubject").value = "";
  document.getElementById("supportSuccess").style.display = "flex";
  setTimeout(() => { document.getElementById("supportSuccess").style.display="none"; }, 5000);
  showToast("Müraciətiniz göndərildi! Tezliklə cavab veriləcək ✅","success");
}

function updateCounters() {
  document.getElementById("flightCount").textContent = flights.length;
  document.getElementById("reqCount").textContent    = requests.length;
  if (currentUser) {
    document.getElementById("myFlightCount").textContent = flights.filter(f => f.uid===currentUser.uid).length;
    document.getElementById("myReqCount").textContent    = requests.filter(r => r.uid===currentUser.uid).length;
  }
}

function showToast(msg, type) {
  const el   = document.getElementById("toast");
  el.textContent = msg;
  el.className   = "toast show " + (type || "success");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3200);
}

function formatDate(str) {
  const d = new Date(str);
  return d.getDate().toString().padStart(2,"0") + "." +
    (d.getMonth()+1).toString().padStart(2,"0") + "." + d.getFullYear();
}

updateCounters();