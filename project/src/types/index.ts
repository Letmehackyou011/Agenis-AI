export interface Metric {
  id: string;
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  network_usage: number;
  is_anomaly: boolean;
  anomaly_score: number;
  created_at: string;
}

export interface Incident {
  id: string;
  metric_id: string;
  severity: 'low' | 'medium' | 'high';
  status: 'detected' | 'healing' | 'recovered' | 'failed';
  description: string;
  detected_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface Action {
  id: string;
  incident_id: string;
  action_type: string;
  action_details: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'failed';
  result: string | null;
  executed_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface Log {
  incident: Incident;
  metric?: Metric;
  actions?: Action[];
}
