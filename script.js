var currentUser = null;
var requests = [];
var chatMessages = {};
var uploadedFiles = {
    idFront: null,
    idBack: null,
    itemImg: null
};

var flights = [
    {
        id: 1,
        uid: "demo",
        name: "Kamran Nesirov",
        initials: "KN",
        phone: "+994 50 211 45 67",
        from: "Baki",
        to: "Istanbul",
        date: "2025-06-10",
        time: "19:00",
        ticket: "TK 198",
        weight: 7,
        types: ["Geyim", "Senad", "Derman"],
        note: "Kicik baglamalar goture bilerem.",
        rating: 4.7,
        ratingCount: 12
    },
    {
        id: 2,
        uid: "u2",
        name: "Leyla Memmedova",
        initials: "LM",
        phone: "+994 55 334 89 01",
        from: "Baki",
        to: "Moskva",
        date: "2025-06-11",
        time: "14:30",
        ticket: "S7 742",
        weight: 5,
        types: ["Senad", "Elektronika"],
        note: "Kovrek esyalari goture bilerem.",
        rating: 4.2,
        ratingCount: 8
    },
    {
        id: 3,
        uid: "u3",
        name: "Rauf Quliyev",
        initials: "RQ",
        phone: "+994 70 456 12 34",
        from: "Baki",
        to: "Dubay",
        date: "2025-06-12",
        time: "22:15",
        ticket: "FZ 329",
        weight: 10,
        types: ["Geyim", "Erzaq", "Diger"],
        note: "5 kq-ya qeder goture bilerem.",
        rating: 5.0,
        ratingCount: 3
    },
    {
        id: 4,
        uid: "u4",
        name: "Nermin Huseynova",
        initials: "NH",
        phone: "+994 51 789 01 23",
        from: "Baki",
        to: "London",
        date: "2025-06-13",
        time: "07:45",
        ticket: "BA 722",
        weight: 8,
        types: ["Senad", "Geyim"],
        note: "",
        rating: 0,
        ratingCount: 0
    },
    {
        id: 5,
        uid: "u5",
        name: "Tural Babayev",
        initials: "TB",
        phone: "+994 55 612 33 21",
        from: "Baki",
        to: "Berlin",
        date: "2025-06-14",
        time: "10:20",
        ticket: "LH 693",
        weight: 6,
        types: ["Elektronika", "Geyim"],
        note: "Yalniz kicik qutu goture bilerem.",
        rating: 4.5,
        ratingCount: 6
    },
    {
        id: 6,
        uid: "u6",
        name: "Ayten Rzayeva",
        initials: "AR",
        phone: "+994 70 881 44 56",
        from: "Baki",
        to: "Paris",
        date: "2025-06-15",
        time: "08:55",
        ticket: "AF 875",
        weight: 4,
        types: ["Senad", "Derman"],
        note: "Derman ve senad gonderenlere ustunluk verirem.",
        rating: 4.8,
        ratingCount: 15
    },
    {
        id: 7,
        uid: "u7",
        name: "Elvin Hesenov",
        initials: "EH",
        phone: "+994 51 320 77 90",
        from: "Baki",
        to: "Amsterdam",
        date: "2025-06-16",
        time: "16:40",
        ticket: "KL 456",
        weight: 9,
        types: ["Geyim", "Erzaq", "Diger"],
        note: "Her nov esya goture bilerem.",
        rating: 3.9,
        ratingCount: 4
    }
];


function getUserLocation() {
    fetch("https://ipapi.co/json")
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            var city = data.city;

            if (city) {
                var fromInput = document.getElementById("aFrom");
                var reqInput  = document.getElementById("rFrom");

                if (fromInput.value === "") {
                    fromInput.value = city;
                }

                if (reqInput.value === "") {
                    reqInput.value = city;
                }
            }
        })
        .catch(function(error) {
            console.log("Mekan tapilmadi: " + error);
        });
}


