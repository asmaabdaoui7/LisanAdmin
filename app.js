/**
 * ============================================================================
 * لِسَان | LISAN — غرفة العمليات ولوحة التحكم الشاملة (app.js) — الإصدار 2.0
 * ============================================================================
 * الميزات المدمجة:
 * 1. تأسيس تلقائي للأدمن الرئيسي (Admin / 123456) بتشفير SHA-256 + فحص لحظي عند الدخول
 * 2. الوثوق بالمتصفح + الرمز السريع (4 أرقام) + استعادة الرمز بكلمة المرور
 * 3. ملفات الموظفين (صورة شخصية + اسم + نبذة تعريفية) + صلاحيات دقيقة بالاختيار
 * 4. بحث عربي ذكي شامل يلتقط الكلمات من المحتوى والاختبارات ومن (نبذة الموظف)
 * 5. المرآة الفورية: مزامنة الشعار والاسم واللون وأيقونة التبويب بين المستودعين
 * 6. المحرر الأكاديمي الحر: صور في أي مكان (رفع/لصق/سحب) + تحكم بالحجم والشرح
 *    + معاينة حية قبل النشر + حفظ تلقائي للمسودات
 * 7. مولّد خريطة الموقع (sitemap.xml) الكامل لمحركات البحث + مفاتيح الميزات الشاملة
 * ============================================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ============================================================================
 * 1. مفاتيح الربط (Firebase + ImgBB)
 * ============================================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyAem1ULSfM9RdKXZPW36fZI8RoI-gvW-lo",
  authDomain: "lisan-b7f25.firebaseapp.com",
  projectId: "lisan-b7f25",
  storageBucket: "lisan-b7f25.firebasestorage.app",
  messagingSenderId: "1068695535462",
  appId: "1:1068695535462:web:aac5c38525898fa30812a7",
  measurementId: "G-4HVJE22SXL"
};

const IMGBB_API_KEY = "6f2cb200a4cd81440fc5ea71238a919e";
const TRUST_STORAGE_KEY = "lisan_ops_trusted_device_v1";
const SESSION_STORAGE_KEY = "lisan_ops_session_v1";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ============================================================================
 * 2. مصفوفة الصلاحيات ومفاتيح الميزات والإعدادات الافتراضية
 * ============================================================================ */
const PERMISSIONS_CATALOG = [
  { key: "manage_content", label: "إضافة وتعديل المحتوى (الكتب، المصطلحات، المحاضرات، الأبحاث)" },
  { key: "delete_content", label: "حذف المواد والمحتوى نهائياً" },
  { key: "approve_submissions", label: "مراجعة واعتماد مساهمات ومشاريع الطلبة" },
  { key: "manage_quizzes", label: "إدارة بنك الاختبارات التفاعلية والأسئلة" },
  { key: "manage_sections", label: "تعديل أسماء الأقسام الستة وفروعها وأوصافها" },
  { key: "manage_features", label: "إخفاء وإظهار ميزات وأقسام الموقع العام (Feature Flags)" },
  { key: "manage_settings", label: "تعديل هوية المنصة، الشعار، الألوان، الإعلان، وخريطة SEO" },
  { key: "manage_admins", label: "إدارة فريق المشرفين ومنح الصلاحيات" },
  { key: "view_logs", label: "الاطلاع على سجل النشاطات والعمليات" }
];

const FEATURE_FLAGS_CATALOG = [
  { key: "globalSearch", label: "محرك البحث العالمي الذكي", desc: "إظهار شريط البحث في الرئيسية والشريط العلوي" },
  { key: "statsBar", label: "شريط الإحصائيات الترحيبي", desc: "عرض عدد الأقسام والمواد والاختبارات في الواجهة" },
  { key: "announcements", label: "شريط الإعلانات العلوي", desc: "إظهار شريط التنبيهات العاجلة أعلى المنصة" },
  { key: "sectionLibrary", label: "قسم 1: المكتبة اللسانية", desc: "إظهار أو إخفاء المكتبة اللسانية بالكامل" },
  { key: "sectionDictionary", label: "قسم 2: المعجم اللساني", desc: "إظهار أو إخفاء المعجم اللساني بالكامل" },
  { key: "sectionQuiz", label: "قسم 3: اختبر معارفك", desc: "إظهار أو إخفاء قسم الاختبارات التفاعلية" },
  { key: "sectionResearch", label: "قسم 4: فضاء الباحث اللساني", desc: "إظهار أو إخفاء فضاء الباحث والمنهجية" },
  { key: "sectionLectures", label: "قسم 5: محاضرات ودروس", desc: "إظهار أو إخفاء قسم المحاضرات والفيديوهات" },
  { key: "sectionExchange", label: "قسم 6: فضاء التبادل العلمي", desc: "إظهار أو إخفاء قسم التبادل والمشاريع" },
  { key: "studentSubmissions", label: "زر مشاركة مشاريع الطلبة", desc: "السماح للطلبة بإرسال مشاريعهم للمراجعة" },
  { key: "externalLinkWarning", label: "تنبيه الأمان للروابط الخارجية", desc: "عرض إشعار تحذيري قبل مغادرة المنصة لرابط خارجي" },
  { key: "fontControls", label: "أزرار تكبير وتصغير الخط", desc: "إتاحة التحكم بحجم الخط في صفحة القراءة الأكاديمية" },
  { key: "warmPaperMode", label: "وضع القراءة الورقي الدافئ (Sepia)", desc: "زر تحويل خلفية المقال إلى لون الورق الكريمي المريح للعين" },
  { key: "shareButtons", label: "زر مشاركة الروابط", desc: "إظهار زر نسخ ومشاركة رابط المادة للزوار" }
];

const DEFAULT_SETTINGS = {
  siteName: "لِسَان | LISAN",
  siteSubtitle: "الفضاء الرقمي لطلبة اللسانيات العربية",
  siteTagline: "نتعلم اللسانيات، نكتشف نظرياتها، ونطور مهاراتنا البحثية.",
  audienceBadge: "جمهور متخصص: طلبة اللسانيات",
  logoUrl: "",
  announcementText: "",
  footerText: "لِسَان | LISAN — الفضاء الرقمي الأكاديمي لطلبة اللسانيات العربية",
  contactEmail: "",
  themeAccent: "#0071e3",
  publicBaseUrl: "",
  socialLinks: { twitter: "", telegram: "", youtube: "", facebook: "" },
  features: {
    globalSearch: true,
    sectionLibrary: true,
    sectionDictionary: true,
    sectionQuiz: true,
    sectionResearch: true,
    sectionLectures: true,
    sectionExchange: true,
    externalLinkWarning: true,
    fontControls: true,
    warmPaperMode: true,
    shareButtons: true,
    announcements: true,
    statsBar: true,
    studentSubmissions: true
  },
  sectionsMeta: {
    library: {
      id: "library", order: 1, featureKey: "sectionLibrary", title: "المكتبة اللسانية",
      shortDesc: "ملخصات النظريات، الكتب والمراجع العلمية، والأبحاث المختارة.",
      icon: "book", accent: "#0071e3",
      branches: ["ملخصات النظريات اللسانية", "كتب ومراجع وروابط علمية", "مقالات وأبحاث مختارة"]
    },
    dictionary: {
      id: "dictionary", order: 2, featureKey: "sectionDictionary", title: "المعجم اللساني",
      shortDesc: "مصطلحات اللسانيات العامة والتطبيقية والتداولية والحاسوبية بتعريفات مبسطة.",
      icon: "bookmark", accent: "#5e5ce6",
      branches: ["مصطلحات اللسانيات العامة", "اللسانيات التطبيقية", "اللسانيات التداولية", "اللسانيات الحاسوبية"]
    },
    quiz: {
      id: "quiz", order: 3, featureKey: "sectionQuiz", title: "اختبر معارفك",
      shortDesc: "اختبارات تفاعلية في فروع اللسانيات، أسئلة اختيار من متعدد، وتحديات أسبوعية.",
      icon: "check-circle", accent: "#0e9aa7",
      branches: ["اختبارات في فروع اللسانيات", "أسئلة اختيار من متعدد", "تحديات أسبوعية"]
    },
    research: {
      id: "research", order: 4, featureKey: "sectionResearch", title: "فضاء الباحث اللساني",
      shortDesc: "منهجية إعداد مذكرة الماستر، تحليل المدونة، التوثيق العلمي، وأدوات البحث.",
      icon: "compass", accent: "#c88a2e",
      branches: ["كيفية إعداد مذكرة ماستر", "منهجية تحليل المدونة", "التوثيق العلمي", "أدوات البحث اللساني"]
    },
    lectures: {
      id: "lectures", order: 5, featureKey: "sectionLectures", title: "محاضرات ودروس",
      shortDesc: "دروس مختصرة ومرئية في الأصوات، الصرف، النحو، الدلالة، التداولية، وتحليل الخطاب.",
      icon: "play-circle", accent: "#8b5cf6",
      branches: ["علم الأصوات", "الصرف والنحو", "الدلالة والتداولية", "تحليل الخطاب"]
    },
    exchange: {
      id: "exchange", order: 6, featureKey: "sectionExchange", title: "فضاء التبادل العلمي",
      shortDesc: "عرض مشاريع الطلبة، الإعلان عن الملتقيات، المسابقات العلمية، وتجارب البحث.",
      icon: "users", accent: "#16a34a",
      branches: ["عرض مشاريع الطلبة", "الإعلان عن الملتقيات", "مسابقات علمية", "مشاركة تجارب البحث"]
    }
  }
};

/* ============================================================================
 * 3. الحالة المركزية لغرفة العمليات (State)
 * ============================================================================ */
const state = {
  currentUser: null,
  view: "hub",
  settings: structuredClone(DEFAULT_SETTINGS),
  items: [],
  quizzes: [],
  admins: [],
  logs: [],
  filters: {
    contentSection: "الكل",
    contentStatus: "الكل",
    contentSearch: "",
    quizSearch: "",
    adminSearch: "",
    logSearch: ""
  },
  editingQuizQuestions: [],
  selectedEditorFigure: null,
  draftTimer: null
};

/* ============================================================================
 * 4. أيقونات SVG نظيفة
 * ============================================================================ */
const ICONS = {
  content: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  quiz: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  inbox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  sliders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
  palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
};

/* ============================================================================
 * 5. التشفير، البحث العربي الذكي، وضغط الصور ورفعها إلى ImgBB
 * ============================================================================ */
async function sha256(text) {
  const data = new TextEncoder().encode(String(text));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeArabic(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

function smartFilter(list, queryText, fieldsFn) {
  const normQ = normalizeArabic(queryText);
  if (!normQ) return list;
  const tokens = normQ.split(" ").filter(Boolean);
  return list.filter((item) => {
    const hay = normalizeArabic(fieldsFn(item));
    return tokens.every((tk) => hay.includes(tk));
  });
}

function hasPerm(permKey) {
  if (!state.currentUser) return false;
  if (state.currentUser.isSuperAdmin) return true;
  return Array.isArray(state.currentUser.permissions) && state.currentUser.permissions.includes(permKey);
}

function showToast(msg, type = "default") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `glass-toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.classList.add("show"), 20);
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3600);
}

function formatDate(val) {
  if (!val) return "—";
  try {
    const d = typeof val.toDate === "function" ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(d);
  } catch {
    return "—";
  }
}

function renderAvatarHtml(url, fallbackName = "A", extraClass = "") {
  const letter = escapeHtml((fallbackName || "A").trim()[0] || "A");
  if (url) {
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(fallbackName)}" class="avatar-img ${extraClass}" />`;
  }
  return `<div class="avatar-placeholder ${extraClass}">${letter}</div>`;
}

/**
 * ضغط الصورة في المتصفح ثم رفعها إلى ImgBB وإرجاع الرابط المباشر
 */
async function compressImageToBase64(file, maxWidth = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر قراءة ملف الصورة"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("ملف الصورة غير صالح"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl.split(",")[1]);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadCompressedImageToImgBB(file, statusEl = null, maxWidth = 1400) {
  if (!file) throw new Error("لم يتم اختيار صورة");
  if (statusEl) statusEl.textContent = "جارٍ ضغط الصورة وتقليل حجمها...";
  const base64 = await compressImageToBase64(file, maxWidth, 0.82);

  if (statusEl) statusEl.textContent = "جارٍ الرفع إلى خادم الصور...";
  const formData = new FormData();
  formData.append("image", base64);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body: formData
  });
  const json = await res.json();
  if (!res.ok || !json?.success || !json?.data?.url) {
    throw new Error(json?.error?.message || "فشل رفع الصورة إلى ImgBB");
  }
  if (statusEl) statusEl.textContent = "تم الضغط والرفع بنجاح ✓";
  return json.data.url;
}

/* ============================================================================
 * 6. المرآة الفورية بين المستودعين (مزامنة الشعار واللون والاسم والـ Favicon)
 * ============================================================================ */
function applyAdminBranding() {
  const s = state.settings;
  if (s.themeAccent) {
    document.documentElement.style.setProperty("--accent", s.themeAccent);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", s.themeAccent);
  }

  const brandTitle = document.getElementById("admin-brand-title");
  if (brandTitle) brandTitle.textContent = `غرفة عمليات ${s.siteName || "لِسَان"}`;

  const logoWrap = document.getElementById("admin-logo-wrap");
  if (logoWrap) {
    if (s.logoUrl) {
      logoWrap.innerHTML = `<img src="${escapeHtml(s.logoUrl)}" alt="${escapeHtml(s.siteName)}" class="brand-logo-img" />`;
      const fav = document.querySelector('link[rel="icon"]');
      if (fav) fav.setAttribute("href", s.logoUrl);
    } else {
      logoWrap.textContent = (s.siteName || "ل").trim()[0] || "ل";
    }
  }

  // تحديث شارة المستخدم الحالي وصورته في الشريط العلوي
  if (state.currentUser) {
    const userNameEl = document.getElementById("current-admin-name");
    const userAvatarEl = document.getElementById("current-admin-avatar");
    if (userNameEl) {
      userNameEl.textContent = `${state.currentUser.displayName || state.currentUser.username}`;
    }
    if (userAvatarEl) {
      userAvatarEl.innerHTML = renderAvatarHtml(
        state.currentUser.avatarUrl,
        state.currentUser.displayName || state.currentUser.username,
        "mini"
      );
    }
  }
}

/* ============================================================================
 * 7. سجل النشاطات + التأسيس التلقائي للأدمن الرئيسي (Admin / 123456)
 * ============================================================================ */
