document.addEventListener('DOMContentLoaded', () => {
  // === UTILS ===
  const $ = id => document.getElementById(id);

  // === GAMIFICATION ===
  const BADGE_LIST = [
    { id: 'starter', name: 'Starter', icon: '🏁', desc: 'Inserisci 5 lead in un giorno.' },
    { id: 'app_ninja', name: 'App Ninja', icon: '📅', desc: 'Fissa 3 appuntamenti in una giornata.' },
    { id: 'zero_archivio', name: 'Tenace', icon: '💪', desc: 'Zero lead archiviati in una settimana.' },
    { id: 'level_2', name: 'Livello 2', icon: '🕹️', desc: 'Raggiungi il livello 2.' },
    { id: 'level_5', name: 'Esperto', icon: '🏆', desc: 'Raggiungi il livello 5.' },
    { id: 'missione', name: 'Missioni!', icon: '🎯', desc: 'Completa tutte le missioni in un giorno.' }
  ];
  const MISSION_POOL = [
    { id: 1, desc: "Inserisci 10 lead oggi", target: 10, type: "inserimento_lead" },
    { id: 2, desc: "Fissa 2 appuntamenti oggi", target: 2, type: "appuntamento" },
    { id: 3, desc: "Invia 3 mail oggi", target: 3, type: "mail" },
    { id: 4, desc: "Imposta 2 recall oggi", target: 2, type: "recall" }
  ];

  // === USER PROFILE INIT ===
  let userProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');
  if (!userProfile) {
    userProfile = {
      xp: 0,
      level: 1,
      badges: [],
      stats: { todayLeads: 0, todayApp: 0, todayMail: 0, todayRecall: 0, todayArch: 0 },
      dailyMissions: [],
      missionsDate: null
    };
    resetDailyMissions();
    saveProfile();
  }
  // === RESET DAILY IF DATE CHANGED ===
  function resetDailyMissions() {
    userProfile.dailyMissions = MISSION_POOL
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(m => ({ ...m, progress: 0, done: false }));
    userProfile.missionsDate = new Date().toISOString().slice(0, 10);
    userProfile.stats.todayLeads = 0;
    userProfile.stats.todayApp = 0;
    userProfile.stats.todayMail = 0;
    userProfile.stats.todayRecall = 0;
    userProfile.stats.todayArch = 0;
    saveProfile();
  }
  if (!userProfile.missionsDate || userProfile.missionsDate !== new Date().toISOString().slice(0, 10)) {
    resetDailyMissions();
  }

  function saveProfile() {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    updateXPBar();
    renderMissions();
  }

  // === XP, LEVEL & BADGE LOGIC ===
  function awardXP(xp, reason) {
    userProfile.xp += xp;
    const prevLevel = userProfile.level;
    userProfile.level = 1 + Math.floor(userProfile.xp / 100);
    if (userProfile.level > prevLevel) {
      toast(`🎉 Sei salito al livello ${userProfile.level}!`);
      if (userProfile.level === 2) unlockBadge('level_2');
      if (userProfile.level === 5) unlockBadge('level_5');
    }
    checkMissions(reason);
    saveProfile();
    updateXPBar();
  }
  function unlockBadge(badgeId) {
    if (!userProfile.badges.includes(badgeId)) {
      userProfile.badges.push(badgeId);
      saveProfile();
      toast('🏅 Nuovo badge sbloccato!');
    }
  }
  function checkMissions(reason) {
    let allDone = true;
    userProfile.dailyMissions.forEach(m => {
      if (m.type === reason && !m.done) {
        m.progress++;
        if (m.progress >= m.target) {
          m.done = true;
          awardXP(40, "missione");
          toast("Missione completata! 🎯");
        }
      }
      if (!m.done) allDone = false;
    });
    if (allDone) unlockBadge('missione');
    saveProfile();
    renderMissions();
  }

  // === XP BAR & GAMER PROFILE RENDER ===
  function updateXPBar() {
    $('gamerLevel').textContent = `Lv. ${userProfile.level}`;
    $('xpValue').textContent = `${userProfile.xp} XP`;
    let progress = Math.min(1, (userProfile.xp % 100) / 100);
    $('xp-bar').style.width = (progress * 100) + "%";
  }
  function renderMissions() {
    const ul = $('missionList');
    if (!ul) return;
    ul.innerHTML = '';
    userProfile.dailyMissions.forEach((m, i) => {
      const li = document.createElement('li');
      li.className = m.done ? "done" : "";
      li.innerHTML = `<span class="check-mission">${m.done ? "✔" : ""}</span>${m.desc} <span style="margin-left:auto">${m.progress}/${m.target}</span>`;
      ul.appendChild(li);
    });
  }

  // === GAMER PROFILE MODAL ===
  $('openGamerProfile').onclick = () => {
    $('profileLevel').textContent = userProfile.level;
    $('profileXP').textContent = `${userProfile.xp} XP`;
    $('profileXPBar').style.width = ((userProfile.xp % 100) / 100 * 100) + "%";
    // BADGES
    $('profileBadges').innerHTML = BADGE_LIST.map(b =>
      `<span class="badge-icon${userProfile.badges.includes(b.id) ? "" : " locked"}" title="${b.name}">
        ${b.icon}
        <span class="tooltip">${b.name}<br>${b.desc}</span>
      </span>`
    ).join('');
    // MISSIONI
    $('profileMissions').innerHTML = userProfile.dailyMissions.map(m =>
      `<li class="${m.done ? "done" : ""}">${m.desc} <span style="margin-left:1em">${m.progress}/${m.target}</span></li>`
    ).join('');
    // STATS
    $('profileStats').innerHTML = `
      <li>Lead inseriti oggi: <b>${userProfile.stats.todayLeads}</b></li>
      <li>Appuntamenti oggi: <b>${userProfile.stats.todayApp}</b></li>
      <li>Mail inviate oggi: <b>${userProfile.stats.todayMail}</b></li>
      <li>Recall oggi: <b>${userProfile.stats.todayRecall}</b></li>
      <li>Lead archiviati oggi: <b>${userProfile.stats.todayArch}</b></li>
    `;
    $('gamerProfileModal').classList.remove('hidden');
  };
  $('closeGamerProfile').onclick = () => $('gamerProfileModal').classList.add('hidden');

  // ====== ORARIO & POMODORO ======
  setInterval(() => $('clock').textContent = new Date().toLocaleTimeString('it-IT'), 1000);
  let sec = 25 * 60, pomodoroTimer = null;
  function updateTimer() {
    const m = String(Math.floor(sec / 60)).padStart(2, '0'), s = String(sec % 60).padStart(2, '0');
    $('timer').textContent = `${m}:${s}`;
  }
  $('start').onclick = () => {
    if (!pomodoroTimer)
      pomodoroTimer = setInterval(() => {
        if (sec > 0) { sec--; updateTimer(); }
        else { clearInterval(pomodoroTimer); pomodoroTimer = null; toast("Pomodoro finito!"); }
      }, 1000);
  };
  $('reset').onclick = () => { clearInterval(pomodoroTimer); pomodoroTimer = null; sec = 25 * 60; updateTimer(); }
  updateTimer();

  // ======= LEADS STORAGE =======
  let leads = JSON.parse(localStorage.getItem('leads') || '[]');
  let tagList = JSON.parse(localStorage.getItem('tagList') || '[]');
  function saveAll() {
    localStorage.setItem('leads', JSON.stringify(leads));
    localStorage.setItem('tagList', JSON.stringify(tagList));
    updateDashboard();
  }

  // ======= DASHBOARD & KPI =======
  function updateDashboard() {
    $('statTot').textContent = leads.length;
    $('statCaldi').textContent = leads.filter(l => getCalore(l.answers) === 'caldo' && !l.archiviato).length;
    $('statTiepidi').textContent = leads.filter(l => getCalore(l.answers) === 'tiepido' && !l.archiviato).length;
    $('statFreddi').textContent = leads.filter(l => getCalore(l.answers) === 'freddo' && !l.archiviato).length;
    $('statAppOggi').textContent = leads.filter(l => l.appuntamento_fissato && isToday(l.data_appuntamento)).length;
    $('statRecall').textContent = leads.filter(l => l.recall && isToday(l.data_recall)).length;
    $('statArch').textContent = leads.filter(l => l.archiviato).length;
  }
  function isToday(dt) {
    if (!dt) return false;
    const d = new Date(dt), n = new Date();
    return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }
  function isThisWeek(dt) {
    if (!dt) return false;
    const d = new Date(dt), n = new Date();
    const w = x => {
      const j = new Date(x.getFullYear(), 0, 1);
      return Math.ceil((((x - j) / 86400000) + j.getDay() + 1) / 7);
    };
    return w(d) === w(n) && d.getFullYear() === n.getFullYear();
  }

  // ======= UTILS QUALIFICA =======
  const QUALIFICA = [
    "1. C’è qualcosa di urgente che volete risolvere in questo periodo?",
    "2. Chi si occupa normalmente di prendere queste decisioni nella vostra struttura?",
    "3. Avete già dato un’occhiata ad altre soluzioni, magari simili a quella di cui parliamo?",
    "4. Quanto è importante per voi, oggi, essere visibili anche online?",
    "5. Mi sembra di capire che l’argomento le interessa:Corretto?",
    "6. Avete già qualche numero o dato che vi aiuta a capire meglio la situazione?",
    "7. Secondo lei, se trovassimo la soluzione giusta, sareste pronti a partire già a breve?"
  ];
  function countYes(ans) { return Object.values(ans || {}).filter(x => x === 'si').length; }
  function getCalore(ans) { const c = countYes(ans); if (c >= 3) return 'caldo'; if (c === 2) return 'tiepido'; return 'freddo'; }
  function getConsiglio(ans) {
    const c = countYes(ans);
    if (c >= 3) return "Lead caldo: proponi subito un appuntamento!";
    if (c === 2) return "Lead tiepido: mostra un caso pratico e chiedi recall.";
    return "Lead freddo: invia materiale informativo e ricontatta tra 7-10 giorni.";
  }
  function formatDateISO(dt) { if (!dt) return '-'; const d = new Date(dt); return d.toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }); }

  // ======= TOAST =======
  function toast(msg, error) {
    let t = $('toast');
    t.textContent = msg;
    t.className = error ? "visible error" : "visible";
    t.style.display = "block";
    setTimeout(() => { t.className = ""; t.style.display = "none"; }, 2100);
  }

  // ======= SWITCH MODALITÀ =======
  let MODE = 'onelead';
  function switchMode(toMode) {
    MODE = toMode || (MODE === 'onelead' ? 'kanban' : 'onelead');
    if (MODE === 'kanban') {
      document.body.classList.add('kanban-active');
      $('kanbanBoard').style.display = 'flex';
      $('oneLeadMode').style.display = 'none';
      $('switchModeBtn').textContent = "Passa a One-Lead";
      renderKanban();
    } else {
      document.body.classList.remove('kanban-active');
      $('kanbanBoard').style.display = 'none';
      $('oneLeadMode').style.display = '';
      $('switchModeBtn').textContent = "Passa a Kanban";
      showCurrentLead();
    }
  }
  $('switchModeBtn').onclick = () => switchMode();

  // ======= ONE-LEAD-A-TIME FLOW =======
  let currentIdx = 0;
  function getLeadIndexList() {
    return leads
      .map((l, i) => ({ i, l }))
      .filter(({ l }) => !l.archiviato)
      .sort((a, b) => {
        const order = { da_lavorare: 0, in_lavorazione: 1, successo: 2, chiuso: 3 };
        return (order[a.l.stato] ?? 4) - (order[b.l.stato] ?? 4) || (a.l.data_inserimento || 0) - (b.l.data_inserimento || 0);
      })
      .map(x => x.i);
  }
  function showCurrentLead() {
    let idxList = getLeadIndexList();
    if (idxList.length === 0) {
      $('oneLeadPanel').innerHTML = "<div class='one-lead-panel'><h2>Tutti i lead sono stati gestiti!</h2></div>";
      return;
    }
    if (currentIdx >= idxList.length) currentIdx = 0;
    let lidx = idxList[currentIdx], lead = leads[lidx];
    $('oneLeadPanel').innerHTML = renderOneLeadPanel(lead, lidx, idxList.length > 1);
    document.querySelectorAll('.onelead-action').forEach(btn => {
      btn.onclick = e => { e.preventDefault(); handleOneLeadAction(btn.dataset.action, lidx); };
    });
    document.querySelectorAll('.onelead-qbtn').forEach(btn => {
      btn.onclick = e => {
        leads[lidx].answers = leads[lidx].answers || {};
        leads[lidx].answers[btn.dataset.q] = btn.dataset.val;
        saveAll(); showCurrentLead();
        // XP per risposta a domanda
        awardXP(2, 'qualifica');
      };
    });
    $('btnLeadPrev').onclick = () => { currentIdx = (currentIdx - 1 + idxList.length) % idxList.length; showCurrentLead(); };
    $('btnLeadNext').onclick = () => { currentIdx = (currentIdx + 1) % idxList.length; showCurrentLead(); };
  }
  function renderOneLeadPanel(lead, idx, multipli) {
    return `
      <div class="one-lead-title">
        ${lead.struttura} <span class="dot dot-${getCalore(lead.answers)}"></span>
      </div>
      <div class="one-lead-info">
        <b>Città:</b> ${lead.citta || '-'} &nbsp; <b>Referente:</b> ${lead.referente || '-'} &nbsp; <b>Tel:</b> ${lead.telefono || '-'}
      </div>
      <div class="one-lead-script">
        ${getScriptSuggerito(lead)}
      </div>
      <div class="one-lead-qualifica">
        ${QUALIFICA.map((q, i) => `
          <div class="qualifica-row">
            <span>${q}</span>
            <button class="onelead-qbtn${(lead.answers || {})['q' + (i + 1)] === 'si' ? ' qual-btn-yes' : ''}" data-q="q${i + 1}" data-val="si">Sì</button>
            <button class="onelead-qbtn${(lead.answers || {})['q' + (i + 1)] === 'no' ? ' qual-btn-no' : ''}" data-q="q${i + 1}" data-val="no">No</button>
          </div>
        `).join('')}
        <div class="consiglio">${getConsiglio(lead.answers)}</div>
      </div>
      <div class="one-lead-actions">
        <button class="big-btn green onelead-action" data-action="appuntamento">Fissa Appuntamento</button>
        <button class="big-btn yellow onelead-action" data-action="recall">Recall/Task</button>
        <button class="big-btn blue onelead-action" data-action="mail">Invia Mail</button>
        <button class="big-btn onelead-action" data-action="export">Export TXT</button>
      </div>
      <div class="one-lead-log">
        <b>Ultime azioni:</b>
        <ul>${(lead.log || []).slice(-5).map(x => `<li>${x}</li>`).join('')}</ul>
      </div>
      ${multipli ? `<div class="one-lead-next"><button id="btnLeadPrev">← Precedente</button> <button id="btnLeadNext">Successivo →</button></div>` : ''}
    `;
  }
  function getScriptSuggerito(lead) {
    if (!lead.referente || lead.referente.toLowerCase().includes('segretaria')) return `Buongiorno, sono [TUO NOME] di MioDottore. Collaboriamo con studi medici per semplificare la gestione appuntamenti, ridurre chiamate perse e aumentare efficienza. Posso parlare con il Dott. [NOME]?`;
    return `Buongiorno Dott. ${lead.referente || ''}, sono [TUO NOME] di MioDottore. Sto lavorando con diverse strutture per semplificare la gestione delle prenotazioni e rispondere più facilmente alle richieste dei pazienti.C’è una persona di riferimento, magari il direttore o il responsabile dell’organizzazione, con cui potrei confrontarmi su questi temi?”
  function handleOneLeadAction(action, lidx) {
    let lead = leads[lidx];
    if (action === 'appuntamento') {
      lead.appuntamento_fissato = true;
      lead.data_appuntamento = new Date().toISOString();
      lead.stato = 'successo';
      pushLog(lead, 'Appuntamento fissato');
      userProfile.stats.todayApp++;
      awardXP(30, "appuntamento");
      if (userProfile.stats.todayApp === 3) unlockBadge('app_ninja');
      window.open("https://calendar.google.com/calendar/r/eventedit?text=Appuntamento+" + encodeURIComponent(lead.struttura), "_blank");
      toast("Apertura Google Calendar!");
      saveAll(); nextOneLead();
    }
    if (action === 'mail') {
      lead.mail_inviata = true;
      lead.data_mail = new Date().toISOString();
      lead.stato = 'successo';
      pushLog(lead, 'Mail inviata');
      userProfile.stats.todayMail++;
      awardXP(15, "mail");
      let subject = encodeURIComponent("Richiesta info — " + (lead.struttura || ''));
      let body = encodeURIComponent("Gentile Dott.,\n\nLe invio le informazioni richieste riguardo ai nostri servizi.\n[Personalizza qui]\n\nCordiali saluti\n[Il tuo nome]");
      window.open("https://mail.google.com/mail/?view=cm&fs=1&to=&su=" + subject + "&body=" + body, "_blank");
      toast("Apertura Gmail!");
      saveAll(); nextOneLead();
    }
    if (action === 'recall') {
      let dt = prompt("Inserisci data/ora richiamo (es: 2025-07-10 15:00):", "");
      if (dt) {
        lead.recall = true;
        lead.data_recall = new Date(dt).toISOString();
        pushLog(lead, 'Recall inserito per ' + dt);
        userProfile.stats.todayRecall++;
        awardXP(10, "recall");
        window.open("https://calendar.google.com/calendar/r/eventedit?text=Recall+" + encodeURIComponent(lead.struttura || '') + "&details=Recall+telefonico", "_blank");
        toast("Recall su Calendar!");
      }
      saveAll(); nextOneLead();
    }
    if (action === 'export') openExportTxtModal(lead);
  }
  function nextOneLead() {
    currentIdx++;
    showCurrentLead();
  }

  // ======= KANBAN =======
  function renderKanban() {
    ['listDaLavorare', 'listInLavorazione', 'listSuccesso', 'listChiusi'].forEach(id => $(id).innerHTML = '');
    let filtered = applyFilters(leads);
    filtered.forEach((lead, i) => {
      const tpl = document.getElementById('tpl-lead-card');
      const li = tpl.content.firstElementChild.cloneNode(true);
      li.classList.add(`calore-${getCalore(lead.answers)}`);
      li.dataset.id = lead.id;
      li.querySelector('.lead-title').innerHTML = `
        ${lead.struttura} <span class="citta">${lead.citta || ''}</span> 
        <span class="dot dot-${getCalore(lead.answers)}"></span>
      `;
      li.querySelector('.lead-meta').innerHTML = `${lead.referente || ''} ${lead.telefono ? '📞 ' + lead.telefono : ''}`;
      li.querySelector('.lead-tags').innerHTML = (lead.tags || []).map(t => `<span class="lead-tag">${t}</span>`).join('') + `<button class="action-btn tag-btn" data-action="tag" title="Aggiungi tag">🏷️</button>`;
      li.querySelector('.lead-actions').innerHTML = kanbanActionsHTML(lead);
      const qualDiv = li.querySelector('.lead-qualifica');
      qualDiv.innerHTML = "";
      if (lead.stato === 'in_lavorazione') {
        QUALIFICA.forEach((q, idx) => {
          const answer = (lead.answers || {})['q' + (idx + 1)] || '';
          qualDiv.innerHTML += `
            <div class="qualifica-row">
              <span>${q}</span>
              <button class="qual-btn ${answer === 'si' ? 'qual-btn-yes' : ''}" data-idx="${i}" data-q="q${idx + 1}" data-val="si">Sì</button>
              <button class="qual-btn ${answer === 'no' ? 'qual-btn-no' : ''}" data-idx="${i}" data-q="q${idx + 1}" data-val="no">No</button>
            </div>
          `;
        });
        qualDiv.innerHTML += `<div class="consiglio">${getConsiglio(lead.answers)}</div>`;
      }
      li.onclick = e => { if (!e.target.classList.contains('action-btn')) openDetailModal(lead.id); };
      if (lead.stato === 'da_lavorare') $('listDaLavorare').appendChild(li);
      else if (lead.stato === 'in_lavorazione') $('listInLavorazione').appendChild(li);
      else if (lead.stato === 'successo') $('listSuccesso').appendChild(li);
      else $('listChiusi').appendChild(li);
    });
  }
  function kanbanActionsHTML(lead) {
    let btns = [];
    if (lead.stato === 'da_lavorare') btns = [
      '<button class="action-btn" data-action="chiama" title="Chiamata">☎️</button>',
      '<button class="action-btn" data-action="archivia" title="Archivia">🗃️</button>'
    ];
    else if (lead.stato === 'in_lavorazione') btns = [
      '<button class="action-btn" data-action="appuntamento" title="Fissa Appuntamento">📅</button>',
      '<button class="action-btn" data-action="mail" title="Invia Mail">📧</button>',
      '<button class="action-btn" data-action="recall" title="Imposta Recall">🔔</button>',
      '<button class="action-btn" data-action="export" title="Export TXT">📋</button>',
      '<button class="action-btn" data-action="archivia" title="Archivia">🗃️</button>',
      '<button class="action-btn" data-action="chiudi" title="Chiudi Lead">❌</button>'
    ];
    else if (lead.stato === 'successo') btns = [
      '<button class="action-btn" data-action="export" title="Export TXT">📋</button>',
      '<button class="action-btn" data-action="archivia" title="Archivia">🗃️</button>'
    ];
    else btns = [
      '<button class="action-btn" data-action="riapri" title="Riapri">↩️</button>',
      '<button class="action-btn" data-action="elimina" title="Elimina">🗑️</button>'
    ];
    btns.push('<button class="action-btn" data-action="log" title="Log azioni">📝</button>');
    return btns.join('');
  }
  function applyFilters(leadList) {
    let arr = [...leadList];
    const stato = $('filterState').value, calore = $('filterCalore').value, s = $('searchInput').value.trim().toLowerCase();
    const tag = $('filterTag').value;
    const recall = $('filterRecall').value;
    if (stato) arr = arr.filter(l => l.stato === stato);
    if (calore) arr = arr.filter(l => getCalore(l.answers) === calore);
    if (tag) arr = arr.filter(l => (l.tags || []).includes(tag));
    if (recall === 'oggi') arr = arr.filter(l => l.recall && isToday(l.data_recall));
    if (recall === 'settimana') arr = arr.filter(l => l.recall && isThisWeek(l.data_recall));
    if (recall === 'no') arr = arr.filter(l => !l.recall);
    if (s) arr = arr.filter(l => (l.struttura || '').toLowerCase().includes(s) || (l.citta || '').toLowerCase().includes(s) || (l.telefono || '').includes(s));
    return arr;
  }

  // ==== EVENTI KANBAN ====
  document.body.addEventListener('click', function (e) {
    if (!e.target.classList.contains('action-btn')) return;
    const id = e.target.closest('.lead-card').dataset.id;
    handleAction(e.target.dataset.action, id);
    e.stopPropagation();
  });
  document.body.addEventListener('click', function (e) {
    if (e.target.classList.contains('tag-btn')) {
      e.preventDefault();
      const id = e.target.closest('.lead-card').dataset.id;
      openTagModal(id);
    }
  });
  ['searchInput', 'filterState', 'filterCalore', 'filterTag', 'filterRecall'].forEach(id => {
    $(id).onchange = $(id).oninput = () => renderKanban();
  });

  // ==== DRAG&DROP KANBAN ====
  let dragged = null;
  document.body.addEventListener('dragstart', function (e) {
    if (e.target.classList.contains('lead-card')) {
      dragged = e.target;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => dragged.classList.add('dragging'), 1);
    }
  });
  document.body.addEventListener('dragend', function (e) {
    if (dragged) dragged.classList.remove('dragging');
    dragged = null;
  });
  document.querySelectorAll('.lead-list').forEach(list => {
    list.ondragover = e => { e.preventDefault(); list.classList.add('droppable'); }
    list.ondragleave = () => { list.classList.remove('droppable'); }
    list.ondrop = e => {
      e.preventDefault();
      list.classList.remove('droppable');
      if (!dragged) return;
      const id = dragged.dataset.id, col = list.id;
      let stato = 'da_lavorare';
      if (col === 'listInLavorazione') stato = 'in_lavorazione';
      if (col === 'listSuccesso') stato = 'successo';
      if (col === 'listChiusi') stato = 'chiuso';
      let idx = leads.findIndex(l => l.id == id);
      if (idx >= 0) { leads[idx].stato = stato; pushLog(leads[idx], `Spostato in ${stato}`); saveAll(); renderKanban(); }
    }
  });

  // ==== ACTION HANDLER KANBAN ====
  function handleAction(action, id) {
    const idx = leads.findIndex(l => l.id == id);
    if (idx < 0) return;
    let lead = leads[idx];
    if (action === 'chiama') { lead.stato = 'in_lavorazione'; lead.ultimo_esito = 'In lavorazione'; pushLog(lead, 'Lead chiamato'); awardXP(5, "chiama"); }
    if (action === 'appuntamento') {
      lead.appuntamento_fissato = true;
      lead.data_appuntamento = new Date().toISOString();
      lead.stato = 'successo';
      lead.ultimo_esito = 'Appuntamento fissato';
      userProfile.stats.todayApp++;
      pushLog(lead, 'Appuntamento fissato');
      awardXP(30, "appuntamento");
      if (userProfile.stats.todayApp === 3) unlockBadge('app_ninja');
      window.open("https://calendar.google.com/calendar/r/eventedit?text=Appuntamento+" + encodeURIComponent(lead.struttura), "_blank");
      toast("Apertura Google Calendar!");
    }
    if (action === 'mail') {
      lead.mail_inviata = true;
      lead.data_mail = new Date().toISOString();
      lead.stato = 'successo';
      lead.ultimo_esito = 'Mail inviata';
      userProfile.stats.todayMail++;
      pushLog(lead, 'Mail inviata');
      awardXP(15, "mail");
      let subject = encodeURIComponent("Richiesta info — " + (lead.struttura || ''));
      let body = encodeURIComponent("Gentile Dott.,\n\nLe invio le informazioni richieste riguardo ai nostri servizi.\n[Personalizza qui]\n\nCordiali saluti\n[Il tuo nome]");
      window.open("https://mail.google.com/mail/?view=cm&fs=1&to=&su=" + subject + "&body=" + body, "_blank");
      toast("Apertura Gmail!");
    }
    if (action === 'recall') {
      let dt = prompt("Inserisci data/ora richiamo (es: 2025-07-10 15:00):", "");
      if (dt) {
        lead.recall = true;
        lead.data_recall = new Date(dt).toISOString();
        lead.ultimo_esito = 'Recall programmato';
        userProfile.stats.todayRecall++;
        pushLog(lead, 'Recall inserito per ' + dt);
        awardXP(10, "recall");
        window.open("https://calendar.google.com/calendar/r/eventedit?text=Recall+" + encodeURIComponent(lead.struttura || '') + "&details=Recall+telefonico", "_blank");
        toast("Recall su Calendar!");
      }
    }
    if (action === 'export') openExportTxtModal(lead);
    if (action === 'archivia') { lead.archiviato = true; lead.stato = 'chiuso'; userProfile.stats.todayArch++; pushLog(lead, 'Archiviato'); awardXP(4, "archivia"); }
    if (action === 'chiudi') { lead.chiuso = true; lead.stato = 'chiuso'; pushLog(lead, 'Chiuso senza successo'); }
    if (action === 'riapri') { lead.archiviato = false; lead.chiuso = false; lead.stato = 'da_lavorare'; pushLog(lead, 'Lead riaperto'); }
    if (action === 'elimina') { if (confirm('Eliminare definitivamente questo lead?')) { leads.splice(idx, 1); } }
    if (action === 'log') openDetailModal(id);
    saveAll(); renderKanban();
  }

  // ==== MODAL NUOVO LEAD ====
  $('btnNewLead').onclick = () => { $('leadModal').classList.remove('hidden'); };
  $('cancelLead').onclick = () => { $('leadModal').classList.add('hidden'); };
  $('saveLead').onclick = () => {
    const struttura = $('inputNome').value.trim();
    const citta = $('inputCitta').value.trim();
    if (!struttura || !citta) return toast("Struttura e città obbligatorie", 1);
    const nuovoLead = {
      id: Date.now(),
      struttura, citta,
      referente: $('inputReferente').value.trim(),
      telefono: $('inputTelefono').value.trim(),
      fonte: $('inputFonte').value.trim(),
      stato: 'da_lavorare',
      calore: 'freddo',
      log: [],
      tags: [],
      archiviato: false, chiuso: false,
      appuntamento_fissato: false, mail_inviata: false, recall: false,
      data_appuntamento: null, data_mail: null, data_recall: null,
      note: '',
      ultimo_esito: '',
      data_inserimento: new Date().toISOString(),
      answers: {}
    };
    leads.push(nuovoLead);
    userProfile.stats.todayLeads++;
    pushLog(nuovoLead, 'Lead inserito');
    awardXP(10, "inserimento_lead");
    if (userProfile.stats.todayLeads === 5) unlockBadge('starter');
    $('leadModal').classList.add('hidden');
    saveAll();
    if (MODE === 'kanban') renderKanban();
    else showCurrentLead();
    ['inputNome', 'inputReferente', 'inputTelefono', 'inputCitta', 'inputFonte'].forEach(id => $(id).value = '');
  };

  // ==== MODAL DETTAGLIO/LOG ====
  function openDetailModal(id) {
    const lead = leads.find(l => l.id == id);
    if (!lead) return;
    $('detailContent').innerHTML = `
      <b>${lead.struttura}</b> <span class="dot dot-${getCalore(lead.answers)}"></span><br>
      Referente: ${lead.referente || '-'}<br>
      Telefono: ${lead.telefono || '-'}<br>
      Città: ${lead.citta || '-'}<br>
      Fonte: ${lead.fonte || '-'}<br>
      Note: <textarea id="editNote">${lead.note || ''}</textarea><br>
      Ultimo esito: ${lead.ultimo_esito || '-'}<br>
      <b>Log azioni:</b>
      <ul>${(lead.log || []).map(x => `<li>${x}</li>`).join('')}</ul>
    `;
    $('detailModal').classList.remove('hidden');
    $('saveDetail').onclick = () => {
      lead.note = $('editNote').value;
      pushLog(lead, 'Note aggiornate');
      $('detailModal').classList.add('hidden');
      saveAll();
      if (MODE === 'kanban') renderKanban();
      else showCurrentLead();
    };
    $('closeDetail').onclick = () => $('detailModal').classList.add('hidden');
  }

  // ==== MODAL TAG ====
  function openTagModal(id) {
    const lead = leads.find(l => l.id == id);
    if (!lead) return;
    let tags = Array.from(new Set(tagList.concat(leads.flatMap(l => l.tags || []))));
    $('tagContent').innerHTML = `
      <input id="inputAddTag" placeholder="Nuovo tag..." style="margin-bottom:0.5em">
      <div>${tags.map(tag =>
        `<label style="margin-right:1em"><input type="checkbox" class="tagchk" value="${tag}" ${lead.tags.includes(tag) ? "checked" : ""}> ${tag}</label>`
      ).join('')}</div>
    `;
    $('tagModal').classList.remove('hidden');
    $('saveTag').onclick = () => {
      let arr = Array.from(document.querySelectorAll('.tagchk')).filter(x => x.checked).map(x => x.value);
      let newTag = $('inputAddTag').value.trim();
      if (newTag) arr.push(newTag);
      lead.tags = Array.from(new Set(arr));
      tagList = Array.from(new Set(tagList.concat(lead.tags)));
      $('tagModal').classList.add('hidden');
      saveAll();
      if (MODE === 'kanban') renderKanban();
      else showCurrentLead();
    };
    $('closeTag').onclick = () => $('tagModal').classList.add('hidden');
  }

  // ==== EXPORT TXT ====
  function openExportTxtModal(lead) {
    let txt = `Struttura: ${lead.struttura}\nReferente: ${lead.referente}\nTelefono: ${lead.telefono}\nCittà: ${lead.citta}\nTag: ${lead.tags.join(', ')}\nCalore: ${getCalore(lead.answers)}\nUltimo esito: ${lead.ultimo_esito}\n\nNote:\n${lead.note || ''}\n\nLog:\n${(lead.log || []).map(x => "- " + x).join('\n')}`;
    $('exportTxtArea').value = txt;
    $('exportTxtModal').classList.remove('hidden');
    $('copyExportTxt').onclick = () => { navigator.clipboard.writeText(txt); toast('Copiato!'); };
    $('closeExportTxt').onclick = () => $('exportTxtModal').classList.add('hidden');
  }

  // ==== PUSH LOG ====
  function pushLog(lead, msg) {
    lead.log = lead.log || [];
    lead.log.push(`[${formatDateISO(new Date())}] ${msg}`);
    if (lead.log.length > 50) lead.log = lead.log.slice(-50);
  }

  // ==== IMPORT/EXPORT CSV ====
  $('importCsv').onclick = () => $('fileImport').click();
  $('fileImport').onchange = (e) => {
    let f = e.target.files[0];
    if (!f) return;
    let reader = new FileReader();
    reader.onload = function (e) {
      let rows = e.target.result.split('\n').map(x => x.split(','));
      for (let r of rows) {
        if (r.length < 2) continue;
        leads.push({
          id: Date.now() + Math.floor(Math.random() * 99999),
          struttura: r[0], citta: r[1], referente: r[2] || '', telefono: r[3] || '',
          stato: 'da_lavorare', tags: [], archiviato: false, chiuso: false,
          data_inserimento: new Date().toISOString(), log: [], answers: {}
        });
      }
      saveAll();
      toast('Import completato!');
      if (MODE === 'kanban') renderKanban();
      else showCurrentLead();
    };
    reader.readAsText(f);
  };
  $('exportCsv').onclick = () => {
    let csv = leads.map(l =>
      [l.struttura, l.citta, l.referente, l.telefono, l.stato].join(',')
    ).join('\n');
    let blob = new Blob([csv], { type: 'text/csv' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url; a.download = "leads.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 400);
  };
  $('clearAll').onclick = () => {
    if (confirm("Cancellare tutto?")) {
      leads = [];
      tagList = [];
      localStorage.removeItem('leads');
      localStorage.removeItem('tagList');
      saveAll();
      if (MODE === 'kanban') renderKanban();
      else showCurrentLead();
    }
  };

  // ==== EXPORT TXT ====
  // (già sopra)

  // ==== INIZIO APP ====
  updateDashboard();
  updateXPBar();
  renderMissions();
  showCurrentLead();

  // ==== ESPORTA LOGICA GAMER PER RIUTILIZZO ====
  window.awardXP = awardXP;
  window.unlockBadge = unlockBadge;
  window.resetDailyMissions = resetDailyMissions;
});