function loadRealFlights() {
    var statusEl = document.getElementById("realFlightsStatus");
    statusEl.style.display = "flex";
    statusEl.innerHTML = '<i class="ti ti-loader-2 spin"></i> Baki hava limanindan ucuslar yuklenir...';

    var now   = Math.floor(Date.now() / 1000);
    var begin = now - 7200;
    var url   = "https://opensky-network.org/api/flights/departure?airport=UBBB&begin=" + begin + "&end=" + now;

    fetch(url)
        .then(function(response) {
            if (response.ok === false) {
                throw new Error("API cavab vermedi");
            }
            return response.json();
        })
        .then(function(data) {
            if (!data || data.length === 0) {
                statusEl.innerHTML = '<i class="ti ti-info-circle"></i> Hazirda aktiv ucus tapilmadi.';
                setTimeout(function() {
                    statusEl.style.display = "none";
                }, 4000);
                return;
            }

            var addedCount = 0;
            var i = 0;

            while (i < data.length && i < 5) {
                var item   = data[i];
                var ticket = "";

                if (item.callsign) {
                    ticket = item.callsign.trim();
                } else {
                    ticket = "—";
                }

                var alreadyExists = false;
                var j = 0;
                while (j < flights.length) {
                    if (flights[j].ticket === ticket) {
                        alreadyExists = true;
                    }
                    j++;
                }

                if (alreadyExists === false) {
                    var newRealFlight = {
                        id:          9000 + i,
                        uid:         "opensky",
                        name:        "OpenSky Melumati",
                        initials:    "OS",
                        phone:       "—",
                        from:        item.estDepartureAirport || "UBBB",
                        to:          item.estArrivalAirport   || "—",
                        date:        new Date(item.firstSeen * 1000).toISOString().split("T")[0],
                        time:        new Date(item.firstSeen * 1000).toTimeString().slice(0, 5),
                        ticket:      ticket,
                        weight:      0,
                        types:       [],
                        note:        "Bu məlumat OpenSky Network API-dən real vaxtda alınır.",
                        rating:      0,
                        ratingCount: 0,
                        isReal:      true
                    };
                    flights.push(newRealFlight);
                    addedCount++;
                }

                i++;
            }

            statusEl.innerHTML = '<i class="ti ti-circle-check"></i> ' + addedCount + ' real uçuş yükləndi (OpenSky API)';
            setTimeout(function() {
                statusEl.style.display = "none";
            }, 4000);

            renderFlights();
            updateCounters();
        })
        .catch(function(error) {
            statusEl.innerHTML = '<i class="ti ti-alert-circle"></i> Real uçuş məlumatı yüklənilmədi.';
            setTimeout(function() {
                statusEl.style.display = "none";
            }, 4000);
        });
}


function switchAuthTab(tab) {
    if (tab === "login") {
        document.getElementById("loginForm").style.display  = "block";
        document.getElementById("signupForm").style.display = "none";
        document.getElementById("atab-login").classList.add("active");
        document.getElementById("atab-signup").classList.remove("active");
    } else {
        document.getElementById("loginForm").style.display  = "none";
        document.getElementById("signupForm").style.display = "block";
        document.getElementById("atab-login").classList.remove("active");
        document.getElementById("atab-signup").classList.add("active");
    }
}


function doLogin() {
    var email = document.getElementById("lEmail").value.trim();
    var pass  = document.getElementById("lPass").value;

    if (email === "" || pass === "") {
        showToast("E-poçt və şifrə daxil edin", "warn");
        return;
    }

    if (email === "demo@test.com" && pass === "123456") {
        currentUser = {
            uid:      "demo",
            name:     "Kamran Nesirov",
            email:    email,
            phone:    "+994 50 211 45 67",
            initials: "KN",
            verified: true
        };
        enterApp();
        return;
    }

    var saved = localStorage.getItem("bf_users");

    if (saved === null) {
        showToast("E-poçt və ya şifrə yanlışdır", "danger");
        return;
    }

    var userList = JSON.parse(saved);
    var found    = null;
    var i        = 0;

    while (i < userList.length) {
        if (userList[i].email === email && userList[i].pass === pass) {
            found = userList[i];
        }
        i++;
    }

    if (found === null) {
        showToast("E-poçt və ya şifrə yanlışdır", "danger");
        return;
    }

    currentUser = found;
    enterApp();
}


