import type {
  AssessmentBatteryMeta,
  AssessmentCategory,
  AssessmentPreset,
  AssessmentQuestion,
} from "@/types/hris";
import { NUMERICAL_VERBAL_QUESTIONS } from "./numerical-verbal";
import { ABSTRACT_SPATIAL_SPEED_QUESTIONS } from "./abstract-spatial-speed";
import { PERSONALITY_SJT_QUESTIONS } from "./personality-sjt";

export const ALL_QUESTIONS: AssessmentQuestion[] = [
  ...NUMERICAL_VERBAL_QUESTIONS,
  ...ABSTRACT_SPATIAL_SPEED_QUESTIONS,
  ...PERSONALITY_SJT_QUESTIONS,
];

export const ASSESSMENT_BATTERIES: AssessmentBatteryMeta[] = [
  {
    id: "numerical",
    name: {
      id: "Penalaran Numerik & Analisis Kuantitatif",
      en: "Numerical Reasoning & Quantitative Analysis",
    },
    shortName: { id: "Numerik", en: "Numerical" },
    description: {
      id: "Deret angka, rasio keuangan, proyeksi bisnis, probabilitas, dan pertumbuhan majemuk.",
      en: "Number series, financial ratios, business projections, probability, and compound growth.",
    },
    durationMinutes: 15,
    questionCount: 15,
    type: "cognitive",
    color: "#22d3ee",
    badge: "SHL / GMAT Calibrated",
  },
  {
    id: "verbal",
    name: {
      id: "Penalaran Verbal & Logika Kritis",
      en: "Verbal Reasoning & Critical Logic",
    },
    shortName: { id: "Verbal", en: "Verbal" },
    description: {
      id: "Silogisme deduktif, evaluasi argumen, fallacy detection, analogi, dan pemahaman teks bisnis.",
      en: "Deductive syllogisms, argument evaluation, fallacy detection, analogies, and business passages.",
    },
    durationMinutes: 12,
    questionCount: 15,
    type: "cognitive",
    color: "#818cf8",
    badge: "Critical Thinking",
  },
  {
    id: "abstract",
    name: {
      id: "Penalaran Abstrak & Matriks Pola (Raven's Style)",
      en: "Abstract & Pattern Matrix (Raven's Style)",
    },
    shortName: { id: "Abstrak", en: "Abstract" },
    description: {
      id: "Matriks visual 3×3 interaktif, transformasi rotasi, simetri geometris, dan dekripsi pola kode.",
      en: "Interactive 3×3 visual matrices, geometric rotations, symmetry rules, and cipher sequences.",
    },
    durationMinutes: 15,
    questionCount: 15,
    type: "cognitive",
    color: "#34d399",
    badge: "Fluid Intelligence (Gf)",
  },
  {
    id: "spatial",
    name: {
      id: "Logika Spasial, Graf & Algoritmik",
      en: "Spatial, Graph & Algorithmic Deduction",
    },
    shortName: { id: "Spasial", en: "Spatial" },
    description: {
      id: "Orientasi 3D, pemetaan ruang, diagram alur logika, dependensi sistem, dan topologi jaringan.",
      en: "3D mental folding, room mapping, algorithmic flowcharts, dependency graphs, and topologies.",
    },
    durationMinutes: 12,
    questionCount: 12,
    type: "cognitive",
    color: "#fbbf24",
    badge: "Systems Thinking",
  },
  {
    id: "speed",
    name: {
      id: "Kecepatan Perseptual & Ketelitian Audit (Kraepelin)",
      en: "Perceptual Speed & Audit Accuracy (Kraepelin)",
    },
    shortName: { id: "Ketelitian", en: "Speed & Audit" },
    description: {
      id: "Verifikasi kode presisi tinggi, deteksi anomali payroll, dan komputasi cepat di bawah tekanan waktu.",
      en: "High-precision code verification, payroll anomaly detection, and rapid calculation under pressure.",
    },
    durationMinutes: 5,
    questionCount: 10,
    type: "cognitive",
    color: "#fb7185",
    badge: "High-Pressure Speed",
  },
  {
    id: "big5",
    name: {
      id: "Inventori Kepribadian Big Five (OCEAN)",
      en: "Big Five Personality Inventory (OCEAN)",
    },
    shortName: { id: "Big Five", en: "Big Five" },
    description: {
      id: "Pemetaan ilmiah 5 dimensi kepribadian kerja internasional dengan item reverse-scored.",
      en: "Scientific mapping of 5 international workplace traits with reverse-scored validity items.",
    },
    durationMinutes: 8,
    questionCount: 15,
    type: "psychometric",
    color: "#a78bfa",
    badge: "IPIP-NEO Standard",
  },
  {
    id: "disc",
    name: {
      id: "Profil Gaya Perilaku Kerja DISC",
      en: "DISC Behavioral Work-Style Profile",
    },
    shortName: { id: "DISC", en: "DISC" },
    description: {
      id: "Analisis kecenderungan Dominance, Influence, Steadiness, dan Compliance untuk pemetaan peran tim.",
      en: "Dominance, Influence, Steadiness, and Compliance profiling for optimal team & role alignment.",
    },
    durationMinutes: 8,
    questionCount: 12,
    type: "psychometric",
    color: "#38bdf8",
    badge: "Behavioral Archetype",
  },
  {
    id: "sjt",
    name: {
      id: "Situational Judgment Test (Kepemimpinan & Etika)",
      en: "Situational Judgment Test (Leadership & Ethics)",
    },
    shortName: { id: "SJT", en: "SJT" },
    description: {
      id: "10 studi kasus dilema korporat global: keamanan data, manajemen krisis, konflik stakeholder, dan etika.",
      en: "10 realistic global corporate dilemmas covering data security, crisis management, stakeholders, and ethics.",
    },
    durationMinutes: 10,
    questionCount: 10,
    type: "psychometric",
    color: "#f59e0b",
    badge: "Executive SJT",
  },
];

