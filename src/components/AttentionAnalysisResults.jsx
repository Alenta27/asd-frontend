import React from 'react';
import { 
  Target, 
  CheckCircle, 
  Zap, 
  AlertTriangle, 
  Download, 
  RotateCcw, 
  Home, 
  BrainCircuit,
  Info,
  Calendar,
  User,
  Clock
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

/**
 * Professional Cognitive Assessment Dashboard UI
 * Redesigned for CORTEXA Attention Analysis
 */
const AttentionAnalysisResults = ({ 
  data = {}, 
  childName = "Child", 
  gameName = "Attention Test",
  sessionDate = new Date().toLocaleDateString(),
  testDuration = "0m 0s",
  onPlayAgain, 
  onReturnHome,
  onDownload
}) => {
  // Extract results with fallbacks for dummy/backend data
  const score = data.score || 0;
  const accuracy = data.accuracy || 0;
  const reactionTime = data.reactionTime || "0.00s";
  const mistakes = data.mistakes || 0;
  const attentionScore = data.attentionScore || 0;

  // Chart data if not provided
  const reactionData = data.reactionRounds && data.reactionRounds.length > 0 
    ? data.reactionRounds 
    : [];

  const accuracyPieData = [
    { name: 'Correct', value: accuracy },
    { name: 'Incorrect', value: 100 - accuracy },
  ];
  const PIE_COLORS = ['#10b981', '#ef4444'];

  const metricCards = [
    { 
      title: 'Final Score', 
      value: score, 
      icon: Target, 
      label: score > 100 ? 'Excellent' : 'Good', 
      color: 'text-purple-600', 
      bg: 'bg-purple-100',
      shadow: 'shadow-purple-100'
    },
    { 
      title: 'Accuracy', 
      value: `${accuracy}%`, 
      icon: CheckCircle, 
      label: accuracy >= 80 ? 'High Precision' : 'Moderate', 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-100',
      shadow: 'shadow-emerald-100'
    },
    { 
      title: 'Avg Reaction Time', 
      value: reactionTime, 
      icon: Zap, 
      label: parseFloat(reactionTime) < 1.5 ? 'Fast Response' : 'Normal Speed', 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      shadow: 'shadow-blue-100'
    },
    { 
      title: 'Mistakes', 
      value: mistakes, 
      icon: AlertTriangle, 
      label: mistakes <= 2 ? 'Minimal Errors' : 'Needs Focus', 
      color: 'text-rose-600', 
      bg: 'bg-rose-100',
      shadow: 'shadow-rose-100'
    }
  ];

  const indicators = [
    { 
      name: 'Sustained Attention', 
      value: attentionScore, 
      status: attentionScore >= 80 ? 'Good' : attentionScore >= 60 ? 'Moderate' : 'Needs Attention', 
      color: attentionScore >= 80 ? 'bg-emerald-500' : attentionScore >= 60 ? 'bg-amber-500' : 'bg-rose-500' 
    },
    { 
      name: 'Response Speed', 
      value: Math.max(10, Math.min(100, Math.round(100 - (parseFloat(reactionTime) * 20)))), 
      status: parseFloat(reactionTime) < 1.5 ? 'Good' : 'Moderate', 
      color: parseFloat(reactionTime) < 1.5 ? 'bg-emerald-500' : 'bg-amber-500' 
    },
    { 
      name: 'Focus Stability', 
      value: Math.max(0, Math.min(100, accuracy - (mistakes * 5))), 
      status: accuracy >= 85 ? 'Good' : 'Moderate', 
      color: accuracy >= 85 ? 'bg-emerald-500' : 'bg-amber-500' 
    },
    { 
      name: 'Impulsivity Risk', 
      value: Math.min(100, mistakes * 20), 
      status: mistakes <= 1 ? 'Low Risk' : mistakes <= 3 ? 'Moderate' : 'High Risk', 
      color: mistakes <= 1 ? 'bg-emerald-500' : mistakes <= 3 ? 'bg-amber-500' : 'bg-rose-500' 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* 1. PAGE HEADER */}
        <div className="bg-white rounded-3xl shadow-xl shadow-purple-100/50 p-8 flex flex-col md:flex-row justify-between items-start md:items-center border border-purple-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-50 rounded-full -mr-32 -mt-32 opacity-50 z-0"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold mb-2 text-gray-900 tracking-tight">Attention Analysis Results</h1>
            <p className="text-purple-600 font-semibold flex items-center gap-2">
              <BrainCircuit className="w-5 h-5" /> {gameName}
            </p>
          </div>
          <div className="mt-6 md:mt-0 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left md:text-right relative z-10">
            <div className="flex flex-col md:items-end">
              <span className="text-xs uppercase text-gray-400 font-bold mb-1 tracking-widest flex items-center gap-1">
                <User className="w-3 h-3" /> Child Name
              </span>
              <p className="text-lg font-bold text-gray-800">{childName}</p>
            </div>
            <div className="flex flex-col md:items-end">
              <span className="text-xs uppercase text-gray-400 font-bold mb-1 tracking-widest flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Session Date
              </span>
              <p className="text-lg font-bold text-gray-800">{sessionDate}</p>
            </div>
            <div className="flex flex-col md:items-end">
              <span className="text-xs uppercase text-gray-400 font-bold mb-1 tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> Test Duration
              </span>
              <p className="text-lg font-bold text-gray-800">{testDuration}</p>
            </div>
          </div>
        </div>

        {/* 2. SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className={`bg-white rounded-3xl shadow-lg ${card.shadow} p-6 border border-gray-50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group cursor-default`}>
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-2xl ${card.bg} group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className={`w-7 h-7 ${card.color}`} />
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${card.bg} ${card.color} border border-current opacity-80 uppercase tracking-tighter`}>
                    {card.label}
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{card.title}</h3>
                  <p className="text-4xl font-black text-gray-900 tabular-nums">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. PERFORMANCE ANALYTICS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reaction Time Per Round (Line Chart) */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 p-8 border border-gray-100 flex flex-col hover:shadow-2xl transition-shadow duration-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-3">
                 <div className="p-2 bg-blue-50 rounded-lg"><Zap className="w-5 h-5 text-blue-500" /></div> 
                 Reaction Time Per Round
              </h3>
              <Info className="w-5 h-5 text-gray-300 cursor-help" />
            </div>
            <div className="flex-1 min-h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reactionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="round" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                    dy={10}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                      padding: '12px 16px'
                    }} 
                    itemStyle={{ fontWeight: '800', fontSize: '14px' }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="reactionTime" 
                    name="Time (s)" 
                    stroke="#8b5cf6" 
                    strokeWidth={4} 
                    dot={{ fill: '#8b5cf6', strokeWidth: 3, r: 5, stroke: 'white' }} 
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#7c3aed' }} 
                    animationDuration={2000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accuracy Distribution (Pie Chart) */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 p-8 border border-gray-100 flex flex-col hover:shadow-2xl transition-shadow duration-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-3">
                 <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-500" /></div> 
                 Accuracy Distribution
              </h3>
              <Info className="w-5 h-5 text-gray-300 cursor-help" />
            </div>
            <div className="flex-1 min-h-[350px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={accuracyPieData} 
                    cx="50%" 
                    cy="45%" 
                    innerRadius={90} 
                    outerRadius={125} 
                    paddingAngle={8} 
                    dataKey="value"
                    animationBegin={200}
                    animationDuration={1500}
                  >
                    {accuracyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Accuracy']} 
                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40} 
                    iconType="circle" 
                    formatter={(value) => <span className="text-sm font-bold text-gray-600 px-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-20">
                <span className="text-5xl font-black text-gray-900 tabular-nums">{accuracy}%</span>
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Overall</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. COGNITIVE INDICATORS SECTION */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-10 hover:shadow-2xl transition-shadow duration-500">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Cognitive Indicators</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Good</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Moderate</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div><span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Low</span></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-10">
            {indicators.map((indicator, index) => (
              <div key={index} className="flex flex-col group">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-gray-800 tracking-tight group-hover:text-purple-600 transition-colors">{indicator.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-gray-900">{indicator.value}%</span>
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${
                      indicator.status === 'Good' || indicator.status === 'Low Risk' ? 'text-emerald-500' : 
                      indicator.status === 'Moderate' ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                      • {indicator.status}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner p-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-1500 ease-out shadow-sm ${indicator.color}`} 
                    style={{ width: `${indicator.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. AI BEHAVIORAL INSIGHT */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-fuchsia-900 rounded-[2.5rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-10 relative z-10">
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/20 flex-shrink-0 animate-pulse">
              <BrainCircuit className="w-14 h-14 text-white" />
            </div>
            <div className="text-center lg:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
                <h3 className="text-3xl font-black text-white tracking-tight">AI Behavioral Insight</h3>
                <span className="px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/30">
                  Automated Analysis
                </span>
              </div>
              <p className="text-purple-50 leading-relaxed text-xl font-medium italic opacity-95 max-w-4xl">
                "Based on the attention task results, the child maintained {accuracy >= 80 ? 'good sustained' : 'variable'} attention with 
                {parseFloat(reactionTime) < 1.5 ? ' quick' : ' moderate'} response speed. Accuracy levels indicate 
                {accuracy >= 85 ? ' stable focus' : ' some fluctuations'} with {mistakes <= 1 ? 'minimal' : 'some'} impulsive responses. 
                Overall performance demonstrates a {accuracy >= 75 ? 'consistent' : 'developing'} attentional profile."
              </p>
              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-purple-200">Stable Processing</div>
                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-purple-200">High Engagement</div>
                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-purple-200">Typical Executive Function</div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8 pb-16">
          <button 
            className="group relative flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white px-12 py-5 rounded-[2rem] text-lg font-black shadow-2xl shadow-purple-500/30 transition-all hover:-translate-y-1.5 active:scale-95 overflow-hidden"
            onClick={onDownload} 
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <Download className="w-6 h-6" /> Download Report (PDF)
          </button>
          
          <button 
            onClick={onPlayAgain} 
            className="flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 px-10 py-5 rounded-[2rem] text-lg font-bold shadow-xl border border-gray-100 transition-all hover:-translate-y-1.5 active:scale-95 group"
          >
            <RotateCcw className="w-5 h-5 text-purple-600 group-hover:rotate-180 transition-transform duration-700" /> Play Again
          </button>
          
          <button 
            onClick={onReturnHome} 
            className="flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 px-10 py-5 rounded-[2rem] text-lg font-bold shadow-xl border border-gray-100 transition-all hover:-translate-y-1.5 active:scale-95 group"
          >
            <Home className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform duration-300" /> Return to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

export default AttentionAnalysisResults;