function doSignup() {
    var firstName = document.getElementById("sAd").value.trim();
    var lastName  = document.getElementById("sSoyad").value.trim();
    var email     = document.getElementById("sEmail").value.trim();
    var phone     = document.getElementById("sPhone").value.trim();
    var pass      = document.getElementById("sPass").value;
    var pass2     = document.getElementById("sPass2").value;
    var agree     = document.getElementById("agreeTerms").checked;

    if (firstName === "" || lastName === "" || email === "" || phone === "" || pass === "") {
        showToast("Bütün məcburi sahələri doldurun", "warn");
        return;
    }

    var isGmail = /^[a-zA-Z0-9._%+-]+@gmail.com$/.test(email);
    if (isGmail === false) {
        showToast("Düzgün mail yazmağınız xahiş olunur", "warn");
        return;
    }

    if (pass !== pass2) {
        showToast("Şifrələr uyğun gəlmir", "danger");
        return;
    }

    if (pass.length < 6) {
        showToast("Şifrə ən az 6 simvol olmalıdır", "warn");
        return;
    }

    if (uploadedFiles.idFront === null || uploadedFiles.idBack === null) {
        showToast("Şəxsiyyət vəsiqənizin hər iki üzünü yükləyin", "warn");
        return;
    }

    if (uploadedFiles.idFront.name === uploadedFiles.idBack.name) {
        showToast("Ön üz və arxa üz üçün fərqli şəkillər yükləyin", "warn");
        return;
    }

    if (agree === false) {
        showToast("Məlumatların işlənməsinə razılıq verin", "warn");
        return;
    }

    var initials = firstName[0].toUpperCase() + lastName[0].toUpperCase();

    var newUser = {
        uid:      "u_" + Date.now(),
        name:     firstName + " " + lastName,
        email:    email,
        phone:    phone,
        pass:     pass,
        initials: initials,
        verified: true
    };

    var saved    = localStorage.getItem("bf_users");
    var userList = [];

    if (saved !== null) {
        userList = JSON.parse(saved);
    }

    var alreadyExists = false;
    var i = 0;

    while (i < userList.length) {
        if (userList[i].email === email) {
            alreadyExists = true;
        }
        i++;
    }

    if (alreadyExists === true) {
        showToast("Bu e-poçt artıq qeydiyyatdadır", "danger");
        return;
    }

    userList.push(newUser);
    localStorage.setItem("bf_users", JSON.stringify(userList));

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
    document.getElementById("profPhone").textContent    = currentUser.phone;

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
    var tabList = ["browse", "add", "send", "myRequests", "profile", "support"];
    var i = 0;

    while (i < tabList.length) {
        var tabBtn = document.getElementById("tab-"   + tabList[i]);
        var panel  = document.getElementById("panel-" + tabList[i]);

        if (tabBtn !== null) {
            if (tabList[i] === name) {
                tabBtn.classList.add("active");
            } else {
                tabBtn.classList.remove("active");
            }
        }

        if (panel !== null) {
            if (tabList[i] === name) {
                panel.classList.add("active");
            } else {
                panel.classList.remove("active");
            }
        }

        i++;
    }

    if (name === "myRequests") {
        renderRequests();
    }
}


function validatePhone(input) {
    input.value = input.value.replace(/[^0-9+ ]/g, "");
}


function fileChosen(input, key, areaId, prevId) {
    var file = input.files[0];

    if (!file) {
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast("Fayl 5 MB-dan böyükdür", "warn");
        input.value = "";
        return;
    }

    if (key === "idBack") {
        if (uploadedFiles.idFront !== null && file.name === uploadedFiles.idFront.name) {
            showToast("Ön üz və arxa üz üçün fərqli şəkillər yükləyin", "warn");
            input.value = "";
            return;
        }
    }

    if (key === "idFront") {
        if (uploadedFiles.idBack !== null && file.name === uploadedFiles.idBack.name) {
            showToast("Ön üz və arxa üz üçün fərqli şəkillər yükləyin", "warn");
            input.value = "";
            return;
        }
    }

    uploadedFiles[key] = file;
    document.getElementById(prevId + "name").textContent = file.name;
    document.getElementById(prevId).classList.add("show");
    document.getElementById(areaId).style.borderColor = "var(--green)";
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
    var file = event.dataTransfer.files[0];

    if (file) {
        uploadedFiles[key] = file;
        document.getElementById(prevId + "name").textContent = file.name;
        document.getElementById(prevId).classList.add("show");
        document.getElementById(areaId).style.borderColor = "var(--green)";
    }
}


function chk(el) {
    if (el.checked === true) {
        el.closest(".check-item").classList.add("on");
    } else {
        el.closest(".check-item").classList.remove("on");
    }
}


