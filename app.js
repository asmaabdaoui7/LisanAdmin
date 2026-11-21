/**
 * ============================================================================
 * لِسَان | LISAN — غرفة العمليات ولوحة التحكم الشاملة (app.js) — الإصدار 3.0
 * ============================================================================
 * 1. تأسيس تلقائي للأدمن الرئيسي (Admin / 123456) بتشفير SHA-256 + الرمز السريع (4 أرقام)
 * 2. شؤون الطلبة والعضويات: مراجعة البطاقة الجامعية السرية + التدرج العادل + الإشعارات الفورية
 * 3. مركز الدعم الفني والتذاكر (بصلاحية موظف دعم مستقلة + بحث ذكي بمعرّف LISAN-XXXXXXXX)
 * 4. محرر الصفحات التعريفية المرنة (من نحن، الرسالة والمنهجية، الخصوصية، وصفحات مخصصة)
 * 5. التحكم الثلاثي بالميزات (on: مفعّل | soon: قريباً | off: مخفي) + سياسات التسجيل والدعم
 * 6. المحرر الأكاديمي الحر للصور + المعاينة الحية + الحفظ التلقائي + مولّد sitemap.xml
 * 7. المرآة الفورية بين المستودعين + ملفات الموظفين (صورة ونبذة وبحث ذكي داخل النبذة)
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
 * 2. مصفوفة الصلاحيات الدقيقة + مفاتيح الميزات الثلاثية + الإعدادات الافتراضية
 * ============================================================================ */
const PERMISSIONS_CATALOG = [
  { key: "manage_content", label: "إضافة وتعديل المحتوى (الكتب، المصطلحات، المحاضرات، الأبحاث)" },
  { key: "delete_content", label: "حذف المواد والمحتوى نهائياً" },
  { key: "approve_submissions", label: "مراجعة واعتماد مساهمات ومشاريع الطلبة" },
  { key: "manage_quizzes", label: "إدارة بنك الاختبارات التفاعلية والأسئلة" },
  { key: "manage_students", label: "إدارة شؤون الطلبة، توثيق الحسابات، التقييد العادل والإشعارات" },
  { key: "manage_support", label: "موظف دعم فني: الرد على تذاكر الدعم ومساعدة المستفيدين" },
  { key: "manage_pages", label: "تعديل وإدارة الصفحات التعريفية (من نحن، المنهجية، الخصوصية)" },
  { key: "manage_sections", label: "تعديل أسماء الأقسام الستة وفروعها وأوصافها" },
  { key: "manage_features", label: "التحكم الثلاثي بميزات وأقسام الموقع (مفعّل / قريباً / مخفي)" },
  { key: "manage_settings", label: "تعديل هوية المنصة، الشعار، الألوان، بيانات الدعم، وخريطة SEO" },
  { key: "manage_admins", label: "إدارة فريق المشرفين ومنح الصلاحيات" },
  { key: "view_logs", label: "الاطلاع على سجل النشاطات والعمليات" }
];

const FEATURE_FLAGS_CATALOG = [
  { key: "studentAccounts", label: "نظام حسابات وعضويات الطلبة", desc: "التسجيل، تسجيل الدخول، وملف الطالب الأكاديمي" },
  { key: "studentPublicGrades", label: "كشف الطالب لدرجاته علناً", desc: "السماح للطالب باختيار إظهار درجاته في ملفه العام بعد التأكيد" },
  { key: "supportChat", label: "مركز ودردشة الدعم الفني", desc: "زر الدعم الفني العائم ونظام التذاكر للزوار وفاقدي الحسابات" },
  { key: "staticPages", label: "الصفحات التعريفية (من نحن، الخصوصية...)", desc: "عرض روابط الصفحات التعريفية في التذييل وإتاحة فتحها" },
  { key: "globalSearch", label: "محرك البحث العالمي الذكي", desc: "إظهار شريط البحث في الرئيسية والشريط العلوي" },
  { key: "statsBar", label: "شريط الإحصائيات الترحيبي", desc: "عرض عدد الأقسام والمواد والاختبارات في الواجهة" },
  { key: "announcements", label: "شريط الإعلانات العلوي", desc: "إظهار شريط التنبيهات العاجلة أعلى المنصة" },
  { key: "sectionLibrary", label: "قسم 1: المكتبة اللسانية", desc: "التحكم بظهور قسم المكتبة اللسانية" },
  { key: "sectionDictionary", label: "قسم 2: المعجم اللساني", desc: "التحكم بظهور قسم المعجم اللساني" },
  { key: "sectionQuiz", label: "قسم 3: اختبر معارفك", desc: "التحكم بظهور قسم الاختبارات التفاعلية" },
  { key: "sectionResearch", label: "قسم 4: فضاء الباحث اللساني", desc: "التحكم بظهور قسم فضاء الباحث والمنهجية" },
  { key: "sectionLectures", label: "قسم 5: محاضرات ودروس", desc: "التحكم بظهور قسم المحاضرات والفيديوهات" },
  { key: "sectionExchange", label: "قسم 6: فضاء التبادل العلمي", desc: "التحكم بظهور قسم التبادل والمشاريع" },
  { key: "studentSubmissions", label: "إرسال مشاريع ومساهمات الطلبة", desc: "زر مشاركة المشاريع في فضاء التبادل العلمي" },
  { key: "externalLinkWarning", label: "تنبيه الأمان للروابط الخارجية", desc: "عرض إشعار تحذيري قبل مغادرة المنصة لرابط خارجي" },
  { key: "fontControls", label: "أزرار تكبير وتصغير الخط", desc: "التحكم بحجم الخط داخل صفحة القراءة الأكاديمية" },
  { key: "warmPaperMode", label: "وضع القراءة الورقي الدافئ (Sepia)", desc: "زر تحويل خلفية المقال إلى لون الورق الكريمي المريح للعين" },
  { key: "shareButtons", label: "زر مشاركة الروابط", desc: "إظهار زر نسخ ومشاركة رابط المادة للزوار" }
];