async function logActivity(action, details = "") {
  try {
    const entry = {
      actor: state.currentUser?.displayName || state.currentUser?.username || "النظام",
      actorUsername: state.currentUser?.username || "system",
      actorAvatar: state.currentUser?.avatarUrl || "",
      action,
      details,
      createdAt: new Date().toISOString(),
      ts: serverTimestamp()
    };
    const ref = await addDoc(collection(db, "logs"), entry);
    state.logs.unshift({ id: ref.id, ...entry });
  } catch (e) {
    console.warn("Log skipped:", e);
  }
}

async function ensureBootstrapSuperAdmin() {
  const adminsRef = collection(db, "admins");
  const snap = await getDocs(adminsRef);
  if (snap.empty) {
    const passHash = await sha256("123456");
    await setDoc(doc(db, "admins", "super-admin-root"), {
      username: "Admin",
      usernameLower: "admin",
      displayName: "الإدارة الرئيسية",
      avatarUrl: "",
      bio: "الحساب الرئيسي للإدارة العليا لمنصة لِسَان | LISAN",
      passwordHash: passHash,
      pinHash: "",
      isSuperAdmin: true,
      active: true,
      permissions: PERMISSIONS_CATALOG.map((p) => p.key),
      createdAt: new Date().toISOString()
    });
  }
}

/* ============================================================================
 * 8. نظام المصادقة: كلمة المرور + الوثوق بالمتصفح + الرمز السريع 4 أرقام
 * ============================================================================ */
function getTrustedDevice() {
  try { return JSON.parse(localStorage.getItem(TRUST_STORAGE_KEY) || "null"); }
  catch { return null; }
}

function setTrustedDevice(data) {
  localStorage.setItem(TRUST_STORAGE_KEY, JSON.stringify(data));
}

function clearTrustedDevice() {
  localStorage.removeItem(TRUST_STORAGE_KEY);
}

async function findAdminByUsername(username) {
  const lower = String(username || "").trim().toLowerCase();
  if (!lower) return null;
  const q = query(collection(db, "admins"), where("usernameLower", "==", lower));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

async function checkInitialAuth() {
  const authScreen = document.getElementById("auth-screen");
  const adminApp = document.getElementById("admin-app");

  try {
    // جلب إعدادات الهوية مبكراً لتظهر في شاشة الدخول أيضاً (المرآة الفورية)
    const setSnap = await getDoc(doc(db, "settings", "global")).catch(() => null);
    if (setSnap?.exists()) {
      state.settings = deepMergeSettings(setSnap.data());
      applyAdminBranding();
    }

    await ensureBootstrapSuperAdmin();

    const savedSession = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) || "null");
    if (savedSession?.adminId) {
      const snap = await getDoc(doc(db, "admins", savedSession.adminId));
      if (snap.exists() && snap.data().active !== false) {
        await completeLogin({ id: snap.id, ...snap.data() }, false);
        return;
      }
    }

    const trusted = getTrustedDevice();
    if (trusted?.adminId) {
      const snap = await getDoc(doc(db, "admins", trusted.adminId));
      if (snap.exists() && snap.data().active !== false) {
        const adminData = { id: snap.id, ...snap.data() };
        if (trusted.mode === "direct" && (trusted.skipPin === true || !adminData.pinHash)) {
          await completeLogin(adminData, false);
          return;
        }
        if (adminData.pinHash) {
          adminApp.hidden = true;
          authScreen.hidden = false;
          renderPinLoginView(adminData);
          return;
        }
      } else {
        clearTrustedDevice();
      }
    }
  } catch (err) {
    console.error("Auth init error:", err);
    showToast("تنبيه: تحقق من قواعد أمان Firestore أو اتصال الإنترنت", "error");
  }

  adminApp.hidden = true;
  authScreen.hidden = false;
  renderPasswordLoginView();
}

function getAuthBadgeHtml() {
  if (state.settings.logoUrl) {
    return `<div class="auth-brand-badge has-img"><img src="${escapeHtml(state.settings.logoUrl)}" alt="" /></div>`;
  }
  return `<div class="auth-brand-badge">${escapeHtml((state.settings.siteName || "ل")[0])}</div>`;
}

function renderPasswordLoginView(prefillUsername = "", mode = "login") {
  const box = document.getElementById("auth-card-content");
  if (!box) return;
  const isPinReset = mode === "reset-pin";

  box.innerHTML = `
    ${getAuthBadgeHtml()}
    <h1 class="auth-title">${isPinReset ? "استعادة الرمز السريع" : `غرفة عمليات ${escapeHtml(state.settings.siteName)}`}</h1>
    <p class="auth-subtitle">
      ${isPinReset
        ? "أدخل اسم المستخدم وكلمة المرور للتحقق وتعيين رمز سريع جديد من 4 أرقام."
        : "سجّل الدخول بحسابك الإداري لإدارة المنصة بالكامل."}
    </p>

    <form id="password-login-form" class="auth-form">
      <div class="form-group">
        <label for="login-username">اسم المستخدم</label>
        <input type="text" id="login-username" required autocomplete="username"
          value="${escapeHtml(prefillUsername)}" placeholder="أدخل اسم المستخدم (أو البريد/الهاتف)" />
      </div>
      <div class="form-group">
        <label for="login-password">كلمة المرور</label>
        <input type="password" id="login-password" required autocomplete="current-password"
          placeholder="••••••••" />
      </div>
      ${isPinReset ? `
        <div class="form-group">
          <label for="reset-new-pin">الرمز السريع الجديد (4 أرقام)</label>
          <input type="password" id="reset-new-pin" required pattern="\\d{4}" maxlength="4"
            inputmode="numeric" placeholder="مثال: 2026" />
        </div>
      ` : ""}
      <div id="auth-error-msg" class="auth-error" hidden></div>
      <button type="submit" class="btn-primary-glass full-width" id="login-submit-btn">
        ${isPinReset ? "التحقق وتحديث الرمز السريع" : "تسجيل الدخول"}
      </button>
    </form>

    ${isPinReset ? `<button type="button" class="text-link-btn" id="back-to-login-btn">العودة لتسجيل الدخول</button>` : ""}
  `;

  document.getElementById("back-to-login-btn")?.addEventListener("click", () => checkInitialAuth());

  document.getElementById("password-login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("auth-error-msg");
    const btn = document.getElementById("login-submit-btn");
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    errEl.hidden = true;
    btn.disabled = true;
    btn.textContent = "جارٍ التحقق...";

    try {
      // ضمان تأسيس الأدمن الرئيسي لحظياً إذا كانت قاعدة البيانات لا تزال فارغة
      await ensureBootstrapSuperAdmin();

      const admin = await findAdminByUsername(username);
      const hashed = await sha256(password);
      if (!admin || admin.passwordHash !== hashed) {
        errEl.textContent = "اسم المستخدم أو كلمة المرور غير صحيحة.";
        errEl.hidden = false;
        btn.disabled = false;
        btn.textContent = isPinReset ? "التحقق وتحديث الرمز السريع" : "تسجيل الدخول";
        return;
      }
      if (admin.active === false) {
        errEl.textContent = "تم إيقاف هذا الحساب مؤقتاً من قِبل الإدارة الرئيسية.";
        errEl.hidden = false;
        btn.disabled = false;
        btn.textContent = "تسجيل الدخول";
        return;
      }

      if (isPinReset) {
        const newPin = document.getElementById("reset-new-pin").value.trim();
        if (!/^\d{4}$/.test(newPin)) {
          errEl.textContent = "يجب أن يتكون الرمز السريع من 4 أرقام بالضبط.";
          errEl.hidden = false;
          btn.disabled = false;
          btn.textContent = "التحقق وتحديث الرمز السريع";
          return;
        }
        const pinHash = await sha256(newPin);
        await updateDoc(doc(db, "admins", admin.id), { pinHash });
        admin.pinHash = pinHash;
        setTrustedDevice({ adminId: admin.id, username: admin.username, mode: "pin", skipPin: false });
        showToast("تم تحديث الرمز السريع بنجاح ✓");
        await completeLogin(admin, true);
        return;
      }

      const trusted = getTrustedDevice();
      if (trusted?.adminId === admin.id) {
        await completeLogin(admin, true);
      } else {
        renderTrustBrowserPrompt(admin);
      }
    } catch (err) {
      console.error(err);
      const reason = err?.code === "permission-denied"
        ? "رفضت قواعد أمان Firestore الاتصال (تحقق من تبويب Rules)."
        : "تعذر الاتصال بـ Firebase، تحقق من الإنترنت.";
      errEl.textContent = reason;
      errEl.hidden = false;
      btn.disabled = false;
      btn.textContent = isPinReset ? "التحقق وتحديث الرمز السريع" : "تسجيل الدخول";
    }
  });
}

function renderTrustBrowserPrompt(admin) {
  const box = document.getElementById("auth-card-content");
  box.innerHTML = `
    <div class="auth-brand-badge">${ICONS.shield}</div>
    <h2 class="auth-title">هل تريد الوثوق بهذا المتصفح؟</h2>
    <p class="auth-subtitle">
      أهلاً <strong>${escapeHtml(admin.displayName || admin.username)}</strong>!
      الوثوق بالمتصفح يغنيك عن إدخال كلمة المرور الصعبة في كل زيارة.
    </p>

    <div class="trust-options-stack">
      <div class="trust-option-card">
        <strong>1. الوثوق مع الرمز السريع (4 أرقام) — الأعلى أماناً</strong>
        <p>${admin.pinHash ? "ستستخدم رمزك السريع المسجل للدخول الفوري." : "عيّن رمزاً سريعاً من 4 أرقام للدخول السريع:"}</p>
        ${!admin.pinHash ? `
          <input type="password" id="setup-pin-input" maxlength="4" inputmode="numeric"
            placeholder="أدخل 4 أرقام" class="pin-inline-input" />
        ` : ""}
        <button type="button" class="btn-primary-glass full-width" id="trust-with-pin-btn">
          الوثوق بالمتصفح عبر الرمز السريع
        </button>
      </div>

      <button type="button" class="tool-btn full-width" id="trust-direct-btn">
        الوثوق والدخول المباشر التلقائي (بدون رمز)
      </button>

      <button type="button" class="text-link-btn" id="skip-trust-btn">
        لا، الدخول لهذه الجلسة فقط
      </button>
    </div>
  `;

  document.getElementById("trust-with-pin-btn")?.addEventListener("click", async () => {
    if (!admin.pinHash) {
      const pinVal = document.getElementById("setup-pin-input")?.value.trim() || "";
      if (!/^\d{4}$/.test(pinVal)) {
        showToast("أدخل رمزاً من 4 أرقام صحيحة", "error");
        return;
      }
      const pinHash = await sha256(pinVal);
      await updateDoc(doc(db, "admins", admin.id), { pinHash });
      admin.pinHash = pinHash;
    }
    setTrustedDevice({ adminId: admin.id, username: admin.username, mode: "pin", skipPin: false });
    showToast("تم حفظ الثقة بالمتصفح مع الرمز السريع ✓");
    await completeLogin(admin, true);
  });

  document.getElementById("trust-direct-btn")?.addEventListener("click", async () => {
    setTrustedDevice({ adminId: admin.id, username: admin.username, mode: "direct", skipPin: true });
    showToast("تم حفظ هذا المتصفح للدخول المباشر ✓");
    await completeLogin(admin, true);
  });

  document.getElementById("skip-trust-btn")?.addEventListener("click", async () => {
    await completeLogin(admin, true);
  });
}

