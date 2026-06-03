


const API_KEY = "YOUR_API_KEY"; 
const API_URL = "http://api.aviationstack.com/v1/flights";


let currentUser = null;
let flights = [
  {
    id: 1, uid: "demo",
    name: "Kamran Nesirov", initials: "KN", phone: "+994 50 211 45 67",
    from: "Baki", to: "Istanbul", date: "2025-06-04", time: "19:00",
    ticket: "TK 198", weight: 7,
    types: ["Geyim", "Senad", "Derman"],
    note: "Kicik baglamalar goture bilerem.",
    rating: 4.7, ratingCount: 12
  },
  {
    id: 2, uid: "u2",
    name: "Leyla Memmedova", initials: "LM", phone: "+994 55 334 89 01",
    from: "Baki", to: "Moskva", date: "2025-06-05", time: "14:30",
    ticket: "S7 742", weight: 5,
    types: ["Senad", "Elektronika"],
    note: "Kovrek esyalari goture bilerem.",
    rating: 4.2, ratingCount: 8
  },
  {
    id: 3, uid: "u3",
    name: "Rauf Quliyev", initials: "RQ", phone: "+994 70 456 12 34",
    from: "Baki", to: "Dubay", date: "2025-06-07", time: "22:15",
    ticket: "FZ 329", weight: 10,
    types: ["Geyim", "Erzaq", "Diger"],
    note: "5 kq-ya qeder goture bilerem.",
    rating: 5.0, ratingCount: 3
  },
  {
    id: 4, uid: "u4",
    name: "Nermin Huseynova", initials: "NH", phone: "+994 51 789 01 23",
    from: "Baki", to: "London", date: "2025-06-10", time: "07:45",
    ticket: "BA 722", weight: 8,
    types: ["Senad", "Geyim"],
    note: "",
    rating: 0, ratingCount: 0
  }
];
let requests = [];
let uploadedFiles = { idFront: null, idBack: null, itemImg: null };
let myRatingValue = 0;




function switchAuthTab(tab) {
  document.getElementById("atab-login").classList.toggle("active", tab === "login");
  document.getElementById("atab-signup").classList.toggle("active", tab === "signup");
  document.getElementById("loginForm").style.display = tab === "login" ? "block" : "none";
  document.getElementById("signupForm").style.display = tab === "signup" ? "block" : "none";
}

function doLogin() {
  const email = document.getElementById("lEmail").value.trim();
  const pass  = document.getElementById("lPass").value;

  if (!email || !pass) { showToast("E-poct ve sifre daxil edin", "warn"); return; }

  if (email === "demo@test.com" && pass === "123456") {
    currentUser = {
      uid: "demo", name: "Kamran Nesirov", email,
      phone: "+994 50 211 45 67", initials: "KN", verified: true
    };
    enterApp();
    return;
  }

  const saved = localStorage.getItem("bf_users");
  if (saved) {
    const found = JSON.parse(saved).find(u => u.email === email && u.pass === pass);
    if (found) { currentUser = found; enterApp(); return; }
  }

  showToast("E-poct ve ya sifre yanlisd ir", "danger");
}

function doSignup() {
  const ad    = document.getElementById("sAd").value.trim();
  const soyad = document.getElementById("sSoyad").value.trim();
  const email = document.getElementById("sEmail").value.trim();
  const phone = document.getElementById("sPhone").value.trim();
  const pass  = document.getElementById("sPass").value;
  const pass2 = document.getElementById("sPass2").value;
  const agree = document.getElementById("agreeTerms").checked;

  if (!ad || !soyad || !email || !phone || !pass) { showToast("Butun mecburi saheleri doldurun", "warn"); return; }
  if (pass !== pass2) { showToast("Sifreler uygun gelmir", "danger"); return; }
  if (pass.length < 6) { showToast("Sifre en az 6 simvol olmalidir", "warn"); return; }
  if (!uploadedFiles.idFront || !uploadedFiles.idBack) { showToast("Sexsiyyet vesiqenizin her iki uzunu yukleyin", "warn"); return; }
  if (!agree) { showToast("Melumatların ishlenmesine raziliq verin", "warn"); return; }

  const initials = (ad[0] + (soyad[0] || "")).toUpperCase();
  const newUser  = { uid: "u_" + Date.now(), name: ad + " " + soyad, email, phone, pass, initials, verified: true };

  const saved = localStorage.getItem("bf_users");
  const list  = saved ? JSON.parse(saved) : [];
  if (list.find(u => u.email === email)) { showToast("Bu e-poct artiq qeydiyyatdadir", "danger"); return; }

  list.push(newUser);
  localStorage.setItem("bf_users", JSON.stringify(list));
  currentUser = newUser;
  showToast("Qeydiyyat ugurla tamamlandi!", "success");
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
  
}