const STUDENT_STATUS_META = {
  pending_email: { label: "بانتظار تأكيد البريد", tone: "warn" },
  pending_review: { label: "بانتظار المراجعة", tone: "info" },
  approved: { label: "موثق ونشط", tone: "ok" },
  restricted_publish: { label: "مقيّد النشر", tone: "warn" },
  restricted_readonly: { label: "قراءة فقط", tone: "warn" },
  hidden_profile: { label: "ملف عام مخفي", tone: "info" },
  suspended: { label: "معلّق مؤقتاً", tone: "danger" },
  rejected: { label: "يحتاج استكمال بيانات", tone: "danger" }
};

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
  studentIdCardMode: "optional", // optional | required | hidden
  requireLoginForQuiz: false,
  supportContacts: {
    whatsapp: "",
    email: "",
    telegram: "",
    welcomeMessage: "مرحباً بك في مركز الدعم الفني لمنصة لِسَان! اختر نوع المشكلة أو اكتب استفسارك ليتم تحويلك مباشرة إلى الكادر البشري."
  },
  socialLinks: { twitter: "", telegram: "", youtube: "", facebook: "" },
  features: {
    globalSearch: "on",
    sectionLibrary: "on",
    sectionDictionary: "on",
    sectionQuiz: "on",
    sectionResearch: "on",
    sectionLectures: "on",
    sectionExchange: "on",
    externalLinkWarning: "on",
    fontControls: "on",
    warmPaperMode: "on",
    shareButtons: "on",
    announcements: "on",
    statsBar: "on",
    studentSubmissions: "on",
    studentAccounts: "on",
    studentPublicGrades: "on",
    supportChat: "on",
    staticPages: "on"
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

const DEFAULT_PAGES = [
  {
    id: "about", slug: "about", order: 1, visible: true,
    title: "من نحن",
    subtitle: "تعرف على منصة لِسَان | LISAN ورؤيتها الأكاديمية",
    bodyHtml: `<h2>عن منصة لِسَان | LISAN</h2><p>منصة <strong>لِسَان</strong> هي فضاء رقمي أكاديمي متخصص صُمم خصيصاً لطلبة وباحثي اللسانيات العربية، بهدف جمع المعرفة اللسانية الموثوقة في بيئة هادئة ومنظمة.</p>`
  },
  {
    id: "methodology", slug: "methodology", order: 2, visible: true,
    title: "الرسالة والمنهجية",
    subtitle: "ضوابط النشر العلمي وتوثيق العضويات في المنصة",
    bodyHtml: `<h2>منهجيتنا العلمية</h2><p>نعتمد على المراجعة التحريرية الدقيقة للمواد المنشورة، ويخضع كل حساب طالب لتحقق مزدوج يحمي موثوقية المجتمع الأكاديمي.</p>`
  },
  {
    id: "privacy", slug: "privacy", order: 3, visible: true,
    title: "الخصوصية وشروط الاستخدام",
    subtitle: "كيف نحمي بياناتك الأكاديمية وضوابط المشاركة العادلة",
    bodyHtml: `<h2>حماية الخصوصية</h2><p>لا يظهر البريد الإلكتروني أو صورة البطاقة الجامعية أو سجل الدرجات للزوار إطلاقاً، ولا يُكشف سجل الدرجات إلا بموافقة الطالب الصريحة.</p>`
  }
];

/* ============================================================================
 * 3. الحالة المركزية لغرفة العمليات (State)
 * ============================================================================ */
const state = {
  currentUser: null,
  view: "hub", // hub | content | quizzes | submissions | students | support | pages | sections | features | settings | admins | security
  settings: structuredClone(DEFAULT_SETTINGS),
  pages: structuredClone(DEFAULT_PAGES),
  items: [],
  quizzes: [],
  students: [],
  tickets: [],
  admins: [],
  logs: [],
  filters: {
    contentSection: "الكل",
    contentStatus: "الكل",
    contentSearch: "",
    quizSearch: "",
    studentTab: "pending_review", // pending_review | approved | restricted | pending_email | all
    studentSearch: "",
    ticketTab: "open", // open | answered | closed | all
    ticketSearch: "",
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
  student: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  support: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  fileText: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
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
 * 5. التشفير، البحث العربي الذكي، الأفاتار، وضغط الصور لـ ImgBB
 * ============================================================================ */
async function sha256(text) {
  const data = new TextEncoder().encode(String(text));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
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

function normalizeFeatureVal(v) {
  if (v === false || v === "off") return "off";
  if (v === "soon") return "soon";
  return "on";
}

function showToast(msg, type = "default") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `glass-toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.classList.add("show"), 20);
  setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 300); }, 3600);
}

function formatDate(val) {
  if (!val) return "—";
  try {
    const d = typeof val.toDate === "function" ? val.toDate() : new Date(val);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(d);
  } catch { return "—"; }
}

function renderAvatarHtml(url, fallbackName = "A", extraClass = "") {
  const letter = escapeHtml((fallbackName || "A").trim()[0] || "A");
  if (url) return `<img src="${escapeHtml(url)}" alt="${escapeHtml(fallbackName)}" class="avatar-img ${extraClass}" />`;
  return `<div class="avatar-placeholder ${extraClass}">${letter}</div>`;
}

async function compressImageToBase64(file, maxWidth = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر قراءة ملف الصورة"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("ملف الصورة غير صالح"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadCompressedImageToImgBB(file, statusEl = null, maxWidth = 1400) {
  if (!file) throw new Error("لم يتم اختيار صورة");
  if (statusEl) statusEl.textContent = "جارٍ ضغط الصورة...";
  const base64 = await compressImageToBase64(file, maxWidth, 0.82);
  if (statusEl) statusEl.textContent = "جارٍ الرفع إلى ImgBB...";
  const fd = new FormData();
  fd.append("image", base64);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok || !json?.success || !json?.data?.url) throw new Error(json?.error?.message || "فشل رفع الصورة");
  if (statusEl) statusEl.textContent = "تم الضغط والرفع بنجاح ✓";
  return json.data.url;
}

/* ============================================================================
 * 6. المرآة الفورية + السجلات + إرسال إشعار فوري للطالب + تأسيس الأدمن
 * ============================================================================ */
function applyAdminBranding() {
  const s = state.settings;
  if (s.themeAccent) {
    document.documentElement.style.setProperty("--accent", s.themeAccent);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", s.themeAccent);
  }
  const brandTitle = document.getElementById("admin-brand-title");
  if (brandTitle) brandTitle.textContent = `عمليات ${s.siteName || "لِسَان"}`;

  const logoWrap = document.getElementById("admin-logo-wrap");
  if (logoWrap) {
    if (s.logoUrl) {
      logoWrap.innerHTML = `<img src="${escapeHtml(s.logoUrl)}" alt="${escapeHtml(s.siteName)}" class="brand-logo-img" />`;
      document.querySelector('link[rel="icon"]')?.setAttribute("href", s.logoUrl);
    } else {
      logoWrap.textContent = (s.siteName || "ل").trim()[0] || "ل";
    }
  }

  if (state.currentUser) {
    const userNameEl = document.getElementById("current-admin-name");
    const userAvatarEl = document.getElementById("current-admin-avatar");
    if (userNameEl) userNameEl.textContent = state.currentUser.displayName || state.currentUser.username;
    if (userAvatarEl) {
      userAvatarEl.innerHTML = renderAvatarHtml(
        state.currentUser.avatarUrl,
        state.currentUser.displayName || state.currentUser.username,
        "mini"
      );
    }
  }
}

async function sendStudentNotification(studentUid, { type = "info", title, message }) {
  if (!studentUid) return;
  try {
    await addDoc(collection(db, "notifications"), {
      studentUid,
      type,
      title,
      message,
      read: false,
      actor: state.currentUser?.displayName || state.currentUser?.username || "الإدارة",
      createdAt: new Date().toISOString(),
      ts: serverTimestamp()
    });
  } catch (e) {
    console.warn("Notification failed:", e);
  }
}

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
  const snap = await getDocs(collection(db, "admins"));
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
 * 7. نظام المصادقة لغرفة العمليات (كلمة المرور + المتصفح الموثوق + PIN)
 * ============================================================================ */
function getTrustedDevice() {
  try { return JSON.parse(localStorage.getItem(TRUST_STORAGE_KEY) || "null"); } catch { return null; }
}
function setTrustedDevice(data) { localStorage.setItem(TRUST_STORAGE_KEY, JSON.stringify(data)); }
function clearTrustedDevice() { localStorage.removeItem(TRUST_STORAGE_KEY); }

async function findAdminByUsername(username) {
  const lower = String(username || "").trim().toLowerCase();
  if (!lower) return null;
  const snap = await getDocs(query(collection(db, "admins"), where("usernameLower", "==", lower)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

async function checkInitialAuth() {
  const authScreen = document.getElementById("auth-screen");
  const adminApp = document.getElementById("admin-app");

  try {
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
    showToast("تحقق من قواعد أمان Firestore أو اتصال الإنترنت", "error");
  }

  adminApp.hidden = true;
  authScreen.hidden = false;
  renderPasswordLoginView();
}

function getAuthBadgeHtml() {
  if (state.settings.logoUrl) return `<div class="auth-brand-badge has-img"><img src="${escapeHtml(state.settings.logoUrl)}" alt="" /></div>`;
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
      ${isPinReset ? "أدخل اسم المستخدم وكلمة المرور لتعيين رمز سريع جديد من 4 أرقام." : "سجّل الدخول بحسابك الإداري لإدارة المنصة بالكامل."}
    </p>

    <form id="password-login-form" class="auth-form">
      <div class="form-group">
        <label for="login-username">اسم المستخدم</label>
        <input type="text" id="login-username" required autocomplete="username" value="${escapeHtml(prefillUsername)}" placeholder="أدخل اسم المستخدم" />
      </div>
      <div class="form-group">
        <label for="login-password">كلمة المرور</label>
        <input type="password" id="login-password" required autocomplete="current-password" placeholder="••••••••" />
      </div>
      ${isPinReset ? `
        <div class="form-group">
          <label for="reset-new-pin">الرمز السريع الجديد (4 أرقام)</label>
          <input type="password" id="reset-new-pin" required pattern="\\d{4}" maxlength="4" inputmode="numeric" placeholder="مثال: 2026" />
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
      if (trusted?.adminId === admin.id) await completeLogin(admin, true);
      else renderTrustBrowserPrompt(admin);
    } catch (err) {
      console.error(err);
      errEl.textContent = err?.code === "permission-denied"
        ? "رفضت قواعد أمان Firestore الاتصال (تحقق من تبويب Rules)."
        : "تعذر الاتصال بـ Firebase، تحقق من الإنترنت.";
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
    <p class="auth-subtitle">أهلاً <strong>${escapeHtml(admin.displayName || admin.username)}</strong>! الوثوق بالمتصفح يسهّل دخولك القادم بأمان.</p>
    <div class="trust-options-stack">
      <div class="trust-option-card">
        <strong>1. الوثوق مع الرمز السريع (4 أرقام) — الأعلى أماناً</strong>
        <p>${admin.pinHash ? "ستستخدم رمزك السريع المسجل للدخول الفوري." : "عيّن رمزاً سريعاً من 4 أرقام للدخول السريع:"}</p>
        ${!admin.pinHash ? `<input type="password" id="setup-pin-input" maxlength="4" inputmode="numeric" placeholder="أدخل 4 أرقام" class="pin-inline-input" />` : ""}
        <button type="button" class="btn-primary-glass full-width" id="trust-with-pin-btn">الوثوق بالمتصفح عبر الرمز السريع</button>
      </div>
      <button type="button" class="tool-btn full-width" id="trust-direct-btn">الوثوق والدخول المباشر التلقائي (بدون رمز)</button>
      <button type="button" class="text-link-btn" id="skip-trust-btn">لا، الدخول لهذه الجلسة فقط</button>
    </div>
  `;

  document.getElementById("trust-with-pin-btn")?.addEventListener("click", async () => {
    if (!admin.pinHash) {
      const pinVal = document.getElementById("setup-pin-input")?.value.trim() || "";
      if (!/^\d{4}$/.test(pinVal)) { showToast("أدخل رمزاً من 4 أرقام صحيحة", "error"); return; }
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

  document.getElementById("skip-trust-btn")?.addEventListener("click", async () => completeLogin(admin, true));
}

function renderPinLoginView(admin) {
  const box = document.getElementById("auth-card-content");
  let pinDigits = "";
  box.innerHTML = `
    <div class="pin-user-avatar">${renderAvatarHtml(admin.avatarUrl, admin.displayName || admin.username, "lg")}</div>
    <h2 class="auth-title">أهلاً بعودتك، ${escapeHtml(admin.displayName || admin.username)}</h2>
    <p class="auth-subtitle">أدخل الرمز السريع المكوّن من 4 أرقام للدخول الفوري</p>
    <div class="pin-dots-row"><span class="pin-dot"></span><span class="pin-dot"></span><span class="pin-dot"></span><span class="pin-dot"></span></div>
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

  const updateDots = () => box.querySelectorAll(".pin-dot").forEach((d, i) => d.classList.toggle("filled", i < pinDigits.length));
  const tryVerifyPin = async () => {
    const errEl = document.getElementById("pin-error-msg");
    if ((await sha256(pinDigits)) === admin.pinHash) await completeLogin(admin, true);
    else { errEl.textContent = "الرمز السريع غير صحيح، حاول مجدداً."; errEl.hidden = false; pinDigits = ""; updateDots(); }
  };
  const pushDigit = (digit) => {
    if (pinDigits.length >= 4) return;
    document.getElementById("pin-error-msg").hidden = true;
    pinDigits += digit;
    updateDots();
    if (pinDigits.length === 4) setTimeout(tryVerifyPin, 120);
  };

  box.querySelectorAll("[data-digit]").forEach((b) => b.addEventListener("click", () => pushDigit(b.dataset.digit)));
  document.getElementById("pin-clear-btn")?.addEventListener("click", () => { pinDigits = ""; updateDots(); });
  document.getElementById("pin-back-btn")?.addEventListener("click", () => { pinDigits = pinDigits.slice(0, -1); updateDots(); });

  const keyHandler = (e) => {
    if (document.getElementById("auth-screen").hidden) { document.removeEventListener("keydown", keyHandler); return; }
    if (/^\d$/.test(e.key)) pushDigit(e.key);
    else if (e.key === "Backspace") { pinDigits = pinDigits.slice(0, -1); updateDots(); }
  };
  document.addEventListener("keydown", keyHandler);

  document.getElementById("forgot-pin-btn")?.addEventListener("click", () => { document.removeEventListener("keydown", keyHandler); renderPasswordLoginView(admin.username, "reset-pin"); });
  document.getElementById("switch-account-btn")?.addEventListener("click", () => { document.removeEventListener("keydown", keyHandler); clearTrustedDevice(); renderPasswordLoginView(); });
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
 * 8. جلب جميع البيانات الحية من Firestore
 * ============================================================================ */
function deepMergeSettings(remote = {}) {
  const merged = structuredClone(DEFAULT_SETTINGS);
  Object.keys(remote).forEach((k) => {
    if (k === "features" && remote.features) {
      Object.keys(remote.features).forEach((fk) => { merged.features[fk] = normalizeFeatureVal(remote.features[fk]); });
    } else if (k === "socialLinks" && remote.socialLinks) {
      merged.socialLinks = { ...merged.socialLinks, ...remote.socialLinks };
    } else if (k === "supportContacts" && remote.supportContacts) {
      merged.supportContacts = { ...merged.supportContacts, ...remote.supportContacts };
    } else if (k === "sectionsMeta" && remote.sectionsMeta) {
      Object.keys(remote.sectionsMeta).forEach((sId) => {
        if (merged.sectionsMeta[sId]) merged.sectionsMeta[sId] = { ...merged.sectionsMeta[sId], ...remote.sectionsMeta[sId] };
      });
    } else if (remote[k] !== undefined) {
      merged[k] = remote[k];
    }
  });
  return merged;
}

async function loadAllAdminData() {
  const [setSnap, pagesSnap, itemsSnap, quizzesSnap, studentsSnap, ticketsSnap, adminsSnap, logsSnap] = await Promise.allSettled([
    getDoc(doc(db, "settings", "global")),
    getDocs(collection(db, "pages")),
    getDocs(query(collection(db, "items"), orderBy("createdAt", "desc"))),
    getDocs(query(collection(db, "quizzes"), orderBy("createdAt", "desc"))),
    getDocs(collection(db, "students")),
    getDocs(collection(db, "tickets")),
    getDocs(collection(db, "admins")),
    getDocs(query(collection(db, "logs"), orderBy("createdAt", "desc"), limit(80)))
  ]);

  if (setSnap.status === "fulfilled" && setSnap.value.exists()) {
    state.settings = deepMergeSettings(setSnap.value.data());
  }
  if (pagesSnap.status === "fulfilled" && !pagesSnap.value.empty) {
    const rMap = new Map(pagesSnap.value.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
    const merged = DEFAULT_PAGES.map((dp) => rMap.has(dp.id) ? { ...dp, ...rMap.get(dp.id) } : dp);
    pagesSnap.value.docs.forEach((d) => { if (!DEFAULT_PAGES.some((dp) => dp.id === d.id)) merged.push({ id: d.id, ...d.data() }); });
    state.pages = merged.sort((a, b) => (a.order || 99) - (b.order || 99));
  }
  if (itemsSnap.status === "fulfilled") state.items = itemsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (quizzesSnap.status === "fulfilled") state.quizzes = quizzesSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (studentsSnap.status === "fulfilled") {
    state.students = studentsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }
  if (ticketsSnap.status === "fulfilled") {
    state.tickets = ticketsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));
  }
  if (adminsSnap.status === "fulfilled") state.admins = adminsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (logsSnap.status === "fulfilled") state.logs = logsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));

  applyAdminBranding();
}

/* ============================================================================
 * 9. التنقل بالكشف التدريجي (الكراتين المرتبة — Hub Grid)
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
    case "students": return renderStudentsManager(main);
    case "support": return renderSupportDesk(main);
    case "pages": return renderPagesManager(main);
    case "sections": return renderSectionsManager(main);
    case "features": return renderFeaturesManager(main);
    case "settings": return renderSettingsManager(main);
    case "admins": return renderAdminsManager(main);
    case "security": return renderSecurityAndLogs(main);
    default: return renderHubView(main);
  }
}

function renderHubView(container) {
  const pendingSubs = state.items.filter((x) => x.status === "pending").length;
  const publishedItems = state.items.filter((x) => !x.status || x.status === "published").length;
  const pendingStudents = state.students.filter((s) => s.status === "pending_review").length;
  const openTickets = state.tickets.filter((t) => t.status === "open").length;

  const boxes = [
    {
      id: "students", perm: "manage_students", icon: ICONS.student, accent: "#0284c7",
      title: "شؤون الطلبة والعضويات",
      desc: "مراجعة البطاقات الأكاديمية، توثيق العضويات، التقييد العادل، وإرسال الإشعارات.",
      badge: pendingStudents > 0 ? `${pendingStudents} للمراجعة` : `${state.students.length} طالب`,
      highlight: pendingStudents > 0
    },
    {
      id: "support", perm: "manage_support", icon: ICONS.support, accent: "#059669",
      title: "الدعم الفني والتذاكر",
      desc: "الرد على تذاكر الطلبة وفاقدي الحسابات والبحث الفوري برقم التذكرة الموحّد.",
      badge: openTickets > 0 ? `${openTickets} مفتوحة` : `${state.tickets.length} تذكرة`,
      highlight: openTickets > 0
    },
    {
      id: "content", perm: "manage_content", icon: ICONS.content, accent: "#0071e3",
      title: "إدارة المحتوى",
      desc: "نشر وتعديل الكتب، المصطلحات، المحاضرات، الصور الحرة، وملفات PDF.",
      badge: `${publishedItems} منشور`
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
      desc: "مراجعة المشاريع المرسلة من الطلبة واعتمادها للنشر مع إشعار صاحبها.",
      badge: pendingSubs > 0 ? `${pendingSubs} معلق` : "لا معلقات",
      highlight: pendingSubs > 0
    },
    {
      id: "pages", perm: "manage_pages", icon: ICONS.fileText, accent: "#7c3aed",
      title: "الصفحات التعريفية",
      desc: "تعديل صفحات (من نحن، الرسالة والمنهجية، الخصوصية) أو إنشاء صفحات جديدة.",
      badge: `${state.pages.length} صفحات`
    },
    {
      id: "sections", perm: "manage_sections", icon: ICONS.layers, accent: "#c88a2e",
      title: "الأقسام والفروع",
      desc: "تعديل مسميات الأقسام الستة وأوصافها وألوانها وفروعها الداخلية.",
      badge: "6 أقسام"
    },
    {
      id: "features", perm: "manage_features", icon: ICONS.sliders, accent: "#8b5cf6",
      title: "مفاتيح الميزات (ثلاثي)",
      desc: "تفعيل، إخفاء، أو وضع (قريباً) لأي قسم أو ميزة بما فيها كشف الدرجات.",
      badge: "تحكم ثلاثي"
    },
    {
      id: "settings", perm: "manage_settings", icon: ICONS.palette, accent: "#5e5ce6",
      title: "الهوية والدعم والسيو",
      desc: "الشعار، اللون، قنوات الدعم (واتساب/بريد)، سياسة التسجيل، ومولّد sitemap.xml.",
      badge: "الإعدادات"
    },
    {
      id: "admins", perm: "manage_admins", icon: ICONS.users, accent: "#db2777",
      title: "فريق الإدارة والدعم",
      desc: "إضافة مشرفين وموظفي دعم بصورهم ونبذهم وصلاحيات محددة بالاختيار.",
      badge: `${state.admins.length} موظف`
    },
    {
      id: "security", perm: null, icon: ICONS.shield, accent: "#1e293b",
      title: "حسابي والسجلات",
      desc: "صورتي ونبذتي، الرمز السريع (4 أرقام)، كلمة المرور، وسجل النشاطات.",
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
            <p>${escapeHtml(state.currentUser.bio || "كل قسم مرتّب داخل صندوقه الخاص للوصول السريع والهادئ.")}</p>
          </div>
        </div>
        <button type="button" class="hero-search-trigger" id="hub-open-spotlight">
          <span>${ICONS.search}</span>
          <span>بحث ذكي: تذكرة LISAN-، طالب، محتوى، موظف...</span>
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
            <div class="hub-box-footer"><span>فتح</span><span>${ICONS.arrowLeft}</span></div>
          </article>
        `).join("")}
      </section>
    </div>
  `;

  container.querySelectorAll("[data-nav-box]").forEach((el) => {
    const go = () => navigateAdmin(el.dataset.navBox);
    el.addEventListener("click", go);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  document.getElementById("hub-open-spotlight")?.addEventListener("click", openAdminSpotlight);
}

function renderSubHeader(title, subtitle, extraBtnHtml = "") {
  return `
    <div class="sub-page-top">
      <button type="button" class="crumb-btn" id="back-to-hub">${ICONS.arrowRight} الرئيسية (الصناديق)</button>
      <div class="sub-banner glass-card heritage-frame">
        <div><h1>${title}</h1><p>${subtitle}</p></div>
        ${extraBtnHtml}
      </div>
    </div>
  `;
}

/* ============================================================================
 * 10. صندوق شؤون الطلبة والعضويات (التوثيق + البطاقة السرية + التدرج العادل)
 * ============================================================================ */
function renderStudentsManager(container) {
  if (!hasPerm("manage_students")) return navigateAdmin("hub");

  const counts = {
    pending_review: state.students.filter((s) => s.status === "pending_review").length,
    approved: state.students.filter((s) => s.status === "approved").length,
    restricted: state.students.filter((s) => ["restricted_publish", "restricted_readonly", "hidden_profile", "suspended", "rejected"].includes(s.status)).length,
    pending_email: state.students.filter((s) => s.status === "pending_email").length,
    all: state.students.length
  };

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "شؤون الطلبة وتوثيق العضويات",
        "راجع البطاقات الجامعية السرية، وثّق الطلبة الحقيقيين، وأدر التقييدات بعدالة وشفافية مع إشعارات فورية."
      )}

      <div class="light-guide-bar">
        💡 <strong>توجيه:</strong> لا تنتقل الطلبات لتبويب «بانتظار المراجعة» إلا بعد تأكيد الطالب لبريده الإلكتروني (أو دخوله عبر Google). كل إجراء تتخذه يصل فوراً لإشعارات الطالب.
      </div>

      <div class="glass-panel filter-toolbar">
        <div class="filter-pills">
          <button type="button" class="filter-tab ${state.filters.studentTab === "pending_review" ? "active" : ""}" data-st-tab="pending_review">بانتظار المراجعة (${counts.pending_review})</button>
          <button type="button" class="filter-tab ${state.filters.studentTab === "approved" ? "active" : ""}" data-st-tab="approved">موثقون (${counts.approved})</button>
          <button type="button" class="filter-tab ${state.filters.studentTab === "restricted" ? "active" : ""}" data-st-tab="restricted">مقيّدون / معلّقون (${counts.restricted})</button>
          <button type="button" class="filter-tab ${state.filters.studentTab === "pending_email" ? "active" : ""}" data-st-tab="pending_email">لم يؤكد البريد (${counts.pending_email})</button>
          <button type="button" class="filter-tab ${state.filters.studentTab === "all" ? "active" : ""}" data-st-tab="all">الكل (${counts.all})</button>
        </div>
        <div class="local-search-box">
          <span>${ICONS.search}</span>
          <input type="search" id="student-search-input" placeholder="بحث بالاسم، الجامعة، التخصص، البريد..." value="${escapeHtml(state.filters.studentSearch)}" />
        </div>
      </div>

      <div id="students-list-wrap" class="admin-list-stack"></div>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));

  const paint = () => {
    let list = state.students;
    const t = state.filters.studentTab;
    if (t === "pending_review") list = list.filter((s) => s.status === "pending_review");
    else if (t === "approved") list = list.filter((s) => s.status === "approved");
    else if (t === "pending_email") list = list.filter((s) => s.status === "pending_email");
    else if (t === "restricted") list = list.filter((s) => ["restricted_publish", "restricted_readonly", "hidden_profile", "suspended", "rejected"].includes(s.status));

    list = smartFilter(list, state.filters.studentSearch, (s) =>
      `${s.fullName || ""} ${s.email || ""} ${s.university || ""} ${s.major || ""} ${s.level || ""} ${s.bio || ""}`
    );

    const wrap = document.getElementById("students-list-wrap");
    if (!list.length) {
      wrap.innerHTML = `<div class="glass-card empty-state"><p>لا توجد حسابات طلبة في هذا التبويب حالياً.</p></div>`;
      return;
    }

    wrap.innerHTML = list.map((st) => {
      const meta = STUDENT_STATUS_META[st.status] || { label: st.status, tone: "info" };
      return `
        <div class="glass-card admin-row-card">
          ${renderAvatarHtml(st.avatarUrl, st.fullName, "md")}
          <div class="row-main">
            <div class="row-badges">
              <span class="status-dot tone-${meta.tone}">${meta.label}</span>
              ${st.emailVerified ? `<span class="pill-badge">بريد مؤكَّد ✓</span>` : `<span class="pill-badge neutral">بريد غير مؤكد</span>`}
              ${st.isEduEmail ? `<span class="pill-badge edu">بريد جامعي</span>` : ""}
              ${st.idCardUrl ? `<span class="pill-badge neutral">مرفق بطاقة جامعية</span>` : ""}
            </div>
            <h3>${escapeHtml(st.fullName || "طالب")}</h3>
            <p>${escapeHtml(st.university || "—")} • ${escapeHtml(st.major || "—")} (${escapeHtml(st.level || "—")})</p>
            <p class="admin-meta-line" dir="ltr" style="text-align:right">${escapeHtml(st.email || "")} • سجل في ${formatDate(st.createdAt)}</p>
          </div>
          <div class="row-actions">
            ${st.status === "pending_review" ? `<button type="button" class="btn-primary-glass" data-quick-approve="${st.id}">اعتماد سريع</button>` : ""}
            <button type="button" class="tool-btn" data-manage-student="${st.id}">${ICONS.shield} مراجعة وإجراءات</button>
          </div>
        </div>
      `;
    }).join("");

    wrap.querySelectorAll("[data-quick-approve]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const st = state.students.find((x) => x.id === btn.dataset.quickApprove);
        if (!st) return;
        await applyStudentAction(st, "approved", "تم التحقق من بياناتك الأكاديمية وتوثيق عضويتك بنجاح في منصة لِسَان!");
        paint();
      });
    });

    wrap.querySelectorAll("[data-manage-student]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const st = state.students.find((x) => x.id === btn.dataset.manageStudent);
        if (st) openStudentManagementModal(st);
      });
    });
  };

  container.querySelectorAll("[data-st-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filters.studentTab = btn.dataset.stTab;
      container.querySelectorAll("[data-st-tab]").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      paint();
    });
  });

  document.getElementById("student-search-input")?.addEventListener("input", (e) => {
    state.filters.studentSearch = e.target.value;
    paint();
  });

  paint();
}

