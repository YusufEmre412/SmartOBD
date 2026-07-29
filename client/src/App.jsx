import React from 'react';
import DiagnosticPanel from './components/DiagnosticPanel';
import MaintenanceLog from './components/MaintenanceLog';
import { Car } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-dark-900 p-4 sm:p-8">
      <header className="max-w-5xl mx-auto mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Car size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">SmartOBD</h1>
            <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Diagnostics & Maintenance</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <DiagnosticPanel />
        </section>
        <section>
          <MaintenanceLog />
        </section>
      </main>
    </div>
  );
}

export default App;
