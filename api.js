// ═══════════════════════════════════════════════════════════════════
//  OpportunityHub — api.js  (v2.0 — Enhanced Multi-Platform API)
//
//  FREE SETUP (5 mins):
//  1. Go to: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
//  2. Sign up FREE → Subscribe to "JSearch" (200 req/month free)
//  3. Copy your API key → paste in RAPIDAPI_KEY below
//  4. Open index.html — LIVE jobs will load from all portals!
//
//  MONETIZATION: Your affiliate/referral IDs go in AFFILIATE_IDS
//  When users click "Apply", they go through your affiliate link
//  and you earn commission from Naukri, Internshala, Unstop, etc.
// ═══════════════════════════════════════════════════════════════════

// ▼▼▼ PASTE YOUR RAPIDAPI KEY HERE ▼▼▼
const RAPIDAPI_KEY = "YOUR_RAPIDAPI_KEY_HERE";

// ▼▼▼ YOUR AFFILIATE / REFERRAL IDs (for monetization) ▼▼▼
// Register as affiliate on each platform, then paste IDs here:
// Naukri: https://www.naukri.com/affiliates
// Internshala: https://internshala.com/affiliate
// Unstop: https://unstop.com/affiliates
const AFFILIATE_IDS = {
  naukri: "",   // e.g. "YOURID123"
  internshala: "",   // e.g. "AFF_12345"
  unstop: "",   // e.g. "ref_yourname"
  linkedin: "",
};

// ─────────────────────────────────────────────────────────────
//  PLATFORM CONFIG — 10 Major Platforms
// ─────────────────────────────────────────────────────────────
const PLATFORMS = {
  "naukri.com": {
    name: "Naukri", icon: "🔵", color: "#4b1fa7", label: "via Naukri.com",
    buildUrl: (title, company) => {
      const base = `https://www.naukri.com/${slugify(title)}-jobs-in-india`;
      return AFFILIATE_IDS.naukri ? `${base}?affiliateId=${AFFILIATE_IDS.naukri}` : base;
    }
  },
  "internshala.com": {
    name: "Internshala", icon: "🟢", color: "#00a653", label: "via Internshala",
    buildUrl: (title) => {
      const base = `https://internshala.com/internships/${slugify(title)}-internship`;
      return AFFILIATE_IDS.internshala ? `${base}?ref=${AFFILIATE_IDS.internshala}` : base;
    }
  },
  "unstop.com": {
    name: "Unstop", icon: "🟠", color: "#ff6b35", label: "via Unstop",
    buildUrl: (title) => {
      const base = `https://unstop.com/jobs?searchTerm=${encodeURIComponent(title)}`;
      return AFFILIATE_IDS.unstop ? `${base}&ref=${AFFILIATE_IDS.unstop}` : base;
    }
  },
  "linkedin.com": {
    name: "LinkedIn", icon: "🔗", color: "#0077b5", label: "via LinkedIn",
    buildUrl: (title) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&location=India`
  },
  "indeed.com": {
    name: "Indeed", icon: "🔷", color: "#003a9b", label: "via Indeed",
    buildUrl: (title) => `https://in.indeed.com/jobs?q=${encodeURIComponent(title)}&l=India`
  },
  "glassdoor.com": {
    name: "Glassdoor", icon: "🟩", color: "#0caa41", label: "via Glassdoor",
    buildUrl: (title) => `https://www.glassdoor.co.in/Job/india-${slugify(title)}-jobs-SRCH_IL.0,5_IN115.htm`
  },
  "wellfound.com": {
    name: "Wellfound", icon: "🚀", color: "#e47a34", label: "via Wellfound",
    buildUrl: (title) => `https://wellfound.com/jobs?q=${encodeURIComponent(title)}&l=India`
  },
  "foundit.in": {
    name: "Foundit", icon: "🟡", color: "#f5a623", label: "via Foundit",
    buildUrl: (title) => `https://www.foundit.in/search/results?query=${encodeURIComponent(title)}`
  },
  "shine.com": {
    name: "Shine", icon: "⭐", color: "#ff4500", label: "via Shine",
    buildUrl: (title) => `https://www.shine.com/job-search/${slugify(title)}-jobs`
  },
  "hirist.tech": {
    name: "Hirist", icon: "💻", color: "#6366f1", label: "via Hirist.tech",
    buildUrl: (title) => `https://www.hirist.tech/jobs?q=${encodeURIComponent(title)}`
  },
  "default": {
    name: "Job Portal", icon: "🌐", color: "#e8ff47", label: "via Job Portal",
    buildUrl: (title, company, url) => url || "#"
  }
};

