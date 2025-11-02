import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

let clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

function generateMetrics() {
  const baseLoad = Math.random() * 0.3 + 0.3;
  const spike = Math.random() > 0.85 ? Math.random() * 0.4 : 0;

  return {
    cpu_usage: Math.min(100, (baseLoad + spike) * 100 + Math.random() * 10),
    memory_usage: Math.min(100, (baseLoad + spike * 0.8) * 100 + Math.random() * 15),
    network_usage: Math.min(1000, (baseLoad + spike) * 500 + Math.random() * 50),
    timestamp: new Date().toISOString()
  };
}

app.get('/api/metrics', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/predict', async (req, res) => {
  try {
    const metrics = req.body;

    const response = await fetch(`${AI_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    });

    const prediction = await response.json();

    res.json(prediction);
  } catch (error) {
    console.error('Error calling AI service:', error);
    res.status(500).json({
      anomaly: false,
      score: 0,
      error: 'AI service unavailable'
    });
  }
});

app.post('/api/heal', async (req, res) => {
  try {
    const { incident_id, action_type } = req.body;

    const { data: action, error } = await supabase
      .from('actions')
      .insert({
        incident_id,
        action_type,
        status: 'running',
        action_details: { triggered_at: new Date().toISOString() }
      })
      .select()
      .single();

    if (error) throw error;

    setTimeout(async () => {
      const healSuccess = Math.random() > 0.2;

      await supabase
        .from('actions')
        .update({
          status: healSuccess ? 'success' : 'failed',
          result: healSuccess ? 'Service restarted successfully' : 'Failed to restart service',
          completed_at: new Date().toISOString()
        })
        .eq('id', action.id);

      await supabase
        .from('incidents')
        .update({
          status: healSuccess ? 'recovered' : 'failed',
          resolved_at: healSuccess ? new Date().toISOString() : null
        })
        .eq('id', incident_id);

      broadcast({
        type: 'action_completed',
        action_id: action.id,
        incident_id,
        success: healSuccess
      });
    }, 3000);

    res.json({ success: true, action });
  } catch (error) {
    console.error('Error executing heal action:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const { data: incidents, error: incidentsError } = await supabase
      .from('incidents')
      .select(`
        *,
        metrics (cpu_usage, memory_usage, network_usage),
        actions (*)
      `)
      .order('detected_at', { ascending: false })
      .limit(20);

    if (incidentsError) throw incidentsError;

    res.json({ success: true, data: incidents });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/incidents', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

async function monitoringLoop() {
  try {
    const metrics = generateMetrics();

    const prediction = await fetch(`${AI_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics)
    }).then(r => r.json()).catch(() => ({ anomaly: false, score: 0 }));

    const { data: savedMetric, error } = await supabase
      .from('metrics')
      .insert({
        ...metrics,
        is_anomaly: prediction.anomaly,
        anomaly_score: prediction.score || 0
      })
      .select()
      .single();

    if (error) throw error;

    broadcast({ type: 'metric', data: savedMetric });

    if (prediction.anomaly && prediction.score > 0.6) {
      const severity = prediction.score > 0.8 ? 'high' : prediction.score > 0.7 ? 'medium' : 'low';

      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .insert({
          metric_id: savedMetric.id,
          severity,
          status: 'detected',
          description: `Anomaly detected: CPU ${metrics.cpu_usage.toFixed(1)}%, Memory ${metrics.memory_usage.toFixed(1)}%, Network ${metrics.network_usage.toFixed(1)} MB/s`
        })
        .select()
        .single();

      if (!incidentError && incident) {
        broadcast({ type: 'incident', data: incident });

        await supabase
          .from('incidents')
          .update({ status: 'healing' })
          .eq('id', incident.id);

        const healResponse = await fetch('http://localhost:3000/api/heal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incident_id: incident.id,
            action_type: 'restart_service'
          })
        });

        await healResponse.json();
      }
    }
  } catch (error) {
    console.error('Monitoring loop error:', error.message);
  }
}

setInterval(monitoringLoop, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
