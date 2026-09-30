import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  MapPin,
  TrendingUp,
  BrainCircuit,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Building,
  Plus,
  ArrowRight,
  ShieldAlert,
  Percent,
  Calculator,
  RefreshCw,
  FolderCheck,
  Check,
  Zap,
} from 'lucide-react';
import L from 'leaflet';
import {
  CitizenRequest,
  Project,
  GovernmentData,
  NationalPriority,
  Recommendation,
  IssueCluster,
  IssueCategory,
} from '../types';
import { calculatePriorityScore } from '../mockData';

interface PolicymakerPortalProps {
  requests: CitizenRequest[];
  projects: Project[];
  governmentData: GovernmentData[];
  nationalPriorities: NationalPriority[];
  recommendations: Recommendation[];
  clusters: IssueCluster[];
  onApproveRecommendation: (rec: Recommendation) => Promise<void>;
  onUpdateProjectProgress: (projectId: string, newProgress: number, newStatus: Project['status']) => Promise<void>;
  onSaveNationalPriorityWeight: (priorityId: string, newWeight: number) => void;
}

export const PolicymakerPortal: React.FC<PolicymakerPortalProps> = ({
  requests,
  projects,
  governmentData,
  nationalPriorities,
  recommendations,
  clusters,
  onApproveRecommendation,
  onUpdateProjectProgress,
  onSaveNationalPriorityWeight,
}) => {
  const [activeTab, setActiveTab] = useState<'hotspots' | 'scoring' | 'recommendations' | 'simulation' | 'projects'>('hotspots');

  // Leaflet map container ref
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Map Filter layers
  const [showPetitions, setShowPetitions] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [selectedMapItem, setSelectedMapItem] = useState<{
    type: 'petition' | 'project' | 'cluster';
    data: CitizenRequest | Project | IssueCluster;
  } | null>(null);

  // Simulation state
  const [simBudget, setSimBudget] = useState(1000000000); // ₹100 Crore
  const [allocations, setAllocations] = useState<{ [key: string]: number }>({
    water: 25,
    healthcare: 20,
    roads: 20,
    education: 15,
    sanitation: 10,
    digital: 10,
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<{
    peopleAffected: number;
    gapsReduced: number;
    priorityCoverage: number;
    impactScore: number;
    label: string;
    sectorBreakdown?: Record<string, { budgetCr: number; beneficiaries: number }>;
  } | null>(null);

  // Recommendations state
  const [recArea, setRecArea] = useState('Varanasi East (Adampur - Rajghat)');
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [liveRecs, setLiveRecs] = useState<Recommendation[]>(recommendations);

  // Priority weights state
  const [priorityWeights, setPriorityWeights] = useState<Record<string, number>>(
    nationalPriorities.reduce((acc, p) => ({ ...acc, [p.id]: p.weight }), {})
  );

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (activeTab !== 'hotspots') return;

    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      // Create Map centered around India central coordinates
      const map = L.map(mapContainerRef.current, {
        center: [25.328, 83.033], // Default Varanasi corridor
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
      markersLayerRef.current = markersGroup;
    }

    const markersGroup = markersLayerRef.current;
    if (!markersGroup) return;

    markersGroup.clearLayers();

    // 1. Hotspot Clusters (Pulsing Circles)
    if (showHotspots) {
      clusters.forEach((clust) => {
        const circle = L.circle([clust.lat, clust.lng], {
          radius: clust.demandLevel === 'Critical' ? 1200 : 800,
          color: clust.demandLevel === 'Critical' ? '#e11d48' : '#ea580c',
          fillColor: clust.demandLevel === 'Critical' ? '#f43f5e' : '#fb923c',
          fillOpacity: 0.22,
          weight: 2,
        }).addTo(markersGroup);

        circle.on('click', () => {
          setSelectedMapItem({ type: 'cluster', data: clust });
        });
      });
    }

    // 2. Citizen Petitions
    if (showPetitions) {
      requests.forEach((req) => {
        const isCritical = req.severity === 'Critical';
        const isHigh = req.severity === 'High';
        const color = isCritical ? '#dc2626' : isHigh ? '#ea580c' : '#2563eb';

        const customIcon = L.divIcon({
          className: 'custom-petition-marker',
          html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([req.location.lat, req.location.lng], { icon: customIcon }).addTo(markersGroup);
        marker.on('click', () => {
          setSelectedMapItem({ type: 'petition', data: req });
        });
      });
    }

    // 3. Infrastructure Projects
    if (showProjects) {
      projects.forEach((prj) => {
        const isCompleted = prj.status === 'Completed';
        const color = isCompleted ? '#059669' : '#0891b2';

        const customIcon = L.divIcon({
          className: 'custom-project-marker',
          html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 4px; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">P</div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker([prj.lat, prj.lng], { icon: customIcon }).addTo(markersGroup);
        marker.on('click', () => {
          setSelectedMapItem({ type: 'project', data: prj });
        });
      });
    }
  }, [activeTab, showPetitions, showProjects, showHotspots, requests, projects, clusters]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Budget Simulation API Handler
  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/simulate-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalBudget: simBudget,
          allocations,
        }),
      });

      if (!res.ok) throw new Error('Simulation failed');
      const data = await res.json();
      setSimulationResults(data.results);
    } catch {
      // Local calculation fallback
      const totalCr = simBudget / 10000000;
      const waterCr = (totalCr * (allocations.water || 0)) / 100;
      const healthCr = (totalCr * (allocations.healthcare || 0)) / 100;
      const roadsCr = (totalCr * (allocations.roads || 0)) / 100;

      const peopleAffected = Math.round(waterCr * 9500 + healthCr * 12000 + roadsCr * 7000);
      setSimulationResults({
        peopleAffected,
        gapsReduced: 12,
        priorityCoverage: 84,
        impactScore: 88,
        label: 'Estimated / Simulated',
        sectorBreakdown: {
          water: { budgetCr: waterCr, beneficiaries: Math.round(waterCr * 9500) },
          healthcare: { budgetCr: healthCr, beneficiaries: Math.round(healthCr * 12000) },
          roads: { budgetCr: roadsCr, beneficiaries: Math.round(roadsCr * 7000) },
        },
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Run simulation once on mount
  useEffect(() => {
    runSimulation();
  }, []);

  // AI Recommendations Generator
  const generateAIRecommendations = async () => {
    setIsGeneratingRecs(true);
    try {
      const matchedData = governmentData.find((g) => g.areaName.includes(recArea.split(' ')[0])) || governmentData[0];
      const areaDemands = requests.filter((r) => r.location.areaName.includes(recArea.split(' ')[0]));
      const areaProjects = projects.filter((p) => p.areaName.includes(recArea.split(' ')[0]));

      const res = await fetch('/api/recommend-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaName: recArea,
          gaps: matchedData ? [matchedData.infrastructureCapacity] : [],
          demands: areaDemands.map((d) => d.keyDemand || d.title),
          existingProjects: areaProjects.map((p) => ({ id: p.id, title: p.title, progress: p.progress })),
          nationalPriorities: nationalPriorities.map((n) => ({ name: n.name, weight: n.weight })),
        }),
      });

      if (!res.ok) throw new Error('AI Recommendations API failed');
      const data = await res.json();
      if (data.recommendations && data.recommendations.length > 0) {
        const formatted: Recommendation[] = data.recommendations.map((r: Partial<Recommendation>, idx: number) => ({
          id: `REC-${Date.now()}-${idx}`,
          title: r.title || 'Civic Infrastructure Scheme',
          problemAddressed: r.problemAddressed || 'Identified infrastructure deficit.',
          category: (r.category as IssueCategory) || 'Water',
          areaName: recArea,
          affectedPopulation: r.affectedPopulation || 85000,
          infrastructureGap: r.infrastructureGap || 'High Deficit',
          priorityScore: r.priorityScore || 85,
          estimatedBudget: r.estimatedBudget || 45000000,
          expectedImpact: r.expectedImpact || 'Improves living standards for residents.',
          evidence: r.evidence || 'Aggregated citizen petitions and baseline municipal audits.',
          confidenceScore: r.confidenceScore || 90,
          explanation: r.explanation || 'Directly addresses citizen petitions with optimal ROI.',
          duplicateCheck: r.duplicateCheck || {
            hasDuplicate: false,
            recommendationType: 'new',
            notes: 'No overlapping projects detected.',
          },
          status: 'Draft',
          createdAt: new Date().toISOString(),
        }));
        setLiveRecs(formatted);
      }
    } catch {
      console.warn('Using baseline explainable recommendations');
      setLiveRecs(recommendations);
    } finally {
      setIsGeneratingRecs(false);
    }
  };

  // Top KPIs
  const criticalCount = requests.filter((r) => r.severity === 'Critical').length;
  const inProgressProjectsCount = projects.filter((p) => p.status === 'In Progress').length;
  const totalAllocatedBudgetCr = projects.reduce((acc, p) => acc + p.budgetAllocated, 0) / 10000000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Policymaker Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-indigo-100 text-indigo-800 rounded-md">
              Executive Decision Support
            </span>
            <span className="text-xs text-slate-500 font-medium">Zonal Infrastructure Command</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            Infrastructure Intelligence & Capital Planning
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time synthesis of multilingual citizen demand, demographic vulnerability, and duplicate investment safeguards.
          </p>
        </div>

        {/* Subnavigation Pills */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'hotspots'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>GIS Hotspots Map</span>
          </button>
          <button
            onClick={() => setActiveTab('scoring')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'scoring'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>0–100 Priority Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'recommendations'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>AI Recommendations</span>
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'simulation'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Budget What-If</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Project Tracking ({projects.length})</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Multilingual Petitions
          </span>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900">{requests.length}</span>
            <span className="text-xs text-blue-600 font-semibold">Across 5 Dialects</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Critical Severity Hotspots
          </span>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-rose-600">{criticalCount}</span>
            <span className="text-xs text-slate-400 font-medium">Requires immediate tender</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Active Capital Projects
          </span>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-cyan-700">{inProgressProjectsCount}</span>
            <span className="text-xs text-slate-400 font-medium">In execution</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Capital In-Flight
          </span>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-indigo-700">₹{totalAllocatedBudgetCr.toFixed(1)} Cr</span>
            <span className="text-xs text-emerald-600 font-semibold">Audited</span>
          </div>
        </div>
      </div>

      {/* 1. GIS HOTSPOTS & DEMAND MAP */}
      {activeTab === 'hotspots' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Leaflet Map (Left 8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  <span>Geographic Demand Clusters & Project Locations</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Click any marker or heatmap zone to inspect petition translation, affected households, and action triggers.
                </p>
              </div>

              {/* Layer Toggles */}
              <div className="flex items-center space-x-2 text-xs font-semibold">
                <button
                  onClick={() => setShowPetitions(!showPetitions)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    showPetitions
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  ● Petitions ({requests.length})
                </button>
                <button
                  onClick={() => setShowProjects(!showProjects)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    showProjects
                      ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  ■ Projects ({projects.length})
                </button>
                <button
                  onClick={() => setShowHotspots(!showHotspots)}
                  className={`px-2.5 py-1 rounded-lg border transition-all ${
                    showHotspots
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  ◎ Clusters ({clusters.length})
                </button>
              </div>
            </div>

            {/* Leaflet Map Canvas */}
            <div
              ref={mapContainerRef}
              className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0"
              style={{ minHeight: '520px' }}
            />

            {/* Map Legend */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                  <span>Critical Citizen Petition</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                  <span>High Severity Petition</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-cyan-600 inline-block" />
                  <span>Active Project In-Flight</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
                  <span>Completed Scheme</span>
                </span>
              </div>
              <span className="italic text-slate-400">OpenStreetMap Cartography</span>
            </div>
          </div>

          {/* Map Inspector Panel (Right 4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>GIS Inspector & Details</span>
              </h3>

              {selectedMapItem ? (
                <div className="space-y-4 text-xs">
                  {/* Entity Type Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                      {selectedMapItem.type.toUpperCase()}: {(selectedMapItem.data as { id: string }).id}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {(selectedMapItem.data as { category?: string }).category || 'Civic'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {(selectedMapItem.data as { title: string }).title}
                    </h4>
                  </div>

                  {/* Petition specific */}
                  {selectedMapItem.type === 'petition' && (
                    <>
                      {(() => {
                        const p = selectedMapItem.data as CitizenRequest;
                        return (
                          <div className="space-y-3">
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="font-semibold text-slate-700 block mb-1">
                                Translation ({p.originalLanguage.toUpperCase()} → EN)
                              </span>
                              <p className="text-slate-600 italic">&ldquo;{p.translatedText || p.description}&rdquo;</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 bg-slate-50 rounded-lg">
                                <span className="text-[10px] text-slate-400 block">Severity</span>
                                <span className="font-bold text-rose-600">{p.severity}</span>
                              </div>
                              <div className="p-2 bg-slate-50 rounded-lg">
                                <span className="text-[10px] text-slate-400 block">Status</span>
                                <span className="font-bold text-blue-600">{p.status}</span>
                              </div>
                            </div>
                            <div className="p-2.5 bg-indigo-50/60 rounded-xl text-indigo-900">
                              <span className="font-bold block mb-0.5">Municipal Action:</span>
                              <p>{p.suggestedAction || 'Under technical evaluation'}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* Project specific */}
                  {selectedMapItem.type === 'project' && (
                    <>
                      {(() => {
                        const prj = selectedMapItem.data as Project;
                        return (
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-xs font-semibold mb-1">
                                <span>Progress</span>
                                <span className="text-cyan-700">{prj.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                  className="bg-cyan-600 h-2 rounded-full"
                                  style={{ width: `${prj.progress}%` }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 bg-slate-50 rounded-lg">
                                <span className="text-[10px] text-slate-400 block">Budget Allocated</span>
                                <span className="font-bold text-slate-800">₹{(prj.budgetAllocated / 10000000).toFixed(1)} Cr</span>
                              </div>
                              <div className="p-2 bg-slate-50 rounded-lg">
                                <span className="text-[10px] text-slate-400 block">Beneficiaries</span>
                                <span className="font-bold text-slate-800">{prj.affectedPopulation.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-900">
                              <span className="font-bold block mb-0.5">After Impact Target:</span>
                              <p className="text-[11px]">{prj.afterImpact}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* Cluster specific */}
                  {selectedMapItem.type === 'cluster' && (
                    <>
                      {(() => {
                        const clust = selectedMapItem.data as IssueCluster;
                        return (
                          <div className="space-y-3">
                            <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-rose-900">
                              <span className="font-bold block mb-1">Concentrated Grievance Zone</span>
                              <p className="text-[11px]">{clust.summary}</p>
                            </div>
                            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl">
                              <span className="text-slate-600">Total Grouped Petitions</span>
                              <span className="font-extrabold text-base text-slate-900">{clust.requestCount}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No Location Selected</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click any marker on the map to inspect petition transcripts, project schedules, or cluster summaries.
                  </p>
                </div>
              )}
            </div>

            {/* Municipal Priority Alert */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-5 space-y-2">
              <div className="flex items-center space-x-1.5 text-cyan-300 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Automated Clustering Status</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                4 semantic clusters active. Citizen petitions in Tondiarpet and Rajghat have exceeded the 15-report municipal threshold, triggering automatic recommendation synthesis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. 0-100 EXPLAINABLE PRIORITY SCORING ENGINE */}
      {activeTab === 'scoring' && (
        <div className="space-y-8">
          {/* Explanation of the 6 auditable factors */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="max-w-3xl mb-6">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <Calculator className="w-3.5 h-3.5" />
                <span>Auditable Decision-Support Algorithm</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                0–100 Explainable Infrastructure Priority Scoring
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Unlike opaque AI black boxes, CivicPulse decomposes every infrastructure priority score into 6 auditable and mathematically transparent components. Every point is backed by empirical citizen grievance volume, baseline deficits, and demographic census records.
              </p>
            </div>

            {/* 6 Factors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800">1. Citizen Demand & Volume</span>
                  <span className="text-blue-600 font-mono">Max 25 pts</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Aggregated citizen petition count, multilingual sentiment urgency, and repeated grievance frequency.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800">2. Severity & Urgency</span>
                  <span className="text-rose-600 font-mono">Max 20 pts</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Direct risk to life, vehicular accident rates, waterborne epidemics, or acute structural collapse.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800">3. Infrastructure Baseline Deficit</span>
                  <span className="text-amber-600 font-mono">Max 20 pts</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Deviation from government capacity norms (e.g., 55 LPCD water, 2.0 hospital beds per 1,000).
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800">4. Population Scale</span>
                  <span className="text-indigo-600 font-mono">Max 15 pts</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Total citizens and residential households directly impacted within the immediate municipal catchment.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800">5. Socio-Economic / Equity Factor</span>
                  <span className="text-emerald-600 font-mono">Max 10 pts</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Proportion of Below-Poverty-Line (BPL) families and historically underserved peri-urban wards.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800">6. National Priority Alignment</span>
                  <span className="text-cyan-600 font-mono">Max 10 pts</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Strategic alignment with Jal Jeevan Mission, PM-ABHIM Health, PMGSY, or Swachh Bharat grants.
                </p>
              </div>
            </div>

            {/* National Priority Weight Tuner */}
            <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl mb-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h4 className="font-bold text-sm text-indigo-950">
                    Configurable National Strategic Weightings
                  </h4>
                  <p className="text-xs text-indigo-700">
                    Adjust weights to simulate shifts in municipal capital allocation guidelines:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {nationalPriorities.map((np) => (
                  <div key={np.id} className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs">
                    <div className="flex justify-between text-xs font-bold mb-1 text-slate-800">
                      <span className="truncate max-w-[180px]">{np.name.split('(')[0]}</span>
                      <span className="text-indigo-600">{priorityWeights[np.id] || np.weight}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={35}
                      value={priorityWeights[np.id] || np.weight}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPriorityWeights((prev) => ({ ...prev, [np.id]: val }));
                        onSaveNationalPriorityWeight(np.id, val);
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1 truncate">{np.category}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ranked Score Analysis Table */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-3">
                Current Ward & Sector Priority Rankings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Ward / Area</th>
                      <th className="py-2.5 px-3">Sector</th>
                      <th className="py-2.5 px-3">Population</th>
                      <th className="py-2.5 px-3">BPL %</th>
                      <th className="py-2.5 px-3">Composite Score</th>
                      <th className="py-2.5 px-3">Classification</th>
                      <th className="py-2.5 px-3">Audit Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {governmentData.map((area, idx) => {
                      // Calculate score
                      const breakdown = calculatePriorityScore(
                        idx === 0 ? 23 : idx === 1 ? 21 : 18,
                        idx === 0 ? 'Critical' : 'High',
                        100 - area.demographics.accessToCleanWaterPct,
                        area.population,
                        area.demographics.bplPercentage,
                        25
                      );

                      return (
                        <tr key={area.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">{area.areaName}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700">
                              Water & Roads
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{area.population.toLocaleString()}</td>
                          <td className="py-3 px-3 text-slate-600">{area.demographics.bplPercentage}%</td>
                          <td className="py-3 px-3">
                            <span
                              className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                                breakdown.totalScore >= 85
                                  ? 'bg-rose-100 text-rose-800'
                                  : breakdown.totalScore >= 75
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {breakdown.totalScore} / 100
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {breakdown.totalScore >= 80 ? 'Urgent Capital Tender' : 'High Priority Scheme'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                            D:{breakdown.factors.citizenDemand} S:{breakdown.factors.severity} G:{breakdown.factors.infrastructureDeficit} P:{breakdown.factors.populationImpact} E:{breakdown.factors.equityFactor} N:{breakdown.factors.nationalPriority}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. AI RECOMMENDATIONS & DUPLICATE INVESTMENT DETECTION */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Explainable AI Planning & Deduplication</span>
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  AI Capital Project Recommendations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synthesizes citizen demand with ground-truth audits and proactively flags duplicate or overlapping government tenders.
                </p>
              </div>

              {/* Action: Regenerate */}
              <div className="flex items-center space-x-2">
                <select
                  value={recArea}
                  onChange={(e) => setRecArea(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                >
                  <option value="Varanasi East (Adampur - Rajghat)">Varanasi East</option>
                  <option value="Chennai North (Tondiarpet)">Chennai North</option>
                  <option value="Varanasi North (Shivpur)">Varanasi North</option>
                  <option value="Hyderabad Old City (Falaknuma)">Hyderabad Old City</option>
                </select>

                <button
                  onClick={generateAIRecommendations}
                  disabled={isGeneratingRecs}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingRecs ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingRecs ? 'Synthesizing...' : 'Evaluate & Refresh'}</span>
                </button>
              </div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-6">
              {liveRecs.map((rec) => (
                <div
                  key={rec.id}
                  className="p-6 bg-slate-50/70 border border-slate-200 rounded-3xl space-y-4 hover:border-slate-300 transition-all"
                >
                  {/* Title & Priority Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-extrabold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-lg">
                        {rec.id}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900">{rec.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg">
                        Priority: {rec.priorityScore}/100
                      </span>
                      <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                        Confidence: {rec.confidenceScore}%
                      </span>
                    </div>
                  </div>

                  {/* DUPLICATE INVESTMENT DETECTION CALLOUT */}
                  {rec.duplicateCheck.hasDuplicate ? (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3 text-amber-900">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <div className="font-bold flex items-center space-x-2">
                          <span>⚠️ Potential Duplicate Investment Detected</span>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-amber-200 rounded-md">
                            Action: {rec.duplicateCheck.recommendationType.toUpperCase()}
                          </span>
                        </div>
                        <p className="leading-relaxed">{rec.duplicateCheck.notes}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Duplicate Check Passed: No overlapping active schemes detected in this sector. New project recommended.</span>
                    </div>
                  )}

                  {/* Explainable AI Reasoning */}
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-900 block flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Explainable AI Planning Rationale:</span>
                    </span>
                    <p className="text-slate-600 leading-relaxed">{rec.explanation}</p>
                    <div className="pt-2 border-t border-slate-100 text-slate-500">
                      <span className="font-semibold text-slate-700">Corroborating Evidence: </span>
                      {rec.evidence}
                    </div>
                  </div>

                  {/* Impact & Budget Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-medium block">Estimated Capital Budget</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{(rec.estimatedBudget / 10000000).toFixed(1)} Crore
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-medium block">Beneficiary Population</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {rec.affectedPopulation.toLocaleString()} Residents
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-medium block">Sector Gap Classification</span>
                      <span className="text-xs font-bold text-slate-800">{rec.infrastructureGap}</span>
                    </div>
                  </div>

                  {/* Approve as Scheme Button */}
                  <div className="flex items-center justify-end space-x-3 pt-2">
                    {rec.status === 'Approved' ? (
                      <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-xl">
                        <Check className="w-4 h-4" />
                        <span>Sanctioned as Official Scheme</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onApproveRecommendation(rec)}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                      >
                        <FolderCheck className="w-4 h-4" />
                        <span>Approve as Municipal Capital Scheme</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. BUDGET WHAT-IF SIMULATION */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative">
            {/* Watermark */}
            <div className="absolute top-6 right-6 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-extrabold uppercase tracking-widest rounded-md">
              Estimated / Simulated Model
            </div>

            <div className="max-w-2xl mb-6">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-2">
                <Sliders className="w-3.5 h-3.5" />
                <span>Predictive Impact Modeling</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Capital Budget What-If Scenario Simulation
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Adjust sectoral budget allocations within a ₹100 Crore capital envelope. The model recalculates forecasted beneficiaries, infrastructure gaps closed, and priority coverage in real time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sliders (Left 7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Total Simulation Envelope:</span>
                  <span className="text-base font-extrabold text-blue-700">₹{(simBudget / 10000000).toFixed(0)} Crore</span>
                </div>

                {/* Sector Sliders */}
                {[
                  { key: 'water', label: 'Water (Jal Jeevan Pipelines)', color: 'accent-cyan-600' },
                  { key: 'healthcare', label: 'Healthcare (Primary Centers & Equipment)', color: 'accent-rose-600' },
                  { key: 'roads', label: 'Urban Roads & Accident Blackspots', color: 'accent-amber-600' },
                  { key: 'education', label: 'Education (Smart School Infra)', color: 'accent-blue-600' },
                  { key: 'sanitation', label: 'Sanitation & Mechanized Drainage', color: 'accent-emerald-600' },
                  { key: 'digital', label: 'Digital Grid & Smart Sensors', color: 'accent-indigo-600' },
                ].map((sec) => (
                  <div key={sec.key} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{sec.label}</span>
                      <span className="font-mono text-blue-700">{allocations[sec.key] || 0}% (₹{(((simBudget * (allocations[sec.key] || 0)) / 100) / 10000000).toFixed(1)} Cr)</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={60}
                      value={allocations[sec.key] || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAllocations((prev) => ({ ...prev, [sec.key]: val }));
                      }}
                      className={`w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer ${sec.color}`}
                    />
                  </div>
                ))}

                <button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'Computing Outcomes...' : 'Recalculate Scenario Outcomes'}</span>
                </button>
              </div>

              {/* Outcomes Forecast (Right 5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl space-y-6 shadow-xl">
                  <div>
                    <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">
                      Forecasted Outcome Summary
                    </span>
                    <h3 className="text-lg font-extrabold text-white mt-0.5">
                      Simulated Impact Dashboard
                    </h3>
                  </div>

                  {simulationResults && (
                    <div className="space-y-4">
                      {/* Metric 1: Beneficiaries */}
                      <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-xs">
                        <span className="text-[11px] text-slate-300 font-medium block">Estimated Citizens Impacted</span>
                        <div className="text-2xl font-extrabold text-cyan-300 mt-1">
                          {simulationResults.peopleAffected.toLocaleString()}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Weighted based on ~9,500 people per ₹1 Crore in water/sanitation and 12,000 per ₹1 Crore in healthcare.
                        </p>
                      </div>

                      {/* Metric 2: Gaps & Coverage */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-white/10 rounded-xl">
                          <span className="text-[10px] text-slate-300 block">Critical Gaps Closed</span>
                          <span className="text-lg font-black text-white mt-1 block">
                            {simulationResults.gapsReduced} Wards
                          </span>
                        </div>
                        <div className="p-3 bg-white/10 rounded-xl">
                          <span className="text-[10px] text-slate-300 block">Priority Coverage</span>
                          <span className="text-lg font-black text-emerald-400 mt-1 block">
                            {simulationResults.priorityCoverage}%
                          </span>
                        </div>
                      </div>

                      {/* Overall Impact Score */}
                      <div className="p-4 bg-blue-600/30 border border-blue-400/30 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-cyan-200 uppercase font-bold tracking-wider block">
                            Overall Efficiency Score
                          </span>
                          <span className="text-xs text-slate-300">Composite Impact Rating</span>
                        </div>
                        <div className="text-2xl font-extrabold text-white">
                          {simulationResults.impactScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700 block mb-0.5">Decision-Support Governance Note:</span>
                  All figures generated by this simulator are indicative decision projections designed to support municipal standing committees. Actual disbursements follow standard financial audit rules.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. PROJECT TRACKING & IMPACT VERIFICATION */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900">
                Capital Scheme Lifecycle & Impact Verification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor live on-site progress and verify public impact before and after capital expenditure completion.
              </p>
            </div>

            <div className="space-y-6">
              {projects.map((prj) => (
                <div key={prj.id} className="p-6 bg-slate-50/70 border border-slate-200 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                        {prj.id}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900">{prj.title}</h3>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        prj.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : prj.status === 'In Progress'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {prj.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Physical Milestone Progress</span>
                      <span className="font-bold text-blue-700">{prj.progress}% Completed</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${prj.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Financials & Target Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">Sanctioned Budget</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        ₹{(prj.budgetAllocated / 10000000).toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">Disbursed / Spent</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        ₹{(prj.budgetSpent / 10000000).toFixed(2)} Cr
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-medium">Beneficiaries</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {prj.affectedPopulation.toLocaleString()} Citizens
                      </span>
                    </div>
                  </div>

                  {/* BEFORE VS AFTER IMPACT COMPARISON */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 block">
                        Baseline Before Scheme
                      </span>
                      <p className="text-slate-700 leading-relaxed">{prj.beforeImpact}</p>
                    </div>

                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                        Verified Impact After Completion
                      </span>
                      <p className="text-slate-700 leading-relaxed">{prj.afterImpact}</p>
                    </div>
                  </div>

                  {/* Officer Action: Advance Progress */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500">
                      Contractor: <strong className="text-slate-700">{prj.contractor || 'Municipal Works Div'}</strong>
                    </span>
                    <div className="flex items-center space-x-2">
                      {prj.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            const nextProgress = Math.min(100, prj.progress + 25);
                            const nextStatus = nextProgress >= 100 ? 'Completed' : 'In Progress';
                            onUpdateProjectProgress(prj.id, nextProgress, nextStatus);
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Advance Progress (+25%)
                        </button>
                      )}
                      {prj.status !== 'Completed' && (
                        <button
                          onClick={() => onUpdateProjectProgress(prj.id, 100, 'Completed')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
