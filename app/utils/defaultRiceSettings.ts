import { RiceSettings, RiceWeights } from "../services/RiceService";

// Générer un ID unique
const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Poids par défaut
export const DEFAULT_WEIGHTS: RiceWeights = {
  reach: 30,
  impact: 30,
  confidence: 20,
  effort: 20
};

// Catégories de portée par défaut
export const DEFAULT_REACH_CATEGORIES = [
  {
    id: "reach-sitewide",
    name: "Sitewide Test",
    minReach: 80,
    maxReach: 100,
    points: 1.0,
    example: "Header modification"
  },
  {
    id: "reach-critical",
    name: "Critical Journey",
    minReach: 50,
    maxReach: 79,
    points: 0.7,
    example: "Checkout optimization"
  },
  {
    id: "reach-specific",
    name: "Specific Page",
    minReach: 20,
    maxReach: 49,
    points: 0.5,
    example: "Mattress PDP redesign"
  },
  {
    id: "reach-micro",
    name: "Micro-Interaction",
    minReach: 1,
    maxReach: 19,
    points: 0.3,
    example: "Delivery tooltip adjustment"
  }
];

// KPIs d'impact par défaut
export const DEFAULT_IMPACT_KPIS = [
  {
    id: "impact-cvr",
    name: "CVR (pp)",
    minDelta: "+0.5%",
    maxDelta: "+5%",
    pointsPerUnit: "0.4/pp",
    example: "Δ +2% → 0.8"
  },
  {
    id: "impact-revenue",
    name: "Revenue (€k)",
    minDelta: "+10k",
    maxDelta: "+500k",
    pointsPerUnit: "0.03/k€",
    example: "Δ +150k → 4.5"
  },
  {
    id: "impact-behavior",
    name: "Behavior*",
    minDelta: "+5%",
    maxDelta: "+50%",
    pointsPerUnit: "0.06/%",
    example: "Δ +20% AddToCart → 1.2"
  }
];

// Sources de confiance par défaut
export const DEFAULT_CONFIDENCE_SOURCES = [
  {
    id: "conf-ab-test",
    name: "Previous A/B Test",
    points: 2.5,
    example: "Similar test on collection page"
  },
  {
    id: "conf-analytics",
    name: "Advanced Analytics (SQL/GA4)",
    points: 2.0,
    example: "6-month funnel analysis"
  },
  {
    id: "conf-benchmark",
    name: "Baymard Benchmark",
    points: 1.5,
    example: "Checkout study 2024"
  },
  {
    id: "conf-testing",
    name: "User Testing (5+ participants)",
    points: 1.2,
    example: "Moderated session DE/FR"
  },
  {
    id: "conf-competitor",
    name: "Verified Competitor Copy",
    points: 0.8,
    example: "Analysis of 3 market leaders"
  },
  {
    id: "conf-audit",
    name: "Heuristic Audit",
    points: 0.5,
    example: "WCAG compliance review"
  }
];

// Tailles d'effort par défaut
export const DEFAULT_EFFORT_SIZES = [
  {
    id: "effort-xs",
    name: "XS",
    duration: "0-1 wk",
    devEffort: 0.3,
    designEffort: 0.2,
    example: "Minor CSS modification"
  },
  {
    id: "effort-s",
    name: "S",
    duration: "1-2 wk",
    devEffort: 0.5,
    designEffort: 0.3,
    example: "New tracking integration"
  },
  {
    id: "effort-m",
    name: "M",
    duration: "2-4 wk",
    devEffort: 0.8,
    designEffort: 0.5,
    example: "PDP module redesign"
  },
  {
    id: "effort-l",
    name: "L",
    duration: "4-6 wk",
    devEffort: 1.2,
    designEffort: 0.8,
    example: "Checkout revamp"
  },
  {
    id: "effort-xl",
    name: "XL",
    duration: "6-8 wk",
    devEffort: 1.5,
    designEffort: 1.2,
    example: "Payment API migration"
  }
];

// Paramètres RICE par défaut complets
export const DEFAULT_RICE_SETTINGS: Omit<RiceSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  name: "Default RICE Settings",
  customWeightsEnabled: false,
  localMarketRuleEnabled: true,
  weights: DEFAULT_WEIGHTS,
  reachCategories: DEFAULT_REACH_CATEGORIES,
  impactKPIs: DEFAULT_IMPACT_KPIS,
  confidenceSources: DEFAULT_CONFIDENCE_SOURCES,
  effortSizes: DEFAULT_EFFORT_SIZES
};

// Fonction pour créer un nouveau paramètre RICE avec les valeurs par défaut
export function createDefaultRiceSettings(name: string = "Default RICE Settings"): Omit<RiceSettings, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    ...DEFAULT_RICE_SETTINGS,
    name
  };
} 