async function applyStudentAction(st, nextStatus, reasonText, isWarningOnly = false) {
  const now = new Date().toISOString();
  const titleMap = {
    approved: "تم توثيق وتفعيل حسابك بالكامل",
    restricted_publish: "تنبيه: تقييد النشر والمساهمات مؤقتاً",
    restricted_readonly: "تنبيه: تحويل الحساب لوضع القراءة فقط مؤقتاً",
    hidden_profile: "ملاحظة: تم إخفاء ملفك الشخصي العام مؤقتاً",
    suspended: "إشعار: تعليق مؤقت للحساب",
    rejected: "ملاحظة: يرجى استكمال بيانات التوثيق",
    pending_review: "تمت إعادة حسابك للمراجعة الأكاديمية",
    warning: "تنبيه / تحذير ودي من إدارة المنصة"
  };
  const notifType = isWarningOnly ? "warning"
    : nextStatus === "approved" ? "success"
      : ["suspended", "rejected"].includes(nextStatus) ? "danger" : "warning";

  if (!isWarningOnly) {
    await updateDoc(doc(db, "students", st.id), {
      status: nextStatus,
      statusReason: reasonText || "",
      updatedAt: now
    });
    st.status = nextStatus;
    st.statusReason = reasonText || "";
  }

  await sendStudentNotification(st.uid || st.id, {
    type: notifType,
    title: titleMap[isWarningOnly ? "warning" : nextStatus] || "إشعار إداري",
    message: reasonText || "تم تحديث حالة حسابك من قِبل الإدارة."
  });

  await logActivity(isWarningOnly ? "تحذير ودي لطالب" : `تغيير حالة طالب (${nextStatus})`, `${st.fullName} (${st.email})`);
  showToast(isWarningOnly ? "تم إرسال التنبيه الودي إلى صندوق إشعارات الطالب ✓" : "تم تطبيق الإجراء وإشعار الطالب فوراً ✓");
}

async function openStudentManagementModal(st) {
  const meta = STUDENT_STATUS_META[st.status] || { label: st.status, tone: "info" };
  let results = [];
  try {
    const rSnap = await getDocs(query(collection(db, "quizResults"), where("studentUid", "==", st.uid || st.id)));
    results = rSnap.docs.map((d) => d.data()).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } catch {}

  openModal(`ملف الطالب: ${st.fullName}`, `
    <div class="student-modal-summary">
      ${renderAvatarHtml(st.avatarUrl, st.fullName, "lg")}
      <div style="flex:1">
        <div class="row-badges">
          <span class="status-dot tone-${meta.tone}">${meta.label}</span>
          ${st.emailVerified ? `<span class="pill-badge">البريد مؤكَّد ✓</span>` : `<span class="pill-badge neutral">بريد غير مؤكَّد</span>`}
          ${st.isEduEmail ? `<span class="pill-badge edu">بريد جامعي</span>` : ""}
          <span class="pill-badge neutral">${st.authProvider === "google" ? "دخول Google" : "بريد وكلمة مرور"}</span>
        </div>
        <h3 style="margin:6px 0 4px">${escapeHtml(st.fullName)}</h3>
        <p style="margin:0; font-size:0.86rem; color:var(--text-secondary)">${escapeHtml(st.university || "—")} • ${escapeHtml(st.major || "—")} (${escapeHtml(st.level || "—")})</p>
        <p style="margin:4px 0 0; font-size:0.82rem; color:var(--text-muted)" dir="ltr">${escapeHtml(st.email)}</p>
        ${st.bio ? `<p class="admin-bio-line">${escapeHtml(st.bio)}</p>` : ""}
      </div>
    </div>

    ${st.idCardUrl ? `
      <div class="idcard-secret-box">
        <div class="idcard-secret-head">
          <strong>🔒 البطاقة الجامعية / شهادة التسجيل (سرية للإدارة فقط)</strong>
          <div class="form-actions-inline">
            <a href="${escapeHtml(st.idCardUrl)}" target="_blank" rel="noopener noreferrer" class="tool-btn">فتح بحجم كامل</a>
            <button type="button" class="tool-btn danger" id="purge-idcard-btn">حذف الوثيقة للخصوصية</button>
          </div>
        </div>
        <img src="${escapeHtml(st.idCardUrl)}" alt="وثيقة الطالب" class="idcard-preview-img" />
      </div>
    ` : `<p class="helper-hint">لم يرفق الطالب صورة بطاقة جامعية.</p>`}

    <div class="fair-actions-panel">
      <h4 style="margin:0 0 8px">إجراءات الإدارة المرنة والعادلة (يصل إشعار فوري للطالب)</h4>
      <div class="form-group">
        <label>الإجراء المطلوب</label>
        <select id="st-action-select">
          <option value="approved">✓ اعتماد وتوثيق الحساب / رفع التقييد بالكامل</option>
          <option value="warning_only">💬 إرسال تنبيه أو تحذير ودي (يبقى الحساب نشطاً بالكامل)</option>
          <option value="restricted_publish">✋ تقييد النشر والمساهمات مؤقتاً (يسمح بالقراءة والاختبارات)</option>
          <option value="restricted_readonly">👁 تحويل الحساب لوضع القراءة فقط مؤقتاً</option>
          <option value="hidden_profile">🕶 إخفاء الملف الشخصي العام عن الزوار (يبقى نشطاً داخلياً)</option>
          <option value="pending_review">🔄 إعادة الحساب لقائمة المراجعة</option>
          <option value="rejected">📝 طلب استكمال أو تصحيح بيانات التوثيق</option>
          <option value="suspended">⛔ تعليق مؤقت للحساب</option>
        </select>
      </div>
      <div class="form-group">
        <label>الرسالة التوضيحية للطالب (تظهر له في صندوق الإشعارات والسبب)</label>
        <textarea id="st-action-reason" rows="2" placeholder="اكتب سبباً واضحاً وعادلاً أو رسالة ترحيبية للطالب...">${escapeHtml(st.statusReason || "")}</textarea>
      </div>
      <button type="button" class="btn-primary-glass full-width" id="apply-st-action-btn">تطبيق الإجراء وإرسال الإشعار</button>
    </div>

    ${results.length ? `
      <div style="margin-top:18px">
        <h4 style="margin:0 0 8px">سجل درجات الطالب في الاختبارات (${results.length})</h4>
        <div class="logs-stack" style="max-height:180px">
          ${results.map((r) => `
            <div class="log-row">
              <strong>${escapeHtml(r.quizTitle)}</strong>
              <span><strong>${r.percentage}%</strong> (${r.score}/${r.total}) • ${formatDate(r.createdAt)}</span>
            </div>
          `).join("")}
        </div>
      </div>
    ` : ""}
  `, "wide");

  document.getElementById("purge-idcard-btn")?.addEventListener("click", async () => {
    if (!confirm("هل تحققت من الطالب وتريد حذف صورة بطاقته الجامعية حفظاً لخصوصيته؟")) return;
    await updateDoc(doc(db, "students", st.id), { idCardUrl: "" });
    st.idCardUrl = "";
    await logActivity("حذف بطاقة طالب للخصوصية", st.fullName);
    showToast("تم حذف صورة الوثيقة من السجل بنجاح ✓");
    openStudentManagementModal(st);
  });

  document.getElementById("apply-st-action-btn")?.addEventListener("click", async () => {
    const actionVal = document.getElementById("st-action-select").value;
    const reason = document.getElementById("st-action-reason").value.trim();
    const isWarn = actionVal === "warning_only";
    if (!reason && actionVal !== "approved") {
      showToast("يرجى كتابة سبب أو رسالة توضيحية عادلة للطالب قبل التنفيذ", "error");
      return;
    }
    const btn = document.getElementById("apply-st-action-btn");
    btn.disabled = true;
    await applyStudentAction(st, isWarn ? st.status : actionVal, reason || "تم توثيق وتفعيل حسابك بنجاح في منصة لِسَان!", isWarn);
    closeModal();
    renderAdminView();
  });
}

/* ============================================================================
 * 11. صندوق الدعم الفني والتذاكر (موظف الدعم + بحث ذكي بـ LISAN-XXXXXXXX)
 * ============================================================================ */
function renderSupportDesk(container) {
  if (!hasPerm("manage_support")) return navigateAdmin("hub");

  const cOpen = state.tickets.filter((t) => t.status === "open").length;
  const cAns = state.tickets.filter((t) => t.status === "answered").length;
  const cClosed = state.tickets.filter((t) => t.status === "closed").length;

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "مركز الدعم الفني وتذاكر المستفيدين",
        "تابع مشكلات الطلبة وفاقدي الحسابات وردّ عليهم مباشرة. البحث يلتقط رقم التذكرة الموحّد فوراً."
      )}

      <div class="glass-panel filter-toolbar">
        <div class="filter-pills">
          <button type="button" class="filter-tab ${state.filters.ticketTab === "open" ? "active" : ""}" data-tk-tab="open">مفتوحة (${cOpen})</button>
          <button type="button" class="filter-tab ${state.filters.ticketTab === "answered" ? "active" : ""}" data-tk-tab="answered">تم الرد (${cAns})</button>
          <button type="button" class="filter-tab ${state.filters.ticketTab === "closed" ? "active" : ""}" data-tk-tab="closed">مغلقة (${cClosed})</button>
          <button type="button" class="filter-tab ${state.filters.ticketTab === "all" ? "active" : ""}" data-tk-tab="all">الكل (${state.tickets.length})</button>
        </div>
        <div class="local-search-box">
          <span>${ICONS.search}</span>
          <input type="search" id="ticket-search-input" placeholder="ابحث برقم التذكرة LISAN-... أو الاسم أو البريد..." value="${escapeHtml(state.filters.ticketSearch)}" />
        </div>
      </div>

      <div id="tickets-list-wrap" class="admin-list-stack"></div>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));

  const paint = () => {
    let list = state.tickets;
    if (state.filters.ticketTab !== "all") list = list.filter((t) => t.status === state.filters.ticketTab);
    list = smartFilter(list, state.filters.ticketSearch, (t) =>
      `${t.ticketId || t.id} ${t.requesterName || ""} ${t.contact || ""} ${t.subject || ""} ${(t.messages || []).map((m) => m.text).join(" ")}`
    );

    const wrap = document.getElementById("tickets-list-wrap");
    if (!list.length) {
      wrap.innerHTML = `<div class="glass-card empty-state"><p>لا توجد تذاكر دعم مطابقة في هذا التبويب.</p></div>`;
      return;
    }

    const stLabels = { open: "مفتوحة بانتظار الرد", answered: "تم الرد", closed: "مغلقة" };
    const stTones = { open: "warn", answered: "ok", closed: "draft" };

    wrap.innerHTML = list.map((tk) => `
      <div class="glass-card admin-row-card">
        <div class="row-thumb placeholder">${ICONS.support}</div>
        <div class="row-main">
          <div class="row-badges">
            <span class="pill-badge" dir="ltr">${escapeHtml(tk.ticketId || tk.id)}</span>
            <span class="status-dot tone-${stTones[tk.status] || "info"}">${stLabels[tk.status] || tk.status}</span>
            <span class="pill-badge neutral">${(tk.messages || []).length} رسائل</span>
          </div>
          <h3>${escapeHtml(tk.subject || "تذكرة دعم")}</h3>
          <p><strong>${escapeHtml(tk.requesterName || "زائر")}</strong> • <span dir="ltr">${escapeHtml(tk.contact || "")}</span></p>
          <p class="admin-meta-line">آخر تحديث: ${formatDate(tk.updatedAt || tk.createdAt)}</p>
        </div>
        <div class="row-actions">
          <button type="button" class="btn-primary-glass" data-open-ticket="${escapeHtml(tk.id)}">فتح والرد</button>
        </div>
      </div>
    `).join("");

    wrap.querySelectorAll("[data-open-ticket]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tk = state.tickets.find((x) => x.id === btn.dataset.openTicket);
        if (tk) openTicketReplyModal(tk);
      });
    });
  };

  container.querySelectorAll("[data-tk-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filters.ticketTab = btn.dataset.tkTab;
      container.querySelectorAll("[data-tk-tab]").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      paint();
    });
  });

  document.getElementById("ticket-search-input")?.addEventListener("input", (e) => {
    state.filters.ticketSearch = e.target.value;
    paint();
  });

  paint();
}

