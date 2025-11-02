/*
  # Aegis AI Cloud Operations Monitoring Schema

  1. New Tables
    - `metrics`
      - `id` (uuid, primary key)
      - `timestamp` (timestamptz) - when the metric was captured
      - `cpu_usage` (numeric) - CPU usage percentage
      - `memory_usage` (numeric) - Memory usage percentage
      - `network_usage` (numeric) - Network usage in MB/s
      - `is_anomaly` (boolean) - whether this metric was flagged as anomalous
      - `anomaly_score` (numeric) - anomaly score from ML model
      - `created_at` (timestamptz)
    
    - `incidents`
      - `id` (uuid, primary key)
      - `metric_id` (uuid, foreign key to metrics)
      - `severity` (text) - 'low', 'medium', 'high'
      - `status` (text) - 'detected', 'healing', 'recovered', 'failed'
      - `description` (text) - description of the incident
      - `detected_at` (timestamptz)
      - `resolved_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
    
    - `actions`
      - `id` (uuid, primary key)
      - `incident_id` (uuid, foreign key to incidents)
      - `action_type` (text) - type of healing action taken
      - `action_details` (jsonb) - details about the action
      - `status` (text) - 'pending', 'running', 'success', 'failed'
      - `result` (text, nullable) - result message
      - `executed_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add public read policies (for demo purposes)
    - Add public write policies (for demo purposes)

  3. Indexes
    - Index on metrics timestamp for efficient querying
    - Index on incidents status for filtering
    - Index on actions incident_id for joins
*/

-- Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  cpu_usage numeric NOT NULL,
  memory_usage numeric NOT NULL,
  network_usage numeric NOT NULL,
  is_anomaly boolean DEFAULT false,
  anomaly_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id uuid REFERENCES metrics(id) ON DELETE CASCADE,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  status text NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'healing', 'recovered', 'failed')),
  description text NOT NULL,
  detected_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create actions table
CREATE TABLE IF NOT EXISTS actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
  result text,
  executed_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_is_anomaly ON metrics(is_anomaly);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_actions_incident_id ON actions(incident_id);

-- Enable Row Level Security
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo purposes)
CREATE POLICY "Allow public read access to metrics"
  ON metrics FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to metrics"
  ON metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read access to incidents"
  ON incidents FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to incidents"
  ON incidents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to incidents"
  ON incidents FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to actions"
  ON actions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to actions"
  ON actions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to actions"
  ON actions FOR UPDATE
  USING (true)
  WITH CHECK (true);