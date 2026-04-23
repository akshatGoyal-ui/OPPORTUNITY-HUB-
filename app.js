// ═══════════════════════════════════════════════════════════
//  OpportunityHub — app.js  (v3.0 — Fixed & Stable)
// ═══════════════════════════════════════════════════════════

// ── API BASE ──────────────────────────────────────────────────
const API_BASE = window.location.origin;

// ── STATE ────────────────────────────────────────────────────
let activeTab = 'all', searchQuery = '', locFilter = 'All States';
let catFilter = 'All Categories', coFilter = 'All Companies';
let currentView = 'opp', isDark = true, selectedTemplate = 'modern';
let currentIQField = null, currentIQIndex = 0, iqAnswers = [];
let ALL_JOBS = [];

// ── BACKEND STORAGE (localStorage) ───────────────────────────
const DB = {
  get: (key) => { try { return JSON.parse(localStorage.getItem('ohub_'+key)); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem('ohub_'+key, JSON.stringify(val)); return true; } catch { return false; } },
  user: () => DB.get('user'),
  saveUser: (u) => DB.set('user', u),
  savedJobs: () => { const s = DB.get('saved'); return Array.isArray(s) ? s : []; },
  saveJob: (id) => { const s = DB.savedJobs(); if (!s.includes(String(id))) { s.push(String(id)); DB.set('saved', s); } },
  unsaveJob: (id) => { DB.set('saved', DB.savedJobs().filter(s=>s!==String(id))); },
  applications: () => { const apps = DB.get('apps'); return Array.isArray(apps) ? apps : []; },
  addApp: (app) => { const apps = DB.applications(); apps.unshift({...app, date: new Date().toLocaleDateString('en-IN'), id: Date.now()}); DB.set('apps', apps); },
  resumeData: () => DB.get('resume') || {},
  saveResume: (data) => DB.set('resume', data),
};

// ── INDIAN STATES ─────────────────────────────────────────────
const INDIAN_STATES = [
  'All States','Remote','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar',
  'Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand',
  'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya',
  'Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi (NCR)',
  'Jammu & Kashmir','Ladakh','Chandigarh','Puducherry'
];

// ── COMPANY CAREER PAGES (Fallback) ──────────────────────────
const COMPANY_CAREERS = {
  'Google India':        'https://careers.google.com/jobs/',
  'Infosys':             'https://career.infosys.com/joblist',
  'Flipkart':            'https://www.flipkartcareers.com/#!/joblist',
  'Microsoft India':     'https://careers.microsoft.com/v2/global/en/home.html',
  'Razorpay':            'https://razorpay.com/jobs/',
  'Zomato':              'https://www.zomato.com/careers',
  'HCL':                 'https://www.hcltech.com/careers',
  'CRED':                'https://careers.cred.club/',
  'TCS':                 'https://www.tcs.com/careers',
  'TCS Research':        'https://www.tcs.com/careers',
  'PhonePe':             'https://www.phonepe.com/careers/',
  'Swiggy':              'https://careers.swiggy.com/',
  'Meesho':              'https://meesho.io/careers',
  'Wipro':               'https://careers.wipro.com/',
  'Paytm':               'https://paytm.com/careers',
  'Polygon':             'https://polygon.technology/careers',
  'Zerodha':             'https://zerodha.com/careers/',
  'Ola':                 'https://www.olacabs.com/careers',
  'Freshworks':          'https://www.freshworks.com/company/careers/',
  'ShareChat':           'https://sharechat.com/careers',
  'NASSCOM':             'https://nasscom.in/careers',
  'Unstop':              'https://unstop.com',
  'Govt of India / MoE': 'https://www.sih.gov.in/',
};

// ── HELPERS ───────────────────────────────────────────────────
function getPlatformName(url, company) {
  if (!url) return company || 'Official Site';
  const lower = url.toLowerCase();
  if (lower.includes('naukri'))      return 'Naukri';
  if (lower.includes('internshala')) return 'Internshala';
  if (lower.includes('unstop'))      return 'Unstop';
  if (lower.includes('linkedin'))    return 'LinkedIn';
  if (lower.includes('google'))      return 'Google Careers';
  if (lower.includes('microsoft'))   return 'Microsoft Careers';
  if (lower.includes('amazon'))      return 'Amazon Jobs';
  if (lower.includes('glassdoor'))   return 'Glassdoor';
  if (lower.includes('wellfound'))   return 'Wellfound';
  if (lower.includes('foundit'))     return 'Foundit';
  if (lower.includes('sih.gov'))     return 'SIH Portal';
  if (lower.includes('codevita'))    return 'CodeVita';
  return company || 'Apply Now';
}