function openTicketReplyModal(tk) {
  const tid = tk.ticketId || tk.id;
  const linkedStudent = tk.studentUid ? state.students.find((s) => s.id === tk.studentUid || s.uid === tk.studentUid) : null;

  openModal(`تذكرة دعم: ${tid}`, `
    <div class="ticket-meta-card">
      <div><strong>المستفيد:</strong> ${escapeHtml(tk.requesterName)} (<span dir="ltr">${escapeHtml(tk.contact)}</span>)</div>
      <div><strong>الموضوع:</strong> ${escapeHtml(tk.subject)}</div>
      ${linkedStudent && hasPerm("manage_students") ? `
        <button type="button" class="tool-btn" id="jump-to-tk-student" style="margin-top:8px">فتح ملف الطالب (${escapeHtml(linkedStudent.fullName)})</button>
      ` : ""}
    </div>

    <div class="admin-chat-thread" id="admin-chat-thread">
      ${(tk.messages || []).map((m) => `
        <div class="chat-msg from-${escapeHtml(m.senderType || "user")}">
          <div class="chat-msg-meta"><strong>${escapeHtml(m.senderName || "")}</strong><span>${formatDate(m.createdAt)}</span></div>
          <p>${escapeHtml(m.text || "")}</p>
        </div>
      `).join("")}
    </div>

    <form id="staff-reply-form" style="margin-top:14px">
      <div class="form-group">
        <label>رد موظف الدعم الفني</label>
        <textarea id="staff-reply-text" rows="3" required placeholder="اكتب ردك الواضح للمستفيد..."></textarea>
      </div>
      <div class="modal-footer-actions split">
        <button type="button" class="tool-btn ${tk.status === "closed" ? "" : "danger"}" id="toggle-close-ticket-btn">
          ${tk.status === "closed" ? "إعادة فتح التذكرة" : "إغلاق التذكرة"}
        </button>
        <button type="submit" class="btn-primary-glass" id="send-staff-reply-btn">إرسال الرد للمستفيد</button>
      </div>
    </form>
  `, "wide");

  const threadEl = document.getElementById("admin-chat-thread");
  if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;

  document.getElementById("jump-to-tk-student")?.addEventListener("click", () => {
    if (linkedStudent) openStudentManagementModal(linkedStudent);
  });

  document.getElementById("toggle-close-ticket-btn")?.addEventListener("click", async () => {
    const nextStatus = tk.status === "closed" ? "open" : "closed";
    await updateDoc(doc(db, "tickets", tk.id), { status: nextStatus, updatedAt: new Date().toISOString() });
    tk.status = nextStatus;
    await logActivity(nextStatus === "closed" ? "إغلاق تذكرة دعم" : "إعادة فتح تذكرة دعم", tid);
    showToast(nextStatus === "closed" ? "تم إغلاق التذكرة ✓" : "تمت إعادة فتح التذكرة ✓");
    closeModal();
    renderAdminView();
  });

  document.getElementById("staff-reply-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const txt = document.getElementById("staff-reply-text").value.trim();
    if (!txt) return;
    const btn = document.getElementById("send-staff-reply-btn");
    btn.disabled = true;
    const now = new Date().toISOString();
    const nextMsgs = [
      ...(tk.messages || []),
      {
        senderType: "staff",
        senderName: `${state.currentUser.displayName || state.currentUser.username} (الدعم الفني)`,
        text: txt,
        createdAt: now
      }
    ];
    await updateDoc(doc(db, "tickets", tk.id), { messages: nextMsgs, status: "answered", updatedAt: now });
    tk.messages = nextMsgs;
    tk.status = "answered";
    tk.updatedAt = now;

    if (tk.studentUid) {
      await sendStudentNotification(tk.studentUid, {
        type: "info",
        title: `رد جديد على تذكرة الدعم (${tid})`,
        message: `ردّ فريق الدعم الفني على تذكرتك "${tk.subject}": ${txt.slice(0, 120)}`
      });
    }
    await logActivity("رد على تذكرة دعم", tid);
    showToast("تم إرسال ردك وحفظه في التذكرة ✓");
    openTicketReplyModal(tk);
  });
}

/* ============================================================================
 * 12. صندوق الصفحات التعريفية المرنة (من نحن، المنهجية، الخصوصية، مخصصة)
 * ============================================================================ */
function renderPagesManager(container) {
  if (!hasPerm("manage_pages")) return navigateAdmin("hub");

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "الصفحات التعريفية المرنة",
        "عدّل نصوص وعناوين الصفحات الأساسية (من نحن، المنهجية، الخصوصية) أو أنشئ صفحات إضافية وتتحكم بظهورها.",
        `<button type="button" class="btn-primary-glass" id="btn-new-page">${ICONS.plus} إضافة صفحة جديدة</button>`
      )}

      <div class="admin-list-stack">
        ${state.pages.map((pg) => `
          <div class="glass-card admin-row-card">
            <div class="row-thumb placeholder">${ICONS.fileText}</div>
            <div class="row-main">
              <div class="row-badges">
                <span class="pill-badge" dir="ltr">?page=${escapeHtml(pg.slug || pg.id)}</span>
                <span class="status-dot ${pg.visible !== false ? "published" : "draft"}">${pg.visible !== false ? "ظاهرة في التذييل" : "مخفية"}</span>
              </div>
              <h3>${escapeHtml(pg.title)}</h3>
              <p>${escapeHtml(pg.subtitle || "")}</p>
            </div>
            <div class="row-actions">
              <button type="button" class="tool-btn" data-edit-page="${escapeHtml(pg.id)}">${ICONS.edit} تعديل المحتوى</button>
              ${!["about", "methodology", "privacy"].includes(pg.id) ? `<button type="button" class="tool-btn danger" data-del-page="${escapeHtml(pg.id)}">${ICONS.trash} حذف</button>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));
  document.getElementById("btn-new-page")?.addEventListener("click", () => openPageEditorModal(null));

  container.querySelectorAll("[data-edit-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const found = state.pages.find((p) => p.id === btn.dataset.editPage);
      if (found) openPageEditorModal(found);
    });
  });

  container.querySelectorAll("[data-del-page]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const found = state.pages.find((p) => p.id === btn.dataset.delPage);
      if (!found || !confirm(`حذف الصفحة "${found.title}" نهائياً؟`)) return;
      await deleteDoc(doc(db, "pages", found.id));
      state.pages = state.pages.filter((p) => p.id !== found.id);
      await logActivity("حذف صفحة تعريفية", found.title);
      showToast("تم حذف الصفحة");
      renderAdminView();
    });
  });
}

function openPageEditorModal(page = null) {
  const isEdit = Boolean(page);
  const isCore = ["about", "methodology", "privacy"].includes(page?.id);

  openModal(isEdit ? `تعديل صفحة: ${page.title}` : "إضافة صفحة تعريفية جديدة", `
    <form id="page-editor-form" class="editor-form">
      <div class="form-grid-2">
        <div class="form-group">
          <label>عنوان الصفحة *</label>
          <input type="text" id="pg-title" required value="${escapeHtml(page?.title || "")}" placeholder="مثال: من نحن / الأسئلة الشائعة" />
        </div>
        <div class="form-group">
          <label>المعرّف في الرابط (بالإنجليزية بدون مسافات) *</label>
          <input type="text" id="pg-slug" required dir="ltr" ${isCore ? "disabled" : ""} value="${escapeHtml(page?.slug || page?.id || "")}" placeholder="faq" />
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group">
          <label>وصف فرعي قصير</label>
          <input type="text" id="pg-sub" value="${escapeHtml(page?.subtitle || "")}" placeholder="نبذة سريعة تظهر تحت العنوان..." />
        </div>
        <div class="form-group">
          <label>حالة الظهور في الموقع العام</label>
          <select id="pg-visible">
            <option value="true" ${page?.visible !== false ? "selected" : ""}>ظاهرة في التذييل ومفهرسة</option>
            <option value="false" ${page?.visible === false ? "selected" : ""}>مخفية مؤقتاً</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>محتوى الصفحة (محرر نصوص منسّق)</label>
        <div class="word-editor-shell">
          <div class="word-toolbar" id="pg-toolbar">
            <button type="button" data-pcmd="formatBlock" data-pval="H2">H2</button>
            <button type="button" data-pcmd="formatBlock" data-pval="H3">H3</button>
            <button type="button" data-pcmd="bold"><strong>B</strong></button>
            <button type="button" data-pcmd="italic"><em>I</em></button>
            <button type="button" data-pcmd="insertUnorderedList">• قائمة</button>
            <button type="button" data-pcmd="formatBlock" data-pval="BLOCKQUOTE">❝</button>
          </div>
          <div id="pg-body-wysiwyg" class="word-canvas" contenteditable="true">${page?.bodyHtml || ""}</div>
        </div>
      </div>

      <div class="modal-footer-actions">
        <button type="button" class="tool-btn" id="cancel-pg-btn">إلغاء</button>
        <button type="submit" class="btn-primary-glass" id="save-pg-btn">حفظ الصفحة</button>
      </div>
    </form>
  `, "wide");

  const canvas = document.getElementById("pg-body-wysiwyg");
  document.querySelectorAll("#pg-toolbar [data-pcmd]").forEach((b) => {
    b.addEventListener("click", () => { canvas.focus(); document.execCommand(b.dataset.pcmd, false, b.dataset.pval || null); });
  });
  document.getElementById("cancel-pg-btn")?.addEventListener("click", closeModal);

  document.getElementById("page-editor-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rawSlug = document.getElementById("pg-slug").value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (!rawSlug) { showToast("أدخل معرّفاً إنجليزياً صالحاً للرابط", "error"); return; }
    const docId = isEdit ? page.id : rawSlug;
    const payload = {
      id: docId,
      slug: docId,
      order: page?.order || state.pages.length + 1,
      title: document.getElementById("pg-title").value.trim(),
      subtitle: document.getElementById("pg-sub").value.trim(),
      visible: document.getElementById("pg-visible").value === "true",
      bodyHtml: canvas.innerHTML,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, "pages", docId), payload, { merge: true });
    const idx = state.pages.findIndex((p) => p.id === docId);
    if (idx >= 0) state.pages[idx] = payload;
    else state.pages.push(payload);
    await logActivity("تحديث صفحة تعريفية", payload.title);
    showToast("تم حفظ الصفحة وتحديث الموقع العام ✓");
    closeModal();
    renderAdminView();
  });
}

/* ============================================================================
 * 13. صندوق إدارة المحتوى والمحرر الأكاديمي الحر (v2.0 + v3.0)
 * ============================================================================ */