function doLogout() {
  currentUser = null;
  document.getElementById("appScreen").classList.remove("visible");
  document.getElementById("authScreen").style.display = "flex";
  switchTab("browse");
  showToast("Hesabdan cixdiniz");
}




function switchTab(name) {
  ["browse", "add", "send", "myRequests", "profile"].forEach(t => {
    document.getElementById("tab-"   + t).classList.toggle("active", t === name);
    document.getElementById("panel-" + t).classList.toggle("active", t === name);
  });
  if (name === "myRequests") renderRequests();
}





async function lookupFlight() {
  const rawInput  = document.getElementById("aTicket").value.trim().toUpperCase();

  if (rawInput.length < 4) return;

  
  showFlightLookupStatus("loading");

  
  const match = rawInput.match(/^([A-Z]{2,3})\s*(\d+)$/);
  if (!match) {
    showFlightLookupStatus("error", "Yanlis format. Misal: TK198 ve ya TK 198");
    return;
  }

  const iataCode    = match[1];
  const flightNum   = match[2];

  try {
   
    const url = `${API_URL}?access_key=${API_KEY}&flight_iata=${iataCode}${flightNum}&limit=1`;
    const res  = await fetch(url);
    const data = await res.json();

    
    if (data.error) {
      showFlightLookupStatus("error", "API xetasi: " + data.error.info);
      return;
    }

    
    const flightData = data.data && data.data[0];

    if (!flightData) {
      showFlightLookupStatus("error", "Bu reys tapilmadi. Yeniden yoxlayin.");
      return;
    }

    
    fillFlightForm(flightData);
    showFlightLookupStatus("success", "Ucush melumatlari tapildi ve dolduruldu!");

  } catch (err) {
    
    showFlightLookupStatus("error", "Sorgu ugursuz oldu. API key-i yoxlayin.");
    console.error("API xetasi:", err);
  }
}


function fillFlightForm(data) {
 
  const depCity = data.departure?.airport || data.departure?.iata || "";
  document.getElementById("aFrom").value = depCity;

  
  const arrCity = data.arrival?.airport || data.arrival?.iata || "";
  document.getElementById("aTo").value = arrCity;

  
  const scheduledDep = data.departure?.scheduled;
  if (scheduledDep) {
    const dateObj  = new Date(scheduledDep);
    
    const dateStr  = dateObj.toISOString().split("T")[0];
    const timeStr  = dateObj.toTimeString().slice(0, 5);
    document.getElementById("aDate").value = dateStr;
    document.getElementById("aTime").value = timeStr;
  }
}


function showFlightLookupStatus(type, message) {
  const el = document.getElementById("flightLookupStatus");
  if (!el) return;

  const styles = {
    loading: { bg: "#eff6ff", color: "#1d4ed8", icon: "ti-loader-2 spin", text: "Axtarılır..." },
    success: { bg: "#f0fdf4", color: "#15803d", icon: "ti-circle-check",  text: message },
    error:   { bg: "#fef2f2", color: "#dc2626", icon: "ti-alert-circle",  text: message }
  };

  const s = styles[type];
  el.style.display      = "flex";
  el.style.background   = s.bg;
  el.style.color        = s.color;
  el.style.border       = `1px solid ${s.color}30`;
  el.innerHTML = `<i class="ti ${s.icon}" style="font-size:16px; flex-shrink:0"></i> ${s.text}`;

  
  if (type !== "loading") {
    setTimeout(() => { el.style.display = "none"; }, 5000);
  }
}