// ── RENDER DROPDOWNS ─────────────────────────────────────────
function renderDropdowns() {
  const locDD = document.getElementById('locDropdownMenu');
  const catDD = document.getElementById('catDropdownMenu');
  const coDD  = document.getElementById('coDropdownMenu');

  if (locDD) locDD.innerHTML = INDIAN_STATES.map(s=>`<div class="dropdown-item" onclick="selectFilter('loc','${s.replace(/'/g,"&#39;")}','locLabel','locDropdown')">${s}</div>`).join('');

  const cats = ['All Categories','Engineering','Data Science','Product','Design','Marketing','Finance','HR','Sales','Security','Legal'];
  if (catDD) catDD.innerHTML = cats.map(c=>`<div class="dropdown-item" onclick="selectFilter('cat','${c}','catLabel','catDropdown')">${c}</div>`).join('');

  if (coDD && typeof COMPANIES !== 'undefined') {
    const cos = ['All Companies',...COMPANIES.map(c=>c.name)];
    coDD.innerHTML = cos.map(c=>`<div class="dropdown-item" onclick="selectFilter('co','${c.replace(/'/g,"&#39;")}','coLabel','coDropdown')">${c}</div>`).join('');
  }
}

// ── FETCH JOBS FROM BACKEND ───────────────────────────────────
async function fetchJobsFromBackend() {
  try {
    const apiWrapper = document.getElementById('apiStatusWrapper');
    if (apiWrapper && window.OpportunityAPI) {
      apiWrapper.innerHTML = OpportunityAPI.getApiStatusHTML();
    }
    
    if (window.OpportunityAPI && OpportunityAPI.isApiConfigured()) {
      const liveJobs = await OpportunityAPI.fetchLiveJobsMulti();
      if (liveJobs && liveJobs.length > 0) {
        OpportunityAPI.updateApiStatus(liveJobs.length);
        const staticOnly = JOBS.filter(j => !liveJobs.find(lj => lj.title === j.title && lj.company === j.company));
        ALL_JOBS = [...liveJobs, ...staticOnly];
      }
    } else {
      ALL_JOBS = (typeof JOBS !== 'undefined') ? JOBS.filter(j => j.isLive !== false) : [];
    }
  } catch (err) {
    console.log('Using offline data.', err);
  }
}

// ── INIT ──────────────────────────────────────────────────────
async function init() {
  try {
  // Load static data immediately
  ALL_JOBS = (typeof JOBS !== 'undefined') ? JOBS.filter(j => j.isLive !== false) : [];

  // Restore user session
  try {
    const user = DB.user();
    if (user && user.name) {
      const btnSI = document.getElementById('btnSignIn');
      const btnSU = document.getElementById('btnSignUp');
      if (btnSI) btnSI.style.display = 'none';
      if (btnSU) btnSU.textContent = `👋 ${user.name.split(' ')[0]}`;
    }
  } catch(e) { console.error(e); }

  const path = window.location.pathname.split('/').pop() || 'index.html';
  const params = new URLSearchParams(window.location.search);

  if (path === '' || path === 'index.html') {
    renderDropdowns();
    const tab = params.get('tab');
    if (tab) activeTab = tab;

    // Show jobs IMMEDIATELY from static data
    renderCards();

    // Then silently refresh from backend
    fetchJobsFromBackend().then(() => renderCards());

    // Auto-refresh every 5 minutes
    setInterval(() => fetchJobsFromBackend().then(() => renderCards()), 5 * 60 * 1000);
  }
  else if (path === 'companies.html')  { renderCompanies(); }
  else if (path === 'practice.html')   { renderPracticeCards(); }
  else if (path === 'resume.html')     {
    renderTemplates();
    const resumeData = DB.resumeData();
    if (resumeData) {
      Object.keys(resumeData).forEach(k => {
        const el = document.getElementById('res_'+k);
        if (el) el.value = resumeData[k];
      });
    }
  }
  else if (path === 'dashboard.html')  { renderDashboard(); }
  else if (path === 'monetize.html')   { renderMonetize(); }
  } catch (error) {
    console.error(error);
    const countEl = document.getElementById('resultsCount');
    if (countEl) countEl.textContent = 'Error loading opportunities: ' + error.message;
  }
}