function addFlight() {
    var from   = document.getElementById("aFrom").value.trim();
    var to     = document.getElementById("aTo").value.trim();
    var date   = document.getElementById("aDate").value;
    var time   = document.getElementById("aTime").value;
    var ticket = document.getElementById("aTicket").value.trim();
    var weight = parseFloat(document.getElementById("aWeight").value);
    var note   = document.getElementById("aNote").value.trim();

    var checkboxes = document.querySelectorAll("#typeChecks input:checked");
    var types = [];
    var i = 0;

    while (i < checkboxes.length) {
        types.push(checkboxes[i].value);
        i++;
    }

    if (from === "" || to === "" || date === "" || time === "" || isNaN(weight)) {
        showToast("Bütün məcburi sahələri doldurun", "warn");
        return;
    }

    if (types.length === 0) {
        showToast("ən az 1 əşya növü seçin", "warn");
        return;
    }

    var newFlight = {
        id:          Date.now(),
        uid:         currentUser.uid,
        name:        currentUser.name,
        initials:    currentUser.initials,
        phone:       currentUser.phone,
        from:        from,
        to:          to,
        date:        date,
        time:        time,
        ticket:      ticket,
        weight:      weight,
        types:       types,
        note:        note,
        rating:      0,
        ratingCount: 0
    };

    flights.unshift(newFlight);

    document.getElementById("aFrom").value   = "";
    document.getElementById("aTo").value     = "";
    document.getElementById("aDate").value   = "";
    document.getElementById("aTime").value   = "";
    document.getElementById("aTicket").value = "";
    document.getElementById("aWeight").value = "";
    document.getElementById("aNote").value   = "";

    var allCheckboxes = document.querySelectorAll("#typeChecks input");
    var j = 0;
    while (j < allCheckboxes.length) {
        allCheckboxes[j].checked = false;
        allCheckboxes[j].closest(".check-item").classList.remove("on");
        j++;
    }

    updateCounters();
    showToast("Uçuşunuz əlavə edildi! ", "success");
    switchTab("browse");
    renderFlights();
}


function sendRequest() {
    var from   = document.getElementById("rFrom").value.trim();
    var to     = document.getElementById("rTo").value.trim();
    var type   = document.getElementById("rType").value;
    var weight = document.getElementById("rWeight").value;
    var desc   = document.getElementById("rDesc").value.trim();

    if (from === "" || to === "" || type === "" || weight === "" || desc === "") {
        showToast("Bütün məcburi sahələri doldurun", "warn");
        return;
    }

    var newRequest = {
        id:        Date.now(),
        uid:       currentUser.uid,
        name:      currentUser.name,
        initials:  currentUser.initials,
        phone:     currentUser.phone,
        from:      from,
        to:        to,
        type:      type,
        weight:    weight,
        desc:      desc,
        createdAt: new Date().toISOString()
    };

    requests.push(newRequest);

    document.getElementById("rFrom").value   = "";
    document.getElementById("rTo").value     = "";
    document.getElementById("rWeight").value = "";
    document.getElementById("rDesc").value   = "";
    document.getElementById("rType").value   = "";

    clearFile("itemImg", "ua3", "prev3");
    updateCounters();
    renderRequests();
    showToast("Tələbiniz göndərildi!", "success");
    switchTab("myRequests");
}


function renderFlights() {
    var searchCity = document.getElementById("fCity").value.toLowerCase();
    var filterType = document.getElementById("fType").value;
    var sortBy     = document.getElementById("fSort").value;

    var filteredList = [];
    var i = 0;

    while (i < flights.length) {
        var flight     = flights[i];
        var cityMatch  = false;
        var typeMatch  = false;

        if (searchCity === "") {
            cityMatch = true;
        } else if (flight.to.toLowerCase().indexOf(searchCity) !== -1) {
            cityMatch = true;
        } else if (flight.from.toLowerCase().indexOf(searchCity) !== -1) {
            cityMatch = true;
        }

        if (filterType === "") {
            typeMatch = true;
        } else {
            var j = 0;
            while (j < flight.types.length) {
                if (flight.types[j] === filterType) {
                    typeMatch = true;
                }
                j++;
            }
        }

        if (cityMatch === true && typeMatch === true) {
            filteredList.push(flight);
        }

        i++;
    }

    if (sortBy === "weight") {
        filteredList.sort(function(a, b) {
            return b.weight - a.weight;
        });
    } else if (sortBy === "rating") {
        filteredList.sort(function(a, b) {
            return b.rating - a.rating;
        });
    } else {
        filteredList.sort(function(a, b) {
            return new Date(a.date) - new Date(b.date);
        });
    }

    var container = document.getElementById("flightList");

    if (filteredList.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="ti ti-mood-empty"></i><p>Uyğun uçuş tapılmadı.</p></div>';
        return;
    }

    var html = "";
    var k = 0;

    while (k < filteredList.length) {
        html = html + buildCard(filteredList[k]);
        k++;
    }

    container.innerHTML = html;
}