function fileChosen(input, key, areaId, prevId) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast("Fayl 5 MB-dan boyukdur", "warn"); return; }
  uploadedFiles[key] = file;
  document.getElementById(prevId + "name").textContent = file.name;
  document.getElementById(prevId).classList.add("show");
  document.getElementById(areaId).style.borderColor = "var(--success)";
}

function clearFile(key, areaId, prevId) {
  uploadedFiles[key] = null;
  document.getElementById(prevId).classList.remove("show");
  document.getElementById(areaId).style.borderColor = "";
}

function dragOver(event, areaId) {
  event.preventDefault();
  document.getElementById(areaId).classList.add("drag");
}

function dragLeave(areaId) {
  document.getElementById(areaId).classList.remove("drag");
}

function dropFile(event, key, areaId, prevId) {
  event.preventDefault();
  document.getElementById(areaId).classList.remove("drag");
  const file = event.dataTransfer.files[0];
  if (file) {
    uploadedFiles[key] = file;
    document.getElementById(prevId + "name").textContent = file.name;
    document.getElementById(prevId).classList.add("show");
    document.getElementById(areaId).style.borderColor = "var(--success)";
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

  if (!from || !to || !date || !time || !ticket || !weight) {
    showToast("Butun mecburi saheleri doldurun", "warn");
    return;
  }
  if (types.length === 0) {
    showToast("En az 1 esya novu secin", "warn");
    return;
  }

  flights.unshift({
    id: Date.now(), uid: currentUser.uid,
    name: currentUser.name, initials: currentUser.initials,
    phone: currentUser.phone,
    from, to, date, time, ticket, weight, types, note,
    rating: 0, ratingCount: 0
  });

  ["aFrom", "aTo", "aDate", "aTime", "aTicket", "aWeight", "aNote"]
    .forEach(id => document.getElementById(id).value = "");
  document.querySelectorAll("#typeChecks input").forEach(cb => {
    cb.checked = false;
    cb.closest(".check-item").classList.remove("on");
  });

  const statusEl = document.getElementById("flightLookupStatus");
  if (statusEl) statusEl.style.display = "none";

  updateCounters();
  showToast("Ucushunuz elave edildi! ✈️", "success");
  switchTab("browse");
  renderFlights();
}




function sendRequest() {
  const from   = document.getElementById("rFrom").value.trim();
  const to     = document.getElementById("rTo").value.trim();
  const type   = document.getElementById("rType").value;
  const weight = document.getElementById("rWeight").value;
  const desc   = document.getElementById("rDesc").value.trim();

  if (!from || !to || !type || !weight || !desc) {
    showToast("Butun mecburi saheleri doldurun", "warn");
    return;
  }

  requests.push({
    id: Date.now(),
    uid: currentUser.uid,
    name: currentUser.name,
    initials: currentUser.initials,
    phone: currentUser.phone,
    from, to, type, weight, desc,
    createdAt: new Date().toISOString()
  });

  ["rFrom", "rTo", "rWeight", "rDesc"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("rType").value = "";
  clearFile("itemImg", "ua3", "prev3");
  updateCounters();
  renderRequests();
  showToast("Telebiniz gonderildi! Dasiyici sizinle elaqe saxlayacaq", "success");
  switchTab("myRequests");
}




function renderFlights() {
  const city   = (document.getElementById("fCity").value || "").toLowerCase();
  const type   = document.getElementById("fType").value;
  const sortBy = document.getElementById("fSort").value;

  let list = flights.filter(f => {
    const cityOk = !city || f.to.toLowerCase().includes(city) || f.from.toLowerCase().includes(city);
    const typeOk = !type || f.types.includes(type);
    return cityOk && typeOk;
  });

  if (sortBy === "weight")  list.sort((a, b) => b.weight - a.weight);
  else if (sortBy === "rating") list.sort((a, b) => b.rating - a.rating);
  else list.sort((a, b) => new Date(a.date) - new Date(b.date));

  const el = document.getElementById("flightList");

  if (!list.length) {
    el.innerHTML = `<div class="empty"><i class="ti ti-mood-empty"></i><p>Uygun ucush tapilmadi.</p></div>`;
    return;
  }

  el.innerHTML = list.map(f => buildFlightCard(f)).join("");
}

function buildFlightCard(f) {
  const date    = formatDate(f.date);
  const isOwner = currentUser && f.uid === currentUser.uid;

  const typeBadges   = f.types.map(t => `<span class="badge badge-gray">${t}</span>`).join("");
  const ratingBadge  = f.rating > 0 ? `<span class="badge badge-amber">⭐ ${f.rating.toFixed(1)}</span>` : "";
  const noteHTML     = f.note ? `<div class="flight-note">"${f.note}"</div>` : "";
  const ownerBadge   = isOwner ? `<span class="badge badge-purple" style="font-size:11px">Siz</span>` : "";
  const footerBtn    = isOwner
    ? `<button class="btn-danger-sm" onclick="deleteFlight(${f.id})"><i class="ti ti-trash"></i> Sil</button>`
    : `<button class="contact-btn" onclick="openContactModal(${f.id})"><i class="ti ti-phone"></i> Elaqe saxla</button>`;

  return `
    <div class="flight-card">
      <div class="flight-top">
        <div class="flight-route">
          <span class="city">${f.from}</span>
          <div class="route-line">
            <hr/><i class="ti ti-plane" style="font-size:16px;color:var(--primary)"></i><hr/>
          </div>
          <span class="city">${f.to}</span>
        </div>
        <div class="flight-time-block">
          <div class="ft-time">${f.time}</div>
          <div class="ft-date">${date}</div>
        </div>
      </div>
      <div class="flight-meta">
        <span class="badge badge-blue"><i class="ti ti-ticket"></i> ${f.ticket}</span>
        <span class="badge badge-green"><i class="ti ti-weight"></i> ${f.weight} kq bos</span>
        ${typeBadges}
        ${ratingBadge}
      </div>
      ${noteHTML}
      <div class="flight-footer">
        <div class="person-row">
          <div class="avatar">${f.initials}</div>
          <div>
            <div class="person-name">${f.name} ${ownerBadge}</div>
            <div class="person-sub verified-tag">
              <i class="ti ti-shield-check"></i> Yoxlanilmish istifadeci
            </div>
          </div>
        </div>
        ${footerBtn}
      </div>
    </div>`;
}

function deleteFlight(id) {
  flights = flights.filter(f => f.id !== id);
  updateCounters();
  renderFlights();
  showToast("Ucush silindi");
}




function openContactModal(id) {
  const f = flights.find(x => x.id === id);
  if (!f) return;

  document.getElementById("modTitle").textContent = f.name;
  document.getElementById("modBody").innerHTML = `
    <div class="contact-row"><i class="ti ti-user"></i> <strong>${f.name}</strong></div>
    <div class="contact-row"><i class="ti ti-phone"></i>
      <a href="tel:${f.phone}" style="color:var(--primary)">${f.phone}</a></div>
    <div class="contact-row"><i class="ti ti-plane"></i> ${f.from} → ${f.to}</div>
    <div class="contact-row"><i class="ti ti-calendar"></i> ${formatDate(f.date)} — saat ${f.time}</div>
    <div class="contact-row"><i class="ti ti-ticket"></i> Bilet: <strong>${f.ticket}</strong></div>
    <div class="contact-row"><i class="ti ti-weight"></i> Bos ceki: <strong>${f.weight} kq</strong></div>
    <div class="contact-row"><i class="ti ti-package"></i> Qebul edir: ${f.types.join(", ")}</div>
    ${f.note ? `<div style="margin:10px 0;padding:10px 12px;background:var(--bg2);border-radius:var(--radius-xs);font-size:13px;color:var(--text2);border-left:3px solid var(--primary-mid)">"${f.note}"</div>` : ""}
    ${f.rating > 0 ? `<div class="contact-row"><i class="ti ti-star"></i> Reytinq: <strong>⭐ ${f.rating.toFixed(1)}</strong> (${f.ratingCount} defe)</div>` : ""}
    <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
      <div style="font-size:12px;color:var(--text3);margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Bu dasiyicini qiymetlendir</div>
      <div id="modalStars" style="display:flex;gap:4px"></div>
    </div>
    <button class="btn btn-primary btn-full" style="margin-top:14px" onclick="closeModal()">
      <i class="ti ti-check"></i> Baghla
    </button>`;

  renderModalStars(id, 0);
  document.getElementById("contactModal").classList.add("open");
}

function renderModalStars(fid, hover) {
  const el = document.getElementById("modalStars");
  if (!el) return;
  el.innerHTML = [1,2,3,4,5].map(i => `
    <span style="font-size:26px;color:${i<=hover?"#f59e0b":"var(--border2)"};cursor:pointer;transition:color .1s"
      onmouseover="renderModalStars(${fid},${i})"
      onmouseout="renderModalStars(${fid},0)"
      onclick="rateCarrier(${fid},${i})">★</span>`).join("");
}

function rateCarrier(fid, val) {
  const f = flights.find(x => x.id === fid);
  if (!f) return;
  f.rating = parseFloat(((f.rating * f.ratingCount + val) / (f.ratingCount + 1)).toFixed(1));
  f.ratingCount++;
  showToast("Reytinqiniz ucun teshekkur! ⭐", "success");
  closeModal();
  renderFlights();
}

function closeModal() {
  document.getElementById("contactModal").classList.remove("open");
}











function updateCounters() {
  document.getElementById("flightCount").textContent = flights.length;
  document.getElementById("reqCount").textContent    = requests.length;
  if (currentUser) {
    document.getElementById("myFlightCount").textContent = flights.filter(f => f.uid === currentUser.uid).length;
    document.getElementById("myReqCount").textContent    = requests.filter(r => r.uid === currentUser.uid).length;
  }
}




function showToast(msg, type) {
  const el = document.getElementById("toast");
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

function clearLookupStatus() {
  const el = document.getElementById("flightLookupStatus");
  if (el) el.style.display = "none";
}

function validatePhone(input) {
  input.value = input.value.replace(/[^0-9+ ]/g, "");
}

function renderRequests() {
  const el = document.getElementById("requestList");
  if (!el) return;

  const myReqs = requests.filter(r => r.uid === currentUser.uid);

  if (myReqs.length === 0) {
    el.innerHTML = `<div class="empty"><i class="ti ti-inbox"></i><p>Hele hec bir teleb gondermemisiniz.</p></div>`;
    return;
  }

  el.innerHTML = myReqs.map(r => `
    <div class="flight-card">
      <div class="flight-top">
        <div class="flight-route">
          <span class="city">${r.from}</span>
          <div class="route-line">
            <hr/><i class="ti ti-package" style="font-size:16px;color:var(--success)"></i><hr/>
          </div>
          <span class="city">${r.to}</span>
        </div>
        <div class="flight-time-block">
          <div class="ft-time" style="font-size:14px;color:var(--success)">${r.type}</div>
          <div class="ft-date">${r.weight} kq</div>
        </div>
      </div>
      <div class="flight-meta">
        <span class="badge badge-green"><i class="ti ti-package"></i> ${r.type}</span>
        <span class="badge badge-gray"><i class="ti ti-weight"></i> ${r.weight} kq</span>
        <span class="badge badge-blue">${r.from} → ${r.to}</span>
      </div>
      <div class="flight-note">${r.desc}</div>
      <div class="flight-footer">
        <div class="person-row">
          <div class="avatar" style="background:#dcfce7;color:var(--success)">${r.initials}</div>
          <div>
            <div class="person-name">${r.name}</div>
            <div class="person-sub">${formatDate(r.createdAt.split("T")[0])}</div>
          </div>
        </div>
        <button class="btn-danger-sm" onclick="deleteRequest(${r.id})">
          <i class="ti ti-trash"></i> Sil
        </button>
      </div>
    </div>`).join("");
}

function deleteRequest(id) {
  requests = requests.filter(r => r.id !== id);
  updateCounters();
  renderRequests();
  showToast("Teleb silindi");
}