// ── RENDER CARDS ──────────────────────────────────────────────
function renderCards() {
  const grid = document.getElementById('cardsGrid');
  if (!grid) return;

  let items = [...ALL_JOBS];

  if (activeTab !== 'all') items = items.filter(j => j.type === activeTab);
  if (searchQuery)         items = items.filter(j =>
    (j.title   && j.title.toLowerCase().includes(searchQuery)) ||
    (j.company && j.company.toLowerCase().includes(searchQuery)) ||
    (j.tags    && j.tags.some(t => t.toLowerCase().includes(searchQuery))) ||
    (j.desc    && j.desc.toLowerCase().includes(searchQuery))
  );
  if (locFilter !== 'All States')       items = items.filter(j => j.location && (j.location === locFilter || j.location.includes(locFilter)));
  if (catFilter !== 'All Categories')   items = items.filter(j => j.category === catFilter);
  if (coFilter  !== 'All Companies')    items = items.filter(j => j.company  === coFilter);

  const countEl = document.getElementById('resultsCount');
  if (countEl) countEl.textContent = `${items.length} opportunit${items.length === 1 ? 'y' : 'ies'} found`;

  if (!items.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><h3>No results found</h3><p>Try adjusting your filters or search query.</p></div>`;
    return;
  }

  const savedIds = DB.savedJobs();
  const badgeMap = {
    job:        '<span class="badge badge-job">💼 Job</span>',
    internship: '<span class="badge badge-internship">🎓 Internship</span>',
    hackathon:  '<span class="badge badge-hackathon">💻 Hackathon</span>',
  };

  grid.innerHTML = items.map((j, i) => {
    const jobId   = j._id || j.id;
    const isSaved = savedIds.includes(String(jobId));
    const applyUrl = j.applyUrl || COMPANY_CAREERS[j.company] || '#';
    const platform = getPlatformName(applyUrl, j.company);
    const delay   = Math.min(i, 9) * 0.05;

    return `
      <div class="card" style="animation-delay:${delay}s">
        <div class="card-header">
          <div>
            <div class="card-title">${j.title}</div>
            <div class="card-company">🏢 ${j.company}</div>
          </div>
          ${badgeMap[j.type] || ''}
        </div>
        <div class="card-meta">
          <span>📍 ${j.location || 'India'}</span>
          <span>📅 ${j.posted || 'Recent'}</span>
          ${j.salary ? `<span class="salary-tag">💰 ${j.salary}</span>` : ''}
        </div>
        <div class="card-desc">${j.desc || ''}</div>
        <div class="tags">${(j.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div style="display:flex;gap:8px;">
          <button class="apply-btn" style="flex:3" onclick="applyNow('${jobId}')">Apply on ${platform} →</button>
          <button class="apply-btn" style="flex:1;padding:10px 6px;" onclick="toggleSave('${jobId}',this)" title="${isSaved ? 'Unsave' : 'Save'}">${isSaved ? '🔖' : '🏷️'}</button>
        </div>
      </div>`;
  }).join('');
}

// ── APPLY NOW ─────────────────────────────────────────────────
async function applyNow(id) {
  const job = ALL_JOBS.find(j => String(j._id || j.id) === String(id));
  if (!job) { showToast('❌ Job not found. Please refresh.'); return; }

  // Track application locally
  DB.addApp({ jobId: id, title: job.title, company: job.company, status: 'Applied' });

  // Get best URL
  let applyUrl = job.applyUrl || COMPANY_CAREERS[job.company];
  if (!applyUrl) {
    applyUrl = `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' apply')}`;
  }

  const platform = getPlatformName(applyUrl, job.company);
  showToast(`🚀 Opening ${job.company} — ${platform}...`);

  // Track click in backend (non-blocking)
  try {
    const user = DB.user();
    fetch(`${API_BASE}/api/clicks/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: id, jobTitle: job.title, company: job.company, jobType: job.type, targetUrl: applyUrl, userId: user ? user.id : null })
    });
  } catch(e) {}

  window.open(applyUrl, '_blank');
}