function renderPinLoginView(admin) {
  const box = document.getElementById("auth-card-content");
  let pinDigits = "";

  box.innerHTML = `
    <div class="pin-user-avatar">${renderAvatarHtml(admin.avatarUrl, admin.displayName || admin.username, "lg")}</div>
    <h2 class="auth-title">أهلاً بعودتك، ${escapeHtml(admin.displayName || admin.username)}</h2>
    <p class="auth-subtitle">أدخل الرمز السريع المكوّن من 4 أرقام للدخول الفوري</p>

    <div class="pin-dots-row" id="pin-dots">
      <span class="pin-dot"></span><span class="pin-dot"></span>
      <span class="pin-dot"></span><span class="pin-dot"></span>
    </div>

    <div id="pin-error-msg" class="auth-error" hidden></div>

    <div class="pin-keypad">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" class="pin-key" data-digit="${n}">${n}</button>`).join("")}
      <button type="button" class="pin-key muted" id="pin-clear-btn">مسح</button>
      <button type="button" class="pin-key" data-digit="0">0</button>
      <button type="button" class="pin-key muted" id="pin-back-btn">⌫</button>
    </div>

    <div class="pin-footer-links">
      <button type="button" class="text-link-btn" id="forgot-pin-btn">نسيت الرمز السريع؟ غيّره بكلمة المرور</button>
      <button type="button" class="text-link-btn" id="switch-account-btn">تبديل الحساب وإلغاء الثقة</button>
    </div>
  `;

  const updateDots = () => {
    box.querySelectorAll(".pin-dot").forEach((d, i) => d.classList.toggle("filled", i < pinDigits.length));
  };

  const tryVerifyPin = async () => {
    const errEl = document.getElementById("pin-error-msg");
    const h = await sha256(pinDigits);
    if (h === admin.pinHash) {
      await completeLogin(admin, true);
    } else {
      errEl.textContent = "الرمز السريع غير صحيح، حاول مجدداً.";
      errEl.hidden = false;
      pinDigits = "";
      updateDots();
    }
  };

  const pushDigit = (digit) => {
    if (pinDigits.length >= 4) return;
    document.getElementById("pin-error-msg").hidden = true;
    pinDigits += digit;
    updateDots();
    if (pinDigits.length === 4) setTimeout(tryVerifyPin, 120);
  };

  box.querySelectorAll("[data-digit]").forEach((btn) => {
    btn.addEventListener("click", () => pushDigit(btn.dataset.digit));
  });
  document.getElementById("pin-clear-btn")?.addEventListener("click", () => { pinDigits = ""; updateDots(); });
  document.getElementById("pin-back-btn")?.addEventListener("click", () => { pinDigits = pinDigits.slice(0, -1); updateDots(); });

  const keyHandler = (e) => {
    if (document.getElementById("auth-screen").hidden) {
      document.removeEventListener("keydown", keyHandler);
      return;
    }
    if (/^\d$/.test(e.key)) pushDigit(e.key);
    else if (e.key === "Backspace") { pinDigits = pinDigits.slice(0, -1); updateDots(); }
  };
  document.addEventListener("keydown", keyHandler);

  document.getElementById("forgot-pin-btn")?.addEventListener("click", () => {
    document.removeEventListener("keydown", keyHandler);
    renderPasswordLoginView(admin.username, "reset-pin");
  });

  document.getElementById("switch-account-btn")?.addEventListener("click", () => {
    document.removeEventListener("keydown", keyHandler);
    clearTrustedDevice();
    renderPasswordLoginView();
  });
}

async function completeLogin(admin, recordLog = true) {
  state.currentUser = admin;
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ adminId: admin.id }));
  document.getElementById("auth-screen").hidden = true;
  document.getElementById("admin-app").hidden = false;

  await loadAllAdminData();
  applyAdminBranding();
  if (recordLog) await logActivity("تسجيل دخول", `دخل ${admin.displayName || admin.username} إلى غرفة العمليات`);
  navigateAdmin("hub");
}

function logoutSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  state.currentUser = null;
  checkInitialAuth();
}

/* ============================================================================
 * 9. جلب جميع البيانات الحية من Firestore
 * ============================================================================ */
function deepMergeSettings(remote = {}) {
  const merged = structuredClone(DEFAULT_SETTINGS);
  Object.keys(remote).forEach((k) => {
    if (k === "features" && remote.features) merged.features = { ...merged.features, ...remote.features };
    else if (k === "socialLinks" && remote.socialLinks) merged.socialLinks = { ...merged.socialLinks, ...remote.socialLinks };
    else if (k === "sectionsMeta" && remote.sectionsMeta) {
      Object.keys(remote.sectionsMeta).forEach((sId) => {
        if (merged.sectionsMeta[sId]) merged.sectionsMeta[sId] = { ...merged.sectionsMeta[sId], ...remote.sectionsMeta[sId] };
      });
    } else if (remote[k] !== undefined) merged[k] = remote[k];
  });
  return merged;
}

async function loadAllAdminData() {
  const [setSnap, itemsSnap, quizzesSnap, adminsSnap, logsSnap] = await Promise.allSettled([
    getDoc(doc(db, "settings", "global")),
    getDocs(query(collection(db, "items"), orderBy("createdAt", "desc"))),
    getDocs(query(collection(db, "quizzes"), orderBy("createdAt", "desc"))),
    getDocs(collection(db, "admins")),
    getDocs(query(collection(db, "logs"), orderBy("createdAt", "desc"), limit(80)))
  ]);

  if (setSnap.status === "fulfilled" && setSnap.value.exists()) {
    state.settings = deepMergeSettings(setSnap.value.data());
  }
  if (itemsSnap.status === "fulfilled") {
    state.items = itemsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  if (quizzesSnap.status === "fulfilled") {
    state.quizzes = quizzesSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  if (adminsSnap.status === "fulfilled") {
    state.admins = adminsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  if (logsSnap.status === "fulfilled") {
    state.logs = logsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  applyAdminBranding();
}

/* ============================================================================
 * 10. التنقل بالكشف التدريجي (الكراتين المرتبة + شبكة Bento للجوال)
 * ============================================================================ */
function navigateAdmin(viewName) {
  state.view = viewName;
  renderAdminView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAdminView() {
  const main = document.getElementById("admin-main");
  if (!main) return;

  switch (state.view) {
    case "content": return renderContentManager(main);
    case "quizzes": return renderQuizzesManager(main);
    case "submissions": return renderSubmissionsQueue(main);
    case "sections": return renderSectionsManager(main);
    case "features": return renderFeaturesManager(main);
    case "settings": return renderSettingsManager(main);
    case "admins": return renderAdminsManager(main);
    case "security": return renderSecurityAndLogs(main);
    default: return renderHubView(main);
  }
}

/* ---------- 10.1 الشاشة الرئيسية للوحة التحكم (شبكة Bento المتناسقة) ---------- */
function renderHubView(container) {
  const pendingCount = state.items.filter((x) => x.status === "pending").length;
  const publishedCount = state.items.filter((x) => !x.status || x.status === "published").length;

  const boxes = [
    {
      id: "content", perm: "manage_content", icon: ICONS.content, accent: "#0071e3",
      title: "إدارة المحتوى",
      desc: "إضافة وتعديل الكتب، المصطلحات، المحاضرات، الصور الحرة، وملفات PDF.",
      badge: `${publishedCount} منشور`
    },
    {
      id: "quizzes", perm: "manage_quizzes", icon: ICONS.quiz, accent: "#0e9aa7",
      title: "بنك الاختبارات",
      desc: "إنشاء اختبارات اختيار من متعدد مع الشروحات اللسانية الفورية للطلبة.",
      badge: `${state.quizzes.length} اختبار`
    },
    {
      id: "submissions", perm: "approve_submissions", icon: ICONS.inbox, accent: "#16a34a",
      title: "مساهمات الطلبة",
      desc: "مراجعة المشاريع والتجارب المرسلة من الزوار واعتمادها للنشر.",
      badge: pendingCount > 0 ? `${pendingCount} معلق` : "لا معلقات",
      highlight: pendingCount > 0
    },
    {
      id: "sections", perm: "manage_sections", icon: ICONS.layers, accent: "#c88a2e",
      title: "الأقسام والفروع",
      desc: "تعديل مسميات الأقسام الستة وأوصافها وألوانها وفروعها الداخلية.",
      badge: "6 أقسام"
    },
    {
      id: "features", perm: "manage_features", icon: ICONS.sliders, accent: "#8b5cf6",
      title: "مفاتيح الميزات",
      desc: "إخفاء أو إظهار أي قسم أو ميزة في الموقع العام بضغطة زر واحدة.",
      badge: "تحكم شامل"
    },
    {
      id: "settings", perm: "manage_settings", icon: ICONS.palette, accent: "#5e5ce6",
      title: "الهوية وخريطة SEO",
      desc: "تغيير الشعار والألوان والنصوص وتوليد ملف sitemap.xml لمحركات البحث.",
      badge: "المظهر والسيو"
    },
    {
      id: "admins", perm: "manage_admins", icon: ICONS.users, accent: "#db2777",
      title: "فريق الإدارة",
      desc: "إضافة موظفين بصورهم ونبذهم التعريفية وتحديد صلاحيات كل شخص بدقة.",
      badge: `${state.admins.length} حساب`
    },
    {
      id: "security", perm: null, icon: ICONS.shield, accent: "#1e293b",
      title: "حسابي والسجلات",
      desc: "ملفي الشخصي وصورتي، الرمز السريع (4 أرقام)، كلمة المرور، والسجلات.",
      badge: "الأمان"
    }
  ].filter((b) => !b.perm || hasPerm(b.perm));

  container.innerHTML = `
    <div class="container">
      <section class="glass-card hub-welcome heritage-frame">
        <div class="hub-welcome-user">
          ${renderAvatarHtml(state.currentUser.avatarUrl, state.currentUser.displayName || state.currentUser.username, "xl")}
          <div>
            <span class="pill-badge">غرفة العمليات المركزية</span>
            <h1>مرحباً، ${escapeHtml(state.currentUser.displayName || state.currentUser.username)}</h1>
            <p>${escapeHtml(state.currentUser.bio || "كل أداة مرتبة داخل صندوقها الخاص لراحة البال وسرعة الإنجاز.")}</p>
          </div>
        </div>
        <button type="button" class="hero-search-trigger" id="hub-open-spotlight">
          <span>${ICONS.search}</span>
          <span>بحث ذكي في المحتوى ونبذ الموظفين...</span>
          <kbd>/</kbd>
        </button>
      </section>

      <section class="hub-grid">
        ${boxes.map((b, idx) => `
          <article class="glass-card hub-box heritage-card stagger-in ${b.highlight ? "attention" : ""}"
            style="--stagger: ${idx}; --box-accent: ${b.accent}"
            data-nav-box="${b.id}" tabindex="0" role="button">
            <div class="hub-box-top">
              <div class="hub-icon" style="--box-accent: ${b.accent}">${b.icon}</div>
              <span class="hub-badge ${b.highlight ? "alert" : ""}">${b.badge}</span>
            </div>
            <h3>${b.title}</h3>
            <p>${b.desc}</p>
            <div class="hub-box-footer">
              <span>فتح</span>
              <span>${ICONS.arrowLeft}</span>
            </div>
          </article>
        `).join("")}
      </section>
    </div>
  `;

  container.querySelectorAll("[data-nav-box]").forEach((el) => {
    const go = () => navigateAdmin(el.dataset.navBox);
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });

  document.getElementById("hub-open-spotlight")?.addEventListener("click", openAdminSpotlight);
}

function renderSubHeader(title, subtitle, extraBtnHtml = "") {
  return `
    <div class="sub-page-top">
      <button type="button" class="crumb-btn" id="back-to-hub">${ICONS.arrowRight} الرئيسية (الصناديق)</button>
      <div class="sub-banner glass-card heritage-frame">
        <div>
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </div>
        ${extraBtnHtml}
      </div>
    </div>
  `;
}

/* ---------- 10.2 صندوق إدارة المحتوى والمواد ---------- */
function renderContentManager(container) {
  if (!hasPerm("manage_content")) return navigateAdmin("hub");

  const secs = Object.values(state.settings.sectionsMeta)
    .filter((s) => s.id !== "quiz")
    .sort((a, b) => a.order - b.order);

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "إدارة المحتوى والمواد",
        "انشر كتباً ومصطلحات ومحاضرات بحرية كاملة في إدراج الصور والوسائط والروابط.",
        `<button type="button" class="btn-primary-glass" id="btn-new-item">${ICONS.plus} إضافة مادة جديدة</button>`
      )}

      <div class="glass-panel filter-toolbar">
        <div class="filter-pills">
          <button type="button" class="filter-tab ${state.filters.contentSection === "الكل" ? "active" : ""}" data-f-sec="الكل">الكل</button>
          ${secs.map((s) => `
            <button type="button" class="filter-tab ${state.filters.contentSection === s.id ? "active" : ""}" data-f-sec="${s.id}">
              ${escapeHtml(s.title)}
            </button>
          `).join("")}
        </div>
        <div class="filter-right-group">
          <select id="filter-status-select" class="glass-select-sm">
            <option value="الكل" ${state.filters.contentStatus === "الكل" ? "selected" : ""}>كل الحالات</option>
            <option value="published" ${state.filters.contentStatus === "published" ? "selected" : ""}>منشور</option>
            <option value="draft" ${state.filters.contentStatus === "draft" ? "selected" : ""}>مسودة</option>
            <option value="pending" ${state.filters.contentStatus === "pending" ? "selected" : ""}>معلق</option>
          </select>
          <div class="local-search-box">
            <span>${ICONS.search}</span>
            <input type="search" id="content-search-input" placeholder="بحث ذكي في المواد..." value="${escapeHtml(state.filters.contentSearch)}" />
          </div>
        </div>
      </div>

      <div id="content-items-list" class="admin-list-stack"></div>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));
  document.getElementById("btn-new-item")?.addEventListener("click", () => openItemEditorModal(null));

  const paintList = () => {
    let list = state.items;
    if (state.filters.contentSection !== "الكل") {
      list = list.filter((it) => it.sectionId === state.filters.contentSection);
    }
    if (state.filters.contentStatus !== "الكل") {
      list = list.filter((it) => (it.status || "published") === state.filters.contentStatus);
    }
    list = smartFilter(list, state.filters.contentSearch, (it) =>
      `${it.title} ${it.subtitle || ""} ${it.branch || ""} ${it.summary || ""} ${(it.tags || []).join(" ")}`
    );

    const listEl = document.getElementById("content-items-list");
    if (!list.length) {
      listEl.innerHTML = `<div class="glass-card empty-state"><p>لا توجد مواد مطابقة حالياً. اضغط "إضافة مادة جديدة" للبدء.</p></div>`;
      return;
    }

    const statusLabels = { published: "منشور", draft: "مسودة", pending: "بانتظار الاعتماد" };

    listEl.innerHTML = list.map((it) => {
      const sec = state.settings.sectionsMeta[it.sectionId];
      const st = it.status || "published";
      return `
        <div class="glass-card admin-row-card">
          ${it.coverUrl ? `<img src="${escapeHtml(it.coverUrl)}" alt="" class="row-thumb" />` : `<div class="row-thumb placeholder">ل</div>`}
          <div class="row-main">
            <div class="row-badges">
              <span class="pill-badge">${escapeHtml(sec?.title || it.sectionId)}</span>
              <span class="pill-badge neutral">${escapeHtml(it.branch || "")}</span>
              <span class="status-dot ${st}">${statusLabels[st] || st}</span>
            </div>
            <h3>${escapeHtml(it.title)}</h3>
            <p>${escapeHtml(it.summary || it.subtitle || "")}</p>
          </div>
          <div class="row-actions">
            <button type="button" class="tool-btn" data-edit-item="${it.id}">${ICONS.edit} تعديل</button>
            ${hasPerm("delete_content") ? `<button type="button" class="tool-btn danger" data-del-item="${it.id}">${ICONS.trash} حذف</button>` : ""}
          </div>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll("[data-edit-item]").forEach((b) => {
      b.addEventListener("click", () => {
        const found = state.items.find((x) => x.id === b.dataset.editItem);
        if (found) openItemEditorModal(found);
      });
    });

    listEl.querySelectorAll("[data-del-item]").forEach((b) => {
      b.addEventListener("click", async () => {
        const found = state.items.find((x) => x.id === b.dataset.delItem);
        if (!found || !confirm(`هل أنت متأكد من حذف "${found.title}" نهائياً؟`)) return;
        await deleteDoc(doc(db, "items", found.id));
        state.items = state.items.filter((x) => x.id !== found.id);
        await logActivity("حذف مادة", found.title);
        showToast("تم حذف المادة بنجاح");
        paintList();
      });
    });
  };

  container.querySelectorAll("[data-f-sec]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filters.contentSection = btn.dataset.fSec;
      container.querySelectorAll("[data-f-sec]").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      paintList();
    });
  });

  document.getElementById("filter-status-select")?.addEventListener("change", (e) => {
    state.filters.contentStatus = e.target.value;
    paintList();
  });

  document.getElementById("content-search-input")?.addEventListener("input", (e) => {
    state.filters.contentSearch = e.target.value;
    paintList();
  });

  paintList();
}

/**
 * المحرر الأكاديمي الحر (رفع/لصق/سحب الصور + تحكم بالحجم والشرح + معاينة حية + حفظ تلقائي)
 */
