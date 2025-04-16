-- Table des settings
create table public.rice_settings (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  custom_weights_enabled boolean null default false,
  local_market_rule_enabled boolean null default true,
  reach_weight numeric null default 30,
  impact_weight numeric null default 30,
  confidence_weight numeric null default 20,
  effort_weight numeric null default 20,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint rice_settings_pkey primary key (id)
) TABLESPACE pg_default;

-- Table des sessions
create table public.rice_sessions (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  description text null,
  feature_name text null,
  feature_description text null,
  status text null default 'active'::text,
  settings_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint rice_sessions_pkey primary key (id),
  constraint rice_sessions_settings_id_fkey foreign KEY (settings_id) references rice_settings (id)
) TABLESPACE pg_default;

create index IF not exists idx_rice_sessions_settings_id on public.rice_sessions using btree (settings_id) TABLESPACE pg_default;

-- Table des participants
create table public.rice_participants (
  id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid null,
  name text not null,
  role text null default 'participant'::text,
  joined_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint rice_participants_pkey primary key (id),
  constraint rice_participants_session_id_fkey foreign KEY (session_id) references rice_sessions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_rice_participants_session_id on public.rice_participants using btree (session_id) TABLESPACE pg_default;

-- Table Settings Reach Categories
create table public.rice_reach_categories (
  id uuid not null default extensions.uuid_generate_v4 (),
  settings_id uuid null,
  name text not null,
  min_reach numeric not null,
  max_reach numeric not null,
  points numeric not null,
  example text null,
  created_at timestamp with time zone null default now(),
  constraint rice_reach_categories_pkey primary key (id),
  constraint rice_reach_categories_settings_id_fkey foreign KEY (settings_id) references rice_settings (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_rice_reach_categories_settings_id on public.rice_reach_categories using btree (settings_id) TABLESPACE pg_default;

-- Table Settings Impact KPI
create table public.rice_impact_kpis (
  id uuid not null default extensions.uuid_generate_v4 (),
  settings_id uuid null,
  name text not null,
  min_delta text not null,
  max_delta text not null,
  points_per_unit text not null,
  example text null,
  is_behavior_metric boolean null default false,
  parent_kpi_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint rice_impact_kpis_pkey primary key (id),
  constraint rice_impact_kpis_parent_kpi_id_fkey foreign KEY (parent_kpi_id) references rice_impact_kpis (id),
  constraint rice_impact_kpis_settings_id_fkey foreign KEY (settings_id) references rice_settings (id) on delete CASCADE
) TABLESPACE pg_default;

-- Table Settings Effort Size
create table public.rice_effort_sizes (
  id uuid not null default extensions.uuid_generate_v4 (),
  settings_id uuid null,
  name text not null,
  duration text not null,
  dev_effort numeric not null,
  design_effort numeric not null,
  example text null,
  created_at timestamp with time zone null default now(),
  constraint rice_effort_sizes_pkey primary key (id),
  constraint rice_effort_sizes_settings_id_fkey foreign KEY (settings_id) references rice_settings (id) on delete CASCADE
) TABLESPACE pg_default;

-- Table Settings Confidence
create table public.rice_confidence_sources (
  id uuid not null default extensions.uuid_generate_v4 (),
  settings_id uuid null,
  name text not null,
  points numeric not null,
  example text null,
  created_at timestamp with time zone null default now(),
  constraint rice_confidence_sources_pkey primary key (id),
  constraint rice_confidence_sources_settings_id_fkey foreign KEY (settings_id) references rice_settings (id) on delete CASCADE
) TABLESPACE pg_default;

-- Table Reach Votes
create table public.rice_reach_votes (
  id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid null,
  participant_id uuid null,
  category_id uuid null,
  created_at timestamp with time zone null default now(),
  value numeric not null default 1,
  constraint rice_reach_votes_pkey primary key (id),
  constraint rice_reach_votes_session_id_participant_id_key unique (session_id, participant_id),
  constraint rice_reach_votes_category_id_fkey foreign KEY (category_id) references rice_reach_categories (id),
  constraint rice_reach_votes_participant_id_fkey foreign KEY (participant_id) references rice_participants (id) on delete CASCADE,
  constraint rice_reach_votes_session_id_fkey foreign KEY (session_id) references rice_sessions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_rice_reach_votes_session_id on public.rice_reach_votes using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_rice_reach_votes_participant_id on public.rice_reach_votes using btree (participant_id) TABLESPACE pg_default;

-- Table Impact Votes
create table public.rice_impact_votes (
  id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid null,
  participant_id uuid null,
  kpi_id uuid null,
  expected_value numeric not null,
  created_at timestamp with time zone null default now(),
  constraint rice_impact_votes_pkey primary key (id),
  constraint rice_impact_votes_kpi_id_fkey foreign KEY (kpi_id) references rice_impact_kpis (id),
  constraint rice_impact_votes_participant_id_fkey foreign KEY (participant_id) references rice_participants (id) on delete CASCADE,
  constraint rice_impact_votes_session_id_fkey foreign KEY (session_id) references rice_sessions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_rice_impact_votes_session_id on public.rice_impact_votes using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_rice_impact_votes_participant_id on public.rice_impact_votes using btree (participant_id) TABLESPACE pg_default;

-- Table Effort Votes
create table public.rice_effort_votes (
  id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid null,
  participant_id uuid null,
  dev_size_id uuid null,
  design_size_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint rice_effort_votes_pkey primary key (id),
  constraint rice_effort_votes_session_id_participant_id_key unique (session_id, participant_id),
  constraint rice_effort_votes_design_size_id_fkey foreign KEY (design_size_id) references rice_effort_sizes (id),
  constraint rice_effort_votes_dev_size_id_fkey foreign KEY (dev_size_id) references rice_effort_sizes (id),
  constraint rice_effort_votes_participant_id_fkey foreign KEY (participant_id) references rice_participants (id) on delete CASCADE,
  constraint rice_effort_votes_session_id_fkey foreign KEY (session_id) references rice_sessions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_rice_effort_votes_session_id on public.rice_effort_votes using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_rice_effort_votes_participant_id on public.rice_effort_votes using btree (participant_id) TABLESPACE pg_default;

-- Table Confidence Votes
create table public.rice_confidence_votes (
  id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid null,
  participant_id uuid null,
  source_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint rice_confidence_votes_pkey primary key (id),
  constraint rice_confidence_votes_participant_id_fkey foreign KEY (participant_id) references rice_participants (id) on delete CASCADE,
  constraint rice_confidence_votes_session_id_fkey foreign KEY (session_id) references rice_sessions (id) on delete CASCADE,
  constraint rice_confidence_votes_source_id_fkey foreign KEY (source_id) references rice_confidence_sources (id)
) TABLESPACE pg_default;

create index IF not exists idx_rice_confidence_votes_session_id on public.rice_confidence_votes using btree (session_id) TABLESPACE pg_default;

create index IF not exists idx_rice_confidence_votes_participant_id on public.rice_confidence_votes using btree (participant_id) TABLESPACE pg_default;

-- Table pour résumer les votes et calculer le score RICE final
create table public.rice_results_summary (
  id uuid not null default extensions.uuid_generate_v4 (),
  session_id uuid not null,
  reach_score numeric not null default 0,
  impact_score numeric not null default 0,
  confidence_score numeric not null default 0,
  effort_score numeric not null default 0,
  rice_score numeric not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint rice_results_summary_pkey primary key (id),
  constraint rice_results_summary_session_id_key unique (session_id),
  constraint rice_results_summary_session_id_fkey foreign KEY (session_id) references rice_sessions (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_rice_results_summary_session_id on public.rice_results_summary using btree (session_id) TABLESPACE pg_default;