// ── SAVE JOB ──────────────────────────────────────────────────
function toggleSave(id, btn) {
  const saved = DB.savedJobs();
  if (saved.includes(String(id))) {
    DB.unsaveJob(String(id));
    btn.textContent = '🏷️';
    showToast('Job removed from saved.');
  } else {
    DB.saveJob(String(id));
    btn.textContent = '🔖';
    showToast('✅ Job saved! View in Dashboard.');
  }
}

// ── COMPANIES ────────────────────────────────────────────────
function renderCompanies() {
  const grid = document.getElementById('companiesGrid');
  if (!grid || typeof COMPANIES === 'undefined') return;
  grid.innerHTML = COMPANIES.map((c, i) => `
    <div class="company-card" style="animation-delay:${Math.min(i,9)*0.05}s">
      <div class="company-top">
        <div class="company-logo">${c.logo}</div>
        <div class="company-info"><h3>${c.name}</h3><span>${c.industry} · 📍 ${c.location}</span></div>
      </div>
      <div class="company-desc">${c.desc}</div>
      <div class="company-stats">
        <div class="company-stat"><div class="stat-val">${c.jobs}</div><div class="stat-label">Open Jobs</div></div>
        <div class="company-stat"><div class="stat-val">${c.internships}</div><div class="stat-label">Internships</div></div>
      </div>
      <div class="tags">${(c.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <button class="view-jobs-btn" onclick="filterByCompany('${c.name}')">View All Openings →</button>
    </div>`).join('');
}

function filterByCompany(name) {
  coFilter = name;
  const el = document.getElementById('coLabel');
  if (el) el.textContent = name;
  window.location.href = 'index.html';
}

// ── INTERVIEW PRACTICE ────────────────────────────────────────
function renderPracticeCards() {
  const grid = document.getElementById('practiceGrid');
  if (!grid || typeof INTERVIEW_QUESTIONS === 'undefined') return;
  const fields = Object.keys(INTERVIEW_QUESTIONS);
  grid.innerHTML = fields.map((key, i) => {
    const f = INTERVIEW_QUESTIONS[key];
    return `
      <div class="practice-card" style="animation-delay:${Math.min(i,9)*0.05}s">
        <div class="practice-icon">${f.icon}</div>
        <h3>${f.label}</h3>
        <p>Practice ${f.questions.length} interview questions with guided hints — updated for 2025.</p>
        <span class="difficulty diff-${f.difficulty}">${f.difficulty.charAt(0).toUpperCase()+f.difficulty.slice(1)}</span>
        <button class="start-practice-btn" onclick="startPractice('${key}')">Start Practice →</button>
      </div>`;
  }).join('');
}

function startPractice(field) { currentIQField = field; currentIQIndex = 0; iqAnswers = []; showIQQuestion(); openModal('iqModal'); }

function showIQQuestion() {
  const f = INTERVIEW_QUESTIONS[currentIQField];
  if (!f) return;
  const q = f.questions[currentIQIndex];
  document.getElementById('iqFieldLabel').textContent = f.label;
  document.getElementById('iqProgress').textContent = `${currentIQIndex+1} / ${f.questions.length}`;
  document.getElementById('iqQuestion').textContent = q.q;
  document.getElementById('iqAnswer').value = iqAnswers[currentIQIndex] || '';
  const hintEl = document.getElementById('iqHint');
  hintEl.textContent = '💡 Hint: '+q.hint;
  hintEl.classList.remove('show');
  document.getElementById('iqPrevBtn').disabled = currentIQIndex === 0;
  document.getElementById('iqNextBtn').textContent = currentIQIndex === f.questions.length-1 ? 'Finish ✓' : 'Next →';
}

function iqNext() {
  const f = INTERVIEW_QUESTIONS[currentIQField];
  iqAnswers[currentIQIndex] = document.getElementById('iqAnswer').value;
  if (currentIQIndex < f.questions.length-1) { currentIQIndex++; showIQQuestion(); }
  else { closeModal('iqModal'); showToast(`🎉 Practice complete! ${f.questions.length} questions done.`); }
}
function iqPrev() { iqAnswers[currentIQIndex] = document.getElementById('iqAnswer').value; if (currentIQIndex > 0) { currentIQIndex--; showIQQuestion(); } }
function toggleHint() { document.getElementById('iqHint').classList.toggle('show'); }