// ─────────────────────────────────────────────────────────────
//  FETCH LIVE JOBS FROM JSEARCH API
//  Fetches jobs from 8 Indian platforms simultaneously
// ─────────────────────────────────────────────────────────────
async function fetchLiveJobs(query = "software engineer jobs India 2025", type = "all") {
  if (RAPIDAPI_KEY === "YOUR_RAPIDAPI_KEY_HERE") {
    console.warn("OpportunityHub: Add your RapidAPI key in api.js");
    return [];
  }

  const empType = { job: "FULLTIME", internship: "INTERN", hackathon: "", all: "" }[type] || "";

  const params = new URLSearchParams({
    query: `${query} India 2025`,
    page: "1",
    num_pages: "3",
    date_posted: "month",
    country: "in",
    ...(empType && { employment_types: empType }),
  });

  try {
    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.data || []).map(job => normalizeToCard(job));
  } catch (err) {
    console.error("OpportunityHub API error:", err.message);
    return [];
  }
}

// Multiple role searches for better coverage
async function fetchLiveJobsMulti() {
  if (RAPIDAPI_KEY === "YOUR_RAPIDAPI_KEY_HERE") return [];
  const queries = [
    "software engineer jobs India",
    "data scientist jobs India",
    "product manager jobs India",
    "UI UX designer jobs India",
    "internship India 2025",
  ];
  try {
    const results = await Promise.all(queries.map(q => fetchLiveJobs(q, "all")));
    const all = results.flat();
    return deduplicateJobs(all);
  } catch (e) {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
//  NORMALIZE API JOB → CARD FORMAT
// ─────────────────────────────────────────────────────────────
function normalizeToCard(apiJob) {
  const applyLink = apiJob.job_apply_link || apiJob.job_url || "";
  const domain = extractDomain(applyLink);
  const platform = PLATFORMS[domain] || PLATFORMS["default"];
  const isIntern = /intern/i.test(apiJob.job_title || "") || /intern/i.test(apiJob.job_employment_type || "");
  const applyUrl = platform.buildUrl(apiJob.job_title || "job", apiJob.employer_name || "", applyLink);

  return {
    id: "live_" + (apiJob.job_id || Math.random().toString(36).slice(2, 8)),
    type: isIntern ? "internship" : "job",
    title: apiJob.job_title || "Job Opening",
    company: apiJob.employer_name || "Company",
    location: apiJob.job_city ? `${apiJob.job_city}, India` : "India",
    posted: relativeTime(apiJob.job_posted_at_timestamp),
    desc: (apiJob.job_description || "").slice(0, 230) + "...",
    tags: extractTechTags(apiJob.job_title || "", apiJob.job_description || ""),
    category: guessCategory(apiJob.job_title || ""),
    salary: apiJob.job_min_salary ? `₹${fmtSalary(apiJob.job_min_salary)}–${fmtSalary(apiJob.job_max_salary)}` : null,
    isLive: true,
    sourceName: platform.name,
    sourceIcon: platform.icon,
    sourceColor: platform.color,
    sourceLabel: platform.label,
    applyUrl: applyUrl,
    hasAffiliate: !!(AFFILIATE_IDS[platform.name?.toLowerCase()] || ""),
  };
}

// ─────────────────────────────────────────────────────────────
//  CARD HTML BUILDERS
// ─────────────────────────────────────────────────────────────
function liveJobCardHTML(job, index) {
  const badgeColor = job.sourceColor || "#e8ff47";
  const delay = Math.min(index, 9) * 0.05;
  const affBadge = job.hasAffiliate ? `<span class="aff-badge">💰 Earn</span>` : "";

  return `
    <div class="card" style="animation-delay:${delay}s;border-top:2px solid ${badgeColor}33;">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(job.title)}</div>
          <div class="card-company">🏢 ${escapeHtml(job.company)}</div>
        </div>
        ${liveBadgeHTML(job.type)}
      </div>
      <div class="source-row">
        <span class="source-badge" style="color:${badgeColor};border-color:${badgeColor}55;background:${badgeColor}11;">
          ${job.sourceIcon} ${job.sourceLabel}
        </span>${affBadge}
      </div>
      <div class="card-meta">
        <span>📍 ${escapeHtml(job.location)}</span>
        <span>📅 ${job.posted}</span>
        ${job.salary ? `<span class="salary-tag">💰 ${job.salary}</span>` : ``}
      </div>
      <div class="card-desc">${escapeHtml(job.desc)}</div>
      <div class="tags">${(job.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
      <button class="apply-btn ${(job.sourceName || '').toLowerCase()}"
        onclick="window.open('${escapeAttr(job.applyUrl)}','_blank')">
        Apply on ${escapeHtml(job.sourceName)} ↗
      </button>
    </div>`;
}

function localJobCardHTML(j, index) {
  const delay = Math.min(index, 9) * 0.05;
  const badgeMap = {
    job: '<span class="badge badge-job">💼 Job</span>',
    internship: '<span class="badge badge-internship">🎓 Internship</span>',
    hackathon: '<span class="badge badge-hackathon">💻 Hackathon</span>',
  };
  return `
    <div class="card" style="animation-delay:${delay}s">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(j.title)}</div>
          <div class="card-company">🏢 ${escapeHtml(j.company)}</div>
        </div>
        ${badgeMap[j.type] || ""}
      </div>
      <div class="card-meta">
        <span>📍 ${escapeHtml(j.location)}</span>
        <span>📅 ${j.posted}</span>
        ${j.salary ? `<span class="salary-tag">💰 ${j.salary}</span>` : ""}
      </div>
      <div class="card-desc">${escapeHtml(j.desc)}</div>
      <div class="tags">${(j.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
      <button class="apply-btn" onclick="applyNow(${j.id})">Apply Now →</button>
    </div>`;
}

function buildMixedGrid(localJobs, liveJobs) {
  const all = [
    ...liveJobs.map((j, i) => liveJobCardHTML(j, i)),
    ...localJobs.map((j, i) => localJobCardHTML(j, i + liveJobs.length)),
  ];
  return all.join("");
}

// ─────────────────────────────────────────────────────────────
//  LOAD + INJECT LIVE JOBS INTO PAGE
// ─────────────────────────────────────────────────────────────
async function loadAndInjectLiveJobs(localJobs) {
  if (!isApiConfigured()) return null;
  const liveJobs = await fetchLiveJobsMulti();
  return deduplicateJobs(liveJobs);
}

function deduplicateJobs(liveJobs) {
  const seen = new Set();
  return liveJobs.filter(j => {
    const key = `${j.title}|${j.company}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
//  STATUS BAR HTML
// ─────────────────────────────────────────────────────────────
function isApiConfigured() {
  return RAPIDAPI_KEY !== "YOUR_RAPIDAPI_KEY_HERE" && RAPIDAPI_KEY.length > 10;
}

function getApiStatusHTML() {
  if (!isApiConfigured()) {
    return '';
  }
  return `
    <div style="max-width:1200px;margin:0 auto;padding:0 32px 12px;">
      <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:8px;border:1px solid var(--border);background:var(--surface);font-size:0.82rem;color:var(--text-muted);flex-wrap:wrap;">
        <span id="apiDot" style="width:8px;height:8px;border-radius:50%;background:#fb923c;display:inline-block;animation:pulse 1.5s infinite;"></span>
        <span id="apiMsg">Loading live jobs from Naukri, Internshala, Unstop, LinkedIn...</span>
        <span style="margin-left:auto;font-size:0.72rem;">
          <span style="color:#34d399;">🔵 Naukri</span> &nbsp;
          <span style="color:#34d399;">🟢 Internshala</span> &nbsp;
          <span style="color:#34d399;">🟠 Unstop</span> &nbsp;
          <span style="color:#34d399;">🔗 LinkedIn</span>
        </span>
      </div>
    </div>`;
}

function updateApiStatus(count) {
  const dot = document.getElementById("apiDot");
  const msg = document.getElementById("apiMsg");
  if (!dot || !msg) return;
  dot.style.background = "#34d399";
  msg.textContent = `✅ Live — ${count} fresh jobs loaded from Naukri, Internshala, Unstop & more`;
}

function showApiSetupInfo() {
  alert(
    "🔌 HOW TO CONNECT LIVE JOBS (FREE)\n\n" +
    "1. Visit: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch\n" +
    "2. Sign up FREE → Subscribe to JSearch (200 req/month free)\n" +
    "3. Copy your API key\n" +
    "4. Open api.js\n" +
    "5. Replace YOUR_RAPIDAPI_KEY_HERE with your key\n" +
    "6. Refresh page — live jobs from 10 portals appear!\n\n" +
    "💰 MONETIZE: Register as affiliate on Naukri / Internshala /\n" +
    "Unstop and add your affiliate IDs in AFFILIATE_IDS in api.js.\n" +
    "Every application click earns you commission!"
  );
}

function redirectToPortal(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function liveBadgeHTML(type) {
  if (type === 'internship') return '<span class="badge badge-internship">🎓 Internship</span>';
  if (type === 'hackathon') return '<span class="badge badge-hackathon">💻 Hackathon</span>';
  return '<span class="badge badge-job">💼 Job</span>';
}

// ─────────────────────────────────────────────────────────────
//  UTILITY HELPERS
// ─────────────────────────────────────────────────────────────
function extractDomain(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return Object.keys(PLATFORMS).find(d => d !== "default" && host.includes(d)) || "default";
  } catch { return "default"; }
}

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function relativeTime(ts) {
  if (!ts) return "Recently";
  const days = Math.floor((Date.now() / 1000 - ts) / 86400);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? "s" : ""} ago`;
  return "1 month ago";
}

function fmtSalary(n) {
  if (!n) return "";
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

function extractTechTags(title, desc) {
  const TECH = [
    "Python", "Java", "JavaScript", "TypeScript", "React", "Node.js", "Angular", "Vue", "Next.js",
    "Go", "Rust", "C++", "C#", "Swift", "Kotlin", "Flutter", "Django", "Spring", "FastAPI",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "SQL", "MongoDB", "PostgreSQL", "Redis",
    "Machine Learning", "ML", "AI", "NLP", "LLM", "GenAI", "TensorFlow", "PyTorch", "Pandas", "Spark",
    "Figma", "UI/UX", "SEO", "Excel", "Tableau", "Power BI", "Salesforce", "SAP",
    "Linux", "Git", "REST API", "GraphQL", "Microservices", "Agile", "React Native",
    "Android", "iOS", "Blockchain", "DevOps", "CI/CD", "Data Science", "Product", "Prompt Engineering",
    "Cybersecurity", "Cloud", "FinTech", "EdTech", "SaaS", "B2B", "B2C",
  ];
  const text = `${title} ${desc}`;
  const found = TECH.filter(k => new RegExp(`\\b${k}\\b`, "i").test(text));
  return found.slice(0, 4).length ? found.slice(0, 4) : ["India", "2025"];
}

function guessCategory(title) {
  const t = title.toLowerCase();
  if (/data|analyst|ml|ai|scientist|nlp|bi|llm|genai/.test(t)) return "Data Science";
  if (/design|ux|ui|figma|graphic|motion/.test(t)) return "Design";
  if (/market|seo|content|social|growth|brand/.test(t)) return "Marketing";
  if (/product|pm |program|roadmap/.test(t)) return "Product";
  if (/finance|account|tax|ca |cfa|invest/.test(t)) return "Finance";
  if (/hr |human resource|recruit|talent|people/.test(t)) return "HR";
  if (/sales|business dev|bd |revenue|account exec/.test(t)) return "Sales";
  if (/security|cyber|penetration|soc |siem/.test(t)) return "Security";
  if (/legal|compliance|policy|lawyer/.test(t)) return "Legal";
  return "Engineering";
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeAttr(str) {
  return String(str || "").replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────────────────────
//  EXPORT
// ─────────────────────────────────────────────────────────────
window.OpportunityAPI = {
  isApiConfigured, fetchLiveJobs, fetchLiveJobsMulti,
  loadAndInjectLiveJobs, buildMixedGrid,
  localJobCardHTML, liveJobCardHTML,
  getApiStatusHTML, updateApiStatus,
  showApiSetupInfo, redirectToPortal,
  PLATFORMS, AFFILIATE_IDS,
};