function renderContentManager(container) {
  if (!hasPerm("manage_content")) return navigateAdmin("hub");
  const secs = Object.values(state.settings.sectionsMeta).filter((s) => s.id !== "quiz").sort((a, b) => a.order - b.order);

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
          ${secs.map((s) => `<button type="button" class="filter-tab ${state.filters.contentSection === s.id ? "active" : ""}" data-f-sec="${s.id}">${escapeHtml(s.title)}</button>`).join("")}
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
    if (state.filters.contentSection !== "الكل") list = list.filter((it) => it.sectionId === state.filters.contentSection);
    if (state.filters.contentStatus !== "الكل") list = list.filter((it) => (it.status || "published") === state.filters.contentStatus);
    list = smartFilter(list, state.filters.contentSearch, (it) => `${it.title} ${it.subtitle || ""} ${it.branch || ""} ${it.summary || ""} ${(it.tags || []).join(" ")}`);

    const listEl = document.getElementById("content-items-list");
    if (!list.length) { listEl.innerHTML = `<div class="glass-card empty-state"><p>لا توجد مواد مطابقة حالياً.</p></div>`; return; }

    const stLabels = { published: "منشور", draft: "مسودة", pending: "بانتظار الاعتماد" };
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
              <span class="status-dot ${st}">${stLabels[st] || st}</span>
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
      b.addEventListener("click", () => { const f = state.items.find((x) => x.id === b.dataset.editItem); if (f) openItemEditorModal(f); });
    });
    listEl.querySelectorAll("[data-del-item]").forEach((b) => {
      b.addEventListener("click", async () => {
        const f = state.items.find((x) => x.id === b.dataset.delItem);
        if (!f || !confirm(`هل أنت متأكد من حذف "${f.title}" نهائياً؟`)) return;
        await deleteDoc(doc(db, "items", f.id));
        state.items = state.items.filter((x) => x.id !== f.id);
        await logActivity("حذف مادة", f.title);
        showToast("تم حذف المادة");
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
  document.getElementById("filter-status-select")?.addEventListener("change", (e) => { state.filters.contentStatus = e.target.value; paintList(); });
  document.getElementById("content-search-input")?.addEventListener("input", (e) => { state.filters.contentSearch = e.target.value; paintList(); });
  paintList();
}

function openItemEditorModal(item = null) {
  const isEdit = Boolean(item);
  const draftKey = `lisan_autosave_${item?.id || "new"}`;
  const savedDraft = JSON.parse(localStorage.getItem(draftKey) || "null");
  const secs = Object.values(state.settings.sectionsMeta).filter((s) => s.id !== "quiz").sort((a, b) => a.order - b.order);
  const initialSecId = item?.sectionId || secs[0].id;
  const initialBranches = state.settings.sectionsMeta[initialSecId]?.branches || [];

  openModal(isEdit ? "تعديل المادة" : "إضافة مادة جديدة", `
    <form id="item-editor-form" class="editor-form">
      ${savedDraft ? `
        <div class="draft-restore-bar" id="draft-restore-bar">
          <span>توجد مسودة محفوظة تلقائياً (${formatDate(savedDraft.savedAt)})</span>
          <div class="form-actions-inline">
            <button type="button" class="tool-btn" id="restore-draft-btn">استعادة</button>
            <button type="button" class="tool-btn danger" id="discard-draft-btn">تجاهل</button>
          </div>
        </div>
      ` : ""}

      <div class="form-grid-2">
        <div class="form-group">
          <label>القسم الرئيسي</label>
          <select id="ed-section">${secs.map((s) => `<option value="${s.id}" ${s.id === initialSecId ? "selected" : ""}>${escapeHtml(s.title)}</option>`).join("")}</select>
        </div>
        <div class="form-group">
          <label>الفرع الداخلي</label>
          <select id="ed-branch">${initialBranches.map((b) => `<option value="${escapeHtml(b)}" ${b === item?.branch ? "selected" : ""}>${escapeHtml(b)}</option>`).join("")}</select>
        </div>
      </div>

      <div class="form-grid-2">
        <div class="form-group"><label>العنوان الرئيسي *</label><input type="text" id="ed-title" required value="${escapeHtml(item?.title || "")}" /></div>
        <div class="form-group"><label>العنوان الفرعي / المقابل الإنجليزي</label><input type="text" id="ed-subtitle" value="${escapeHtml(item?.subtitle || "")}" /></div>
      </div>

      <div class="form-group"><label>ملخص قصير (للبطاقة وللسيو)</label><textarea id="ed-summary" rows="2">${escapeHtml(item?.summary || "")}</textarea></div>

      <div class="form-group">
        <div class="editor-label-row">
          <label>المتن الأكاديمي (رفع/لصق/سحب الصور في أي سطر بحرية)</label>
          <span id="autosave-indicator" class="autosave-badge">حفظ تلقائي نشط</span>
        </div>
        <div class="word-editor-shell">
          <div class="word-toolbar">
            <button type="button" data-cmd="formatBlock" data-val="H2">H2</button>
            <button type="button" data-cmd="formatBlock" data-val="H3">H3</button>
            <button type="button" data-cmd="bold"><strong>B</strong></button>
            <button type="button" data-cmd="italic"><em>I</em></button>
            <button type="button" data-cmd="underline"><u>U</u></button>
            <button type="button" data-cmd="formatBlock" data-val="BLOCKQUOTE">❝</button>
            <button type="button" data-cmd="insertUnorderedList">• قائمة</button>
            <button type="button" data-cmd="insertOrderedList">1. مرقمة</button>
            <button type="button" id="ed-insert-link">🔗 رابط</button>
            <label class="toolbar-upload-btn">🖼 إدراج صورة هنا<input type="file" id="ed-inline-img-file" accept="image/*" hidden /></label>
            <button type="button" data-cmd="removeFormat">مسح التنسيق</button>
          </div>
          <div id="img-props-bar" class="img-props-bar" hidden>
            <span class="img-props-label">الصورة المحددة:</span>
            <button type="button" data-img-size="img-size-sm">صغيرة</button>
            <button type="button" data-img-size="img-size-md">متوسطة</button>
            <button type="button" data-img-size="img-size-full">كاملة العرض</button>
            <button type="button" id="img-edit-caption-btn">تعديل الشرح</button>
            <button type="button" id="img-delete-btn" class="danger-mini">حذف الصورة</button>
          </div>
          <div id="ed-body-wysiwyg" class="word-canvas" contenteditable="true" data-placeholder="اكتب هنا أو الصق/اسحب صورة مباشرة...">${item?.bodyHtml || ""}</div>
        </div>
      </div>

      <div class="media-accordion-grid">
        <div class="form-group">
          <label>صورة الغلاف (ImgBB)</label>
          <div class="upload-row">
            <input type="url" id="ed-cover-url" dir="ltr" value="${escapeHtml(item?.coverUrl || "")}" placeholder="رابط أو ارفع من جهازك..." />
            <label class="tool-btn upload-trigger">${ICONS.upload} رفع<input type="file" id="ed-cover-file" accept="image/*" hidden /></label>
          </div>
          <small id="ed-cover-status" class="helper-hint"></small>
        </div>
        <div class="form-group"><label>رابط فيديو يوتيوب</label><input type="url" id="ed-youtube-url" dir="ltr" value="${escapeHtml(item?.youtubeUrl || "")}" placeholder="https://www.youtube.com/watch?v=..." /></div>
        <div class="form-group"><label>رابط ملف PDF</label><input type="url" id="ed-pdf-url" dir="ltr" value="${escapeHtml(item?.pdfUrl || "")}" placeholder="https://drive.google.com/file/d/..." /></div>
        <div class="form-group"><label>رابط مصدر خارجي</label><input type="url" id="ed-external-url" dir="ltr" value="${escapeHtml(item?.externalUrl || "")}" placeholder="https://..." /></div>
      </div>

      <div class="form-grid-2">
        <div class="form-group"><label>الوسوم (افصل بفاصلة)</label><input type="text" id="ed-tags" value="${escapeHtml((item?.tags || []).join("، "))}" /></div>
        <div class="form-group">
          <label>حالة النشر</label>
          <select id="ed-status">
            <option value="published" ${(item?.status || "published") === "published" ? "selected" : ""}>منشور مباشرة للعامة</option>
            <option value="draft" ${item?.status === "draft" ? "selected" : ""}>مسودة (مخفي)</option>
            <option value="pending" ${item?.status === "pending" ? "selected" : ""}>معلق للمراجعة</option>
          </select>
        </div>
      </div>

      <div class="modal-footer-actions split">
        <button type="button" class="tool-btn" id="live-preview-btn">${ICONS.eye} معاينة حية</button>
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
    branchSelect.innerHTML = branches.map((b) => `<option value="${escapeHtml(b)}" ${b === selectedBranch ? "selected" : ""}>${escapeHtml(b)}</option>`).join("");
  };
  secSelect.addEventListener("change", () => updateBranchesList());

  const saveCursor = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && canvas.contains(sel.anchorNode)) savedRange = sel.getRangeAt(0).cloneRange();
  };
  canvas.addEventListener("keyup", saveCursor);
  canvas.addEventListener("mouseup", saveCursor);

  const insertUploadedFigure = async (file) => {
    try {
      showToast("جارٍ ضغط الصورة وإدراجها...");
      const url = await uploadCompressedImageToImgBB(file);
      const figHtml = `<figure class="academic-figure img-size-full"><img src="${escapeHtml(url)}" alt="صورة توضيحية" class="academic-inline-img" /><figcaption>انقر على الصورة لتعديل حجمها أو هذا الشرح</figcaption></figure><p><br></p>`;
      canvas.focus();
      if (savedRange) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(savedRange); }
      document.execCommand("insertHTML", false, figHtml);
      triggerAutoSave();
      showToast("تم إدراج الصورة بنجاح ✓");
    } catch (err) { showToast(err.message, "error"); }
  };

  document.querySelectorAll(".word-toolbar [data-cmd]").forEach((btn) => {
    btn.addEventListener("click", () => { canvas.focus(); document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null); triggerAutoSave(); });
  });
  document.getElementById("ed-insert-link")?.addEventListener("click", () => {
    const url = prompt("أدخل الرابط الكامل (https://...):");
    if (url) { canvas.focus(); document.execCommand("createLink", false, url); triggerAutoSave(); }
  });
  document.getElementById("ed-inline-img-file")?.addEventListener("change", async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) await insertUploadedFigure(f); });
  canvas.addEventListener("paste", async (e) => {
    const imgItem = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith("image/"));
    if (imgItem) { e.preventDefault(); const f = imgItem.getAsFile(); if (f) await insertUploadedFigure(f); }
  });
  canvas.addEventListener("dragover", (e) => { e.preventDefault(); canvas.classList.add("drag-active"); });
  canvas.addEventListener("dragleave", () => canvas.classList.remove("drag-active"));
  canvas.addEventListener("drop", async (e) => {
    canvas.classList.remove("drag-active");
    const f = Array.from(e.dataTransfer?.files || []).find((x) => x.type.startsWith("image/"));
    if (f) { e.preventDefault(); await insertUploadedFigure(f); }
  });

  canvas.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (img) {
      let fig = img.closest("figure");
      if (!fig) { fig = document.createElement("figure"); fig.className = "academic-figure img-size-full"; img.parentNode.insertBefore(fig, img); fig.appendChild(img); }
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
      if (!state.selectedEditorFigure) return;
      state.selectedEditorFigure.classList.remove("img-size-sm", "img-size-md", "img-size-full");
      state.selectedEditorFigure.classList.add(btn.dataset.imgSize);
      triggerAutoSave();
    });
  });
  document.getElementById("img-edit-caption-btn")?.addEventListener("click", () => {
    const fig = state.selectedEditorFigure;
    if (!fig) return;
    let cap = fig.querySelector("figcaption");
    const txt = prompt("الشرح التوضيحي أسفل الصورة (اتركه فارغاً لإزالته):", cap?.textContent || "");
    if (txt === null) return;
    if (txt.trim()) { if (!cap) { cap = document.createElement("figcaption"); fig.appendChild(cap); } cap.textContent = txt.trim(); }
    else if (cap) cap.remove();
    triggerAutoSave();
  });
  document.getElementById("img-delete-btn")?.addEventListener("click", () => {
    if (state.selectedEditorFigure) { state.selectedEditorFigure.remove(); state.selectedEditorFigure = null; imgPropsBar.hidden = true; triggerAutoSave(); }
  });

  const collectSnap = () => ({
    sectionId: secSelect.value, branch: branchSelect.value,
    title: document.getElementById("ed-title").value, subtitle: document.getElementById("ed-subtitle").value,
    summary: document.getElementById("ed-summary").value, bodyHtml: canvas.innerHTML,
    coverUrl: document.getElementById("ed-cover-url").value, youtubeUrl: document.getElementById("ed-youtube-url").value,
    pdfUrl: document.getElementById("ed-pdf-url").value, externalUrl: document.getElementById("ed-external-url").value,
    tags: document.getElementById("ed-tags").value, status: document.getElementById("ed-status").value,
    savedAt: new Date().toISOString()
  });

  const triggerAutoSave = () => {
    clearTimeout(state.draftTimer);
    if (autoSaveBadge) autoSaveBadge.textContent = "جارٍ الحفظ...";
    state.draftTimer = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(collectSnap())); if (autoSaveBadge) autoSaveBadge.textContent = "تم الحفظ التلقائي ✓"; } catch {}
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
  });
  document.getElementById("discard-draft-btn")?.addEventListener("click", () => { localStorage.removeItem(draftKey); document.getElementById("draft-restore-bar")?.remove(); });

  document.getElementById("ed-cover-file")?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { document.getElementById("ed-cover-url").value = await uploadCompressedImageToImgBB(f, document.getElementById("ed-cover-status")); triggerAutoSave(); }
    catch (err) { showToast(err.message, "error"); }
  });

  document.getElementById("live-preview-btn")?.addEventListener("click", () => openLivePreviewModal(collectSnap()));
  document.getElementById("cancel-editor-btn")?.addEventListener("click", closeModal);

  document.getElementById("item-editor-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("save-item-btn");
    btn.disabled = true;
    canvas.querySelectorAll(".selected-fig").forEach((el) => el.classList.remove("selected-fig"));
    const tags = document.getElementById("ed-tags").value.split(/[,،]+/).map((t) => t.trim()).filter(Boolean);
    const payload = {
      sectionId: secSelect.value, branch: branchSelect.value || "",
      title: document.getElementById("ed-title").value.trim(), subtitle: document.getElementById("ed-subtitle").value.trim(),
      summary: document.getElementById("ed-summary").value.trim(), contentType: secSelect.value === "dictionary" ? "term" : "article",
      bodyHtml: canvas.innerHTML, coverUrl: document.getElementById("ed-cover-url").value.trim(),
      youtubeUrl: document.getElementById("ed-youtube-url").value.trim(), pdfUrl: document.getElementById("ed-pdf-url").value.trim(),
      externalUrl: document.getElementById("ed-external-url").value.trim(), tags, status: document.getElementById("ed-status").value,
      updatedAt: new Date().toISOString()
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, "items", item.id), payload);
        const idx = state.items.findIndex((x) => x.id === item.id);
        if (idx >= 0) state.items[idx] = { ...state.items[idx], ...payload };
        await logActivity("تعديل مادة", payload.title);
      } else {
        payload.views = 0; payload.createdAt = new Date().toISOString(); payload.authorAdmin = state.currentUser.username;
        const ref = await addDoc(collection(db, "items"), payload);
        state.items.unshift({ id: ref.id, ...payload });
        await logActivity("إضافة مادة جديدة", payload.title);
      }
      localStorage.removeItem(draftKey);
      showToast("تم حفظ المادة بنجاح ✓");
      closeModal();
      renderAdminView();
    } catch { showToast("تعذر حفظ المادة", "error"); btn.disabled = false; }
  });
}

function openLivePreviewModal(snap) {
  const backdrop = document.getElementById("preview-modal-backdrop");
  const body = document.getElementById("preview-modal-body");
  if (!backdrop || !body) return;
  const secTitle = state.settings.sectionsMeta[snap.sectionId]?.title || "";
  body.innerHTML = `
    <div class="preview-article">
      <div class="row-badges" style="margin-bottom:12px"><span class="pill-badge">${escapeHtml(secTitle)}</span><span class="pill-badge neutral">${escapeHtml(snap.branch || "")}</span></div>
      <h1 class="preview-title">${escapeHtml(snap.title || "بدون عنوان")}</h1>
      ${snap.subtitle ? `<p class="preview-sub">${escapeHtml(snap.subtitle)}</p>` : ""}
      ${snap.summary ? `<p class="preview-lead">${escapeHtml(snap.summary)}</p>` : ""}
      ${snap.coverUrl ? `<img src="${escapeHtml(snap.coverUrl)}" alt="" class="preview-cover" />` : ""}
      <div class="preview-prose">${snap.bodyHtml || "<p>لا يوجد نص بعد...</p>"}</div>
    </div>
  `;
  backdrop.hidden = false;
}
function closeLivePreviewModal() { const b = document.getElementById("preview-modal-backdrop"); if (b) b.hidden = true; }

/* ============================================================================
 * 14. صندوق الاختبارات + صندوق مساهمات الطلبة (مع إشعار فوري للطالب)
 * ============================================================================ */
function renderQuizzesManager(container) {
  if (!hasPerm("manage_quizzes")) return navigateAdmin("hub");
  container.innerHTML = `
    <div class="container">
      ${renderSubHeader("بنك الاختبارات التفاعلية", "ابنِ اختبارات اختيار من متعدد مع تفسير علمي لكل إجابة.", `<button type="button" class="btn-primary-glass" id="btn-new-quiz">${ICONS.plus} إنشاء اختبار</button>`)}
      <div class="glass-panel filter-toolbar"><div class="local-search-box full-flex"><span>${ICONS.search}</span><input type="search" id="quiz-search-input" placeholder="ابحث في الاختبارات..." value="${escapeHtml(state.filters.quizSearch)}" /></div></div>
      <div id="quizzes-list" class="admin-list-stack"></div>
    </div>
  `;
  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));
  document.getElementById("btn-new-quiz")?.addEventListener("click", () => openQuizEditorModal(null));

  const paint = () => {
    const list = smartFilter(state.quizzes, state.filters.quizSearch, (q) => `${q.title} ${q.branch} ${q.description || ""}`);
    const wrap = document.getElementById("quizzes-list");
    if (!list.length) { wrap.innerHTML = `<div class="glass-card empty-state"><p>لا توجد اختبارات مضافة بعد.</p></div>`; return; }
    wrap.innerHTML = list.map((q) => `
      <div class="glass-card admin-row-card">
        <div class="row-thumb placeholder">؟</div>
        <div class="row-main">
          <div class="row-badges"><span class="pill-badge">${escapeHtml(q.branch || "اختبار")}</span><span class="pill-badge neutral">${escapeHtml(q.difficulty || "متوسط")}</span><span class="pill-badge neutral">${(q.questions || []).length} أسئلة</span></div>
          <h3>${escapeHtml(q.title)}</h3>
          <p>${escapeHtml(q.description || "")}</p>
        </div>
        <div class="row-actions">
          <button type="button" class="tool-btn" data-edit-quiz="${q.id}">${ICONS.edit} تعديل</button>
          <button type="button" class="tool-btn danger" data-del-quiz="${q.id}">${ICONS.trash} حذف</button>
        </div>
      </div>
    `).join("");

    wrap.querySelectorAll("[data-edit-quiz]").forEach((b) => b.addEventListener("click", () => { const f = state.quizzes.find((x) => x.id === b.dataset.editQuiz); if (f) openQuizEditorModal(f); }));
    wrap.querySelectorAll("[data-del-quiz]").forEach((b) => b.addEventListener("click", async () => {
      const f = state.quizzes.find((x) => x.id === b.dataset.delQuiz);
      if (!f || !confirm(`حذف الاختبار "${f.title}" نهائياً؟`)) return;
      await deleteDoc(doc(db, "quizzes", f.id));
      state.quizzes = state.quizzes.filter((x) => x.id !== f.id);
      await logActivity("حذف اختبار", f.title);
      showToast("تم حذف الاختبار");
      paint();
    }));
  };
  document.getElementById("quiz-search-input")?.addEventListener("input", (e) => { state.filters.quizSearch = e.target.value; paint(); });
  paint();
}

function openQuizEditorModal(quiz = null) {
  const isEdit = Boolean(quiz);
  const branches = state.settings.sectionsMeta.quiz?.branches || ["اختبارات في فروع اللسانيات"];
  state.editingQuizQuestions = quiz?.questions?.length ? structuredClone(quiz.questions) : [{ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" }];

  openModal(isEdit ? "تعديل الاختبار" : "إنشاء اختبار تفاعلي", `
    <form id="quiz-editor-form" class="editor-form">
      <div class="form-grid-2">
        <div class="form-group"><label>عنوان الاختبار *</label><input type="text" id="qz-title" required value="${escapeHtml(quiz?.title || "")}" /></div>
        <div class="form-group"><label>الفرع</label><select id="qz-branch">${branches.map((b) => `<option value="${escapeHtml(b)}" ${b === quiz?.branch ? "selected" : ""}>${escapeHtml(b)}</option>`).join("")}</select></div>
      </div>
      <div class="form-grid-2">
        <div class="form-group"><label>الصعوبة</label><select id="qz-diff">${["مبتدئ", "متوسط", "متقدم"].map((d) => `<option value="${d}" ${d === (quiz?.difficulty || "متوسط") ? "selected" : ""}>${d}</option>`).join("")}</select></div>
        <div class="form-group"><label>الحالة</label><select id="qz-status"><option value="published" ${(quiz?.status || "published") === "published" ? "selected" : ""}>منشور</option><option value="draft" ${quiz?.status === "draft" ? "selected" : ""}>مسودة</option></select></div>
      </div>
      <div class="form-group"><label>وصف قصير</label><input type="text" id="qz-desc" value="${escapeHtml(quiz?.description || "")}" /></div>
      <div class="quiz-builder-header"><strong>الأسئلة</strong><button type="button" class="tool-btn" id="add-question-btn">${ICONS.plus} إضافة سؤال</button></div>
      <div id="quiz-questions-builder" class="quiz-questions-stack"></div>
      <div class="modal-footer-actions"><button type="button" class="tool-btn" id="cancel-quiz-btn">إلغاء</button><button type="submit" class="btn-primary-glass" id="save-quiz-btn">حفظ الاختبار</button></div>
    </form>
  `, "wide");

  const syncQ = () => {
    state.editingQuizQuestions = Array.from(document.querySelectorAll(".q-builder-card")).map((c) => ({
      question: c.querySelector(".qb-q").value.trim(),
      options: Array.from(c.querySelectorAll(".qb-opt")).map((i) => i.value.trim()),
      correctIndex: Number(c.querySelector(".qb-correct").value),
      explanation: c.querySelector(".qb-exp").value.trim()
    }));
  };
  const renderQB = () => {
    const wrap = document.getElementById("quiz-questions-builder");
    wrap.innerHTML = state.editingQuizQuestions.map((q, idx) => `
      <div class="q-builder-card">
        <div class="q-builder-head"><strong>سؤال #${idx + 1}</strong>${state.editingQuizQuestions.length > 1 ? `<button type="button" class="tool-btn danger" data-rm-q="${idx}">حذف</button>` : ""}</div>
        <div class="form-group"><input type="text" class="qb-q" required value="${escapeHtml(q.question)}" placeholder="نص السؤال..." /></div>
        <div class="form-grid-2">${[0, 1, 2, 3].map((oi) => `<input type="text" class="qb-opt" required value="${escapeHtml(q.options[oi] || "")}" placeholder="الخيار ${["أ", "ب", "ج", "د"][oi]}" />`).join("")}</div>
        <div class="form-grid-2" style="margin-top:10px">
          <div class="form-group"><label>الإجابة الصحيحة</label><select class="qb-correct">${["أ", "ب", "ج", "د"].map((lbl, oi) => `<option value="${oi}" ${Number(q.correctIndex) === oi ? "selected" : ""}>${lbl}</option>`).join("")}</select></div>
          <div class="form-group"><label>الشرح اللساني</label><input type="text" class="qb-exp" value="${escapeHtml(q.explanation || "")}" /></div>
        </div>
      </div>
    `).join("");
    wrap.querySelectorAll("[data-rm-q]").forEach((b) => b.addEventListener("click", () => { syncQ(); state.editingQuizQuestions.splice(Number(b.dataset.rmQ), 1); renderQB(); }));
  };

  document.getElementById("add-question-btn")?.addEventListener("click", () => { syncQ(); state.editingQuizQuestions.push({ question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" }); renderQB(); });
  document.getElementById("cancel-quiz-btn")?.addEventListener("click", closeModal);
  document.getElementById("quiz-editor-form")?.addEventListener("submit", async (e) => {
    e.preventDefault(); syncQ();
    const payload = {
      title: document.getElementById("qz-title").value.trim(), branch: document.getElementById("qz-branch").value,
      difficulty: document.getElementById("qz-diff").value, status: document.getElementById("qz-status").value,
      description: document.getElementById("qz-desc").value.trim(), questions: state.editingQuizQuestions, updatedAt: new Date().toISOString()
    };
    if (isEdit) {
      await updateDoc(doc(db, "quizzes", quiz.id), payload);
      const idx = state.quizzes.findIndex((x) => x.id === quiz.id);
      if (idx >= 0) state.quizzes[idx] = { ...state.quizzes[idx], ...payload };
    } else {
      payload.createdAt = new Date().toISOString();
      const ref = await addDoc(collection(db, "quizzes"), payload);
      state.quizzes.unshift({ id: ref.id, ...payload });
    }
    await logActivity(isEdit ? "تعديل اختبار" : "إضافة اختبار", payload.title);
    showToast("تم حفظ الاختبار ✓"); closeModal(); renderAdminView();
  });
  renderQB();
}

function renderSubmissionsQueue(container) {
  if (!hasPerm("approve_submissions")) return navigateAdmin("hub");
  const pending = state.items.filter((x) => x.status === "pending");

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader("مساهمات ومشاريع الطلبة المعلقة", "اعتمد المساهمات المرسلة وسيصل للطالب إشعار فوري بقبول أو ملاحظة مساهمته.")}
      <div class="admin-list-stack">
        ${pending.length ? pending.map((it) => `
          <div class="glass-card admin-row-card">
            <div class="row-main">
              <div class="row-badges"><span class="pill-badge">${escapeHtml(it.branch || "فضاء التبادل")}</span><span class="status-dot pending">بانتظار الاعتماد</span></div>
              <h3>${escapeHtml(it.title)}</h3>
              <p><strong>${escapeHtml(it.studentName || it.subtitle || "")}</strong> — ${escapeHtml(it.summary || "")}</p>
            </div>
            <div class="row-actions">
              <button type="button" class="btn-primary-glass" data-approve="${it.id}">اعتماد ونشر</button>
              <button type="button" class="tool-btn" data-review-edit="${it.id}">مراجعة وتعديل</button>
              <button type="button" class="tool-btn danger" data-reject="${it.id}">رفض</button>
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
      if (it.studentUid) {
        await sendStudentNotification(it.studentUid, {
          type: "success",
          title: "تم قبول ونشر مساهمتك العلمية!",
          message: `مبارك! تم اعتماد ونشر مشروعك "${it.title}" في فضاء التبادل العلمي.`
        });
      }
      await logActivity("اعتماد مساهمة طالب", it.title);
      showToast("تم اعتماد المساهمة وإشعار الطالب ✓");
      renderAdminView();
    });
  });
  container.querySelectorAll("[data-review-edit]").forEach((b) => b.addEventListener("click", () => { const it = state.items.find((x) => x.id === b.dataset.reviewEdit); if (it) openItemEditorModal(it); }));
  container.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const it = state.items.find((x) => x.id === btn.dataset.reject);
      if (!it) return;
      const reason = prompt("اكتب سبباً أو ملاحظة لطيفة للطالب (اختياري):", "");
      if (reason === null) return;
      await deleteDoc(doc(db, "items", it.id));
      state.items = state.items.filter((x) => x.id !== it.id);
      if (it.studentUid) {
        await sendStudentNotification(it.studentUid, {
          type: "warning",
          title: `ملاحظة حول مساهمتك: ${it.title}`,
          message: reason.trim() || "لم تُعتمد المساهمة للنشر حالياً، يمكنك تعديلها وإعادة إرسالها."
        });
      }
      await logActivity("رفض مساهمة", it.title);
      showToast("تمت إزالة المساهمة وإشعار صاحبها");
      renderAdminView();
    });
  });
}

