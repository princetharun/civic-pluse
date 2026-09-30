import React, { useState, useEffect } from 'react';
import {
  FileText,
  Mic,
  MicOff,
  MapPin,
  Sparkles,
  Camera,
  Send,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Info,
  Layers,
  ChevronRight,
  Building,
  RefreshCw,
} from 'lucide-react';
import {
  CitizenRequest,
  SupportedLanguage,
  IssueCategory,
  SeverityLevel,
  RequestStatus,
  AIAnalysisResult,
} from '../types';
import { PRESET_PETITIONS } from '../mockData';

interface CitizenPortalProps {
  requests: CitizenRequest[];
  onSubmitRequest: (request: Omit<CitizenRequest, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>) => Promise<string>;
  selectedRequestId?: string;
  onSelectRequest?: (id: string) => void;
  userEmail: string;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  requests,
  onSubmitRequest,
  selectedRequestId,
  onSelectRequest,
  userEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'tracker'>('submit');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('ta');
  const [category, setCategory] = useState<IssueCategory>('Water');
  const [areaName, setAreaName] = useState('Chennai North (Tondiarpet)');
  const [address, setAddress] = useState('Near Gandhi Market, Tondiarpet High Road');
  const [lat, setLat] = useState(13.118);
  const [lng, setLng] = useState(80.287);
  const [photoUrl, setPhotoUrl] = useState('');

  // AI & Voice state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccessId, setSubmissionSuccessId] = useState<string | null>(null);