function openItemEditorModal(item = null) {
  const isEdit = Boolean(item);
  const draftKey = `lisan_autosave_${item?.id || "new"}`;
  const savedDraft = JSON.parse(localStorage.getItem(draftKey) || "null");

  const secs = Object.values(state.settings.sectionsMeta)
    .filter((s) => s.id !== "quiz")
    .sort((a, b) => a.order - b.order);

  const initialSecId = item?.sectionId || secs[0].id;
  const initialBranches = state.settings.sectionsMeta[initialSecId]?.branches || [];

  openModal(isEdit ? "تعديل المادة" : "إضافة مادة جديدة", `
    <form id="item-editor-form" class="editor-form">
      ${savedDraft ? `
        <div class="draft-restore-bar" id="draft-restore-bar">
          <span>توجد مسودة محفوظة تلقائياً (${formatDate(savedDraft.savedAt)}) — هل تود استعادتها؟</span>
          <div class="form-actions-inline">
            <button type="button" class="tool-btn" id="restore-draft-btn">استعادة المسودة</button>
            <button type="button" class="tool-btn danger" id="discard-draft-btn">تجاهل</button>
          </div>
        </div>
      ` : ""}

      <div class="form-grid-2">
        <div class="form-group">
          <label>القسم الرئيسي</label>
          <select id="ed-section">
            ${secs.map((s) => `<option value="${s.id}" ${s.id === initialSecId ? "selected" : ""}>${escapeHtml(s.title)}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label>الفرع الداخلي</label>
          <select id="ed-branch">
            ${initialBranches.map((b) => `<option value="${escapeHtml(b)}" ${b === item?.branch ? "selected" : ""}>${escapeHtml(b)}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label>العنوان الرئيسي *</label>
          <input type="text" id="ed-title" required value="${escapeHtml(item?.title || "")}" placeholder="مثال: مدخل إلى التداولية الحديثة" />
        </div>
        <div class="form-group">
          <label>العنوان الفرعي أو المقابل الإنجليزي (للمعجم)</label>
          <input type="text" id="ed-subtitle" value="${escapeHtml(item?.subtitle || "")}" placeholder="مثال: Pragmatics أو اسم المؤلف" />
        </div>
      </div>

      <div class="form-group">
        <label>ملخص قصير (يظهر في البطاقة وفي نتائج جوجل SEO)</label>
        <textarea id="ed-summary" rows="2" placeholder="وصف مكثف وواضح في سطرين...">${escapeHtml(item?.summary || "")}</textarea>
      </div>

      <!-- المحرر الأكاديمي الحر الشبيه بـ Word -->
      <div class="form-group">
        <div class="editor-label-row">
          <label>المتن الأكاديمي (يمكنك لصق أو سحب أو رفع صور في أي سطر بحرية)</label>
          <span id="autosave-indicator" class="autosave-badge">حفظ تلقائي نشط</span>
        </div>

        <div class="word-editor-shell" id="word-editor-shell">
          <div class="word-toolbar">
            <button type="button" data-cmd="formatBlock" data-val="H2" title="عنوان رئيسي">H2</button>
            <button type="button" data-cmd="formatBlock" data-val="H3" title="عنوان فرعي">H3</button>
            <button type="button" data-cmd="bold" title="عريض"><strong>B</strong></button>
            <button type="button" data-cmd="italic" title="مائل"><em>I</em></button>
            <button type="button" data-cmd="underline" title="تحته خط"><u>U</u></button>
            <button type="button" data-cmd="formatBlock" data-val="BLOCKQUOTE" title="اقتباس أكاديمي">❝</button>
            <button type="button" data-cmd="insertUnorderedList" title="قائمة نقطية">• قائمة</button>
            <button type="button" data-cmd="insertOrderedList" title="قائمة مرقمة">1. مرقمة</button>
            <button type="button" id="ed-insert-link" title="إدراج رابط">🔗 رابط</button>
            <label class="toolbar-upload-btn" title="رفع صورة مضغوطة في موضع المؤشر">
              🖼 إدراج صورة هنا
              <input type="file" id="ed-inline-img-file" accept="image/*" hidden />
            </label>
            <button type="button" data-cmd="removeFormat" title="إزالة التنسيق">مسح التنسيق</button>
          </div>

          <!-- شريط التحكم بالصورة المحددة داخل المحرر -->
          <div id="img-props-bar" class="img-props-bar" hidden>
            <span class="img-props-label">تنسيق الصورة المحددة:</span>
            <button type="button" data-img-size="img-size-sm">صغيرة</button>
            <button type="button" data-img-size="img-size-md">متوسطة</button>
            <button type="button" data-img-size="img-size-full">كاملة العرض</button>
            <button type="button" id="img-edit-caption-btn">تعديل الشرح</button>
            <button type="button" id="img-delete-btn" class="danger-mini">حذف الصورة</button>
          </div>

          <div id="ed-body-wysiwyg" class="word-canvas" contenteditable="true"
            data-placeholder="اكتب المحتوى الأكاديمي هنا... يمكنك لصق صورة (Ctrl+V) أو سحبها وإفلاتها في أي مكان داخل النص.">${item?.bodyHtml || ""}</div>
        </div>
      </div>

      <!-- الوسائط المرفقة -->
      <div class="media-accordion-grid">
        <div class="form-group">
          <label>صورة الغلاف (ضغط تلقائي + رفع إلى ImgBB)</label>
          <div class="upload-row">
            <input type="url" id="ed-cover-url" dir="ltr" value="${escapeHtml(item?.coverUrl || "")}" placeholder="رابط الصورة أو ارفع من جهازك..." />
            <label class="tool-btn upload-trigger">
              ${ICONS.upload} رفع صورة
              <input type="file" id="ed-cover-file" accept="image/*" hidden />
            </label>
          </div>
          <small id="ed-cover-status" class="helper-hint"></small>
        </div>

        <div class="form-group">
          <label>رابط فيديو يوتيوب (يعمل بالمشغل الذكي تلقائياً)</label>
          <input type="url" id="ed-youtube-url" dir="ltr" value="${escapeHtml(item?.youtubeUrl || "")}" placeholder="https://www.youtube.com/watch?v=..." />
        </div>

        <div class="form-group">
          <label>رابط ملف PDF من Google Drive أو رابط مباشر</label>
          <input type="url" id="ed-pdf-url" dir="ltr" value="${escapeHtml(item?.pdfUrl || "")}" placeholder="https://drive.google.com/file/d/..." />
        </div>

        <div class="form-group">
          <label>رابط مصدر أو مرجع خارجي إضافي (اختياري)</label>
          <input type="url" id="ed-external-url" dir="ltr" value="${escapeHtml(item?.externalUrl || "")}" placeholder="https://..." />
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label>الوسوم والكلمات المفتاحية (افصل بينها بفاصلة)</label>
          <input type="text" id="ed-tags" value="${escapeHtml((item?.tags || []).join("، "))}" placeholder="التداولية، دي سوسير، مدونة..." />
        </div>
        <div class="form-group">
          <label>حالة النشر</label>
          <select id="ed-status">
            <option value="published" ${(item?.status || "published") === "published" ? "selected" : ""}>منشور مباشرة للعامة</option>
            <option value="draft" ${item?.status === "draft" ? "selected" : ""}>مسودة (مخفي عن الزوار)</option>
            <option value="pending" ${item?.status === "pending" ? "selected" : ""}>معلق للمراجعة</option>
          </select>
        </div>
      </div>

      <div class="modal-footer-actions split">
        <button type="button" class="tool-btn" id="live-preview-btn">${ICONS.eye} معاينة حية قبل النشر</button>
        <div class="form-actions-inline">
          <button type="button" class="tool-btn" id="cancel-editor-btn">إلغاء</button>
          <button type="submit" class="btn-primary-glass" id="save-item-btn">${isEdit ? "حفظ التعديلات" : "نشر وحفظ المادة"}</button>
        </div>
      </div>
    </form>
  `, "wide");

  const secSelect = document.getElementById("ed-section");
  const branchSelect = document.getElementById("ed-branch");
  const canvas = document.getElementById("ed-body-wysiwyg");
  const imgPropsBar = document.getElementById("img-props-bar");
  const autoSaveBadge = document.getElementById("autosave-indicator");
  let savedRange = null;

  const updateBranchesList = (selectedBranch = "") => {
    const branches = state.settings.sectionsMeta[secSelect.value]?.branches || [];
    branchSelect.innerHTML = branches.map((b) =>
      `<option value="${escapeHtml(b)}" ${b === selectedBranch ? "selected" : ""}>${escapeHtml(b)}</option>`
    ).join("");
  };
  secSelect.addEventListener("change", () => updateBranchesList());

  // حفظ موضع المؤشر لإدراج الصورة بدقة في المكان الذي يريده الكاتب
  const saveCursorPosition = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && canvas.contains(sel.anchorNode)) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }
  };
  canvas.addEventListener("keyup", saveCursorPosition);
  canvas.addEventListener("mouseup", saveCursorPosition);

  // إدراج صورة مضغوطة كـ <figure> أكاديمي قابل لتعديل الحجم والشرح
  const insertUploadedFigure = async (file) => {
    try {
      showToast("جارٍ ضغط الصورة وإدراجها في مكانها...");
      const url = await uploadCompressedImageToImgBB(file);
      const figureHtml = `
        <figure class="academic-figure img-size-full">
          <img src="${escapeHtml(url)}" alt="صورة توضيحية" class="academic-inline-img" />
          <figcaption>انقر على الصورة لتعديل حجمها أو هذا الشرح التوضيحي</figcaption>
        </figure><p><br></p>
      `;
      canvas.focus();
      if (savedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
      document.execCommand("insertHTML", false, figureHtml);
      triggerAutoSave();
      showToast("تم إدراج الصورة بنجاح — انقر عليها للتحكم بحجمها ✓");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // أزرار شريط Word
  document.querySelectorAll(".word-toolbar [data-cmd]").forEach((btn) => {
    btn.addEventListener("click", () => {
      canvas.focus();
      document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
      triggerAutoSave();
    });
  });

  document.getElementById("ed-insert-link")?.addEventListener("click", () => {
    const url = prompt("أدخل الرابط الكامل (https://...):");
    if (url) {
      canvas.focus();
      document.execCommand("createLink", false, url);
      triggerAutoSave();
    }
  });

  // رفع صورة عبر الزر في الشريط
  document.getElementById("ed-inline-img-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await insertUploadedFigure(file);
  });

  // دعم اللصق المباشر للصور (Ctrl+V) داخل المحرر
  canvas.addEventListener("paste", async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imgItem = items.find((i) => i.type.startsWith("image/"));
    if (imgItem) {
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (file) await insertUploadedFigure(file);
    }
  });

  // دعم السحب والإفلات للصور (Drag & Drop) داخل المحرر
  canvas.addEventListener("dragover", (e) => {
    e.preventDefault();
    canvas.classList.add("drag-active");
  });
  canvas.addEventListener("dragleave", () => canvas.classList.remove("drag-active"));
  canvas.addEventListener("drop", async (e) => {
    canvas.classList.remove("drag-active");
    const file = Array.from(e.dataTransfer?.files || []).find((f) => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      await insertUploadedFigure(file);
    }
  });

  // شريط التحكم بالصورة عند النقر على أي صورة داخل المحرر
  canvas.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (img) {
      let fig = img.closest("figure");
      if (!fig) {
        fig = document.createElement("figure");
        fig.className = "academic-figure img-size-full";
        img.parentNode.insertBefore(fig, img);
        fig.appendChild(img);
      }
      canvas.querySelectorAll(".selected-fig").forEach((el) => el.classList.remove("selected-fig"));
      fig.classList.add("selected-fig");
      state.selectedEditorFigure = fig;
      imgPropsBar.hidden = false;
    } else if (!e.target.closest("#img-props-bar")) {
      canvas.querySelectorAll(".selected-fig").forEach((el) => el.classList.remove("selected-fig"));
      state.selectedEditorFigure = null;
      imgPropsBar.hidden = true;
    }
  });

  imgPropsBar?.querySelectorAll("[data-img-size]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fig = state.selectedEditorFigure;
      if (!fig) return;
      fig.classList.remove("img-size-sm", "img-size-md", "img-size-full");
      fig.classList.add(btn.dataset.imgSize);
      triggerAutoSave();
      showToast("تم تغيير حجم الصورة ✓");
    });
  });

  document.getElementById("img-edit-caption-btn")?.addEventListener("click", () => {
    const fig = state.selectedEditorFigure;
    if (!fig) return;
    let cap = fig.querySelector("figcaption");
    const nextText = prompt("اكتب الشرح التوضيحي أسفل الصورة (اتركه فارغاً لإزالته):", cap?.textContent || "");
    if (nextText === null) return;
    if (nextText.trim()) {
      if (!cap) {
        cap = document.createElement("figcaption");
        fig.appendChild(cap);
      }
      cap.textContent = nextText.trim();
    } else if (cap) {
      cap.remove();
    }
    triggerAutoSave();
  });

  document.getElementById("img-delete-btn")?.addEventListener("click", () => {
    if (state.selectedEditorFigure) {
      state.selectedEditorFigure.remove();
      state.selectedEditorFigure = null;
      imgPropsBar.hidden = true;
      triggerAutoSave();
    }
  });

  // الحفظ التلقائي للمسودات
  const collectFormSnapshot = () => ({
    sectionId: secSelect.value,
    branch: branchSelect.value,
    title: document.getElementById("ed-title").value,
    subtitle: document.getElementById("ed-subtitle").value,
    summary: document.getElementById("ed-summary").value,
    bodyHtml: canvas.innerHTML,
    coverUrl: document.getElementById("ed-cover-url").value,
    youtubeUrl: document.getElementById("ed-youtube-url").value,
    pdfUrl: document.getElementById("ed-pdf-url").value,
    externalUrl: document.getElementById("ed-external-url").value,
    tags: document.getElementById("ed-tags").value,
    status: document.getElementById("ed-status").value,
    savedAt: new Date().toISOString()
  });

  const triggerAutoSave = () => {
    clearTimeout(state.draftTimer);
    if (autoSaveBadge) autoSaveBadge.textContent = "جارٍ الحفظ التلقائي...";
    state.draftTimer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(collectFormSnapshot()));
        if (autoSaveBadge) autoSaveBadge.textContent = "تم الحفظ التلقائي ✓";
      } catch {}
    }, 900);
  };

  document.getElementById("item-editor-form")?.addEventListener("input", triggerAutoSave);

  document.getElementById("restore-draft-btn")?.addEventListener("click", () => {
    if (!savedDraft) return;
    secSelect.value = savedDraft.sectionId || initialSecId;
    updateBranchesList(savedDraft.branch || "");
    document.getElementById("ed-title").value = savedDraft.title || "";
    document.getElementById("ed-subtitle").value = savedDraft.subtitle || "";
    document.getElementById("ed-summary").value = savedDraft.summary || "";
    canvas.innerHTML = savedDraft.bodyHtml || "";
    document.getElementById("ed-cover-url").value = savedDraft.coverUrl || "";
    document.getElementById("ed-youtube-url").value = savedDraft.youtubeUrl || "";
    document.getElementById("ed-pdf-url").value = savedDraft.pdfUrl || "";
    document.getElementById("ed-external-url").value = savedDraft.externalUrl || "";
    document.getElementById("ed-tags").value = savedDraft.tags || "";
    document.getElementById("ed-status").value = savedDraft.status || "published";
    document.getElementById("draft-restore-bar")?.remove();
    showToast("تمت استعادة المسودة بنجاح ✓");
  });

  document.getElementById("discard-draft-btn")?.addEventListener("click", () => {
    localStorage.removeItem(draftKey);
    document.getElementById("draft-restore-bar")?.remove();
  });

  // رفع الغلاف
  document.getElementById("ed-cover-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const statusEl = document.getElementById("ed-cover-status");
    try {
      const url = await uploadCompressedImageToImgBB(file, statusEl);
      document.getElementById("ed-cover-url").value = url;
      triggerAutoSave();
    } catch (err) {
      statusEl.textContent = err.message;
      showToast(err.message, "error");
    }
  });

  // زر المعاينة الحية قبل النشر
  document.getElementById("live-preview-btn")?.addEventListener("click", () => {
    const snap = collectFormSnapshot();
    openLivePreviewModal(snap);
  });

  document.getElementById("cancel-editor-btn")?.addEventListener("click", closeModal);

  document.getElementById("item-editor-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById("save-item-btn");
    saveBtn.disabled = true;
    saveBtn.textContent = "جارٍ الحفظ...";

    // تنظيف كلاس التحديد المؤقت من الصور قبل الحفظ
    canvas.querySelectorAll(".selected-fig").forEach((el) => el.classList.remove("selected-fig"));

    const tags = document.getElementById("ed-tags").value.split(/[,،]+/).map((t) => t.trim()).filter(Boolean);
    const payload = {
      sectionId: secSelect.value,
      branch: branchSelect.value || "",
      title: document.getElementById("ed-title").value.trim(),
      subtitle: document.getElementById("ed-subtitle").value.trim(),
      summary: document.getElementById("ed-summary").value.trim(),
      contentType: secSelect.value === "dictionary" ? "term" : "article",
      bodyHtml: canvas.innerHTML,
      coverUrl: document.getElementById("ed-cover-url").value.trim(),
      youtubeUrl: document.getElementById("ed-youtube-url").value.trim(),
      pdfUrl: document.getElementById("ed-pdf-url").value.trim(),
      externalUrl: document.getElementById("ed-external-url").value.trim(),
      tags,
      status: document.getElementById("ed-status").value,
      updatedAt: new Date().toISOString()
    };

    try {
      if (isEdit) {
        await updateDoc(doc(db, "items", item.id), payload);
        const idx = state.items.findIndex((x) => x.id === item.id);
        if (idx >= 0) state.items[idx] = { ...state.items[idx], ...payload };
        await logActivity("تعديل مادة", payload.title);
        showToast("تم تحديث المادة بنجاح ✓");
      } else {
        payload.views = 0;
        payload.createdAt = new Date().toISOString();
        payload.authorAdmin = state.currentUser.username;
        const ref = await addDoc(collection(db, "items"), payload);
        state.items.unshift({ id: ref.id, ...payload });
        await logActivity("إضافة مادة جديدة", payload.title);
        showToast("تم نشر المادة بنجاح ✓");
      }
      localStorage.removeItem(draftKey);
      closeModal();
      renderAdminView();
    } catch (err) {
      console.error(err);
      showToast("تعذر حفظ المادة في قاعدة البيانات", "error");
      saveBtn.disabled = false;
      saveBtn.textContent = isEdit ? "حفظ التعديلات" : "نشر وحفظ المادة";
    }
  });
}

