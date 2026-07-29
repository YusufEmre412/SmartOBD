import React, { useState, useEffect } from 'react';
import { Plus, PenTool, Calendar, Droplets, Wrench, Activity, AlertOctagon } from 'lucide-react';

export default function MaintenanceLog() {
  const [logs, setLogs] = useState([
    { id: 1, type: "Oil Change", date: new Date().toLocaleDateString(), mileage: 145000, desc: "Replaced oil drain plug due to stripping." },
    { id: 2, type: "Fluid Leak", date: new Date().toLocaleDateString(), mileage: 145200, desc: "Minor oil seep near oil pan.", severity: "Low" }
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ type: 'Repair', desc: '', mileage: '', severity: 'Low' });
  const [leakWarning, setLeakWarning] = useState(false);

  useEffect(() => {
    // Dynamic threshold alerts for fluid leaks
    const fluidLeaks = logs.filter(l => l.type === 'Fluid Leak');
    const hasHighSeverity = fluidLeaks.some(l => l.severity === 'High');
    const multipleRecentLeaks = fluidLeaks.length >= 2; // simplified check
    
    setLeakWarning(hasHighSeverity || multipleRecentLeaks);
  }, [logs]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLog = {
      id: Date.now(),
      type: formData.type,
      desc: formData.desc,
      mileage: parseInt(formData.mileage) || 0,
      severity: formData.type === 'Fluid Leak' ? formData.severity : undefined,
      date: new Date().toLocaleDateString()
    };
    
    setLogs([newLog, ...logs]);
    setShowForm(false);
    setFormData({ type: 'Repair', desc: '', mileage: '', severity: 'Low' });
  };

  return (
    <div className="glass-panel p-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent-500/10 rounded-lg text-accent-500">
            <PenTool size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Maintenance Log</h2>
            <p className="text-sm text-slate-400">Track heavy-duty repairs and leaks</p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary !bg-dark-700 hover:!bg-dark-600 flex items-center gap-2"
        >
          {showForm ? 'Cancel' : <><Plus size={18} /> Add Log</>}
        </button>
      </div>

      {leakWarning && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200 animate-pulse">
          <AlertOctagon size={24} className="text-red-500 shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-red-400">Critical Fluid Leak Alert</h4>
            <p className="text-sm mt-1">Our dynamic system detected multiple recent fluid leaks or a high-severity leak. Inspect your vehicle immediately to prevent catastrophic engine or transmission failure.</p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-dark-900/80 p-4 rounded-lg border border-primary-500/30 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Type</label>
              <select 
                className="input-field"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option>Repair</option>
                <option>Fluid Leak</option>
                <option>Oil Change</option>
                <option>Inspection</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Mileage</label>
              <input 
                type="number" 
                required
                className="input-field" 
                placeholder="e.g. 150000"
                value={formData.mileage}
                onChange={(e) => setFormData({...formData, mileage: e.target.value})}
              />
            </div>
            {formData.type === 'Fluid Leak' && (
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-1">Severity</label>
                <select 
                  className="input-field"
                  value={formData.severity}
                  onChange={(e) => setFormData({...formData, severity: e.target.value})}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Description</label>
              <textarea 
                required
                className="input-field" 
                rows="2"
                placeholder="Details about the repair or leak..."
                value={formData.desc}
                onChange={(e) => setFormData({...formData, desc: e.target.value})}
              ></textarea>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">Save Log Entry</button>
        </form>
      )}

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {logs.map(log => (
          <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-dark-900/50 rounded-lg border border-slate-700/30 hover:border-slate-600 transition-colors group">
            <div>
              <h4 className="font-medium text-white flex items-center gap-2 mb-1">
                {log.type === 'Fluid Leak' ? <Droplets size={16} className={log.severity === 'High' ? "text-red-500" : "text-primary-500"}/> : <Wrench size={16} className="text-slate-400"/>}
                {log.type}
                {log.severity && <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${log.severity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-primary-500/20 text-primary-400'}`}>{log.severity}</span>}
              </h4>
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">{log.desc}</p>
            </div>
            <div className="mt-3 sm:mt-0 flex gap-4 text-sm text-slate-500 shrink-0">
              <span className="flex items-center gap-1"><Calendar size={14}/> {log.date}</span>
              <span className="flex items-center gap-1"><Activity size={14}/> {log.mileage.toLocaleString()} mi</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