  // Tracker states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTrackingId, setActiveTrackingId] = useState<string>(
    selectedRequestId || (requests.length > 0 ? requests[0].id : '')
  );

  useEffect(() => {
    if (selectedRequestId) {
      setActiveTrackingId(selectedRequestId);
      setActiveTab('tracker');
    }
  }, [selectedRequestId]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: typeof PRESET_PETITIONS[0]) => {
    setTitle(preset.label.split(':')[1]?.trim() || preset.label);
    setDescription(preset.text);
    setLanguage(preset.language);
    setCategory(preset.category);
    setAreaName(preset.locationName);
    setLat(preset.lat);
    setLng(preset.lng);
    setAiAnalysis(null);
  };

  // Web Speech API Voice Recognition
  const toggleVoiceInput = () => {
    // Check SpeechRecognition support in window
    interface SpeechRecognitionInstance {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onstart: (() => void) | null;
      onresult: ((event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
      onerror: ((event: { error: string }) => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };

    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechError('Web Speech API is not supported in this browser. Please type your request.');
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;

      const langMap: Record<SupportedLanguage, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        bn: 'bn-IN',
      };
      recognition.lang = langMap[language] || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        setSpeechError(`Voice input error: ${event.error}. Please check mic permissions or type text.`);
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setSpeechError('Failed to initialize speech recognition.');
      setIsListening(false);
    }
  };

  // Browser Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(4)));
        setLng(Number(pos.coords.longitude.toFixed(4)));
        setAddress(`GPS Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        // Fallback demo preset coordinates
        setLat(25.328);
        setLng(83.033);
        setAreaName('Varanasi East (Rajghat)');
        setAddress('Detected municipal sector Ward 14');
      }
    );
  };

  // AI Analyze Citizen Issue
  const handleAnalyzeWithAI = async () => {
    if (!description.trim()) {
      alert('Please enter issue details first to analyze.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: description,
          language,
          category,
          locationName: areaName,
        }),
      });

      if (!res.ok) throw new Error('Failed to analyze petition');
      const data: AIAnalysisResult = await res.json();
      setAiAnalysis(data);

      if (data.category) setCategory(data.category);
    } catch (err) {
      console.error('AI Analysis failed:', err);
      // Client-side fallback preview
      setAiAnalysis({
        detectedLanguage: language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English',
        detectedLanguageCode: language,
        translatedText: description,
        category,
        severity: 'High',
        infrastructureType: `${category} Infrastructure`,
        keyDemand: description.slice(0, 100),
        suggestedAction: 'Route to Municipal Ward Engineering Officer for on-ground inspection.',
        summary: description.slice(0, 150),
        priorityScoreDemand: 19,
        aiPowered: false,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      alert('Please describe your civic issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const petitionTitle = title.trim() || `${category} Infrastructure Grievance in ${areaName}`;
      const newId = await onSubmitRequest({
        userId: userEmail || 'citizen_user',
        userEmail: userEmail || 'citizen@civicpulse.org',
        title: petitionTitle,
        description,
        originalLanguage: language,
        translatedText: aiAnalysis?.translatedText || description,
        category,
        severity: (aiAnalysis?.severity as SeverityLevel) || 'High',
        infrastructureType: aiAnalysis?.infrastructureType || `${category} Grid`,
        keyDemand: aiAnalysis?.keyDemand || description.slice(0, 120),
        suggestedAction: aiAnalysis?.suggestedAction || 'Submit to municipal department',
        location: {
          lat,
          lng,
          areaName,
          address,
        },
        imageUrl: photoUrl || undefined,
        photoUrl: photoUrl || undefined,
        status: 'Submitted',
        priorityScore: aiAnalysis?.priorityScoreDemand ? aiAnalysis.priorityScoreDemand * 4 : 75,
      });

      setSubmissionSuccessId(newId);
      setActiveTrackingId(newId);
      // Reset form
      setTitle('');
      setDescription('');
      setAiAnalysis(null);
      setPhotoUrl('');
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to submit petition. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7-Stage Timeline Definition
  const LIFECYCLE_STAGES: { status: RequestStatus; title: string; desc: string }[] = [
    { status: 'Submitted', title: '1. Submitted', desc: 'Received & digitally registered with tracking hash' },
    { status: 'Under Review', title: '2. Under Review', desc: 'AI translation & automated severity classification' },
    { status: 'Verified', title: '3. Verified', desc: 'Municipal engineer field inspection & ground confirmation' },
    { status: 'Prioritized', title: '4. Prioritized', desc: 'Ranked on 0–100 infrastructure deficit index' },
    { status: 'Project Planned', title: '5. Project Planned', desc: 'Integrated into official municipal capital scheme' },
    { status: 'In Progress', title: '6. In Progress', desc: 'Tender awarded and on-site construction active' },
    { status: 'Completed', title: '7. Completed', desc: 'Work certified and before/after impact verified' },
  ];

  const getStageIndex = (status: RequestStatus): number => {
    return LIFECYCLE_STAGES.findIndex((s) => s.status === status);
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeRequest = requests.find((r) => r.id === activeTrackingId) || requests[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Citizen Portal Banner */}
      <div className="mb-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-semibold backdrop-blur-xs mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven Citizen Empowerment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Report Civic Issues in Your Native Language
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Speak or type in <span className="text-cyan-300 font-semibold">Tamil, Hindi, Telugu, Bengali, or English</span>.
            CivicPulse AI automatically detects your dialect, translates to official standard English, extracts infrastructure demands, and monitors your petition through a transparent 7-stage municipal lifecycle.
          </p>

          {/* Quick Tab Switcher */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'submit'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Submit New Grievance / Petition</span>
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tracker'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>My Petitions & 7-Stage Tracker ({requests.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Submission Success Banner */}
      {submissionSuccessId && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <div className="text-sm font-bold">
                Petition Registered Successfully! Tracking ID: <span className="font-mono text-emerald-950 font-extrabold">{submissionSuccessId}</span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Your feedback has been mapped to local municipal GIS coordinates and queued for automated cluster analysis.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('tracker');
              setSubmissionSuccessId(null);
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Track Status
          </button>
        </div>
      )}

      {/* TAB 1: SUBMIT NEW PETITION */}
      {activeTab === 'submit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form (Left 7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Describe Civic Infrastructure Need</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">Step 1 of 2</span>
            </div>

            {/* Quick Demo Presets */}
            <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Try Multilingual Realistic Presets:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PETITIONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="text-[11px] px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium rounded-lg border border-slate-200 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Language & Category Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Original Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Infrastructure Sector
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IssueCategory)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Water">Water (குடிநீர் / जल)</option>
                    <option value="Roads">Roads (சாலைகள் / सड़क)</option>
                    <option value="Electricity">Electricity (மின்சாரம் / विद्युत)</option>
                    <option value="Healthcare">Healthcare (சுகாதாரம் / स्वास्थ्य)</option>
                    <option value="Sanitation">Sanitation & Drainage (தூய்மை / स्वच्छता)</option>
                    <option value="Education">Education (கல்வி / शिक्षा)</option>
                    <option value="Public Transport">Public Transport</option>
                    <option value="Digital Infrastructure">Digital & Telecom</option>
                    <option value="Other">Other Infrastructure</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Brief Title / Subject (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Drinking Water Pipeline Rupture near Tondiarpet Market"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Multilingual Description + Voice Button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Detailed Citizen Feedback / Petition
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {description.length}/2000 chars
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={description}
                    maxLength={2000}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Type in your own language or click the microphone to speak..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                  />
                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all flex items-center space-x-1.5 text-xs font-bold ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-white text-slate-700 hover:text-blue-600 border border-slate-200 shadow-xs'
                    }`}
                    title={isListening ? 'Click to stop listening' : 'Speak your feedback (Web Speech API)'}
                  >
                    {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-600" />}
                    <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
                  </button>
                </div>
                {speechError && (
                  <p className="mt-1 text-xs text-rose-600 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{speechError}</span>
                  </p>
                )}
              </div>

              {/* Location Controls */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span>Location & GIS Coordinates</span>
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-600 font-bold rounded-lg border border-slate-200 transition-colors flex items-center space-x-1"
                  >
                    <MapPin className="w-3 h-3 text-blue-600" />
                    <span>Detect Current Location</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium block mb-1">
                      Municipal Zone / Ward Area
                    </label>
                    <input
                      type="text"
                      value={areaName}
                      onChange={(e) => setAreaName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 font-medium block mb-1">
                      Street / Landmark Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-[11px] text-slate-500 font-mono">
                  <span>Lat: {lat}</span>
                  <span>Lng: {lng}</span>
                </div>
              </div>

              {/* Photo Attachment URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>Attach Evidence Photo URL (Optional)</span>
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or paste image URL"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons: AI Analyze & Submit */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAnalyzeWithAI}
                  disabled={isAnalyzing || !description.trim()}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? 'AI Analyzing...' : 'Run Instant AI Preview'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registering...' : 'Submit Citizen Petition'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* AI Analysis Preview (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">AI Instant Analysis</h3>
                </div>
                {aiAnalysis && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-md">
                    {aiAnalysis.modelUsed || 'AI Verified'}
                  </span>
                )}
              </div>

              {!aiAnalysis && !isAnalyzing && (
                <div className="py-10 text-center text-slate-400">
                  <Sparkles className="w-10 h-10 mx-auto mb-2 text-indigo-200" />
                  <p className="text-xs font-medium text-slate-600">No Analysis Generated Yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Click &ldquo;Run Instant AI Preview&rdquo; to translate your native dialect into standard English and extract municipal impact factors.
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="py-12 text-center text-indigo-600 space-y-3">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin" />
                  <p className="text-xs font-semibold">Gemini 3.6 Multilingual Processing Active...</p>
                  <p className="text-[11px] text-slate-400">
                    Detecting dialect, synthesizing demand, estimating priority index
                  </p>
                </div>
              )}

              {aiAnalysis && (
                <div className="space-y-4">
                  {/* Language & Severity Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-500 font-medium block">Identified Language</span>
                      <span className="font-bold text-slate-800">
                        {aiAnalysis.detectedLanguage} ({aiAnalysis.detectedLanguageCode})
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-500 font-medium block">Assessed Severity</span>
                      <span
                        className={`font-bold ${
                          aiAnalysis.severity === 'Critical'
                            ? 'text-rose-600'
                            : aiAnalysis.severity === 'High'
                            ? 'text-orange-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {aiAnalysis.severity}
                      </span>
                    </div>
                  </div>

                  {/* English Translation */}
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block mb-1">
                      Official English Translation
                    </span>
                    <p className="text-xs text-slate-800 italic leading-relaxed">
                      &ldquo;{aiAnalysis.translatedText}&rdquo;
                    </p>
                  </div>

                  {/* Extracted Demand & Suggested Action */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-700">Specific Infrastructure Type:</span>
                      <p className="text-slate-800 font-medium mt-0.5">{aiAnalysis.infrastructureType}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-700">Key Citizen Demand:</span>
                      <p className="text-slate-800 mt-0.5">{aiAnalysis.keyDemand}</p>
                    </div>
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                      <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                        Recommended Immediate Action:
                      </span>
                      <p className="text-xs text-amber-900 mt-0.5">{aiAnalysis.suggestedAction}</p>
                    </div>
                  </div>

                  {/* Demand Priority Score */}
                  <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-cyan-300 font-semibold uppercase tracking-wider block">
                        Baseline Demand Factor
                      </span>
                      <span className="text-xs text-slate-300">Calculated Severity & Urgency</span>
                    </div>
                    <div className="text-xl font-extrabold text-white">
                      {aiAnalysis.priorityScoreDemand} <span className="text-xs font-normal text-slate-400">/ 25</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Explanatory Policy Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-xs text-slate-600 space-y-2">
              <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                <Info className="w-4 h-4 text-blue-600" />
                <span>How Your Petition Feeds into Decisions</span>
              </div>
              <p className="leading-relaxed">
                Individual petitions are not evaluated in isolation. CivicPulse AI semantically clusters matching complaints within your ward to assess true geographical demand. When combined with baseline demographic census data and national priorities, it drives fund allocation in the municipal budget.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY PETITIONS & 7-STAGE TRACKER */}
      {activeTab === 'tracker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Petitions List (Left 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search and Filters */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID (e.g. REQ-1042), sector, or ward..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-slate-500">Filter:</span>
                <select
                  aria-label="Filter petitions by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700"
                >
                  <option value="all">All Statuses ({requests.length})</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Verified">Verified</option>
                  <option value="Prioritized">Prioritized</option>
                  <option value="Project Planned">Project Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  No petitions found matching your search.
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => {
                      setActiveTrackingId(req.id);
                      if (onSelectRequest) onSelectRequest(req.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      activeTrackingId === req.id
                        ? 'bg-blue-50/70 border-blue-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                        {req.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'In Progress'
                            ? 'bg-cyan-100 text-cyan-800'
                            : req.status === 'Prioritized' || req.status === 'Project Planned'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{req.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {req.translatedText || req.description}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{req.location.areaName}</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stepper & Deep Inspection (Right 7 cols) */}
          <div className="lg:col-span-7">
            {activeRequest ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                {/* Header */}
                <div className="border-b border-slate-100 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-extrabold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                        {activeRequest.id}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                        {activeRequest.category}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-md font-semibold ${
                          activeRequest.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {activeRequest.severity} Severity
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                      Logged {new Date(activeRequest.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">{activeRequest.title}</h3>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {activeRequest.location.areaName} — {activeRequest.location.address}
                    </span>
                  </div>
                </div>

                {/* 7-STAGE STEPPER */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      7-Stage Municipal Request Lifecycle
                    </h4>
                    <span className="text-xs font-bold text-blue-600">
                      Step {getStageIndex(activeRequest.status) + 1} of 7: {activeRequest.status}
                    </span>
                  </div>

                  {/* Stepper bar */}
                  <div className="space-y-4">
                    {LIFECYCLE_STAGES.map((stage, idx) => {
                      const currentIdx = getStageIndex(activeRequest.status);
                      const isPast = idx < currentIdx;
                      const isCurrent = idx === currentIdx;
                      const historyItem = activeRequest.statusHistory.find((h) => h.status === stage.status);

                      return (
                        <div key={stage.status} className="flex items-start space-x-3 relative">
                          {/* Connector line */}
                          {idx < LIFECYCLE_STAGES.length - 1 && (
                            <div
                              className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${
                                isPast ? 'bg-blue-600' : 'bg-slate-200'
                              }`}
                            />
                          )}

                          {/* Node Icon */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs transition-all ${
                              isPast
                                ? 'bg-blue-600 text-white'
                                : isCurrent
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                          >
                            {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold ${
                                  isCurrent ? 'text-indigo-900' : isPast ? 'text-slate-800' : 'text-slate-400'
                                }`}
                              >
                                {stage.title}
                              </span>
                              {historyItem && (
                                <span className="text-[10px] text-slate-400">
                                  {new Date(historyItem.timestamp).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{stage.desc}</p>
                            {historyItem && (
                              <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700">
                                <span className="font-semibold text-slate-800">Remark: </span>
                                {historyItem.remarks}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Original vs Translated Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="font-semibold text-slate-700 block mb-1">
                      Original Feedback ({activeRequest.originalLanguage.toUpperCase()})
                    </span>
                    <p className="text-slate-600 leading-relaxed">{activeRequest.description}</p>
                  </div>
                  <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <span className="font-semibold text-blue-900 block mb-1">Standard English Translation</span>
                    <p className="text-slate-700 leading-relaxed italic">
                      &ldquo;{activeRequest.translatedText || activeRequest.description}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Priority & Action */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">
                      Calculated Demand Score
                    </span>
                    <div className="text-lg font-extrabold">
                      {activeRequest.priorityScore || 75} / 100
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-medium block">Key Action Demand</span>
                    <p className="text-xs text-slate-200 max-w-sm truncate">
                      {activeRequest.keyDemand || activeRequest.suggestedAction}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                Select a petition from the left column to view its 7-stage lifecycle.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