function openLivePreviewModal(snap) {
  const backdrop = document.getElementById("preview-modal-backdrop");
  const body = document.getElementById("preview-modal-body");
  if (!backdrop || !body) return;
  const secTitle = state.settings.sectionsMeta[snap.sectionId]?.title || "";

  body.innerHTML = `
    <div class="preview-article">
      <div class="row-badges" style="margin-bottom:12px">
        <span class="pill-badge">${escapeHtml(secTitle)}</span>
        <span class="pill-badge neutral">${escapeHtml(snap.branch || "")}</span>
      </div>
      <h1 class="preview-title">${escapeHtml(snap.title || "بدون عنوان بعد")}</h1>
      ${snap.subtitle ? `<p class="preview-sub">${escapeHtml(snap.subtitle)}</p>` : ""}
      ${snap.summary ? `<p class="preview-lead">${escapeHtml(snap.summary)}</p>` : ""}
      ${snap.coverUrl ? `<img src="${escapeHtml(snap.coverUrl)}" alt="" class="preview-cover" />` : ""}
      <div class="preview-prose">${snap.bodyHtml || "<p style='color:var(--text-muted)'>لم يُكتب نص بعد...</p>"}</div>
    </div>
  `;
  backdrop.hidden = false;
}

function closeLivePreviewModal() {
  const backdrop = document.getElementById("preview-modal-backdrop");
  if (backdrop) backdrop.hidden = true;
}

/* ---------- 10.3 صندوق بنك الاختبارات التفاعلية ---------- */
function renderQuizzesManager(container) {
  if (!hasPerm("manage_quizzes")) return navigateAdmin("hub");

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "بنك الاختبارات التفاعلية (اختبر معارفك)",
        "ابنِ اختبارات اختيار من متعدد مع تفسير علمي لكل إجابة صحيحة.",
        `<button type="button" class="btn-primary-glass" id="btn-new-quiz">${ICONS.plus} إنشاء اختبار جديد</button>`
      )}

      <div class="glass-panel filter-toolbar">
        <div class="local-search-box full-flex">
          <span>${ICONS.search}</span>
          <input type="search" id="quiz-search-input" placeholder="ابحث في الاختبارات..." value="${escapeHtml(state.filters.quizSearch)}" />
        </div>
      </div>

      <div id="quizzes-list" class="admin-list-stack"></div>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));
  document.getElementById("btn-new-quiz")?.addEventListener("click", () => openQuizEditorModal(null));

  const paint = () => {
    const list = smartFilter(state.quizzes, state.filters.quizSearch, (q) => `${q.title} ${q.branch} ${q.description || ""}`);
    const wrap = document.getElementById("quizzes-list");
    if (!list.length) {
      wrap.innerHTML = `<div class="glass-card empty-state"><p>لا توجد اختبارات مضافة بعد.</p></div>`;
      return;
    }

    wrap.innerHTML = list.map((q) => `
      <div class="glass-card admin-row-card">
        <div class="row-thumb placeholder">؟</div>
        <div class="row-main">
          <div class="row-badges">
            <span class="pill-badge">${escapeHtml(q.branch || "اختبار")}</span>
            <span class="pill-badge neutral">${escapeHtml(q.difficulty || "متوسط")}</span>
            <span class="pill-badge neutral">${(q.questions || []).length} أسئلة</span>
          </div>
          <h3>${escapeHtml(q.title)}</h3>
          <p>${escapeHtml(q.description || "")}</p>
        </div>
        <div class="row-actions">
          <button type="button" class="tool-btn" data-edit-quiz="${q.id}">${ICONS.edit} تعديل</button>
          <button type="button" class="tool-btn danger" data-del-quiz="${q.id}">${ICONS.trash} حذف</button>
        </div>
      </div>
    `).join("");

    wrap.querySelectorAll("[data-edit-quiz]").forEach((b) => {
      b.addEventListener("click", () => {
        const found = state.quizzes.find((x) => x.id === b.dataset.editQuiz);
        if (found) openQuizEditorModal(found);
      });
    });

    wrap.querySelectorAll("[data-del-quiz]").forEach((b) => {
      b.addEventListener("click", async () => {
        const found = state.quizzes.find((x) => x.id === b.dataset.delQuiz);
        if (!found || !confirm(`حذف الاختبار "${found.title}" نهائياً؟`)) return;
        await deleteDoc(doc(db, "quizzes", found.id));
        state.quizzes = state.quizzes.filter((x) => x.id !== found.id);
        await logActivity("حذف اختبار", found.title);
        showToast("تم حذف الاختبار");
        paint();
      });
    });
  };

  document.getElementById("quiz-search-input")?.addEventListener("input", (e) => {
    state.filters.quizSearch = e.target.value;
    paint();
  });

  paint();
}

function openQuizEditorModal(quiz = null) {
  const isEdit = Boolean(quiz);
  const branches = state.settings.sectionsMeta.quiz?.branches || ["اختبارات في فروع اللسانيات"];
  state.editingQuizQuestions = quiz?.questions?.length
    ? structuredClone(quiz.questions)
    : [{ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" }];

  openModal(isEdit ? "تعديل الاختبار" : "إنشاء اختبار تفاعلي جديد", `
    <form id="quiz-editor-form" class="editor-form">
      <div class="form-grid-2">
        <div class="form-group">
          <label>عنوان الاختبار *</label>
          <input type="text" id="qz-title" required value="${escapeHtml(quiz?.title || "")}" placeholder="مثال: اختبار في علم الأصوات العربية" />
        </div>
        <div class="form-group">
          <label>الفرع</label>
          <select id="qz-branch">
            ${branches.map((b) => `<option value="${escapeHtml(b)}" ${b === quiz?.branch ? "selected" : ""}>${escapeHtml(b)}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label>مستوى الصعوبة</label>
          <select id="qz-diff">
            ${["مبتدئ", "متوسط", "متقدم"].map((d) => `<option value="${d}" ${d === (quiz?.difficulty || "متوسط") ? "selected" : ""}>${d}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label>حالة النشر</label>
          <select id="qz-status">
            <option value="published" ${(quiz?.status || "published") === "published" ? "selected" : ""}>منشور</option>
            <option value="draft" ${quiz?.status === "draft" ? "selected" : ""}>مسودة</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>وصف قصير للاختبار</label>
        <input type="text" id="qz-desc" value="${escapeHtml(quiz?.description || "")}" placeholder="نبذة عن محاور الأسئلة..." />
      </div>

      <div class="quiz-builder-header">
        <strong>الأسئلة (${state.editingQuizQuestions.length})</strong>
        <button type="button" class="tool-btn" id="add-question-btn">${ICONS.plus} إضافة سؤال</button>
      </div>
      <div id="quiz-questions-builder" class="quiz-questions-stack"></div>

      <div class="modal-footer-actions">
        <button type="button" class="tool-btn" id="cancel-quiz-btn">إلغاء</button>
        <button type="submit" class="btn-primary-glass" id="save-quiz-btn">حفظ الاختبار</button>
      </div>
    </form>
  `, "wide");

  const syncQuestionsFromDOM = () => {
    const cards = document.querySelectorAll(".q-builder-card");
    state.editingQuizQuestions = Array.from(cards).map((card) => ({
      question: card.querySelector(".qb-q").value.trim(),
      options: Array.from(card.querySelectorAll(".qb-opt")).map((i) => i.value.trim()),
      correctIndex: Number(card.querySelector(".qb-correct").value),
      explanation: card.querySelector(".qb-exp").value.trim()
    }));
  };

  const renderQuestionsBuilder = () => {
    const wrap = document.getElementById("quiz-questions-builder");
    wrap.innerHTML = state.editingQuizQuestions.map((q, idx) => `
      <div class="q-builder-card">
        <div class="q-builder-head">
          <strong>سؤال #${idx + 1}</strong>
          ${state.editingQuizQuestions.length > 1 ? `<button type="button" class="tool-btn danger" data-rm-q="${idx}">حذف السؤال</button>` : ""}
        </div>
        <div class="form-group">
          <input type="text" class="qb-q" required value="${escapeHtml(q.question)}" placeholder="نص السؤال..." />
        </div>
        <div class="form-grid-2">
          ${[0, 1, 2, 3].map((oi) => `
            <input type="text" class="qb-opt" required value="${escapeHtml(q.options[oi] || "")}" placeholder="الخيار ${["أ", "ب", "ج", "د"][oi]}" />
          `).join("")}
        </div>
        <div class="form-grid-2" style="margin-top:10px">
          <div class="form-group">
            <label>الإجابة الصحيحة</label>
            <select class="qb-correct">
              ${["أ (الأول)", "ب (الثاني)", "ج (الثالث)", "د (الرابع)"].map((lbl, oi) =>
                `<option value="${oi}" ${Number(q.correctIndex) === oi ? "selected" : ""}>${lbl}</option>`
              ).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>الشرح اللساني للإجابة</label>
            <input type="text" class="qb-exp" value="${escapeHtml(q.explanation || "")}" placeholder="تفسير مختصر..." />
          </div>
        </div>
      </div>
    `).join("");

    wrap.querySelectorAll("[data-rm-q]").forEach((btn) => {
      btn.addEventListener("click", () => {
        syncQuestionsFromDOM();
        state.editingQuizQuestions.splice(Number(btn.dataset.rmQ), 1);
        renderQuestionsBuilder();
      });
    });
  };

  document.getElementById("add-question-btn")?.addEventListener("click", () => {
    syncQuestionsFromDOM();
    state.editingQuizQuestions.push({ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" });
    renderQuestionsBuilder();
  });

  document.getElementById("cancel-quiz-btn")?.addEventListener("click", closeModal);

  document.getElementById("quiz-editor-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    syncQuestionsFromDOM();
    const saveBtn = document.getElementById("save-quiz-btn");
    saveBtn.disabled = true;

    const payload = {
      title: document.getElementById("qz-title").value.trim(),
      branch: document.getElementById("qz-branch").value,
      difficulty: document.getElementById("qz-diff").value,
      status: document.getElementById("qz-status").value,
      description: document.getElementById("qz-desc").value.trim(),
      questions: state.editingQuizQuestions,
      updatedAt: new Date().toISOString()
    };

    try {
      if (isEdit) {
        await updateDoc(doc(db, "quizzes", quiz.id), payload);
        const idx = state.quizzes.findIndex((x) => x.id === quiz.id);
        if (idx >= 0) state.quizzes[idx] = { ...state.quizzes[idx], ...payload };
        await logActivity("تعديل اختبار", payload.title);
      } else {
        payload.createdAt = new Date().toISOString();
        const ref = await addDoc(collection(db, "quizzes"), payload);
        state.quizzes.unshift({ id: ref.id, ...payload });
        await logActivity("إضافة اختبار جديد", payload.title);
      }
      showToast("تم حفظ الاختبار بنجاح ✓");
      closeModal();
      renderAdminView();
    } catch (err) {
      console.error(err);
      showToast("تعذر حفظ الاختبار", "error");
      saveBtn.disabled = false;
    }
  });

  renderQuestionsBuilder();
}

/* ---------- 10.4 صندوق مراجعة مساهمات الطلبة ---------- */
function renderSubmissionsQueue(container) {
  if (!hasPerm("approve_submissions")) return navigateAdmin("hub");
  const pending = state.items.filter((x) => x.status === "pending");

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "مساهمات ومشاريع الطلبة المعلقة",
        "راجع ما أرسله الطلبة في فضاء التبادل العلمي واعتمد نشره بضغطة زر."
      )}
      <div class="admin-list-stack">
        ${pending.length ? pending.map((it) => `
          <div class="glass-card admin-row-card">
            <div class="row-main">
              <div class="row-badges">
                <span class="pill-badge">${escapeHtml(it.branch || "فضاء التبادل العلمي")}</span>
                <span class="status-dot pending">بانتظار الاعتماد</span>
              </div>
              <h3>${escapeHtml(it.title)}</h3>
              <p><strong>${escapeHtml(it.subtitle || "")}</strong> — ${escapeHtml(it.summary || "")}</p>
            </div>
            <div class="row-actions">
              <button type="button" class="btn-primary-glass" data-approve="${it.id}">اعتماد ونشر</button>
              <button type="button" class="tool-btn" data-review-edit="${it.id}">مراجعة وتعديل</button>
              <button type="button" class="tool-btn danger" data-reject="${it.id}">رفض وحذف</button>
            </div>
          </div>
        `).join("") : `<div class="glass-card empty-state"><p>ممتاز! لا توجد مساهمات معلقة حالياً.</p></div>`}
      </div>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));

  container.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const it = state.items.find((x) => x.id === btn.dataset.approve);
      if (!it) return;
      await updateDoc(doc(db, "items", it.id), { status: "published" });
      it.status = "published";
      await logActivity("اعتماد مساهمة طالب", it.title);
      showToast("تم اعتماد المساهمة ونشرها في المنصة ✓");
      renderAdminView();
    });
  });

  container.querySelectorAll("[data-review-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const it = state.items.find((x) => x.id === btn.dataset.reviewEdit);
      if (it) openItemEditorModal(it);
    });
  });

  container.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const it = state.items.find((x) => x.id === btn.dataset.reject);
      if (!it || !confirm("هل تريد رفض وحذف هذه المساهمة؟")) return;
      await deleteDoc(doc(db, "items", it.id));
      state.items = state.items.filter((x) => x.id !== it.id);
      await logActivity("رفض مساهمة", it.title);
      showToast("تم حذف المساهمة");
      renderAdminView();
    });
  });
}