function buildCard(flight) {
    var isOwner = false;
    if (currentUser !== null && flight.uid === currentUser.uid) {
        isOwner = true;
    }

    var isReal = false;
    if (flight.isReal === true) {
        isReal = true;
    }

    var typeBadges = "";
    var i = 0;
    while (i < flight.types.length) {
        typeBadges = typeBadges + '<span class="badge badge-gray">' + flight.types[i] + '</span>';
        i++;
    }

    var ratingBadge = "";
    if (flight.rating > 0) {
        ratingBadge = '<span class="badge badge-amber">⭐ ' + flight.rating.toFixed(1) + '</span>';
    }

    var realBadge = "";
    if (isReal === true) {
        realBadge = '<span class="badge badge-purple"><i class="ti ti-satellite"></i> Canlı OpenSky</span>';
    }

    var noteHTML = "";
    if (flight.note !== "") {
        noteHTML = '<div class="flight-note">"' + flight.note + '"</div>';
    }

    var ownerBadge = "";
    if (isOwner === true) {
        ownerBadge = '<span class="badge badge-purple" style="font-size:11px">Siz</span>';
    }

    var weightBadge = "";
    if (isReal === false) {
        weightBadge = '<span class="badge badge-green"><i class="ti ti-weight"></i> ' + flight.weight + ' kq bos</span>';
    }

    var footerBtn = "";
    if (isOwner === true) {
        footerBtn = '<button class="btn-delete" onclick="deleteFlight(' + flight.id + ')"><i class="ti ti-trash"></i> Sil</button>';
    } else if (isReal === true) {
        footerBtn = '<span style="font-size:12px;color:var(--text-light);font-style:italic">Real ucus melumatidir</span>';
    } else {
        footerBtn = '<button class="contact-btn" onclick="openContact(' + flight.id + ')"><i class="ti ti-phone"></i> Elaqe saxla</button>';
    }

    var card = "";
    card = card + '<div class="flight-card">';
    card = card +     '<div class="flight-top">';
    card = card +         '<div class="flight-route">';
    card = card +             '<span class="city">' + flight.from + '</span>';
    card = card +             '<div class="route-arrow"><hr/><i class="ti ti-plane"></i><hr/></div>';
    card = card +             '<span class="city">' + flight.to + '</span>';
    card = card +         '</div>';
    card = card +         '<div class="flight-time">';
    card = card +             '<div class="time">' + flight.time + '</div>';
    card = card +             '<div class="date">' + formatDate(flight.date) + '</div>';
    card = card +         '</div>';
    card = card +     '</div>';
    card = card +     '<div class="badge-list">';
    card = card +         '<span class="badge badge-blue"><i class="ti ti-ticket"></i> ' + flight.ticket + '</span>';
    card = card +         weightBadge + typeBadges + ratingBadge + realBadge;
    card = card +     '</div>';
    card = card +     noteHTML;
    card = card +     '<div class="flight-bottom">';
    card = card +         '<div class="user-row">';
    card = card +             '<div class="user-avatar-sm">' + flight.initials + '</div>';
    card = card +             '<div>';
    card = card +                 '<div class="user-name">' + flight.name + ' ' + ownerBadge + '</div>';
    card = card +                 '<div class="user-verified"><i class="ti ti-shield-check"></i> Yoxlanilmis istifadeci</div>';
    card = card +             '</div>';
    card = card +         '</div>';
    card = card +         footerBtn;
    card = card +     '</div>';
    card = card + '</div>';

    return card;
}


function deleteFlight(id) {
    var newList = [];
    var i = 0;

    while (i < flights.length) {
        if (flights[i].id !== id) {
            newList.push(flights[i]);
        }
        i++;
    }

    flights = newList;
    updateCounters();
    renderFlights();
    showToast("Ucus silindi");
}


