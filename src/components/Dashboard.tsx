import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  AlertTriangle, 
  Truck, 
  Activity, 
  Zap, 
  ShieldAlert, 
  Navigation, 
  BarChart3,
  BrainCircuit,
  CloudRain,
  Wind
} from 'lucide-react';
import { Map } from './Map';
import { GoogleGenAI } from "@google/genai";
import axios from 'axios';

export const Dashboard: React.FC = () => {
  const { 
    shipments, 
    alerts, 
    selectedShipmentId, 
    setSelectedShipment, 
    isSimulating, 
    setIsSimulating 
  } = useStore();
  
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId);

  const handleExplain = async () => {
    if (!selectedShipment) return;
    setIsExplaining(true);
    
    // Fallback for missing Gemini key
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
      setTimeout(() => {
        setExplanation(`[DEMO MODE] Shipment ${selectedShipment.id} is currently at ${selectedShipment.riskScore}% risk. 
        The system recommends rerouting via the Northern Corridor to avoid the active ${selectedShipment.status === 'delayed' ? 'flood' : 'disruption'} zone. 
        Estimated delay mitigation: 22 minutes.`);
        setIsExplaining(false);
      }, 1500);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Explain the logistics risk for shipment ${selectedShipment.id}. 
        Current Risk Score: ${selectedShipment.riskScore}%. 
        Status: ${selectedShipment.status}. 
        Delay: ${selectedShipment.delay} mins. 
        Context: Disaster events detected in the region. 
        Provide a concise, professional explanation and recommendation.`,
      });
      setExplanation(response.text || "No explanation available.");
    } catch (error) {
      console.error("AI Explanation failed:", error);
      setExplanation("Failed to generate AI explanation.");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleSimulate = async (type: string) => {
    setIsSimulating(true);
    try {
      await axios.post('/api/simulate', {
        eventType: type,
        intensity: 80,
        location: { lat: 19.0760, lng: 72.8777 } // Mumbai
      });
      // In a real app, Firestore listeners would update the state
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setTimeout(() => setIsSimulating(false), 2000);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white font-sans overflow-hidden">
      {/* Sidebar - Control Panel */}
      <aside className="w-80 bg-[#121214] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SupplyGuard AI</h1>
          </div>
          <p className="text-xs text-gray-400">Disaster Logistics Command</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Active Alerts */}
          <section>
            <div className="flex items-center justify-between mb-3 px-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Alerts</h2>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full border border-red-500/30">
                {alerts.length} NEW
              </span>
            </div>
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-red-200">{alert.message}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{alert.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Simulation Controls */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 px-2">Digital Twin Simulation</h2>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleSimulate('flood')}
                className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
              >
                <CloudRain className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium">Flood</span>
              </button>
              <button 
                onClick={() => handleSimulate('cyclone')}
                className="flex flex-col items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
              >
                <Wind className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium">Cyclone</span>
              </button>
            </div>
          </section>

          {/* Shipments List */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 px-2">Live Shipments</h2>
            <div className="space-y-2">
              {shipments.map(s => (
                <div 
                  key={s.id}
                  onClick={() => setSelectedShipment(s.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedShipmentId === s.id 
                      ? 'bg-blue-600/10 border-blue-500/50' 
                      : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-400">{s.id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold ${
                      s.status === 'on-time' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-3 h-3 text-gray-500" />
                    <p className="text-xs font-medium truncate">{s.origin.name} → {s.destination.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Top Stats Bar */}
        <header className="h-16 bg-[#121214] border-b border-white/5 flex items-center px-6 justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">System Health</p>
                <p className="text-xs font-bold">OPTIMAL</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Risk Mitigation</p>
                <p className="text-xs font-bold">84% EFFICIENCY</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isSimulating && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 animate-pulse">
                <Activity className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase">Simulating Impact...</span>
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">
              VG
            </div>
          </div>
        </header>

        {/* Map Area */}
        <div className="flex-1 p-4 relative">
          <Map />
          
          {/* Floating Metrics Overlay */}
          <div className="absolute top-8 right-8 w-64 space-y-4">
            <div className="p-4 bg-[#121214]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Fleet Metrics</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-400">Average Risk Score</span>
                    <span className="font-bold">24%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[24%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-400">Rerouting Success</span>
                    <span className="font-bold">92%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[92%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom AI Panel */}
        {selectedShipment && (
          <div className="h-64 bg-[#121214] border-t border-white/5 p-6 flex gap-6">
            <div className="w-1/3 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-500" />
                  Shipment Details: {selectedShipment.id}
                </h3>
                <span className="text-[10px] text-gray-500">Last updated: Just now</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Risk Score</p>
                  <p className={`text-xl font-bold ${selectedShipment.riskScore > 50 ? 'text-red-500' : 'text-green-500'}`}>
                    {selectedShipment.riskScore}%
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Est. Delay</p>
                  <p className="text-xl font-bold text-yellow-500">+{selectedShipment.delay}m</p>
                </div>
              </div>
              <button 
                onClick={handleExplain}
                disabled={isExplaining}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors rounded-xl flex items-center justify-center gap-2 font-bold text-xs"
              >
                <BrainCircuit className="w-4 h-4" />
                {isExplaining ? 'Analyzing...' : 'Generate AI Explanation'}
              </button>
            </div>

            <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <BrainCircuit className="w-4 h-4 text-purple-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Gemini Explainability Layer</h3>
              </div>
              <div className="text-sm text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                {explanation ? (
                  <p>{explanation}</p>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-4">
                    <BrainCircuit className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-xs italic">Select a shipment and click "Generate AI Explanation" for real-time reasoning.</p>
                  </div>
                )}
              </div>
              {isExplaining && (
                <div className="absolute inset-0 bg-[#121214]/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