/* ---------- 10.5 صندوق الأقسام الستة وفروعها ---------- */
function renderSectionsManager(container) {
  if (!hasPerm("manage_sections")) return navigateAdmin("hub");
  const secs = Object.values(state.settings.sectionsMeta).sort((a, b) => a.order - b.order);

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "هيكلة الأقسام الستة وفروعها",
        "عدّل اسم أي قسم أو وصفه أو لونه أو أضف/احذف فروعاً داخلية بحرية كاملة.",
        `<button type="button" class="btn-primary-glass" id="save-sections-btn">حفظ تغييرات الأقسام</button>`
      )}

      <div class="sections-editor-grid">
        ${secs.map((s) => `
          <div class="glass-card section-editor-card" data-sec-card="${s.id}">
            <div class="form-grid-2">
              <div class="form-group">
                <label>اسم القسم</label>
                <input type="text" class="se-title" value="${escapeHtml(s.title)}" />
              </div>
              <div class="form-group">
                <label>لون التمييز</label>
                <input type="color" class="se-accent color-input" value="${escapeHtml(s.accent || "#0071e3")}" />
              </div>
            </div>
            <div class="form-group">
              <label>وصف مختصر يظهر على الصندوق</label>
              <textarea class="se-desc" rows="2">${escapeHtml(s.shortDesc)}</textarea>
            </div>
            <div class="form-group">
              <label>الفروع الداخلية (كل فرع في سطر مستقل)</label>
              <textarea class="se-branches" rows="4">${escapeHtml((s.branches || []).join("\n"))}</textarea>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));

  document.getElementById("save-sections-btn")?.addEventListener("click", async () => {
    const btn = document.getElementById("save-sections-btn");
    btn.disabled = true;
    btn.textContent = "جارٍ الحفظ...";

    container.querySelectorAll("[data-sec-card]").forEach((card) => {
      const id = card.dataset.secCard;
      const branches = card.querySelector(".se-branches").value.split("\n").map((x) => x.trim()).filter(Boolean);
      state.settings.sectionsMeta[id] = {
        ...state.settings.sectionsMeta[id],
        title: card.querySelector(".se-title").value.trim(),
        accent: card.querySelector(".se-accent").value,
        shortDesc: card.querySelector(".se-desc").value.trim(),
        branches
      };
    });

    try {
      await setDoc(doc(db, "settings", "global"), state.settings, { merge: true });
      await logActivity("تحديث الأقسام والفروع", "تم تعديل بنية الأقسام في المنصة");
      showToast("تم حفظ بنية الأقسام والفروع وتحديث الموقع العام ✓");
    } catch (err) {
      console.error(err);
      showToast("تعذر الحفظ", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "حفظ تغييرات الأقسام";
    }
  });
}

/* ---------- 10.6 صندوق مفاتيح الميزات والظهور (Feature Flags) ---------- */
function renderFeaturesManager(container) {
  if (!hasPerm("manage_features")) return navigateAdmin("hub");

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "مفاتيح الميزات والظهور (Feature Flags)",
        "تحكم بإخفاء أو إظهار أي قسم أو ميزة في الواجهة العامة فوراً بضغطة زر."
      )}

      <div class="glass-card toggles-list">
        ${FEATURE_FLAGS_CATALOG.map((f) => {
          const checked = state.settings.features[f.key] !== false;
          return `
            <div class="toggle-row">
              <div>
                <strong>${f.label}</strong>
                <p>${f.desc}</p>
              </div>
              <label class="apple-switch">
                <input type="checkbox" data-flag-key="${f.key}" ${checked ? "checked" : ""} />
                <span class="apple-slider"></span>
              </label>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));

  container.querySelectorAll("[data-flag-key]").forEach((chk) => {
    chk.addEventListener("change", async () => {
      const key = chk.dataset.flagKey;
      state.settings.features[key] = chk.checked;
      try {
        await setDoc(doc(db, "settings", "global"), { features: state.settings.features }, { merge: true });
        await logActivity("تغيير حالة ميزة", `${key} => ${chk.checked ? "مفعّلة" : "مخفية"}`);
        showToast(chk.checked ? "تم تفعيل الميزة في الموقع العام ✓" : "تم إخفاء الميزة من الموقع العام");
      } catch {
        chk.checked = !chk.checked;
        showToast("تعذر تحديث الميزة", "error");
      }
    });
  });
}

/* ---------- 10.7 صندوق هوية المنصة + مولّد خريطة الموقع للسيو (sitemap.xml) ---------- */
function buildSitemapXml(baseUrlRaw) {
  const cleanBase = (baseUrlRaw || "https://example.com").trim().replace(/\/+$/, "");
  const today = new Date().toISOString().split("T")[0];
  const urls = [{ loc: `${cleanBase}/`, priority: "1.0", changefreq: "daily", lastmod: today }];

  const enabledSecs = Object.values(state.settings.sectionsMeta)
    .filter((s) => state.settings.features[s.featureKey] !== false)
    .sort((a, b) => a.order - b.order);

  enabledSecs.forEach((sec) => {
    urls.push({
      loc: `${cleanBase}/?section=${encodeURIComponent(sec.id)}`,
      priority: "0.9",
      changefreq: "weekly",
      lastmod: today
    });
  });

  state.items
    .filter((it) => !it.status || it.status === "published")
    .forEach((it) => {
      const d = (it.updatedAt || it.createdAt || today).slice(0, 10);
      urls.push({
        loc: `${cleanBase}/?section=${encodeURIComponent(it.sectionId || "library")}&amp;item=${encodeURIComponent(it.id)}`,
        priority: "0.8",
        changefreq: "monthly",
        lastmod: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today
      });
    });

  state.quizzes
    .filter((q) => !q.status || q.status === "published")
    .forEach((q) => {
      const d = (q.updatedAt || q.createdAt || today).slice(0, 10);
      urls.push({
        loc: `${cleanBase}/?section=quiz&amp;quiz=${encodeURIComponent(q.id)}`,
        priority: "0.75",
        changefreq: "monthly",
        lastmod: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today
      });
    });

  const body = urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

function renderSettingsManager(container) {
  if (!hasPerm("manage_settings")) return navigateAdmin("hub");
  const s = state.settings;

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "هوية المنصة وخريطة الفهرسة (SEO)",
        "أي تغيير في الشعار أو اللون هنا ينعكس فوراً على الموقع العام وغرفة العمليات معاً."
      )}

      <form id="global-settings-form" class="glass-card settings-form-card">
        <div class="form-grid-2">
          <div class="form-group">
            <label>اسم المنصة الرئيسي</label>
            <input type="text" id="set-name" value="${escapeHtml(s.siteName)}" required />
          </div>
          <div class="form-group">
            <label>الوصف الفرعي (تحت الاسم)</label>
            <input type="text" id="set-subtitle" value="${escapeHtml(s.siteSubtitle)}" />
          </div>
        </div>

        <div class="form-group">
          <label>الشعار النصي الترحيبي (Tagline)</label>
          <input type="text" id="set-tagline" value="${escapeHtml(s.siteTagline)}" />
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label>شارة الجمهور المتخصص</label>
            <input type="text" id="set-badge" value="${escapeHtml(s.audienceBadge)}" />
          </div>
          <div class="form-group">
            <label>اللون الأساسي للمنصة (ينعكس على المستودعين فوراً)</label>
            <input type="color" id="set-accent" class="color-input" value="${escapeHtml(s.themeAccent || "#0071e3")}" />
          </div>
        </div>

        <div class="form-group">
          <label>شعار المنصة (يتغير في الموقع العام ولوحة التحكم معاً)</label>
          <div class="upload-row">
            <input type="url" id="set-logo" dir="ltr" value="${escapeHtml(s.logoUrl || "")}" placeholder="رابط الشعار (اتركه فارغاً لحرف ل الافتراضي)" />
            <label class="tool-btn upload-trigger">
              ${ICONS.upload} رفع شعار
              <input type="file" id="set-logo-file" accept="image/*" hidden />
            </label>
          </div>
          <small id="set-logo-status" class="helper-hint"></small>
        </div>

        <div class="form-group">
          <label>نص شريط الإعلانات العلوية (اتركه فارغاً لإخفائه)</label>
          <input type="text" id="set-announcement" value="${escapeHtml(s.announcementText || "")}" placeholder="مثال: تم فتح باب استقبال مشاريع الماستر للفصل الحالي..." />
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label>نص التذييل (Footer)</label>
            <input type="text" id="set-footer" value="${escapeHtml(s.footerText || "")}" />
          </div>
          <div class="form-group">
            <label>البريد الإلكتروني للتواصل</label>
            <input type="email" id="set-email" dir="ltr" value="${escapeHtml(s.contactEmail || "")}" placeholder="contact@lisan.org" />
          </div>
        </div>

        <h3 class="sub-divider-title">روابط التواصل الاجتماعي</h3>
        <div class="form-grid-2">
          <div class="form-group">
            <label>فيسبوك</label>
            <input type="url" id="set-fb" dir="ltr" value="${escapeHtml(s.socialLinks?.facebook || "")}" placeholder="https://facebook.com/..." />
          </div>
          <div class="form-group">
            <label>تيليجرام</label>
            <input type="url" id="set-tg" dir="ltr" value="${escapeHtml(s.socialLinks?.telegram || "")}" placeholder="https://t.me/..." />
          </div>
          <div class="form-group">
            <label>يوتيوب</label>
            <input type="url" id="set-yt" dir="ltr" value="${escapeHtml(s.socialLinks?.youtube || "")}" placeholder="https://youtube.com/..." />
          </div>
          <div class="form-group">
            <label>X / تويتر</label>
            <input type="url" id="set-tw" dir="ltr" value="${escapeHtml(s.socialLinks?.twitter || "")}" placeholder="https://x.com/..." />
          </div>
        </div>

        <div class="modal-footer-actions">
          <button type="submit" class="btn-primary-glass" id="save-settings-btn">حفظ وتطبيق الهوية فوراً</button>
        </div>
      </form>

      <!-- مولّد خريطة الموقع لمحركات البحث (sitemap.xml) -->
      <section class="glass-card settings-form-card" style="margin-top: 22px">
        <div class="sitemap-head">
          <div>
            <h3 style="margin:0 0 4px">${ICONS.globe} مولّد خريطة الموقع للسيو (sitemap.xml)</h3>
            <p class="helper-hint" style="margin:0">يجمع كل روابط الأقسام والمواد والاختبارات المنشورة تلقائياً لتقديمها لـ Google Search Console.</p>
          </div>
        </div>

        <div class="form-group" style="margin-top: 16px">
          <label>رابط الدومين الرسمي للمنصة العامة (عند ربطه أو رابط Cloudflare Pages الحالي)</label>
          <div class="upload-row">
            <input type="url" id="seo-base-url" dir="ltr" value="${escapeHtml(s.publicBaseUrl || "")}" placeholder="https://lisan-platform.com" />
            <button type="button" class="btn-primary-glass" id="generate-sitemap-btn">توليد الخريطة</button>
          </div>
        </div>

        <div id="sitemap-output-wrap" hidden>
          <textarea id="sitemap-xml-output" rows="10" dir="ltr" readonly class="code-textarea"></textarea>
          <div class="form-actions-inline" style="margin-top: 10px">
            <button type="button" class="tool-btn" id="copy-sitemap-btn">نسخ كود sitemap.xml</button>
            <button type="button" class="btn-primary-glass" id="download-sitemap-btn">تحميل ملف sitemap.xml</button>
          </div>
        </div>
      </section>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));

  document.getElementById("set-logo-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const statusEl = document.getElementById("set-logo-status");
    try {
      const url = await uploadCompressedImageToImgBB(file, statusEl, 512);
      document.getElementById("set-logo").value = url;
    } catch (err) {
      statusEl.textContent = err.message;
      showToast(err.message, "error");
    }
  });

  document.getElementById("global-settings-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("save-settings-btn");
    btn.disabled = true;
    btn.textContent = "جارٍ الحفظ...";

    state.settings = {
      ...state.settings,
      siteName: document.getElementById("set-name").value.trim(),
      siteSubtitle: document.getElementById("set-subtitle").value.trim(),
      siteTagline: document.getElementById("set-tagline").value.trim(),
      audienceBadge: document.getElementById("set-badge").value.trim(),
      themeAccent: document.getElementById("set-accent").value,
      logoUrl: document.getElementById("set-logo").value.trim(),
      announcementText: document.getElementById("set-announcement").value.trim(),
      footerText: document.getElementById("set-footer").value.trim(),
      contactEmail: document.getElementById("set-email").value.trim(),
      publicBaseUrl: document.getElementById("seo-base-url")?.value.trim() || state.settings.publicBaseUrl || "",
      socialLinks: {
        facebook: document.getElementById("set-fb").value.trim(),
        telegram: document.getElementById("set-tg").value.trim(),
        youtube: document.getElementById("set-yt").value.trim(),
        twitter: document.getElementById("set-tw").value.trim()
      }
    };

    try {
      await setDoc(doc(db, "settings", "global"), state.settings, { merge: true });
      applyAdminBranding(); // المرآة الفورية في غرفة العمليات
      await logActivity("تحديث هوية المنصة", state.settings.siteName);
      showToast("تم تحديث الهوية والشعار واللون في المستودعين بنجاح ✓");
    } catch (err) {
      console.error(err);
      showToast("تعذر حفظ الإعدادات", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "حفظ وتطبيق الهوية فوراً";
    }
  });

  // مولّد خريطة sitemap.xml
  document.getElementById("generate-sitemap-btn")?.addEventListener("click", async () => {
    const baseInput = document.getElementById("seo-base-url").value.trim();
    if (!/^https?:\/\//i.test(baseInput)) {
      showToast("أدخل رابط الموقع العام يبدأ بـ https:// أولاً", "error");
      return;
    }
    state.settings.publicBaseUrl = baseInput;
    setDoc(doc(db, "settings", "global"), { publicBaseUrl: baseInput }, { merge: true }).catch(() => {});

    const xml = buildSitemapXml(baseInput);
    const out = document.getElementById("sitemap-xml-output");
    out.value = xml;
    document.getElementById("sitemap-output-wrap").hidden = false;
    showToast("تم توليد خريطة الموقع بالكامل جاهزة للفهرسة ✓");
  });

  document.getElementById("copy-sitemap-btn")?.addEventListener("click", async () => {
    const xml = document.getElementById("sitemap-xml-output")?.value || "";
    try {
      await navigator.clipboard.writeText(xml);
      showToast("تم نسخ كود sitemap.xml بنجاح ✓");
    } catch {
      showToast("حدد النص وانسخه يدوياً");
    }
  });

  document.getElementById("download-sitemap-btn")?.addEventListener("click", () => {
    const xml = document.getElementById("sitemap-xml-output")?.value || "";
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

/* ---------- 10.8 صندوق فريق الإدارة والصلاحيات (مع الصورة والنبذة والبحث الذكي فيها) ---------- */
function renderAdminsManager(container) {
  if (!hasPerm("manage_admins")) return navigateAdmin("hub");

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "فريق الإدارة والصلاحيات المرنة",
        "أضف موظفين بصورهم ونبذهم التعريفية؛ البحث الذكي يلتقط أي كلمة من الاسم أو النبذة فوراً.",
        `<button type="button" class="btn-primary-glass" id="btn-new-admin">${ICONS.plus} إضافة مشرف جديد</button>`
      )}

      <div class="glass-panel filter-toolbar">
        <div class="local-search-box full-flex">
          <span>${ICONS.search}</span>
          <input type="search" id="admin-search-input"
            placeholder="ابحث بالاسم، اسم المستخدم، أو أي كلمة من نبذة الموظف (مثل: معجم، أصوات، ماستر)..."
            value="${escapeHtml(state.filters.adminSearch)}" />
        </div>
      </div>

      <div id="admins-list-wrap" class="admin-list-stack"></div>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));
  document.getElementById("btn-new-admin")?.addEventListener("click", () => openAdminEditorModal(null));

  const paint = () => {
    // البحث الذكي يلتقط من الاسم + اسم المستخدم + النبذة التعريفية
    const list = smartFilter(state.admins, state.filters.adminSearch, (a) =>
      `${a.displayName || ""} ${a.username || ""} ${a.bio || ""}`
    );
    const wrap = document.getElementById("admins-list-wrap");
    if (!list.length) {
      wrap.innerHTML = `<div class="glass-card empty-state"><p>لم يُعثر على موظف مطابق في الاسم أو النبذة التعريفية.</p></div>`;
      return;
    }

    wrap.innerHTML = list.map((ad) => `
      <div class="glass-card admin-row-card">
        ${renderAvatarHtml(ad.avatarUrl, ad.displayName || ad.username, "md")}
        <div class="row-main">
          <div class="row-badges">
            <span class="pill-badge">${ad.isSuperAdmin ? "أدمن رئيسي (كامل الصلاحيات)" : `${(ad.permissions || []).length} صلاحيات`}</span>
            <span class="status-dot ${ad.active !== false ? "published" : "draft"}">${ad.active !== false ? "نشط" : "موقوف"}</span>
          </div>
          <h3>${escapeHtml(ad.displayName || ad.username)}</h3>
          <p class="admin-meta-line">اسم المستخدم: <strong dir="ltr">${escapeHtml(ad.username)}</strong></p>
          ${ad.bio ? `<p class="admin-bio-line">${escapeHtml(ad.bio)}</p>` : ""}
        </div>
        <div class="row-actions">
          <button type="button" class="tool-btn" data-edit-admin="${ad.id}">${ICONS.edit} تعديل</button>
          ${!ad.isSuperAdmin ? `<button type="button" class="tool-btn danger" data-del-admin="${ad.id}">${ICONS.trash} حذف</button>` : ""}
        </div>
      </div>
    `).join("");

    wrap.querySelectorAll("[data-edit-admin]").forEach((b) => {
      b.addEventListener("click", () => {
        const found = state.admins.find((x) => x.id === b.dataset.editAdmin);
        if (found) openAdminEditorModal(found);
      });
    });

    wrap.querySelectorAll("[data-del-admin]").forEach((b) => {
      b.addEventListener("click", async () => {
        const found = state.admins.find((x) => x.id === b.dataset.delAdmin);
        if (!found || found.isSuperAdmin) return;
        if (!confirm(`حذف حساب المشرف "${found.username}" نهائياً؟`)) return;
        await deleteDoc(doc(db, "admins", found.id));
        state.admins = state.admins.filter((x) => x.id !== found.id);
        await logActivity("حذف مشرف", found.username);
        showToast("تم حذف المشرف");
        paint();
      });
    });
  };

  document.getElementById("admin-search-input")?.addEventListener("input", (e) => {
    state.filters.adminSearch = e.target.value;
    paint();
  });

  paint();
}