function renderRequests() {
    var container = document.getElementById("requestList");
    var myList    = [];
    var i         = 0;

    while (i < requests.length) {
        if (requests[i].uid === currentUser.uid) {
            myList.push(requests[i]);
        }
        i++;
    }

    if (myList.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="ti ti-inbox"></i><p>Hələ heç bir tələb göndərmədiniz.</p></div>';
        return;
    }

    var html = "";
    var j    = 0;

    while (j < myList.length) {
        var req  = myList[j];
        var date = formatDate(req.createdAt.split("T")[0]);

        html = html + '<div class="flight-card">';
        html = html +     '<div class="flight-top">';
        html = html +         '<div class="flight-route">';
        html = html +             '<span class="city">' + req.from + '</span>';
        html = html +             '<div class="route-arrow"><hr/><i class="ti ti-package" style="color:var(--green)"></i><hr/></div>';
        html = html +             '<span class="city">' + req.to + '</span>';
        html = html +         '</div>';
        html = html +         '<div class="flight-time">';
        html = html +             '<div class="time" style="font-size:14px;color:var(--green)">' + req.type + '</div>';
        html = html +             '<div class="date">' + req.weight + ' kq</div>';
        html = html +         '</div>';
        html = html +     '</div>';
        html = html +     '<div class="badge-list">';
        html = html +         '<span class="badge badge-green">' + req.type + '</span>';
        html = html +         '<span class="badge badge-gray">' + req.weight + ' kq</span>';
        html = html +         '<span class="badge badge-blue">' + req.from + ' → ' + req.to + '</span>';
        html = html +     '</div>';
        html = html +     '<div class="flight-note">' + req.desc + '</div>';
        html = html +     '<div class="flight-bottom">';
        html = html +         '<div class="user-row">';
        html = html +             '<div class="user-avatar-sm" style="background:#dcfce7;color:var(--green)">' + req.initials + '</div>';
        html = html +             '<div>';
        html = html +                 '<div class="user-name">' + req.name + '</div>';
        html = html +                 '<div class="user-verified">' + date + '</div>';
        html = html +             '</div>';
        html = html +         '</div>';
        html = html +         '<button class="btn-delete" onclick="deleteRequest(' + req.id + ')"><i class="ti ti-trash"></i> Sil</button>';
        html = html +     '</div>';
        html = html + '</div>';

        j++;
    }

    container.innerHTML = html;
}


function deleteRequest(id) {
    var newList = [];
    var i = 0;

    while (i < requests.length) {
        if (requests[i].id !== id) {
            newList.push(requests[i]);
        }
        i++;
    }

    requests = newList;
    updateCounters();
    renderRequests();
    showToast("Teleb silindi");
}


function openContact(id) {
    var flight = null;
    var i      = 0;

    while (i < flights.length) {
        if (flights[i].id === id) {
            flight = flights[i];
        }
        i++;
    }

    if (flight === null) return;

    if (chatMessages[flight.id] === undefined) {
        chatMessages[flight.id] = [];
    }

    document.getElementById("modTitle").textContent = flight.name;

    var noteRow = "";
    if (flight.note !== "") {
        noteRow = '<div style="padding:8px 12px;background:var(--bg-gray);border-radius:8px;font-size:13px;color:var(--text-gray);border-left:3px solid var(--blue-mid);margin:8px 0">"' + flight.note + '"</div>';
    }

    var ratingRow = "";
    if (flight.rating > 0) {
        ratingRow = '<div class="modal-row"><i class="ti ti-star"></i> Reytinq: <strong>⭐ ' + flight.rating.toFixed(1) + '</strong></div>';
    }

    var bodyHTML = "";
    bodyHTML = bodyHTML + '<div class="modal-row"><i class="ti ti-user"></i> <strong>' + flight.name + '</strong></div>';
    bodyHTML = bodyHTML + '<div class="modal-row"><i class="ti ti-phone"></i> ' + flight.phone + '</div>';
    bodyHTML = bodyHTML + '<div class="modal-row"><i class="ti ti-plane"></i> ' + flight.from + ' → ' + flight.to + '</div>';
    bodyHTML = bodyHTML + '<div class="modal-row"><i class="ti ti-calendar"></i> ' + formatDate(flight.date) + ' — saat ' + flight.time + '</div>';
    bodyHTML = bodyHTML + '<div class="modal-row"><i class="ti ti-ticket"></i> Bilet: <strong>' + flight.ticket + '</strong></div>';
    bodyHTML = bodyHTML + '<div class="modal-row"><i class="ti ti-weight"></i> Bos ceki: <strong>' + flight.weight + ' kq</strong></div>';
    bodyHTML = bodyHTML + '<div class="modal-row"><i class="ti ti-package"></i> Qebul edir: ' + flight.types.join(", ") + '</div>';
    bodyHTML = bodyHTML + noteRow;
    bodyHTML = bodyHTML + ratingRow;

    bodyHTML = bodyHTML + '<div id="contactActions" style="display:flex;gap:8px;margin-top:16px">';
    bodyHTML = bodyHTML +     '<button class="btn btn-primary" style="flex:1" onclick="startChat(' + flight.id + ')"><i class="ti ti-message"></i> Elaqe saxla</button>';
    bodyHTML = bodyHTML +     '<button class="btn btn-outline" style="flex:1" onclick="closeModal()"><i class="ti ti-x"></i> Baghla</button>';
    bodyHTML = bodyHTML + '</div>';

    bodyHTML = bodyHTML + '<div id="chatSection" style="display:none;margin-top:14px">';
    bodyHTML = bodyHTML +     '<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:10px">';
    bodyHTML = bodyHTML +         '<div id="chatMessages" style="padding:12px;max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;background:var(--bg-gray);min-height:80px"></div>';
    bodyHTML = bodyHTML +         '<div style="display:flex;gap:8px;padding:8px;border-top:1px solid var(--border);background:white">';
    bodyHTML = bodyHTML +             '<input type="text" id="chatInput" placeholder="Mesajinizi yazin..." style="flex:1;border:1px solid var(--border);border-radius:6px;padding:8px 10px;font-size:13px;font-family:inherit" onkeydown="if(event.key===\'Enter\')sendChatMsg(' + flight.id + ')">';
    bodyHTML = bodyHTML +             '<button onclick="sendChatMsg(' + flight.id + ')" style="background:var(--blue);color:white;border:none;border-radius:6px;padding:8px 14px;cursor:pointer;font-size:16px"><i class="ti ti-send"></i></button>';
    bodyHTML = bodyHTML +         '</div>';
    bodyHTML = bodyHTML +     '</div>';
    bodyHTML = bodyHTML +     '<div style="display:flex;gap:8px">';
    bodyHTML = bodyHTML +         '<button class="btn btn-outline" style="flex:1" onclick="endChatAndRate(' + flight.id + ')"><i class="ti ti-star"></i> Bitir ve qiymetlendir</button>';
    bodyHTML = bodyHTML +         '<button class="btn btn-outline" style="flex:1" onclick="closeModal()"><i class="ti ti-x"></i> Baghla</button>';
    bodyHTML = bodyHTML +     '</div>';
    bodyHTML = bodyHTML + '</div>';

    bodyHTML = bodyHTML + '<div id="ratingSection" style="display:none;margin-top:14px">';
    bodyHTML = bodyHTML +     '<p style="font-size:14px;font-weight:600;margin-bottom:8px">Dasiyicini qiymetlendir:</p>';
    bodyHTML = bodyHTML +     '<div id="ratingStars" style="display:flex;gap:6px;margin-bottom:14px"></div>';
    bodyHTML = bodyHTML +     '<button class="btn btn-primary" onclick="closeModal()"><i class="ti ti-check"></i> Baghla</button>';
    bodyHTML = bodyHTML + '</div>';

    document.getElementById("modBody").innerHTML = bodyHTML;

    renderChatMessages(flight.id);
    document.getElementById("contactModal").classList.add("open");
}


