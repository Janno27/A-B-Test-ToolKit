// Types pour les services Rice
export interface RiceWeights {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
}

export interface ReachCategory {
  id: string;
  name: string;
  minReach: number;
  maxReach: number;
  points: number;
  example: string;
}

export interface ImpactKPI {
  id: string;
  name: string;
  minDelta: string;
  maxDelta: string;
  pointsPerUnit: string;
  example: string;
  isBehaviorMetric?: boolean;
  parentKPI?: string;
}

export interface ImpactMetric {
  id: string;
  name: string;
  description: string;
  points: number;
  example: string;
  color?: string;
}

export interface ConfidenceSource {
  id: string;
  name: string;
  points: number;
  example: string;
  description?: string;
}

export interface EffortSize {
  id: string;
  name: string;
  duration: string;
  devEffort: number;
  designEffort: number;
  example: string;
}

// Interface pour les mises à jour individuelles d'éléments
export interface SingleItemUpdate {
  type: 'reach' | 'impact' | 'confidence' | 'effort';
  itemId: string;
  key: string;
  value: any;
}

// Interface pour les suppressions individuelles d'éléments
export interface SingleItemDelete {
  type: 'reach' | 'impact' | 'confidence' | 'effort';
  itemId: string;
}

export interface RiceSettings {
  id: string;
  name: string;
  customWeightsEnabled: boolean;
  localMarketRuleEnabled: boolean;
  reachWeight: number;
  impactWeight: number;
  confidenceWeight: number;
  effortWeight: number;
  weights: RiceWeights;
  reachCategories: ReachCategory[];
  impactKPIs: ImpactKPI[];
  confidenceSources: ConfidenceSource[];
  effortSizes: EffortSize[];
  impactMetrics?: ImpactMetric[];
  createdAt: string;
  updatedAt: string;
  updateSingleItem?: SingleItemUpdate; // Pour les mises à jour individuelles
  deleteSingleItem?: SingleItemDelete; // Pour les suppressions individuelles
}

// Interface pour le service RICE
export interface RiceServiceInterface {
  getAllSettings(): Promise<RiceSettings[]>;
  getSettingsById(id: string): Promise<RiceSettings | null>;
  createSettings(settings: Omit<RiceSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiceSettings>;
  updateSettings(id: string, updates: Partial<RiceSettings>): Promise<RiceSettings>;
  deleteSettings(id: string): Promise<boolean>;
} 