function openAdminEditorModal(admin = null) {
  const isEdit = Boolean(admin);
  const currentPerms = new Set(admin?.permissions || []);

  openModal(isEdit ? `تعديل حساب: ${admin.displayName || admin.username}` : "إضافة مشرف جديد", `
    <form id="admin-user-form" class="editor-form">
      <div class="tip-banner">
        <strong>نصيحة احترافية:</strong> ضع <strong>البريد الإلكتروني أو رقم الهاتف</strong> كاسم مستخدم، وأضف كلمات وصفية في <strong>نبذة الموظف</strong> لتسهيل العثور عليه بالبحث الذكي لاحقاً.
      </div>

      <div class="avatar-editor-row">
        <div id="adm-avatar-preview">${renderAvatarHtml(admin?.avatarUrl, admin?.displayName || "م", "lg")}</div>
        <div class="form-group" style="flex:1; margin:0">
          <label>الصورة الشخصية للموظف (اختياري — يمكن للموظف تغييرها لاحقاً)</label>
          <div class="upload-row">
            <input type="url" id="adm-avatar-url" dir="ltr" value="${escapeHtml(admin?.avatarUrl || "")}" placeholder="رابط الصورة أو ارفع صورة..." />
            <label class="tool-btn upload-trigger">
              ${ICONS.upload} رفع صورة
              <input type="file" id="adm-avatar-file" accept="image/*" hidden />
            </label>
          </div>
          <small id="adm-avatar-status" class="helper-hint"></small>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label>الاسم الظاهر *</label>
          <input type="text" id="adm-display" required value="${escapeHtml(admin?.displayName || "")}" placeholder="مثال: أ. سارة بن علي" />
        </div>
        <div class="form-group">
          <label>اسم المستخدم (فريد لا يتكرر) *</label>
          <input type="text" id="adm-username" required dir="ltr" value="${escapeHtml(admin?.username || "")}" placeholder="sara@lisan.org أو 05..." />
          <small id="username-check-hint" class="helper-hint"></small>
        </div>
      </div>

      <div class="form-group">
        <label>نبذة تعريفية عن الموظف ومهامه (مفهرسة في البحث الذكي)</label>
        <textarea id="adm-bio" rows="2" placeholder="مثال: مسؤولة قسم المعجم اللساني والتداولية — جامعة الجزائر — مراجعة الكتب والأبحاث...">${escapeHtml(admin?.bio || "")}</textarea>
      </div>

      <div class="form-grid-2">
        <div class="form-group">
          <label>${isEdit ? "كلمة مرور جديدة (اتركها فارغة للإبقاء على الحالية)" : "كلمة المرور *"}</label>
          <input type="password" id="adm-password" ${isEdit ? "" : "required"} placeholder="أدخل كلمة مرور قوية" />
        </div>
        <div class="form-group">
          <label>حالة الحساب</label>
          <select id="adm-active" ${admin?.isSuperAdmin ? "disabled" : ""}>
            <option value="true" ${admin?.active !== false ? "selected" : ""}>نشط ومصرّح له بالدخول</option>
            <option value="false" ${admin?.active === false ? "selected" : ""}>موقوف مؤقتاً</option>
          </select>
        </div>
      </div>

      ${admin?.isSuperAdmin ? `
        <div class="tip-banner">هذا الحساب هو <strong>الأدمن الرئيسي</strong> ويملك كافة الصلاحيات بشكل دائم.</div>
      ` : `
        <div class="form-group">
          <label>حدد الصلاحيات الممنوحة لهذا المشرف (اختيار مرن ودقيق):</label>
          <div class="perms-checklist">
            ${PERMISSIONS_CATALOG.map((p) => `
              <label class="perm-check-item">
                <input type="checkbox" class="adm-perm-chk" value="${p.key}" ${currentPerms.has(p.key) ? "checked" : ""} />
                <span>${p.label}</span>
              </label>
            `).join("")}
          </div>
        </div>
      `}

      <div class="modal-footer-actions">
        <button type="button" class="tool-btn" id="cancel-admin-btn">إلغاء</button>
        <button type="submit" class="btn-primary-glass" id="save-admin-btn">${isEdit ? "حفظ التغييرات" : "إنشاء حساب المشرف"}</button>
      </div>
    </form>
  `);

  const usernameInput = document.getElementById("adm-username");
  const hintEl = document.getElementById("username-check-hint");
  const avatarUrlInput = document.getElementById("adm-avatar-url");
  const avatarPreview = document.getElementById("adm-avatar-preview");

  document.getElementById("adm-avatar-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const statusEl = document.getElementById("adm-avatar-status");
    try {
      const url = await uploadCompressedImageToImgBB(file, statusEl, 512);
      avatarUrlInput.value = url;
      avatarPreview.innerHTML = renderAvatarHtml(url, document.getElementById("adm-display").value || "م", "lg");
    } catch (err) {
      statusEl.textContent = err.message;
      showToast(err.message, "error");
    }
  });

  const isDuplicateUsername = (val) => {
    const lower = val.trim().toLowerCase();
    return state.admins.some((a) => a.usernameLower === lower && a.id !== admin?.id);
  };

  usernameInput.addEventListener("input", () => {
    const val = usernameInput.value.trim();
    if (!val) { hintEl.textContent = ""; return; }
    if (isDuplicateUsername(val)) {
      hintEl.textContent = "هذا اسم مستخدم مسجل لدينا بالفعل — اختر اسماً آخر.";
      hintEl.className = "helper-hint error";
    } else {
      hintEl.textContent = "اسم المستخدم متاح وفريد ✓";
      hintEl.className = "helper-hint ok";
    }
  });

  document.getElementById("cancel-admin-btn")?.addEventListener("click", closeModal);

  document.getElementById("admin-user-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const usernameLower = username.toLowerCase();

    if (isDuplicateUsername(username)) {
      showToast("هذا اسم مستخدم مسجل لدينا! يرجى اختيار اسم مختلف.", "error");
      return;
    }
    const existing = await findAdminByUsername(username);
    if (existing && existing.id !== admin?.id) {
      showToast("هذا اسم مستخدم مسجل لدينا بالفعل!", "error");
      return;
    }

    const saveBtn = document.getElementById("save-admin-btn");
    saveBtn.disabled = true;

    const selectedPerms = admin?.isSuperAdmin
      ? PERMISSIONS_CATALOG.map((p) => p.key)
      : Array.from(document.querySelectorAll(".adm-perm-chk:checked")).map((c) => c.value);

    const newPass = document.getElementById("adm-password").value;
    const payload = {
      displayName: document.getElementById("adm-display").value.trim(),
      username,
      usernameLower,
      avatarUrl: avatarUrlInput.value.trim(),
      bio: document.getElementById("adm-bio").value.trim(),
      active: admin?.isSuperAdmin ? true : document.getElementById("adm-active").value === "true",
      permissions: selectedPerms,
      updatedAt: new Date().toISOString()
    };

    if (newPass) payload.passwordHash = await sha256(newPass);

    try {
      if (isEdit) {
        await updateDoc(doc(db, "admins", admin.id), payload);
        const idx = state.admins.findIndex((x) => x.id === admin.id);
        if (idx >= 0) state.admins[idx] = { ...state.admins[idx], ...payload };
        if (state.currentUser.id === admin.id) {
          state.currentUser = { ...state.currentUser, ...payload };
          applyAdminBranding();
        }
        await logActivity("تعديل بيانات مشرف", username);
        showToast("تم تحديث بيانات المشرف ✓");
      } else {
        payload.isSuperAdmin = false;
        payload.pinHash = "";
        payload.createdAt = new Date().toISOString();
        const ref = await addDoc(collection(db, "admins"), payload);
        state.admins.push({ id: ref.id, ...payload });
        await logActivity("إضافة مشرف جديد", username);
        showToast("تم إنشاء حساب المشرف بنجاح ✓");
      }
      closeModal();
      renderAdminView();
    } catch (err) {
      console.error(err);
      showToast("تعذر حفظ بيانات المشرف", "error");
      saveBtn.disabled = false;
    }
  });
}