function startChat(flightId) {
    document.getElementById("contactActions").style.display = "none";
    document.getElementById("chatSection").style.display    = "block";
    renderChatMessages(flightId);
}


function sendChatMsg(flightId) {
    var input = document.getElementById("chatInput");
    var text  = input.value.trim();

    if (text === "") return;

    if (chatMessages[flightId] === undefined) {
        chatMessages[flightId] = [];
    }

    var newMsg = {
        from:     currentUser.name,
        initials: currentUser.initials,
        text:     text,
        time:     new Date().toLocaleTimeString("az", { hour: "2-digit", minute: "2-digit" })
    };

    chatMessages[flightId].push(newMsg);
    input.value = "";
    renderChatMessages(flightId);
}


function renderChatMessages(flightId) {
    var container = document.getElementById("chatMessages");
    if (container === null) return;

    var messages = chatMessages[flightId];
    if (messages === undefined) {
        messages = [];
    }

    if (messages.length === 0) {
        container.innerHTML = '<p style="text-align:center;font-size:12px;color:var(--text-light);padding:10px">Hələ mesaj yoxdur. Salam deyin! </p>';
        return;
    }

    var html = "";
    var i    = 0;

    while (i < messages.length) {
        var msg  = messages[i];
        var isMe = false;

        if (msg.from === currentUser.name) {
            isMe = true;
        }

        var direction = "";
        var avatarBg  = "";
        var avatarClr = "";
        var bubbleBg  = "";
        var bubbleClr = "";
        var border    = "";
        var radius    = "";
        var textAlign = "";

        if (isMe === true) {
            direction = "flex-direction:row-reverse";
            avatarBg  = "var(--blue)";
            avatarClr = "white";
            bubbleBg  = "var(--blue)";
            bubbleClr = "white";
            border    = "none";
            radius    = "12px 4px 12px 12px";
            textAlign = "right";
        } else {
            direction = "";
            avatarBg  = "var(--blue-mid)";
            avatarClr = "var(--blue)";
            bubbleBg  = "white";
            bubbleClr = "var(--text)";
            border    = "1px solid var(--border)";
            radius    = "4px 12px 12px 12px";
            textAlign = "left";
        }

        html = html + '<div style="display:flex;gap:8px;align-items:flex-end;' + direction + '">';
        html = html +     '<div style="width:26px;height:26px;border-radius:50%;background:' + avatarBg + ';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:' + avatarClr + ';flex-shrink:0">' + msg.initials + '</div>';
        html = html +     '<div style="max-width:72%">';
        html = html +         '<div style="background:' + bubbleBg + ';color:' + bubbleClr + ';padding:8px 12px;border-radius:' + radius + ';font-size:13px;border:' + border + '">' + msg.text + '</div>';
        html = html +         '<div style="font-size:11px;color:var(--text-light);margin-top:2px;text-align:' + textAlign + '">' + msg.time + '</div>';
        html = html +     '</div>';
        html = html + '</div>';

        i++;
    }

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}