export const ASSESSMENT_PRESETS: AssessmentPreset[] = [
  {
    id: "executive-full",
    name: {
      id: "Full International Assessment Center (Lengkap 104 Soal)",
      en: "Full International Assessment Center (Complete 104 Qs)",
    },
    description: {
      id: "Seluruh 8 baterai Kognitif IQ + Big Five OCEAN + DISC + SJT untuk seleksi manajerial, senior & global hire.",
      en: "All 8 batteries: Cognitive IQ + Big Five OCEAN + DISC + SJT for senior, managerial, and global roles.",
    },
    categories: ["numerical", "verbal", "abstract", "spatial", "speed", "big5", "disc", "sjt"],
    durationMinutes: 85,
    targetLevel: "Senior / Manager / Executive",
  },
  {
    id: "cognitive-pro",
    name: {
      id: "Cognitive IQ & Reasoning Pro (67 Soal)",
      en: "Cognitive IQ & Reasoning Pro (67 Qs)",
    },
    description: {
      id: "Fokus penuh pada kemampuan intelektual: Numerik, Verbal, Matriks Abstrak, Spasial, dan Ketelitian Audit.",
      en: "Deep cognitive battery: Numerical, Verbal, Visual Abstract Matrices, Spatial Logic, and Audit Speed.",
    },
    categories: ["numerical", "verbal", "abstract", "spatial", "speed"],
    durationMinutes: 59,
    targetLevel: "Analyst / Engineer / Specialist",
  },
  {
    id: "psychometric-culture",
    name: {
      id: "Psikotes Kepribadian & Leadership Fit (37 Soal)",
      en: "Psychometric Personality & Leadership Fit (37 Qs)",
    },
    description: {
      id: "Pemetaan psikologis lengkap Big Five (OCEAN), gaya komunikasi DISC, dan Situational Judgment Test.",
      en: "Complete psychological profiling: Big Five (OCEAN), DISC work style, and Situational Judgment Test.",
    },
    categories: ["big5", "disc", "sjt"],
    durationMinutes: 26,
    targetLevel: "All Roles / Culture Fit",
  },
  {
    id: "engineering-tech",
    name: {
      id: "Tech, AI & Engineering Cognitive Suite (62 Soal)",
      en: "Tech, AI & Engineering Cognitive Suite (62 Qs)",
    },
    description: {
      id: "Dirancang untuk Software Engineer, Data Scientist, dan Arsitek Sistem (Numerik, Abstrak, Spasial, Speed, SJT).",
      en: "Tailored for Software Engineers, Data Scientists & Architects (Numerical, Abstract, Spatial, Speed, SJT).",
    },
    categories: ["numerical", "abstract", "spatial", "speed", "sjt"],
    durationMinutes: 57,
    targetLevel: "Tech / Product / Data",
  },
  {
    id: "express-screening",
    name: {
      id: "Express 360° Screening (24 Soal Terkalibrasi — 20 Menit)",
      en: "Express 360° Screening (24 Calibrated Qs — 20 Mins)",
    },
    description: {
      id: "Skrining cepat namun komprehensif: 3 soal representatif dari seluruh 8 baterai Kognitif & Psikotes.",
      en: "Rapid yet comprehensive screening pulling 3 representative items across all 8 Cognitive & Psychometric domains.",
    },
    categories: ["numerical", "verbal", "abstract", "spatial", "speed", "big5", "disc", "sjt"],
    durationMinutes: 20,
    expressLimitPerCategory: 3,
    targetLevel: "Fast Screening / Live Demo",
  },
];

function deterministicShuffle<T>(items: T[], seedStr: string): T[] {
  const arr = [...items];
  let seed = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    seed ^= seedStr.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function selectQuestionsForSession(
  categories: AssessmentCategory[],
  expressLimitPerCategory?: number,
  sessionSeed?: string
): AssessmentQuestion[] {
  const result: AssessmentQuestion[] = [];
  for (const cat of categories) {
    const rawItems = ALL_QUESTIONS.filter((q) => q.category === cat);
    const pool = sessionSeed
      ? deterministicShuffle(rawItems, `${sessionSeed}:${cat}`)
      : rawItems;
    if (expressLimitPerCategory && expressLimitPerCategory > 0) {
      result.push(...pool.slice(0, expressLimitPerCategory));
    } else {
      result.push(...pool);
    }
  }
  return result;
}

export function getBatteryMeta(category: AssessmentCategory): AssessmentBatteryMeta {
  return (
    ASSESSMENT_BATTERIES.find((b) => b.id === category) || ASSESSMENT_BATTERIES[0]
  );
}