/* ---------- 10.9 صندوق حسابي (تعديل الصورة والاسم والنبذة) + الأمان + السجلات ---------- */
function renderSecurityAndLogs(container) {
  const trusted = getTrustedDevice();
  const isThisTrusted = trusted?.adminId === state.currentUser.id;
  const me = state.currentUser;

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "ملفي الشخصي، الأمان، والسجلات",
        "عدّل صورتك الشخصية واسمك ونبذتك التعريفية، واضبط الرمز السريع وكلمة المرور."
      )}

      <!-- بطاقة تعديل الملف الشخصي للموظف بنفسه -->
      <form id="self-profile-form" class="glass-card settings-form-card" style="margin-bottom: 20px">
        <h3 style="margin-top:0">ملفي الشخصي</h3>
        <div class="avatar-editor-row">
          <div id="self-avatar-preview">${renderAvatarHtml(me.avatarUrl, me.displayName || me.username, "lg")}</div>
          <div class="form-group" style="flex:1; margin:0">
            <label>صورتي الشخصية (تُضغط وتُرفع تلقائياً)</label>
            <div class="upload-row">
              <input type="url" id="self-avatar-url" dir="ltr" value="${escapeHtml(me.avatarUrl || "")}" placeholder="رابط الصورة أو ارفع من جهازك..." />
              <label class="tool-btn upload-trigger">
                ${ICONS.upload} رفع صورة
                <input type="file" id="self-avatar-file" accept="image/*" hidden />
              </label>
            </div>
            <small id="self-avatar-status" class="helper-hint"></small>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group">
            <label>الاسم الظاهر</label>
            <input type="text" id="self-display" required value="${escapeHtml(me.displayName || "")}" />
          </div>
          <div class="form-group">
            <label>اسم المستخدم (للدخول)</label>
            <input type="text" dir="ltr" value="${escapeHtml(me.username)}" disabled />
          </div>
        </div>
        <div class="form-group">
          <label>نبذتي التعريفية (مفهرسة للبحث السريع بين الفريق)</label>
          <textarea id="self-bio" rows="2" placeholder="اكتب تخصصك أو مهامك في المنصة...">${escapeHtml(me.bio || "")}</textarea>
        </div>
        <button type="submit" class="btn-primary-glass" id="save-self-profile-btn">حفظ ملفي الشخصي</button>
      </form>

      <div class="security-grid">
        <div class="glass-card settings-form-card">
          <h3>الرمز السريع (4 أرقام) والثقة بالمتصفح</h3>
          <p class="helper-hint">حالة المتصفح الحالي: <strong>${isThisTrusted ? (trusted.mode === "pin" ? "موثوق بالرمز السريع" : "موثوق بالدخول المباشر") : "غير موثوق"}</strong></p>

          <form id="pin-update-form" style="margin-top:14px">
            <div class="form-group">
              <label>تعيين أو تغيير الرمز السريع (4 أرقام)</label>
              <input type="password" id="sec-new-pin" maxlength="4" pattern="\\d{4}" inputmode="numeric" required placeholder="أدخل 4 أرقام جديدة" />
            </div>
            <div class="form-actions-inline">
              <button type="submit" class="btn-primary-glass">حفظ الرمز وتفعيل الثقة</button>
              ${isThisTrusted ? `<button type="button" class="tool-btn danger" id="revoke-trust-btn">إلغاء الثقة</button>` : ""}
            </div>
          </form>
        </div>

        <div class="glass-card settings-form-card">
          <h3>تغيير كلمة المرور</h3>
          <form id="pass-update-form" style="margin-top:14px">
            <div class="form-group">
              <label>كلمة المرور الحالية</label>
              <input type="password" id="sec-old-pass" required placeholder="••••••••" />
            </div>
            <div class="form-group">
              <label>كلمة المرور الجديدة</label>
              <input type="password" id="sec-new-pass" required minlength="6" placeholder="6 أحرف أو أرقام فأكثر" />
            </div>
            <button type="submit" class="btn-primary-glass">تحديث كلمة المرور</button>
          </form>
        </div>
      </div>

      ${hasPerm("view_logs") ? `
        <div class="glass-card settings-form-card" style="margin-top: 22px">
          <div class="logs-head-row">
            <h3>سجل النشاطات والعمليات الأخيرة</h3>
            <div class="local-search-box">
              <span>${ICONS.search}</span>
              <input type="search" id="logs-search-input" placeholder="بحث في السجلات..." value="${escapeHtml(state.filters.logSearch)}" />
            </div>
          </div>
          <div id="logs-list-wrap" class="logs-stack"></div>
        </div>
      ` : ""}
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));

  document.getElementById("self-avatar-file")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const statusEl = document.getElementById("self-avatar-status");
    try {
      const url = await uploadCompressedImageToImgBB(file, statusEl, 512);
      document.getElementById("self-avatar-url").value = url;
      document.getElementById("self-avatar-preview").innerHTML = renderAvatarHtml(url, me.displayName || me.username, "lg");
    } catch (err) {
      statusEl.textContent = err.message;
      showToast(err.message, "error");
    }
  });

  document.getElementById("self-profile-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("save-self-profile-btn");
    btn.disabled = true;
    const updates = {
      displayName: document.getElementById("self-display").value.trim(),
      avatarUrl: document.getElementById("self-avatar-url").value.trim(),
      bio: document.getElementById("self-bio").value.trim(),
      updatedAt: new Date().toISOString()
    };
    try {
      await updateDoc(doc(db, "admins", me.id), updates);
      state.currentUser = { ...state.currentUser, ...updates };
      const idx = state.admins.findIndex((a) => a.id === me.id);
      if (idx >= 0) state.admins[idx] = { ...state.admins[idx], ...updates };
      applyAdminBranding();
      await logActivity("تحديث الملف الشخصي", updates.displayName);
      showToast("تم تحديث ملفك الشخصي وصورتك بنجاح ✓");
    } catch {
      showToast("تعذر تحديث الملف الشخصي", "error");
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById("pin-update-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pin = document.getElementById("sec-new-pin").value.trim();
    if (!/^\d{4}$/.test(pin)) { showToast("الرمز يجب أن يكون 4 أرقام بالضبط", "error"); return; }
    const pinHash = await sha256(pin);
    await updateDoc(doc(db, "admins", me.id), { pinHash });
    state.currentUser.pinHash = pinHash;
    setTrustedDevice({ adminId: me.id, username: me.username, mode: "pin", skipPin: false });
    await logActivity("تحديث الرمز السريع", "تم تعيين رمز سريع جديد من 4 أرقام");
    showToast("تم حفظ الرمز السريع وتوثيق المتصفح ✓");
    renderAdminView();
  });

  document.getElementById("revoke-trust-btn")?.addEventListener("click", () => {
    clearTrustedDevice();
    showToast("تم إلغاء الثقة بهذا المتصفح");
    renderAdminView();
  });

  document.getElementById("pass-update-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldP = document.getElementById("sec-old-pass").value;
    const newP = document.getElementById("sec-new-pass").value;
    const oldHash = await sha256(oldP);
    if (oldHash !== state.currentUser.passwordHash) {
      showToast("كلمة المرور الحالية غير صحيحة", "error");
      return;
    }
    const newHash = await sha256(newP);
    await updateDoc(doc(db, "admins", me.id), { passwordHash: newHash });
    state.currentUser.passwordHash = newHash;
    await logActivity("تغيير كلمة المرور", me.username);
    showToast("تم تغيير كلمة المرور بنجاح ✓");
    e.target.reset();
  });

  if (hasPerm("view_logs")) {
    const paintLogs = () => {
      const list = smartFilter(state.logs, state.filters.logSearch, (l) => `${l.actor} ${l.action} ${l.details}`);
      const wrap = document.getElementById("logs-list-wrap");
      if (!list.length) {
        wrap.innerHTML = `<p class="helper-hint">لا توجد سجلات مطابقة.</p>`;
        return;
      }
      wrap.innerHTML = list.map((l) => {
        const matchedAdmin = state.admins.find((a) => a.username === l.actorUsername);
        const av = l.actorAvatar || matchedAdmin?.avatarUrl || "";
        return `
          <div class="log-row">
            <div class="log-actor-wrap">
              ${renderAvatarHtml(av, l.actor, "mini")}
              <div>
                <strong>${escapeHtml(l.action)}</strong> — <span>${escapeHtml(l.details || "")}</span>
              </div>
            </div>
            <small>${escapeHtml(l.actor)} • ${formatDate(l.createdAt)}</small>
          </div>
        `;
      }).join("");
    };
    document.getElementById("logs-search-input")?.addEventListener("input", (e) => {
      state.filters.logSearch = e.target.value;
      paintLogs();
    });
    paintLogs();
  }
}

/* ============================================================================
 * 11. محرك البحث العالمي الذكي داخل غرفة العمليات (يلتقط من نبذ الموظفين أيضاً)
 * ============================================================================ */
function openAdminSpotlight() {
  const modal = document.getElementById("admin-spotlight-modal");
  const input = document.getElementById("admin-spotlight-input");
  if (!modal) return;
  modal.hidden = false;
  setTimeout(() => input?.focus(), 30);
  renderAdminSpotlightResults(input?.value || "");
}

function closeAdminSpotlight() {
  const modal = document.getElementById("admin-spotlight-modal");
  if (modal) modal.hidden = true;
}

function renderAdminSpotlightResults(q) {
  const wrap = document.getElementById("admin-spotlight-results");
  if (!wrap) return;
  if (!q.trim()) {
    wrap.innerHTML = `<div class="spotlight-hint">ابحث في المواد، الاختبارات، أو أي كلمة من نبذة الموظفين (يدعم البحث بدون تشكيل أو همزات)...</div>`;
    return;
  }

  const hits = [];
  if (hasPerm("manage_content")) {
    smartFilter(state.items, q, (it) => `${it.title} ${it.branch} ${it.summary || ""} ${(it.tags || []).join(" ")}`).slice(0, 8).forEach((it) => {
      hits.push({ type: "item", id: it.id, title: it.title, sub: it.branch, tag: "محتوى" });
    });
  }
  if (hasPerm("manage_quizzes")) {
    smartFilter(state.quizzes, q, (qz) => `${qz.title} ${qz.branch} ${qz.description || ""}`).slice(0, 5).forEach((qz) => {
      hits.push({ type: "quiz", id: qz.id, title: qz.title, sub: qz.branch, tag: "اختبار" });
    });
  }
  if (hasPerm("manage_admins")) {
    smartFilter(state.admins, q, (ad) => `${ad.displayName || ""} ${ad.username} ${ad.bio || ""}`).slice(0, 6).forEach((ad) => {
      hits.push({
        type: "admin", id: ad.id,
        title: ad.displayName || ad.username,
        sub: ad.bio || ad.username,
        tag: "موظف"
      });
    });
  }

  if (!hits.length) {
    wrap.innerHTML = `<div class="spotlight-hint">لا توجد نتائج مطابقة لـ "${escapeHtml(q)}"</div>`;
    return;
  }

  wrap.innerHTML = hits.map((h) => `
    <button type="button" class="spotlight-row" data-sp-type="${h.type}" data-sp-id="${h.id}">
      <div class="spotlight-row-main">
        <strong>${escapeHtml(h.title)}</strong>
        <span>${escapeHtml(h.sub || "")}</span>
      </div>
      <span class="pill-badge">${h.tag}</span>
    </button>
  `).join("");

  wrap.querySelectorAll("[data-sp-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeAdminSpotlight();
      const { spType, spId } = btn.dataset;
      if (spType === "item") {
        const it = state.items.find((x) => x.id === spId);
        if (it) openItemEditorModal(it);
      } else if (spType === "quiz") {
        const qz = state.quizzes.find((x) => x.id === spId);
        if (qz) openQuizEditorModal(qz);
      } else if (spType === "admin") {
        const ad = state.admins.find((x) => x.id === spId);
        if (ad) openAdminEditorModal(ad);
      }
    });
  });
}

/* ============================================================================
 * 12. النوافذ المنبثقة ونقطة الانطلاق
 * ============================================================================ */
function openModal(title, bodyHtml, size = "normal") {
  const backdrop = document.getElementById("admin-modal-backdrop");
  const dialog = document.getElementById("admin-modal-dialog");
  document.getElementById("admin-modal-title").textContent = title;
  document.getElementById("admin-modal-body").innerHTML = bodyHtml;
  dialog.className = `admin-modal-dialog ${size}`;
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  clearTimeout(state.draftTimer);
  state.selectedEditorFigure = null;
  document.getElementById("admin-modal-backdrop").hidden = true;
  document.body.style.overflow = "";
}

function initAdminApp() {
  document.getElementById("admin-brand-home")?.addEventListener("click", () => navigateAdmin("hub"));
  document.getElementById("header-spotlight-btn")?.addEventListener("click", openAdminSpotlight);
  document.getElementById("header-logout-btn")?.addEventListener("click", logoutSession);
  document.getElementById("close-admin-modal")?.addEventListener("click", closeModal);
  document.getElementById("close-preview-modal")?.addEventListener("click", closeLivePreviewModal);
  document.getElementById("preview-modal-backdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "preview-modal-backdrop") closeLivePreviewModal();
  });
  document.getElementById("close-admin-spotlight")?.addEventListener("click", closeAdminSpotlight);
  document.getElementById("admin-spotlight-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "admin-spotlight-modal") closeAdminSpotlight();
  });
  document.getElementById("admin-spotlight-input")?.addEventListener("input", (e) => {
    renderAdminSpotlightResults(e.target.value);
  });

  document.addEventListener("keydown", (e) => {
    if (!state.currentUser) return;
    if ((e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) &&
        !document.activeElement?.isContentEditable) {
      e.preventDefault();
      openAdminSpotlight();
    } else if (e.key === "Escape") {
      if (!document.getElementById("preview-modal-backdrop")?.hidden) {
        closeLivePreviewModal();
      } else {
        closeAdminSpotlight();
        closeModal();
      }
    }
  });

  checkInitialAuth();
}

document.addEventListener("DOMContentLoaded", initAdminApp);