function endChatAndRate(flightId) {
    document.getElementById("chatSection").style.display   = "none";
    document.getElementById("ratingSection").style.display = "block";
    buildRatingStars(flightId, 0);
}


function buildRatingStars(flightId, hover) {
    var container = document.getElementById("ratingStars");
    if (container === null) return;

    var html = "";
    var i    = 1;

    while (i <= 5) {
        var color = "";

        if (i <= hover) {
            color = "#f59e0b";
        } else {
            color = "var(--border)";
        }

        html = html + '<span style="font-size:32px;cursor:pointer;color:' + color + ';transition:color .1s" ';
        html = html + 'onmouseover="buildRatingStars(' + flightId + ',' + i + ')" ';
        html = html + 'onmouseout="buildRatingStars(' + flightId + ',0)" ';
        html = html + 'onclick="submitRating(' + flightId + ',' + i + ')">★</span>';

        i++;
    }

    container.innerHTML = html;
}


function submitRating(flightId, value) {
    var flight = null;
    var i      = 0;

    while (i < flights.length) {
        if (flights[i].id === flightId) {
            flight = flights[i];
        }
        i++;
    }

    if (flight === null) return;

    var newTotal       = flight.rating * flight.ratingCount + value;
    flight.ratingCount = flight.ratingCount + 1;
    flight.rating      = parseFloat((newTotal / flight.ratingCount).toFixed(1));

    showToast("Reytinqiniz üçün təşəkkür! ", "success");
    closeModal();
    renderFlights();
}


function closeModal() {
    document.getElementById("contactModal").classList.remove("open");
}


function submitSupport() {
    var name    = document.getElementById("supName").value.trim();
    var email   = document.getElementById("supEmail").value.trim();
    var subject = document.getElementById("supSubject").value;
    var msg     = document.getElementById("supMsg").value.trim();

    if (name === "" || email === "" || subject === "" || msg === "") {
        showToast("Bütün sahələri doldurun", "warn");
        return;
    }

    document.getElementById("supName").value    = "";
    document.getElementById("supEmail").value   = "";
    document.getElementById("supMsg").value     = "";
    document.getElementById("supSubject").value = "";

    document.getElementById("supportSuccess").style.display = "flex";

    setTimeout(function() {
        document.getElementById("supportSuccess").style.display = "none";
    }, 5000);

    showToast("Müraciətiniz göndərildi! Tezliklə cavab veriləcək ", "success");
}


function updateCounters() {
    document.getElementById("flightCount").textContent = flights.length;
    document.getElementById("reqCount").textContent    = requests.length;

    if (currentUser !== null) {
        var myFlightCount  = 0;
        var myRequestCount = 0;
        var i              = 0;

        while (i < flights.length) {
            if (flights[i].uid === currentUser.uid) {
                myFlightCount++;
            }
            i++;
        }

        var j = 0;
        while (j < requests.length) {
            if (requests[j].uid === currentUser.uid) {
                myRequestCount++;
            }
            j++;
        }

        document.getElementById("myFlightCount").textContent = myFlightCount;
        document.getElementById("myReqCount").textContent    = myRequestCount;
    }
}


function showToast(msg, type) {
    var toastEl = document.getElementById("toast");
    toastEl.textContent = msg;

    if (type === "warn") {
        toastEl.className = "toast show warn";
    } else if (type === "danger") {
        toastEl.className = "toast show danger";
    } else {
        toastEl.className = "toast show success";
    }

    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(function() {
        toastEl.classList.remove("show");
    }, 3200);
}


function formatDate(str) {
    var d     = new Date(str);
    var day   = d.getDate().toString().padStart(2, "0");
    var month = (d.getMonth() + 1).toString().padStart(2, "0");
    var year  = d.getFullYear();
    return day + "." + month + "." + year;
}


updateCounters();