// ── RESUME BUILDER ────────────────────────────────────────────
function renderTemplates() {
  const grid = document.getElementById('templateGrid');
  if (!grid || typeof RESUME_TEMPLATES === 'undefined') return;
  grid.innerHTML = RESUME_TEMPLATES.map(t => `
    <div class="tpl-card ${selectedTemplate===t.id?'selected':''}" onclick="selectTemplate('${t.id}',this)" title="${t.desc}">
      <div class="tpl-icon">${t.icon}</div>
      <div class="tpl-name">${t.name}</div>
    </div>`).join('');
}

function selectTemplate(id, el) {
  selectedTemplate = id;
  document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  const tpl = RESUME_TEMPLATES.find(t => t.id === id);
  showToast(`✅ Template "${tpl.name}" selected!`);
}

function generateResume() {
  const fields = ['fullName','email','phone','city','linkedin','github','college','degree','gradYear','cgpa','jobTitle','company1','duration','responsibilities','techSkills','softSkills','projectName','projectDesc','certifications','achievements'];
  const data = {};
  fields.forEach(f => { const el = document.getElementById('res_'+f); if (el) data[f] = el.value; });
  DB.saveResume(data);
  if (!data.fullName) { showToast('⚠️ Please enter your full name first.'); return; }
  const tpl = RESUME_TEMPLATES.find(t => t.id === selectedTemplate);
  showToast(`📄 "${tpl.name}" resume generated! Downloading...`);
}

// ── MONETIZE PAGE ─────────────────────────────────────────────
function renderMonetize() {
  const grid = document.getElementById('monetizeGrid');
  if (!grid) return;
  const methods = [
    {icon:'💰',title:'Naukri Affiliate',desc:'Earn ₹50–500 per successful job application through your referral link.',earn:'₹50–500/application',link:'https://www.naukri.com/affiliates'},
    {icon:'🟢',title:'Internshala Partner',desc:'Earn commission for every student who enrolls in paid courses.',earn:'₹100–300/enrollment',link:'https://internshala.com/affiliate'},
    {icon:'🟠',title:'Unstop Affiliate',desc:'Earn per registration for hackathons via your referral code.',earn:'₹20–100/registration',link:'https://unstop.com/affiliates'},
    {icon:'🎓',title:'Coursera / Udemy',desc:'Earn 15–45% commission when users buy courses via your links.',earn:'15–45% commission',link:'https://www.coursera.org/about/affiliates'},
    {icon:'🏢',title:'Job Post Revenue',desc:'Charge companies ₹999–9,999 to post jobs on OpportunityHub.',earn:'₹999–9,999/listing',link:'#'},
    {icon:'📝',title:'Resume Review',desc:'Offer ₹299–999 manual resume reviews or AI-powered ATS scoring.',earn:'₹299–999/review',link:'#'},
    {icon:'🎯',title:'Mock Interview',desc:'Charge ₹499–1,499 per mock interview session.',earn:'₹499–1,499/session',link:'#'},
    {icon:'📢',title:'Sponsored Listings',desc:'Companies pay ₹2,999–14,999/week to feature at top.',earn:'₹2,999–14,999/week',link:'#'},
    {icon:'🤝',title:'Campus Partner',desc:'Partner with colleges for ₹15,000–50,000/month.',earn:'₹15K–50K/month',link:'#'},
  ];
  grid.innerHTML = methods.map((m, i) => `
    <div class="monetize-card" style="animation-delay:${Math.min(i,9)*0.05}s">
      <div class="mon-icon">${m.icon}</div>
      <h3>${m.title}</h3>
      <p>${m.desc}</p>
      <div class="mon-earn">💸 Earn: ${m.earn}</div>
      <button class="mon-btn" onclick="window.open('${m.link}','_blank')">${m.link==='#'?'Enable on Your Platform':'Get Affiliate Link ↗'}</button>
    </div>`).join('');
}

// ── PAGE NAVIGATION ───────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-'+name);
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const el = document.getElementById('nav-'+name);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'companies') renderCompanies();
  if (name === 'practice')  renderPracticeCards();
  if (name === 'resume')    renderTemplates();
  if (name === 'monetize')  renderMonetize();
  if (name === 'home')      renderCards();
  if (name === 'dashboard') renderDashboard();
}

