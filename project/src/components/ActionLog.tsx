import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Incident } from '../types';

interface ActionLogProps {
  logs: any[];
}

export function ActionLog({ logs }: ActionLogProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detected':
        return <Activity className="w-4 h-4 text-red-400" />;
      case 'healing':
        return <Activity className="w-4 h-4 text-amber-400 animate-pulse" />;
      case 'recovered':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'detected':
        return 'Anomaly Detected';
      case 'healing':
        return 'Self-Healing In Progress';
      case 'recovered':
        return 'System Recovered';
      case 'failed':
        return 'Healing Failed';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-4">Action Log</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {logs.map((log, index) => (
          <div
            key={log.id || index}
            className="border border-white/10 rounded-lg p-3 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(log.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-sm text-white">
                    {getStatusText(log.status)}
                  </span>
                  <span className="text-xs text-white/40 whitespace-nowrap">
                    {new Date(log.detected_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-white/70 break-words">{log.description}</p>
                {log.actions && log.actions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {log.actions.map((action: any) => (
                      <div key={action.id} className="text-xs text-white/60 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          action.status === 'success' ? 'bg-emerald-400' :
                          action.status === 'failed' ? 'bg-red-400' :
                          action.status === 'running' ? 'bg-amber-400 animate-pulse' :
                          'bg-gray-400'
                        }`}></span>
                        <span>Action: {action.action_type.replace(/_/g, ' ')}</span>
                        {action.result && <span>- {action.result}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