/* ============================================================================
 * 15. الأقسام الستة + التحكم الثلاثي بالميزات (مفعّل / قريباً / مخفي)
 * ============================================================================ */
function renderSectionsManager(container) {
  if (!hasPerm("manage_sections")) return navigateAdmin("hub");
  const secs = Object.values(state.settings.sectionsMeta).sort((a, b) => a.order - b.order);

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader("هيكلة الأقسام الستة وفروعها", "عدّل أسماء الأقسام وأوصافها وألوانها وفروعها الداخلية بحرية.", `<button type="button" class="btn-primary-glass" id="save-sections-btn">حفظ التغييرات</button>`)}
      <div class="sections-editor-grid">
        ${secs.map((s) => `
          <div class="glass-card section-editor-card" data-sec-card="${s.id}">
            <div class="form-grid-2">
              <div class="form-group"><label>اسم القسم</label><input type="text" class="se-title" value="${escapeHtml(s.title)}" /></div>
              <div class="form-group"><label>لون التمييز</label><input type="color" class="se-accent color-input" value="${escapeHtml(s.accent || "#0071e3")}" /></div>
            </div>
            <div class="form-group"><label>وصف مختصر</label><textarea class="se-desc" rows="2">${escapeHtml(s.shortDesc)}</textarea></div>
            <div class="form-group"><label>الفروع الداخلية (كل فرع في سطر)</label><textarea class="se-branches" rows="4">${escapeHtml((s.branches || []).join("\n"))}</textarea></div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));
  document.getElementById("save-sections-btn")?.addEventListener("click", async () => {
    container.querySelectorAll("[data-sec-card]").forEach((card) => {
      const id = card.dataset.secCard;
      state.settings.sectionsMeta[id] = {
        ...state.settings.sectionsMeta[id],
        title: card.querySelector(".se-title").value.trim(),
        accent: card.querySelector(".se-accent").value,
        shortDesc: card.querySelector(".se-desc").value.trim(),
        branches: card.querySelector(".se-branches").value.split("\n").map((x) => x.trim()).filter(Boolean)
      };
    });
    await setDoc(doc(db, "settings", "global"), state.settings, { merge: true });
    await logActivity("تحديث الأقسام والفروع", "تم تعديل بنية الأقسام");
    showToast("تم حفظ الأقسام وتحديث الموقع العام ✓");
  });
}

function renderFeaturesManager(container) {
  if (!hasPerm("manage_features")) return navigateAdmin("hub");

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "مفاتيح الميزات والظهور (تحكم ثلاثي مرن)",
        "لكل ميزة 3 حالات فورية: مفعّلة للجميع، أو (قريباً) برسالة أنيقة، أو مخفية تماماً عن الزوار."
      )}

      <div class="glass-card toggles-list">
        ${FEATURE_FLAGS_CATALOG.map((f) => {
          const cur = normalizeFeatureVal(state.settings.features[f.key]);
          return `
            <div class="toggle-row tri-row">
              <div>
                <strong>${f.label}</strong>
                <p>${f.desc}</p>
              </div>
              <div class="tri-state-segment" data-flag-seg="${f.key}">
                <button type="button" class="tri-btn ${cur === "on" ? "active on" : ""}" data-val="on">مفعّل</button>
                <button type="button" class="tri-btn ${cur === "soon" ? "active soon" : ""}" data-val="soon">قريباً</button>
                <button type="button" class="tri-btn ${cur === "off" ? "active off" : ""}" data-val="off">مخفي</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));

  container.querySelectorAll("[data-flag-seg]").forEach((seg) => {
    const key = seg.dataset.flagSeg;
    seg.querySelectorAll(".tri-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const val = btn.dataset.val;
        state.settings.features[key] = val;
        seg.querySelectorAll(".tri-btn").forEach((b) => b.classList.remove("active", "on", "soon", "off"));
        btn.classList.add("active", val);
        try {
          await setDoc(doc(db, "settings", "global"), { features: state.settings.features }, { merge: true });
          const lbl = val === "on" ? "مفعّلة" : val === "soon" ? "قريباً" : "مخفية";
          await logActivity("تحديث حالة ميزة", `${key} => ${lbl}`);
          showToast(`تم تحويل حالة الميزة إلى (${lbl}) ✓`);
        } catch {
          showToast("تعذر التحديث", "error");
        }
      });
    });
  });
}

/* ============================================================================
 * 16. الإعدادات الشاملة: الهوية + قنوات الدعم + سياسة التسجيل + مولّد sitemap.xml
 * ============================================================================ */