function filterTab(tab) {
  activeTab = tab;
  ['all','job','internship','hackathon'].forEach(t => {
    const el = document.getElementById('tab-'+t);
    if (el) el.classList.toggle('active', t === tab);
  });
  renderCards();
}

function switchView(v) {
  currentView = v;
  document.getElementById('view-opp')?.classList.toggle('active', v==='opp');
  document.getElementById('view-co')?.classList.toggle('active',  v==='co');
  const main = document.getElementById('mainContent');
  if (!main) return;
  if (v === 'co') {
    const countEl = document.getElementById('resultsCount');
    if (countEl) countEl.textContent = `${COMPANIES.length} companies found`;
    main.innerHTML = `<div class="companies-grid" id="companiesGrid"></div>`;
    renderCompanies();
  } else {
    main.innerHTML = `<div class="cards-grid" id="cardsGrid"></div>`;
    renderCards();
  }
}

// ── SEARCH & FILTERS ──────────────────────────────────────────
function handleSearch(val) { searchQuery = val.toLowerCase().trim(); renderCards(); }

function toggleDropdown(id) {
  document.querySelectorAll('.dropdown-wrapper').forEach(d => { if (d.id !== id) d.classList.remove('open'); });
  document.getElementById(id)?.classList.toggle('open');
}

function selectFilter(type, val, labelId, dropdownId) {
  const labelEl = document.getElementById(labelId);
  if (labelEl) labelEl.textContent = val;
  document.getElementById(dropdownId)?.classList.remove('open');
  if (type === 'loc') locFilter = val;
  else if (type === 'cat') catFilter = val;
  else if (type === 'co')  coFilter  = val;
  document.querySelectorAll(`#${dropdownId} .dropdown-item`).forEach(el => el.classList.toggle('selected', el.textContent === val));
  renderCards();
}

function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ── AUTH ───────────────────────────────────────────────────────
let TEMP_USER_EMAIL = '';

async function signIn() {
  const email = document.getElementById('siEmail')?.value;
  const pass  = document.getElementById('siPass')?.value;
  if (!email || !pass) { showToast('⚠️ Please fill all fields.'); return; }
  try {
    const res  = await fetch(`${API_BASE}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password: pass }) });
    const data = await res.json();
    if (!res.ok) {
      if (data.unverified) { showToast('🔐 OTP sent to your email.'); TEMP_USER_EMAIL = email; closeModal('signinModal'); openModal('otpModal'); return; }
      showToast(`❌ ${data.msg || 'Login failed'}`); return;
    }
    localStorage.setItem('ohub_token', data.token);
    DB.saveUser(data.user);
    closeModal('signinModal');
    document.getElementById('btnSignIn').style.display = 'none';
    document.getElementById('btnSignUp').textContent = `👋 ${data.user.name.split(' ')[0]}`;
    showToast(`✅ Welcome back, ${data.user.name.split(' ')[0]}!`);
  } catch(err) { showToast('❌ Cannot connect to server.'); }
}

async function signUp() {
  const name  = document.getElementById('suName')?.value;
  const email = document.getElementById('suEmail')?.value;
  const phone = document.getElementById('suPhone')?.value;
  const pass  = document.getElementById('suPass')?.value;
  const role  = document.getElementById('suRole')?.value;
  if (!name || !email || !pass) { showToast('⚠️ Please fill all required fields.'); return; }
  try {
    const res  = await fetch(`${API_BASE}/api/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, phone, password: pass, role }) });
    const data = await res.json();
    if (!res.ok) { showToast(`❌ ${data.msg || 'Registration failed'}`); return; }
    showToast('📨 OTP sent! Please verify your email.');
    TEMP_USER_EMAIL = email;
    closeModal('signupModal');
    openModal('otpModal');
  } catch(err) { showToast('❌ Registration server error.'); }
}

