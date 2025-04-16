-- Supprimer toutes les tables existantes
DROP TABLE IF EXISTS rice_results CASCADE;
DROP TABLE IF EXISTS rice_effort_votes CASCADE;
DROP TABLE IF EXISTS rice_confidence_votes CASCADE;
DROP TABLE IF EXISTS rice_impact_votes CASCADE;
DROP TABLE IF EXISTS rice_reach_votes CASCADE;
DROP TABLE IF EXISTS rice_participants CASCADE;
DROP TABLE IF EXISTS rice_sessions CASCADE;
DROP TABLE IF EXISTS rice_effort_sizes CASCADE;
DROP TABLE IF EXISTS rice_confidence_sources CASCADE;
DROP TABLE IF EXISTS rice_impact_kpis CASCADE;
DROP TABLE IF EXISTS rice_reach_categories CASCADE;
DROP TABLE IF EXISTS rice_settings CASCADE;

-- Activation de l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table principale des paramètres RICE
CREATE TABLE rice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  custom_weights_enabled BOOLEAN DEFAULT FALSE,
  local_market_rule_enabled BOOLEAN DEFAULT TRUE,
  reach_weight NUMERIC DEFAULT 30,
  impact_weight NUMERIC DEFAULT 30,
  confidence_weight NUMERIC DEFAULT 20,
  effort_weight NUMERIC DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tables pour les sous-éléments de RICE Settings
CREATE TABLE rice_reach_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_reach INTEGER NOT NULL,
  max_reach INTEGER NOT NULL,
  points NUMERIC NOT NULL,
  example TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rice_impact_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_delta TEXT NOT NULL,
  max_delta TEXT NOT NULL,
  points_per_unit TEXT NOT NULL,
  example TEXT,
  is_behavior_metric BOOLEAN DEFAULT FALSE,
  parent_kpi_id UUID REFERENCES rice_impact_kpis(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rice_confidence_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  points NUMERIC NOT NULL,
  example TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rice_effort_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES rice_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  dev_effort NUMERIC NOT NULL,
  design_effort NUMERIC NOT NULL,
  example TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pré-remplir une configuration RICE par défaut
INSERT INTO rice_settings (
  id, 
  name, 
  custom_weights_enabled, 
  local_market_rule_enabled,
  reach_weight,
  impact_weight,
  confidence_weight,
  effort_weight
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Paramètres par défaut',
  FALSE,
  TRUE,
  30,
  30,
  20,
  20
);

-- Pré-remplir les catégories de Reach
INSERT INTO rice_reach_categories (settings_id, name, min_reach, max_reach, points, example)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Sitewide Test', 80, 100, 1.0, 'Header modification'),
('00000000-0000-0000-0000-000000000001', 'Critical Journey', 50, 79, 0.7, 'Checkout optimization'),
('00000000-0000-0000-0000-000000000001', 'Specific Page', 20, 49, 0.5, 'Product page redesign'),
('00000000-0000-0000-0000-000000000001', 'Micro-Interaction', 1, 19, 0.3, 'Delivery tooltip adjustment');

-- Pré-remplir les KPIs d'Impact
INSERT INTO rice_impact_kpis (settings_id, name, min_delta, max_delta, points_per_unit, example, is_behavior_metric, parent_kpi_id)
VALUES 
('00000000-0000-0000-0000-000000000001', 'CVR (pp)', '+0.5%', '+5%', '0.4/pp', 'Δ +2% → 0.8', FALSE, NULL),
('00000000-0000-0000-0000-000000000001', 'Revenue (€k)', '+10k', '+500k', '0.03/k€', 'Δ +150k → 4.5', FALSE, NULL),
('00000000-0000-0000-0000-000000000001', 'Behavior', '', '', 'Calculated', 'Weighted average of sub-metrics', FALSE, NULL);

-- Stocker l'ID du KPI Behavior pour les sous-métriques
DO $$
DECLARE behavior_id UUID;
BEGIN
  SELECT id INTO behavior_id FROM rice_impact_kpis WHERE name = 'Behavior' AND settings_id = '00000000-0000-0000-0000-000000000001';
  
  -- Ajouter les sous-métriques de comportement
  INSERT INTO rice_impact_kpis (settings_id, name, min_delta, max_delta, points_per_unit, example, is_behavior_metric, parent_kpi_id)
  VALUES 
  ('00000000-0000-0000-0000-000000000001', 'AddToCart', '+5%', '+30%', '0.06/%', 'Δ +15% → 0.9', TRUE, behavior_id),
  ('00000000-0000-0000-0000-000000000001', 'PDP Access', '+3%', '+25%', '0.04/%', 'Δ +10% → 0.4', TRUE, behavior_id),
  ('00000000-0000-0000-0000-000000000001', 'Scroll Depth', '+10%', '+50%', '0.03/%', 'Δ +25% → 0.75', TRUE, behavior_id);
END $$;

-- Pré-remplir les sources de Confidence
INSERT INTO rice_confidence_sources (settings_id, name, points, example)
VALUES 
('00000000-0000-0000-0000-000000000001', 'Previous A/B Test', 2.5, 'Similar test on collection page'),
('00000000-0000-0000-0000-000000000001', 'Advanced Analytics (SQL/GA4)', 2.0, '6-month funnel analysis'),
('00000000-0000-0000-0000-000000000001', 'Baymard Benchmark', 1.5, 'Checkout study 2024'),
('00000000-0000-0000-0000-000000000001', 'User Testing (5+ participants)', 1.2, 'Moderated session DE/FR'),
('00000000-0000-0000-0000-000000000001', 'Verified Competitor Copy', 0.8, 'Analysis of 3 market leaders'),
('00000000-0000-0000-0000-000000000001', 'Heuristic Audit', 0.5, 'WCAG compliance review');

-- Pré-remplir les tailles d'Effort
INSERT INTO rice_effort_sizes (settings_id, name, duration, dev_effort, design_effort, example)
VALUES 
('00000000-0000-0000-0000-000000000001', 'XS', '0-1 wk', 0.3, 0.2, 'Minor CSS modification'),
('00000000-0000-0000-0000-000000000001', 'S', '1-2 wk', 0.5, 0.3, 'New tracking integration'),
('00000000-0000-0000-0000-000000000001', 'M', '2-4 wk', 0.8, 0.5, 'PDP module redesign'),
('00000000-0000-0000-0000-000000000001', 'L', '4-6 wk', 1.2, 0.8, 'Checkout revamp'),
('00000000-0000-0000-0000-000000000001', 'XL', '6-8 wk', 1.5, 1.2, 'Payment API migration'); 