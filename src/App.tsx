import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CitizenPortal } from './components/CitizenPortal';
import { PolicymakerPortal } from './components/PolicymakerPortal';
import { CitizenNotificationsModal } from './components/CitizenNotificationsModal';
import {
  CitizenRequest,
  Project,
  GovernmentData,
  NationalPriority,
  Recommendation,
  IssueCluster,
  CitizenNotification,
  SupportedLanguage,
} from './types';
import {
  INITIAL_CITIZEN_REQUESTS,
  INITIAL_PROJECTS,
  INITIAL_GOVERNMENT_DATA,
  INITIAL_NATIONAL_PRIORITIES,
  INITIAL_RECOMMENDATIONS,
  INITIAL_ISSUE_CLUSTERS,
} from './mockData';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<'citizen' | 'policymaker'>('citizen');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('ta');

  // Core Data Collections
  const [requests, setRequests] = useState<CitizenRequest[]>(INITIAL_CITIZEN_REQUESTS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [governmentData, setGovernmentData] = useState<GovernmentData[]>(INITIAL_GOVERNMENT_DATA);
  const [nationalPriorities, setNationalPriorities] = useState<NationalPriority[]>(INITIAL_NATIONAL_PRIORITIES);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(INITIAL_RECOMMENDATIONS);
  const [clusters, setClusters] = useState<IssueCluster[]>(INITIAL_ISSUE_CLUSTERS);

  // User Notifications
  const [notifications, setNotifications] = useState<CitizenNotification[]>([
    {
      id: 'NOTIF-01',
      userId: 'citizen_user',
      requestId: 'REQ-1043',
      title: 'Road Works Tender Awarded (PRJ-101)',
      message:
        'Your petition regarding Rajghat craters has been incorporated into Capital Road Scheme PRJ-101. Bitumen hot-mix crews are deployed on site.',
      read: false,
      createdAt: '2026-09-27T08:00:00Z',
    },
    {
      id: 'NOTIF-02',
      userId: 'citizen_user',
      requestId: 'REQ-1042',
      title: 'Water Deficit Prioritized for Capital Scheme',
      message:
        'Tondiarpet drinking water petition assigned priority index 84/100 under the Urban Jal Jeevan Mission allocation.',
      read: false,
      createdAt: '2026-09-26T14:30:00Z',
    },
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [targetedRequestId, setTargetedRequestId] = useState<string | undefined>(undefined);

  // System Health
  const [hasGeminiKey, setHasGeminiKey] = useState(true);
  const userEmail = currentRole === 'policymaker' ? 'vtharunofficial57@gmail.com' : 'citizen.chennai@civicpulse.org';

  // Check backend Gemini API readiness
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.hasGeminiKey === 'boolean') {
          setHasGeminiKey(data.hasGeminiKey);
        }
      })
      .catch((err) => {
        console.warn('Backend health check error:', err);
      });
  }, []);

  // Submit new Citizen Request
  const handleSubmitRequest = async (
    newRequestData: Omit<CitizenRequest, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory'>
  ): Promise<string> => {
    const timestamp = new Date().toISOString();
    const newId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest: CitizenRequest = {
      ...newRequestData,
      id: newId,
      createdAt: timestamp,
      updatedAt: timestamp,
      statusHistory: [
        {
          status: 'Submitted',
          timestamp,
          remarks: 'Citizen grievance recorded via multilingual input.',
        },
      ],
    };

    // Update in-memory state immediately
    setRequests((prev) => [newRequest, ...prev]);

    // Create a citizen alert
    const newAlert: CitizenNotification = {
      id: `NOTIF-${Date.now()}`,
      userId: newRequest.userId,
      requestId: newId,
      title: 'Petition Registered & Geocoded',
      message: `Your grievance for ${newRequest.category} in ${newRequest.location.areaName} has been assigned tracking ID ${newId}.`,
      read: false,
      createdAt: timestamp,
    };
    setNotifications((prev) => [newAlert, ...prev]);

    // Attempt to persist to Firestore if online
    try {
      await setDoc(doc(db, 'citizenRequests', newId), newRequest);
    } catch (err) {
      console.warn('Firestore write fallback (operating in resilient local state):', err);
    }

    return newId;
  };

  // Update Project Progress (Policymaker Action)
  const handleUpdateProjectProgress = async (
    projectId: string,
    newProgress: number,
    newStatus: Project['status']
  ) => {
    const timestamp = new Date().toISOString();

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            progress: newProgress,
            status: newStatus,
            updatedAt: timestamp,
          };
        }
        return p;
      })
    );

    // If progress advances, notify citizens who filed complaints in that area
    const matchingProject = projects.find((p) => p.id === projectId);
    if (matchingProject) {
      const alert: CitizenNotification = {
        id: `NOTIF-${Date.now()}`,
        userId: 'citizen_user',
        requestId: projectId,
        title: `Scheme Milestone Progress: ${newProgress}%`,
        message: `Project ${matchingProject.title} in ${matchingProject.areaName} has reached ${newProgress}% completion (${newStatus}).`,
        read: false,
        createdAt: timestamp,
      };
      setNotifications((prev) => [alert, ...prev]);
    }

    // Try firestore update
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        progress: newProgress,
        status: newStatus,
        updatedAt: timestamp,
      });
    } catch {
      // Handled silently with local state resilience
    }
  };

  // Approve AI Recommendation as Municipal Scheme
  const handleApproveRecommendation = async (rec: Recommendation) => {
    const timestamp = new Date().toISOString();
    const newProjectId = `PRJ-${Math.floor(100 + Math.random() * 900)}`;

    const newProject: Project = {
      id: newProjectId,
      title: rec.title,
      category: rec.category,
      areaName: rec.areaName,
      status: 'Project Planned',
      progress: 0,
      budgetAllocated: rec.estimatedBudget,
      budgetSpent: 0,
      affectedPopulation: rec.affectedPopulation,
      expectedCompletion: '2027-06-30',
      beforeImpact: rec.problemAddressed,
      afterImpact: rec.expectedImpact,
      lat: 25.328,
      lng: 83.033,
      contractor: 'Municipal Capital Projects Cell',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setProjects((prev) => [newProject, ...prev]);

    // Update recommendation status
    setRecommendations((prev) =>
      prev.map((r) => (r.id === rec.id ? { ...r, status: 'Approved' } : r))
    );

    // Notify citizens in area
    const alert: CitizenNotification = {
      id: `NOTIF-${Date.now()}`,
      userId: 'citizen_user',
      requestId: newProjectId,
      title: 'New Infrastructure Scheme Sanctioned',
      message: `Municipal Council sanctioned scheme: ${rec.title} with budget ₹${(
        rec.estimatedBudget / 10000000
      ).toFixed(1)} Cr.`,
      read: false,
      createdAt: timestamp,
    };
    setNotifications((prev) => [alert, ...prev]);

    try {
      await setDoc(doc(db, 'projects', newProjectId), newProject);
    } catch {
      // Local state fallback
    }
  };

  // Update National Priority Weight
  const handleSaveNationalPriorityWeight = (priorityId: string, newWeight: number) => {
    setNationalPriorities((prev) =>
      prev.map((np) => (np.id === priorityId ? { ...np, weight: newWeight } : np))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        hasGeminiKey={hasGeminiKey}
        userEmail={userEmail}
      />

      {/* Main Portals View */}
      <main className="flex-1">
        {currentRole === 'citizen' ? (
          <CitizenPortal
            requests={requests}
            onSubmitRequest={handleSubmitRequest}
            selectedRequestId={targetedRequestId}
            onSelectRequest={setTargetedRequestId}
            userEmail={userEmail}
          />
        ) : (
          <PolicymakerPortal
            requests={requests}
            projects={projects}
            governmentData={governmentData}
            nationalPriorities={nationalPriorities}
            recommendations={recommendations}
            clusters={clusters}
            onApproveRecommendation={handleApproveRecommendation}
            onUpdateProjectProgress={handleUpdateProjectProgress}
            onSaveNationalPriorityWeight={handleSaveNationalPriorityWeight}
          />
        )}
      </main>

      {/* Citizen Notifications Modal */}
      <CitizenNotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onSelectRequest={(reqId) => {
          setTargetedRequestId(reqId);
          setCurrentRole('citizen');
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">CivicPulse AI</span>
            <span>&bull;</span>
            <span>Multilingual Citizen Infrastructure Intelligence Platform</span>
          </div>
          <div className="text-slate-400">
            Powered by Google Gemini 3.6 Flash &bull; Cloud Firestore Zero-Trust Security
          </div>
        </div>
      </footer>
    </div>
  );
};