function buildSitemapXml(baseUrlRaw) {
  const cleanBase = (baseUrlRaw || "https://example.com").trim().replace(/\/+$/, "");
  const today = new Date().toISOString().split("T")[0];
  const urls = [{ loc: `${cleanBase}/`, priority: "1.0", changefreq: "daily", lastmod: today }];

  Object.values(state.settings.sectionsMeta)
    .filter((s) => normalizeFeatureVal(state.settings.features[s.featureKey]) === "on")
    .sort((a, b) => a.order - b.order)
    .forEach((sec) => urls.push({ loc: `${cleanBase}/?section=${encodeURIComponent(sec.id)}`, priority: "0.9", changefreq: "weekly", lastmod: today }));

  if (normalizeFeatureVal(state.settings.features.staticPages) === "on") {
    state.pages.filter((p) => p.visible !== false).forEach((p) => {
      urls.push({ loc: `${cleanBase}/?page=${encodeURIComponent(p.slug || p.id)}`, priority: "0.7", changefreq: "monthly", lastmod: today });
    });
  }

  state.items.filter((it) => !it.status || it.status === "published").forEach((it) => {
    const d = (it.updatedAt || it.createdAt || today).slice(0, 10);
    urls.push({
      loc: `${cleanBase}/?section=${encodeURIComponent(it.sectionId || "library")}&amp;item=${encodeURIComponent(it.id)}`,
      priority: "0.8", changefreq: "monthly", lastmod: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today
    });
  });

  state.quizzes.filter((q) => !q.status || q.status === "published").forEach((q) => {
    const d = (q.updatedAt || q.createdAt || today).slice(0, 10);
    urls.push({
      loc: `${cleanBase}/?section=quiz&amp;quiz=${encodeURIComponent(q.id)}`,
      priority: "0.75", changefreq: "monthly", lastmod: /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : today
    });
  });

  const body = urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

function renderSettingsManager(container) {
  if (!hasPerm("manage_settings")) return navigateAdmin("hub");
  const s = state.settings;
  const sc = s.supportContacts || {};

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "هوية المنصة، إعدادات الدعم والتسجيل، وخريطة SEO",
        "تحكم بكل تفصيلة؛ الشعار واللون يتزامنان لحظياً في المستودعين."
      )}

      <form id="global-settings-form" class="glass-card settings-form-card">
        <h3 style="margin-top:0">1. الهوية والمظهر العام</h3>
        <div class="form-grid-2">
          <div class="form-group"><label>اسم المنصة</label><input type="text" id="set-name" value="${escapeHtml(s.siteName)}" required /></div>
          <div class="form-group"><label>الوصف الفرعي</label><input type="text" id="set-subtitle" value="${escapeHtml(s.siteSubtitle)}" /></div>
        </div>
        <div class="form-group"><label>الشعار النصي الترحيبي</label><input type="text" id="set-tagline" value="${escapeHtml(s.siteTagline)}" /></div>
        <div class="form-grid-2">
          <div class="form-group"><label>شارة الجمهور المتخصص</label><input type="text" id="set-badge" value="${escapeHtml(s.audienceBadge)}" /></div>
          <div class="form-group"><label>اللون الأساسي للمنصة</label><input type="color" id="set-accent" class="color-input" value="${escapeHtml(s.themeAccent || "#0071e3")}" /></div>
        </div>
        <div class="form-group">
          <label>شعار المنصة (يتزامن في المستودعين معاً)</label>
          <div class="upload-row">
            <input type="url" id="set-logo" dir="ltr" value="${escapeHtml(s.logoUrl || "")}" placeholder="رابط الشعار..." />
            <label class="tool-btn upload-trigger">${ICONS.upload} رفع شعار<input type="file" id="set-logo-file" accept="image/*" hidden /></label>
          </div>
          <small id="set-logo-status" class="helper-hint"></small>
        </div>
        <div class="form-group"><label>شريط الإعلان العلوي (فارغ لإخفائه)</label><input type="text" id="set-announcement" value="${escapeHtml(s.announcementText || "")}" /></div>
        <div class="form-grid-2">
          <div class="form-group"><label>نص التذييل</label><input type="text" id="set-footer" value="${escapeHtml(s.footerText || "")}" /></div>
          <div class="form-group"><label>البريد العام للمنصة</label><input type="email" id="set-email" dir="ltr" value="${escapeHtml(s.contactEmail || "")}" /></div>
        </div>

        <h3 class="sub-divider-title">2. سياسات عضويات الطلبة والاختبارات</h3>
        <div class="form-grid-2">
          <div class="form-group">
            <label>رفع صورة البطاقة الجامعية عند التسجيل</label>
            <select id="set-idcard-mode">
              <option value="optional" ${s.studentIdCardMode === "optional" ? "selected" : ""}>اختياري (موصى به لتسريع التوثيق)</option>
              <option value="required" ${s.studentIdCardMode === "required" ? "selected" : ""}>إلزامي لكل طالب جديد</option>
              <option value="hidden" ${s.studentIdCardMode === "hidden" ? "selected" : ""}>مخفي (الاكتفاء بتأكيد البريد ومراجعة البيانات)</option>
            </select>
          </div>
          <div class="form-group">
            <label>شرط أداء الاختبارات التفاعلية</label>
            <select id="set-quiz-login">
              <option value="false" ${!s.requireLoginForQuiz ? "selected" : ""}>متاحة للجميع (وحفظ الدرجات للطلبة المسجلين)</option>
              <option value="true" ${s.requireLoginForQuiz ? "selected" : ""}>حصرية للطلبة المسجلين والموثقين فقط</option>
            </select>
          </div>
        </div>

        <h3 class="sub-divider-title">3. إعدادات قنوات التواصل مع الدعم الفني</h3>
        <div class="form-grid-2">
          <div class="form-group"><label>رقم واتساب الإدارة (مع مفتاح الدولة)</label><input type="text" id="sup-wa" dir="ltr" value="${escapeHtml(sc.whatsapp || "")}" placeholder="213555000000" /></div>
          <div class="form-group"><label>بريد الدعم الفني</label><input type="email" id="sup-em" dir="ltr" value="${escapeHtml(sc.email || "")}" placeholder="support@lisan.org" /></div>
        </div>
        <div class="form-group"><label>رابط تيليجرام الدعم (اختياري)</label><input type="url" id="sup-tg" dir="ltr" value="${escapeHtml(sc.telegram || "")}" placeholder="https://t.me/..." /></div>
        <div class="form-group"><label>الرسالة الترحيبية للمساعد الآلي في دردشة الدعم</label><textarea id="sup-welcome" rows="2">${escapeHtml(sc.welcomeMessage || "")}</textarea></div>

        <h3 class="sub-divider-title">4. روابط التواصل الاجتماعي</h3>
        <div class="form-grid-2">
          <div class="form-group"><label>فيسبوك</label><input type="url" id="set-fb" dir="ltr" value="${escapeHtml(s.socialLinks?.facebook || "")}" /></div>
          <div class="form-group"><label>تيليجرام</label><input type="url" id="set-tg" dir="ltr" value="${escapeHtml(s.socialLinks?.telegram || "")}" /></div>
          <div class="form-group"><label>يوتيوب</label><input type="url" id="set-yt" dir="ltr" value="${escapeHtml(s.socialLinks?.youtube || "")}" /></div>
          <div class="form-group"><label>X / تويتر</label><input type="url" id="set-tw" dir="ltr" value="${escapeHtml(s.socialLinks?.twitter || "")}" /></div>
        </div>

        <div class="modal-footer-actions">
          <button type="submit" class="btn-primary-glass" id="save-settings-btn">حفظ وتطبيق جميع الإعدادات</button>
        </div>
      </form>

      <section class="glass-card settings-form-card" style="margin-top: 22px">
        <div class="sitemap-head">
          <h3 style="margin:0 0 4px">${ICONS.globe} مولّد خريطة الموقع للسيو (sitemap.xml)</h3>
          <p class="helper-hint" style="margin:0">يجمع الأقسام، الصفحات التعريفية، المواد، والاختبارات المنشورة تلقائياً لتقديمها لـ Google.</p>
        </div>
        <div class="form-group" style="margin-top: 14px">
          <label>رابط الدومين الرسمي للمنصة العامة</label>
          <div class="upload-row">
            <input type="url" id="seo-base-url" dir="ltr" value="${escapeHtml(s.publicBaseUrl || "")}" placeholder="https://lisan-platform.com" />
            <button type="button" class="btn-primary-glass" id="generate-sitemap-btn">توليد الخريطة</button>
          </div>
        </div>
        <div id="sitemap-output-wrap" hidden>
          <textarea id="sitemap-xml-output" rows="9" dir="ltr" readonly class="code-textarea"></textarea>
          <div class="form-actions-inline" style="margin-top: 10px">
            <button type="button" class="tool-btn" id="copy-sitemap-btn">نسخ الكود</button>
            <button type="button" class="btn-primary-glass" id="download-sitemap-btn">تحميل sitemap.xml</button>
          </div>
        </div>
      </section>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));
  document.getElementById("set-logo-file")?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { document.getElementById("set-logo").value = await uploadCompressedImageToImgBB(f, document.getElementById("set-logo-status"), 512); }
    catch (err) { showToast(err.message, "error"); }
  });

  document.getElementById("global-settings-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("save-settings-btn");
    btn.disabled = true;
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
      studentIdCardMode: document.getElementById("set-idcard-mode").value,
      requireLoginForQuiz: document.getElementById("set-quiz-login").value === "true",
      publicBaseUrl: document.getElementById("seo-base-url")?.value.trim() || state.settings.publicBaseUrl || "",
      supportContacts: {
        whatsapp: document.getElementById("sup-wa").value.trim(),
        email: document.getElementById("sup-em").value.trim(),
        telegram: document.getElementById("sup-tg").value.trim(),
        welcomeMessage: document.getElementById("sup-welcome").value.trim()
      },
      socialLinks: {
        facebook: document.getElementById("set-fb").value.trim(),
        telegram: document.getElementById("set-tg").value.trim(),
        youtube: document.getElementById("set-yt").value.trim(),
        twitter: document.getElementById("set-tw").value.trim()
      }
    };
    await setDoc(doc(db, "settings", "global"), state.settings, { merge: true });
    applyAdminBranding();
    await logActivity("تحديث الإعدادات العامة والدعم", state.settings.siteName);
    showToast("تم حفظ الإعدادات وتطبيقها في المستودعين ✓");
    btn.disabled = false;
  });

  document.getElementById("generate-sitemap-btn")?.addEventListener("click", () => {
    const base = document.getElementById("seo-base-url").value.trim();
    if (!/^https?:\/\//i.test(base)) { showToast("أدخل رابط الموقع يبدأ بـ https://", "error"); return; }
    state.settings.publicBaseUrl = base;
    setDoc(doc(db, "settings", "global"), { publicBaseUrl: base }, { merge: true }).catch(() => {});
    document.getElementById("sitemap-xml-output").value = buildSitemapXml(base);
    document.getElementById("sitemap-output-wrap").hidden = false;
    showToast("تم توليد خريطة sitemap.xml بالكامل ✓");
  });
  document.getElementById("copy-sitemap-btn")?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(document.getElementById("sitemap-xml-output").value); showToast("تم نسخ الكود ✓"); } catch {}
  });
  document.getElementById("download-sitemap-btn")?.addEventListener("click", () => {
    const blob = new Blob([document.getElementById("sitemap-xml-output").value], { type: "application/xml;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sitemap.xml"; a.click(); URL.revokeObjectURL(a.href);
  });
}

/* ============================================================================
 * 17. فريق الإدارة والدعم (مع النبذة والبحث الذكي) + حسابي والأمان والسجلات
 * ============================================================================ */
function renderAdminsManager(container) {
  if (!hasPerm("manage_admins")) return navigateAdmin("hub");

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader(
        "فريق الإدارة والدعم الفني",
        "أضف مشرفين أو موظفي دعم فني بصورهم ونبذهم؛ البحث الذكي يلتقط أي كلمة من الاسم أو النبذة.",
        `<button type="button" class="btn-primary-glass" id="btn-new-admin">${ICONS.plus} إضافة موظف</button>`
      )}
      <div class="glass-panel filter-toolbar">
        <div class="local-search-box full-flex">
          <span>${ICONS.search}</span>
          <input type="search" id="admin-search-input" placeholder="ابحث بالاسم أو أي كلمة في نبذة الموظف (مثل: دعم، معجم، أصوات)..." value="${escapeHtml(state.filters.adminSearch)}" />
        </div>
      </div>
      <div id="admins-list-wrap" class="admin-list-stack"></div>
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));
  document.getElementById("btn-new-admin")?.addEventListener("click", () => openAdminEditorModal(null));

  const paint = () => {
    const list = smartFilter(state.admins, state.filters.adminSearch, (a) => `${a.displayName || ""} ${a.username || ""} ${a.bio || ""}`);
    const wrap = document.getElementById("admins-list-wrap");
    if (!list.length) { wrap.innerHTML = `<div class="glass-card empty-state"><p>لم يُعثر على موظف مطابق.</p></div>`; return; }

    wrap.innerHTML = list.map((ad) => `
      <div class="glass-card admin-row-card">
        ${renderAvatarHtml(ad.avatarUrl, ad.displayName || ad.username, "md")}
        <div class="row-main">
          <div class="row-badges">
            <span class="pill-badge">${ad.isSuperAdmin ? "أدمن رئيسي" : `${(ad.permissions || []).length} صلاحيات`}</span>
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

    wrap.querySelectorAll("[data-edit-admin]").forEach((b) => b.addEventListener("click", () => { const f = state.admins.find((x) => x.id === b.dataset.editAdmin); if (f) openAdminEditorModal(f); }));
    wrap.querySelectorAll("[data-del-admin]").forEach((b) => b.addEventListener("click", async () => {
      const f = state.admins.find((x) => x.id === b.dataset.delAdmin);
      if (!f || f.isSuperAdmin || !confirm(`حذف حساب "${f.username}" نهائياً؟`)) return;
      await deleteDoc(doc(db, "admins", f.id));
      state.admins = state.admins.filter((x) => x.id !== f.id);
      await logActivity("حذف موظف", f.username);
      showToast("تم حذف الحساب");
      paint();
    }));
  };
  document.getElementById("admin-search-input")?.addEventListener("input", (e) => { state.filters.adminSearch = e.target.value; paint(); });
  paint();
}

function openAdminEditorModal(admin = null) {
  const isEdit = Boolean(admin);
  const currentPerms = new Set(admin?.permissions || []);

  openModal(isEdit ? `تعديل حساب: ${admin.displayName || admin.username}` : "إضافة مشرف / موظف دعم جديد", `
    <form id="admin-user-form" class="editor-form">
      <div class="tip-banner">
        <strong>نصيحة:</strong> يمكنك إنشاء <strong>موظف دعم فني فقط</strong> بتحديد مربع «موظف دعم فني» وحده دون باقي الصلاحيات، وأضف تخصصه في النبذة لتسهيل البحث عنه لاحقاً.
      </div>
      <div class="avatar-editor-row">
        <div id="adm-avatar-preview">${renderAvatarHtml(admin?.avatarUrl, admin?.displayName || "م", "lg")}</div>
        <div class="form-group" style="flex:1; margin:0">
          <label>الصورة الشخصية للموظف</label>
          <div class="upload-row">
            <input type="url" id="adm-avatar-url" dir="ltr" value="${escapeHtml(admin?.avatarUrl || "")}" placeholder="رابط أو ارفع..." />
            <label class="tool-btn upload-trigger">${ICONS.upload} رفع<input type="file" id="adm-avatar-file" accept="image/*" hidden /></label>
          </div>
          <small id="adm-avatar-status" class="helper-hint"></small>
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-group"><label>الاسم الظاهر *</label><input type="text" id="adm-display" required value="${escapeHtml(admin?.displayName || "")}" /></div>
        <div class="form-group">
          <label>اسم المستخدم (فريد لا يتكرر) *</label>
          <input type="text" id="adm-username" required dir="ltr" value="${escapeHtml(admin?.username || "")}" placeholder="البريد أو الهاتف" />
          <small id="username-check-hint" class="helper-hint"></small>
        </div>
      </div>
      <div class="form-group"><label>نبذة تعريفية عن الموظف ومهامه (مفهرسة بالبحث الذكي)</label><textarea id="adm-bio" rows="2">${escapeHtml(admin?.bio || "")}</textarea></div>
      <div class="form-grid-2">
        <div class="form-group"><label>${isEdit ? "كلمة مرور جديدة (اتركها فارغة للإبقاء)" : "كلمة المرور *"}</label><input type="password" id="adm-password" ${isEdit ? "" : "required"} /></div>
        <div class="form-group"><label>حالة الحساب</label><select id="adm-active" ${admin?.isSuperAdmin ? "disabled" : ""}><option value="true" ${admin?.active !== false ? "selected" : ""}>نشط</option><option value="false" ${admin?.active === false ? "selected" : ""}>موقوف</option></select></div>
      </div>
      ${admin?.isSuperAdmin ? `<div class="tip-banner">الأدمن الرئيسي يملك كافة الصلاحيات دائماً.</div>` : `
        <div class="form-group">
          <label>الصلاحيات الممنوحة (اختيار مرن ودقيق):</label>
          <div class="perms-checklist">
            ${PERMISSIONS_CATALOG.map((p) => `<label class="perm-check-item"><input type="checkbox" class="adm-perm-chk" value="${p.key}" ${currentPerms.has(p.key) ? "checked" : ""} /><span>${p.label}</span></label>`).join("")}
          </div>
        </div>
      `}
      <div class="modal-footer-actions"><button type="button" class="tool-btn" id="cancel-admin-btn">إلغاء</button><button type="submit" class="btn-primary-glass" id="save-admin-btn">${isEdit ? "حفظ التغييرات" : "إنشاء الحساب"}</button></div>
    </form>
  `);

  const usernameInput = document.getElementById("adm-username");
  const hintEl = document.getElementById("username-check-hint");
  document.getElementById("adm-avatar-file")?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadCompressedImageToImgBB(f, document.getElementById("adm-avatar-status"), 512);
      document.getElementById("adm-avatar-url").value = url;
      document.getElementById("adm-avatar-preview").innerHTML = renderAvatarHtml(url, document.getElementById("adm-display").value || "م", "lg");
    } catch (err) { showToast(err.message, "error"); }
  });

  const isDup = (val) => state.admins.some((a) => a.usernameLower === val.trim().toLowerCase() && a.id !== admin?.id);
  usernameInput.addEventListener("input", () => {
    const val = usernameInput.value.trim();
    if (!val) { hintEl.textContent = ""; return; }
    hintEl.textContent = isDup(val) ? "هذا اسم مستخدم مسجل لدينا بالفعل." : "اسم المستخدم متاح ✓";
    hintEl.className = `helper-hint ${isDup(val) ? "error" : "ok"}`;
  });
  document.getElementById("cancel-admin-btn")?.addEventListener("click", closeModal);

  document.getElementById("admin-user-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (isDup(username) || ((await findAdminByUsername(username))?.id && (await findAdminByUsername(username)).id !== admin?.id)) {
      showToast("هذا اسم مستخدم مسجل لدينا بالفعل!", "error"); return;
    }
    const payload = {
      displayName: document.getElementById("adm-display").value.trim(),
      username, usernameLower: username.toLowerCase(),
      avatarUrl: document.getElementById("adm-avatar-url").value.trim(),
      bio: document.getElementById("adm-bio").value.trim(),
      active: admin?.isSuperAdmin ? true : document.getElementById("adm-active").value === "true",
      permissions: admin?.isSuperAdmin ? PERMISSIONS_CATALOG.map((p) => p.key) : Array.from(document.querySelectorAll(".adm-perm-chk:checked")).map((c) => c.value),
      updatedAt: new Date().toISOString()
    };
    const newPass = document.getElementById("adm-password").value;
    if (newPass) payload.passwordHash = await sha256(newPass);

    if (isEdit) {
      await updateDoc(doc(db, "admins", admin.id), payload);
      const idx = state.admins.findIndex((x) => x.id === admin.id);
      if (idx >= 0) state.admins[idx] = { ...state.admins[idx], ...payload };
      if (state.currentUser.id === admin.id) { state.currentUser = { ...state.currentUser, ...payload }; applyAdminBranding(); }
    } else {
      payload.isSuperAdmin = false; payload.pinHash = ""; payload.createdAt = new Date().toISOString();
      const ref = await addDoc(collection(db, "admins"), payload);
      state.admins.push({ id: ref.id, ...payload });
    }
    await logActivity(isEdit ? "تعديل موظف" : "إضافة موظف", username);
    showToast("تم حفظ بيانات الموظف ✓"); closeModal(); renderAdminView();
  });
}

function renderSecurityAndLogs(container) {
  const trusted = getTrustedDevice();
  const isThisTrusted = trusted?.adminId === state.currentUser.id;
  const me = state.currentUser;

  container.innerHTML = `
    <div class="container">
      ${renderSubHeader("ملفي الشخصي، الأمان، والسجلات", "عدّل صورتك واسمك ونبذتك، واضبط الرمز السريع وكلمة المرور.")}
      <form id="self-profile-form" class="glass-card settings-form-card" style="margin-bottom:20px">
        <h3 style="margin-top:0">ملفي الشخصي</h3>
        <div class="avatar-editor-row">
          <div id="self-avatar-preview">${renderAvatarHtml(me.avatarUrl, me.displayName || me.username, "lg")}</div>
          <div class="form-group" style="flex:1; margin:0">
            <label>صورتي الشخصية</label>
            <div class="upload-row">
              <input type="url" id="self-avatar-url" dir="ltr" value="${escapeHtml(me.avatarUrl || "")}" />
              <label class="tool-btn upload-trigger">${ICONS.upload} رفع<input type="file" id="self-avatar-file" accept="image/*" hidden /></label>
            </div>
            <small id="self-avatar-status" class="helper-hint"></small>
          </div>
        </div>
        <div class="form-grid-2">
          <div class="form-group"><label>الاسم الظاهر</label><input type="text" id="self-display" required value="${escapeHtml(me.displayName || "")}" /></div>
          <div class="form-group"><label>اسم المستخدم</label><input type="text" dir="ltr" value="${escapeHtml(me.username)}" disabled /></div>
        </div>
        <div class="form-group"><label>نبذتي التعريفية</label><textarea id="self-bio" rows="2">${escapeHtml(me.bio || "")}</textarea></div>
        <button type="submit" class="btn-primary-glass">حفظ ملفي الشخصي</button>
      </form>

      <div class="security-grid">
        <div class="glass-card settings-form-card">
          <h3>الرمز السريع (4 أرقام) والثقة بالمتصفح</h3>
          <p class="helper-hint">الحالة: <strong>${isThisTrusted ? (trusted.mode === "pin" ? "موثوق بالرمز السريع" : "موثوق بالدخول المباشر") : "غير موثوق"}</strong></p>
          <form id="pin-update-form" style="margin-top:14px">
            <div class="form-group"><label>تعيين/تغيير الرمز السريع (4 أرقام)</label><input type="password" id="sec-new-pin" maxlength="4" pattern="\\d{4}" inputmode="numeric" required placeholder="4 أرقام" /></div>
            <div class="form-actions-inline">
              <button type="submit" class="btn-primary-glass">حفظ وتفعيل الثقة</button>
              ${isThisTrusted ? `<button type="button" class="tool-btn danger" id="revoke-trust-btn">إلغاء الثقة</button>` : ""}
            </div>
          </form>
        </div>
        <div class="glass-card settings-form-card">
          <h3>تغيير كلمة المرور</h3>
          <form id="pass-update-form" style="margin-top:14px">
            <div class="form-group"><label>كلمة المرور الحالية</label><input type="password" id="sec-old-pass" required /></div>
            <div class="form-group"><label>كلمة المرور الجديدة</label><input type="password" id="sec-new-pass" required minlength="6" /></div>
            <button type="submit" class="btn-primary-glass">تحديث كلمة المرور</button>
          </form>
        </div>
      </div>

      ${hasPerm("view_logs") ? `
        <div class="glass-card settings-form-card" style="margin-top:22px">
          <div class="logs-head-row">
            <h3>سجل النشاطات والعمليات الأخيرة</h3>
            <div class="local-search-box"><span>${ICONS.search}</span><input type="search" id="logs-search-input" placeholder="بحث في السجلات..." value="${escapeHtml(state.filters.logSearch)}" /></div>
          </div>
          <div id="logs-list-wrap" class="logs-stack"></div>
        </div>
      ` : ""}
    </div>
  `;

  document.getElementById("back-to-hub")?.addEventListener("click", () => navigateAdmin("hub"));
  document.getElementById("self-avatar-file")?.addEventListener("change", async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadCompressedImageToImgBB(f, document.getElementById("self-avatar-status"), 512);
      document.getElementById("self-avatar-url").value = url;
      document.getElementById("self-avatar-preview").innerHTML = renderAvatarHtml(url, me.displayName || me.username, "lg");
    } catch (err) { showToast(err.message, "error"); }
  });

  document.getElementById("self-profile-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const updates = { displayName: document.getElementById("self-display").value.trim(), avatarUrl: document.getElementById("self-avatar-url").value.trim(), bio: document.getElementById("self-bio").value.trim(), updatedAt: new Date().toISOString() };
    await updateDoc(doc(db, "admins", me.id), updates);
    state.currentUser = { ...state.currentUser, ...updates };
    const idx = state.admins.findIndex((a) => a.id === me.id);
    if (idx >= 0) state.admins[idx] = { ...state.admins[idx], ...updates };
    applyAdminBranding();
    showToast("تم تحديث ملفك الشخصي ✓");
  });

  document.getElementById("pin-update-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pin = document.getElementById("sec-new-pin").value.trim();
    if (!/^\d{4}$/.test(pin)) { showToast("يجب إدخال 4 أرقام بالضبط", "error"); return; }
    const pinHash = await sha256(pin);
    await updateDoc(doc(db, "admins", me.id), { pinHash });
    state.currentUser.pinHash = pinHash;
    setTrustedDevice({ adminId: me.id, username: me.username, mode: "pin", skipPin: false });
    showToast("تم حفظ الرمز السريع ✓");
    renderAdminView();
  });
  document.getElementById("revoke-trust-btn")?.addEventListener("click", () => { clearTrustedDevice(); showToast("تم إلغاء الثقة"); renderAdminView(); });
  document.getElementById("pass-update-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if ((await sha256(document.getElementById("sec-old-pass").value)) !== state.currentUser.passwordHash) { showToast("كلمة المرور الحالية غير صحيحة", "error"); return; }
    const newHash = await sha256(document.getElementById("sec-new-pass").value);
    await updateDoc(doc(db, "admins", me.id), { passwordHash: newHash });
    state.currentUser.passwordHash = newHash;
    showToast("تم تحديث كلمة المرور ✓");
    e.target.reset();
  });

  if (hasPerm("view_logs")) {
    const paintLogs = () => {
      const list = smartFilter(state.logs, state.filters.logSearch, (l) => `${l.actor} ${l.action} ${l.details}`);
      document.getElementById("logs-list-wrap").innerHTML = list.length ? list.map((l) => `
        <div class="log-row">
          <div class="log-actor-wrap">${renderAvatarHtml(l.actorAvatar, l.actor, "mini")}<div><strong>${escapeHtml(l.action)}</strong> — <span>${escapeHtml(l.details || "")}</span></div></div>
          <small>${escapeHtml(l.actor)} • ${formatDate(l.createdAt)}</small>
        </div>
      `).join("") : `<p class="helper-hint">لا توجد سجلات مطابقة.</p>`;
    };
    document.getElementById("logs-search-input")?.addEventListener("input", (e) => { state.filters.logSearch = e.target.value; paintLogs(); });
    paintLogs();
  }
}

/* ============================================================================
 * 18. البحث العالمي الذكي (تذاكر LISAN- + طلبة + محتوى + اختبارات + نبذ الموظفين)
 * ============================================================================ */
function openAdminSpotlight() {
  const modal = document.getElementById("admin-spotlight-modal");
  const input = document.getElementById("admin-spotlight-input");
  if (!modal) return;
  modal.hidden = false;
  setTimeout(() => input?.focus(), 30);
  renderAdminSpotlightResults(input?.value || "");
}
function closeAdminSpotlight() { const m = document.getElementById("admin-spotlight-modal"); if (m) m.hidden = true; }

function renderAdminSpotlightResults(q) {
  const wrap = document.getElementById("admin-spotlight-results");
  if (!wrap) return;
  if (!q.trim()) {
    wrap.innerHTML = `<div class="spotlight-hint">ابحث برقم تذكرة الدعم (LISAN-...)، أو باسم طالب أو جامعته، أو أي كلمة من نبذة الموظفين أو المحتوى...</div>`;
    return;
  }

  const hits = [];
  if (hasPerm("manage_support")) {
    smartFilter(state.tickets, q, (t) => `${t.ticketId || t.id} ${t.requesterName || ""} ${t.contact || ""} ${t.subject || ""}`).slice(0, 6).forEach((t) => {
      hits.push({ type: "ticket", id: t.id, title: `${t.ticketId || t.id} — ${t.subject}`, sub: t.requesterName, tag: "تذكرة دعم" });
    });
  }
  if (hasPerm("manage_students")) {
    smartFilter(state.students, q, (s) => `${s.fullName || ""} ${s.email || ""} ${s.university || ""} ${s.major || ""}`).slice(0, 6).forEach((s) => {
      hits.push({ type: "student", id: s.id, title: s.fullName, sub: `${s.university || ""} • ${s.email}`, tag: "طالب" });
    });
  }
  if (hasPerm("manage_content")) {
    smartFilter(state.items, q, (it) => `${it.title} ${it.branch} ${it.summary || ""} ${(it.tags || []).join(" ")}`).slice(0, 6).forEach((it) => {
      hits.push({ type: "item", id: it.id, title: it.title, sub: it.branch, tag: "محتوى" });
    });
  }
  if (hasPerm("manage_quizzes")) {
    smartFilter(state.quizzes, q, (qz) => `${qz.title} ${qz.branch}`).slice(0, 4).forEach((qz) => {
      hits.push({ type: "quiz", id: qz.id, title: qz.title, sub: qz.branch, tag: "اختبار" });
    });
  }
  if (hasPerm("manage_admins")) {
    smartFilter(state.admins, q, (ad) => `${ad.displayName || ""} ${ad.username} ${ad.bio || ""}`).slice(0, 5).forEach((ad) => {
      hits.push({ type: "admin", id: ad.id, title: ad.displayName || ad.username, sub: ad.bio || ad.username, tag: "موظف" });
    });
  }

  if (!hits.length) { wrap.innerHTML = `<div class="spotlight-hint">لا توجد نتائج مطابقة لـ "${escapeHtml(q)}"</div>`; return; }

  wrap.innerHTML = hits.map((h) => `
    <button type="button" class="spotlight-row" data-sp-type="${h.type}" data-sp-id="${escapeHtml(h.id)}">
      <div class="spotlight-row-main"><strong>${escapeHtml(h.title)}</strong><span>${escapeHtml(h.sub || "")}</span></div>
      <span class="pill-badge">${h.tag}</span>
    </button>
  `).join("");

  wrap.querySelectorAll("[data-sp-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeAdminSpotlight();
      const { spType, spId } = btn.dataset;
      if (spType === "ticket") { const t = state.tickets.find((x) => x.id === spId); if (t) openTicketReplyModal(t); }
      else if (spType === "student") { const s = state.students.find((x) => x.id === spId); if (s) openStudentManagementModal(s); }
      else if (spType === "item") { const it = state.items.find((x) => x.id === spId); if (it) openItemEditorModal(it); }
      else if (spType === "quiz") { const qz = state.quizzes.find((x) => x.id === spId); if (qz) openQuizEditorModal(qz); }
      else if (spType === "admin") { const ad = state.admins.find((x) => x.id === spId); if (ad) openAdminEditorModal(ad); }
    });
  });
}

/* ============================================================================
 * 19. النافذة المنبثقة العامة ونقطة الانطلاق
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
  document.getElementById("preview-modal-backdrop")?.addEventListener("click", (e) => { if (e.target.id === "preview-modal-backdrop") closeLivePreviewModal(); });
  document.getElementById("close-admin-spotlight")?.addEventListener("click", closeAdminSpotlight);
  document.getElementById("admin-spotlight-modal")?.addEventListener("click", (e) => { if (e.target.id === "admin-spotlight-modal") closeAdminSpotlight(); });
  document.getElementById("admin-spotlight-input")?.addEventListener("input", (e) => renderAdminSpotlightResults(e.target.value));

  document.addEventListener("keydown", (e) => {
    if (!state.currentUser) return;
    if ((e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) &&
        !document.activeElement?.isContentEditable) {
      e.preventDefault();
      openAdminSpotlight();
    } else if (e.key === "Escape") {
      if (!document.getElementById("preview-modal-backdrop")?.hidden) closeLivePreviewModal();
      else { closeAdminSpotlight(); closeModal(); }
    }
  });

  checkInitialAuth();
}

document.addEventListener("DOMContentLoaded", initAdminApp);