async function verifyOTP() {
  const otp = document.getElementById('otpCode')?.value;
  if (!otp || otp.length < 6) { showToast('⚠️ Enter a valid 6-digit code.'); return; }
  try {
    const btn = document.getElementById('otpSubmitBtn');
    btn.disabled = true; btn.textContent = 'Verifying...';
    const res  = await fetch(`${API_BASE}/api/auth/verify-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: TEMP_USER_EMAIL, otp }) });
    const data = await res.json();
    btn.disabled = false; btn.textContent = 'Verify & Continue →';
    if (!res.ok) { showToast(`❌ ${data.msg || 'Verification failed'}`); return; }
    localStorage.setItem('ohub_token', data.token);
    DB.saveUser(data.user);
    closeModal('otpModal');
    document.getElementById('btnSignIn').style.display = 'none';
    const suBtn = document.getElementById('btnSignUp');
    if (suBtn) suBtn.textContent = `👋 ${data.user.name.split(' ')[0]}`;
    showToast(`🎉 Welcome to OpportunityHub, ${data.user.name.split(' ')[0]}!`);
  } catch(err) { showToast('❌ Verification server error.'); }
}

async function resendOTP() {
  if (!TEMP_USER_EMAIL) return;
  try {
    showToast('🔄 Resending OTP...');
    const res = await fetch(`${API_BASE}/api/auth/send-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: TEMP_USER_EMAIL }) });
    if (res.ok) showToast('✅ New OTP sent!');
  } catch(err) { showToast('❌ Resend failed.'); }
}

// ── TOAST ──────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toastMsg');
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── THEME ──────────────────────────────────────────────────────
function toggleTheme() {
  isDark = !isDark;
  const v = isDark
    ? {'--bg':'#0a0a0b','--surface':'#111113','--surface2':'#18181c','--border':'#242428','--border-hover':'#3a3a42','--text':'#f0f0f2','--text-muted':'#7a7a85','--text-dim':'#4a4a55','--tag-bg':'#1e1e24','--card-hover':'#141418'}
    : {'--bg':'#f4f4f6','--surface':'#ffffff','--surface2':'#f0f0f3','--border':'#e0e0e6','--border-hover':'#c0c0cc','--text':'#111113','--text-muted':'#555560','--text-dim':'#99999f','--tag-bg':'#ebebf0','--card-hover':'#f8f8fb'};
  Object.entries(v).forEach(([k, val]) => document.documentElement.style.setProperty(k, val));
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// ── CLOSE DROPDOWNS ON OUTSIDE CLICK ─────────────────────────
document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown-wrapper')) document.querySelectorAll('.dropdown-wrapper').forEach(d => d.classList.remove('open'));
});
document.querySelectorAll('.modal-overlay').forEach(el => el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); }));

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  const savedGrid = document.getElementById('dashboardSavedGrid');
  const appGrid   = document.getElementById('dashboardAppliedGrid');
  if (!savedGrid || !appGrid) return;

  const savedIds   = DB.savedJobs();
  const savedItems = ALL_JOBS.filter(j => savedIds.includes(String(j._id || j.id)));

  if (savedItems.length === 0) {
    savedGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">📍</div><h3>No saved jobs</h3><p>Tap 🏷️ on any job to save it here.</p></div>`;
  } else {
    savedGrid.innerHTML = savedItems.map(j => {
      const applyUrl = j.applyUrl || COMPANY_CAREERS[j.company] || '#';
      const platform = getPlatformName(applyUrl, j.company);
      return `
        <div class="card" style="padding:16px;">
          <h4 style="margin-bottom:4px;">${j.title}</h4>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px;">🏢 ${j.company} · 📍 ${j.location || 'India'}</p>
          <button class="apply-btn" style="width:100%;padding:8px;" onclick="applyNow('${j._id || j.id}')">Apply on ${platform} →</button>
        </div>`;
    }).join('');
  }

  const apps = DB.applications();
  if (apps.length === 0) {
    appGrid.innerHTML = `<div class="empty-state" style="padding:40px;background:var(--surface);border-radius:var(--radius)"><div class="empty-icon">📝</div><h3>No applications yet</h3><p>Start applying to see your tracked applications.</p></div>`;
  } else {
    appGrid.innerHTML = apps.map(a => `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h4 style="margin-bottom:4px;">${a.title}</h4>
          <p style="font-size:0.8rem;color:var(--text-muted);">🏢 ${a.company} · Applied: ${a.date}</p>
        </div>
        <span class="badge badge-internship" style="background:#10b98122;color:#10b981;border-color:#10b98155;">✓ Applied</span>
      </div>`).join('');
  }
}

// ── START ──────────────────────────────────────────────────────
init();