import { useEffect, useState } from 'react';
import { Shield, Activity } from 'lucide-react';
import { MetricsChart } from './components/MetricsChart';
import { AlertPanel } from './components/AlertPanel';
import { ActionLog } from './components/ActionLog';
import { MetricCard } from './components/MetricCard';
import { supabase } from './lib/supabase';
import { Metric, Incident } from './types';

const API_URL = 'http://localhost:3000/api';
const WS_URL = 'ws://localhost:3000';

function App() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [currentMetric, setCurrentMetric] = useState<Metric | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    fetchInitialData();
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'metric') {
        setMetrics((prev) => [...prev.slice(-49), message.data]);
        setCurrentMetric(message.data);
      } else if (message.type === 'incident') {
        setIncidents((prev) => [message.data, ...prev]);
        fetchLogs();
      } else if (message.type === 'action_completed') {
        fetchIncidents();
        fetchLogs();
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
      setTimeout(connectWebSocket, 5000);
    };

    setWs(websocket);
  };

  const fetchInitialData = async () => {
    await Promise.all([fetchMetrics(), fetchIncidents(), fetchLogs()]);
  };

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data && data.length > 0) {
        setMetrics(data.reverse());
        setCurrentMetric(data[0]);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setIncidents(data);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data: incidents, error } = await supabase
        .from('incidents')
        .select(`
          *,
          metrics (cpu_usage, memory_usage, network_usage),
          actions (*)
        `)
        .order('detected_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (incidents) {
        setLogs(incidents);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-emerald-500';
      case 'connecting':
        return 'bg-amber-500 animate-pulse';
      case 'disconnected':
        return 'bg-red-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Aegis AI</h1>
                <p className="text-sm text-white/60">Autonomous Cloud Operations Monitor</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-sm text-white/80 capitalize">{connectionStatus}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            type="cpu"
            value={currentMetric?.cpu_usage || 0}
            isAnomaly={currentMetric?.is_anomaly || false}
          />
          <MetricCard
            type="memory"
            value={currentMetric?.memory_usage || 0}
            isAnomaly={currentMetric?.is_anomaly || false}
          />
          <MetricCard
            type="network"
            value={currentMetric?.network_usage || 0}
            isAnomaly={currentMetric?.is_anomaly || false}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                CPU Usage
              </h2>
              <div className="h-64">
                {metrics.length > 0 && <MetricsChart metrics={metrics} type="cpu" />}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Memory Usage
              </h2>
              <div className="h-64">
                {metrics.length > 0 && <MetricsChart metrics={metrics} type="memory" />}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-400" />
                Network Traffic
              </h2>
              <div className="h-64">
                {metrics.length > 0 && <MetricsChart metrics={metrics} type="network" />}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <AlertPanel incidents={incidents} />
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <ActionLog logs={logs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
