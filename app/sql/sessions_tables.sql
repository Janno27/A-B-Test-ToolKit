-- Table des sessions RICE
CREATE TABLE rice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  feature_name TEXT,
  feature_description TEXT,
  status TEXT DEFAULT 'active',
  settings_id UUID REFERENCES rice_settings(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des participants
CREATE TABLE rice_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'participant',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des votes Reach
CREATE TABLE rice_reach_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES rice_participants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES rice_reach_categories(id),
  value NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (session_id, participant_id)
);

-- Table des votes Impact
CREATE TABLE rice_impact_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES rice_participants(id) ON DELETE CASCADE,
  kpi_id UUID REFERENCES rice_impact_kpis(id),
  expected_value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des votes Confidence
CREATE TABLE rice_confidence_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES rice_participants(id) ON DELETE CASCADE,
  source_id UUID REFERENCES rice_confidence_sources(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des votes Effort
CREATE TABLE rice_effort_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES rice_participants(id) ON DELETE CASCADE,
  dev_size_id UUID REFERENCES rice_effort_sizes(id),
  design_size_id UUID REFERENCES rice_effort_sizes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (session_id, participant_id)
);

-- Table des résultats RICE
CREATE TABLE rice_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES rice_sessions(id) ON DELETE CASCADE,
  reach_score DECIMAL,
  impact_score DECIMAL,
  confidence_score DECIMAL,
  effort_score DECIMAL,
  rice_score DECIMAL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (session_id)
);

-- Création d'index pour améliorer les performances
CREATE INDEX idx_rice_sessions_settings_id ON rice_sessions(settings_id);
CREATE INDEX idx_rice_participants_session_id ON rice_participants(session_id);
CREATE INDEX idx_rice_reach_votes_session_id ON rice_reach_votes(session_id);
CREATE INDEX idx_rice_reach_votes_participant_id ON rice_reach_votes(participant_id);
CREATE INDEX idx_rice_impact_votes_session_id ON rice_impact_votes(session_id);
CREATE INDEX idx_rice_impact_votes_participant_id ON rice_impact_votes(participant_id);
CREATE INDEX idx_rice_confidence_votes_session_id ON rice_confidence_votes(session_id);
CREATE INDEX idx_rice_confidence_votes_participant_id ON rice_confidence_votes(participant_id);
CREATE INDEX idx_rice_effort_votes_session_id ON rice_effort_votes(session_id);
CREATE INDEX idx_rice_effort_votes_participant_id ON rice_effort_votes(participant_id);
CREATE INDEX idx_rice_results_session_id ON rice_results(session_id); 