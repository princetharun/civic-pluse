import {
  GovernmentData,
  CitizenRequest,
  Project,
  NationalPriority,
  IssueCluster,
  Recommendation,
  PriorityScoreBreakdown,
} from './types';

export const INITIAL_GOVERNMENT_DATA: GovernmentData[] = [
  {
    id: 'area-varanasi-north',
    areaName: 'Varanasi North (Shivpur - Orderly Bazar)',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    population: 320000,
    lat: 25.352,
    lng: 82.983,
    existingProjectsCount: 2,
    updatedAt: new Date().toISOString(),
    demographics: {
      totalHouseholds: 58000,
      bplPercentage: 34,
      scStPercentage: 22,
      elderlyPercentage: 14,
      accessToCleanWaterPct: 52,
      accessToHealthcarePct: 48,
      allWeatherRoadAccessPct: 61,
    },
    infrastructureCapacity: {
      hospitalBedsPer1000: 0.8,
      waterSupplyLitersPerCapita: 68,
      roadPavedPct: 62,
      powerAvailabilityHours: 19.5,
      sanitationCoveragePct: 54,
      internetBroadbandPct: 45,
    },
  },
  {
    id: 'area-varanasi-east',
    areaName: 'Varanasi East (Adampur - Rajghat)',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    population: 285000,
    lat: 25.325,
    lng: 83.031,
    existingProjectsCount: 3,
    updatedAt: new Date().toISOString(),
    demographics: {
      totalHouseholds: 51000,
      bplPercentage: 42,
      scStPercentage: 28,
      elderlyPercentage: 16,
      accessToCleanWaterPct: 41,
      accessToHealthcarePct: 39,
      allWeatherRoadAccessPct: 53,
    },
    infrastructureCapacity: {
      hospitalBedsPer1000: 0.6,
      waterSupplyLitersPerCapita: 55,
      roadPavedPct: 55,
      powerAvailabilityHours: 18.2,
      sanitationCoveragePct: 48,
      internetBroadbandPct: 38,
    },
  },
  {
    id: 'area-chennai-north',
    areaName: 'Chennai North (Tondiarpet - Royapuram)',
    district: 'Chennai',
    state: 'Tamil Nadu',
    population: 410000,
    lat: 13.118,
    lng: 80.287,
    existingProjectsCount: 4,
    updatedAt: new Date().toISOString(),
    demographics: {
      totalHouseholds: 82000,
      bplPercentage: 29,
      scStPercentage: 18,
      elderlyPercentage: 12,
      accessToCleanWaterPct: 48,
      accessToHealthcarePct: 62,
      allWeatherRoadAccessPct: 78,
    },
    infrastructureCapacity: {
      hospitalBedsPer1000: 1.4,
      waterSupplyLitersPerCapita: 72,
      roadPavedPct: 80,
      powerAvailabilityHours: 22.8,
      sanitationCoveragePct: 68,
      internetBroadbandPct: 65,
    },
  },
  {
    id: 'area-hyderabad-old',
    areaName: 'Hyderabad Old City (Charminar - Falaknuma)',
    district: 'Hyderabad',
    state: 'Telangana',
    population: 395000,
    lat: 17.361,
    lng: 78.474,
    existingProjectsCount: 2,
    updatedAt: new Date().toISOString(),
    demographics: {
      totalHouseholds: 74000,
      bplPercentage: 38,
      scStPercentage: 15,
      elderlyPercentage: 13,
      accessToCleanWaterPct: 59,
      accessToHealthcarePct: 54,
      allWeatherRoadAccessPct: 69,
    },
    infrastructureCapacity: {
      hospitalBedsPer1000: 1.1,
      waterSupplyLitersPerCapita: 80,
      roadPavedPct: 72,
      powerAvailabilityHours: 20.1,
      sanitationCoveragePct: 60,
      internetBroadbandPct: 58,
    },
  },
  {
    id: 'area-kolkata-north',
    areaName: 'Kolkata North (Shyambazar - Belgachia)',
    district: 'Kolkata',
    state: 'West Bengal',
    population: 350000,
    lat: 22.602,
    lng: 88.378,
    existingProjectsCount: 3,
    updatedAt: new Date().toISOString(),
    demographics: {
      totalHouseholds: 69000,
      bplPercentage: 31,
      scStPercentage: 14,
      elderlyPercentage: 19,
      accessToCleanWaterPct: 65,
      accessToHealthcarePct: 58,
      allWeatherRoadAccessPct: 74,
    },
    infrastructureCapacity: {
      hospitalBedsPer1000: 1.3,
      waterSupplyLitersPerCapita: 88,
      roadPavedPct: 76,
      powerAvailabilityHours: 22.0,
      sanitationCoveragePct: 70,
      internetBroadbandPct: 62,
    },
  },
];

export const INITIAL_CITIZEN_REQUESTS: CitizenRequest[] = [
  {
    id: 'REQ-1042',
    userId: 'demo_user_chennai',
    userEmail: 'citizen.chennai@civicpulse.org',
    title: 'Drinking Water Supply Disruption in Tondiarpet',
    description:
      'எங்கள் பகுதியில் கடந்த இரண்டு வாரங்களாக குடிநீர் விநியோகம் முற்றிலும் நின்றுவிட்டது. மக்கள் தனியார் லாரிகளிடம் அதிக பணம் கொடுத்து தண்ணீர் வாங்க வேண்டியுள்ளது. தயவுசெய்து உடனடியாக சரிசெய்யவும்.',
    originalLanguage: 'ta',
    translatedText:
      'In our area, drinking water supply has completely ceased for the past two weeks. People are forced to pay exorbitant rates to private tankers for potable water. Kindly resolve this pipeline outage urgently.',
    category: 'Water',
    severity: 'High',
    infrastructureType: 'Drinking Water Pipeline',
    keyDemand: 'Restore municipal potable water supply pipeline and deploy temporary bowsers',
    suggestedAction: 'Deploy MetroWater emergency repair team and dispatch mobile water bowsers immediately',
    location: {
      lat: 13.118,
      lng: 80.287,
      areaName: 'Chennai North (Tondiarpet)',
      district: 'Chennai',
      state: 'Tamil Nadu',
      address: 'Near Gandhi Market, Tondiarpet High Road',
    },
    status: 'Prioritized',
    priorityScore: 84,
    statusHistory: [
      {
        status: 'Submitted',
        timestamp: '2026-09-24T08:30:00Z',
        remarks: 'Citizen petition logged via Tamil mobile portal.',
      },
      {
        status: 'Under Review',
        timestamp: '2026-09-24T11:15:00Z',
        remarks: 'AI multilingual parser validated translation and severity: High.',
      },
      {
        status: 'Verified',
        timestamp: '2026-09-25T09:00:00Z',
        remarks: 'Zonal Assistant Engineer verified pipeline rupture near feeder valve #4.',
      },
      {
        status: 'Prioritized',
        timestamp: '2026-09-26T14:20:00Z',
        remarks: 'Score 84 assigned under Jal Jeevan Mission urban continuity allocation.',
      },
    ],
    createdAt: '2026-09-24T08:30:00Z',
    updatedAt: '2026-09-26T14:20:00Z',
  },
  {
    id: 'REQ-1043',
    userId: 'demo_user_varanasi',
    userEmail: 'citizen.varanasi@civicpulse.org',
    title: 'Severe Arterial Road Craters and Potholes near Rajghat',
    description:
      'राजघाट पुल के पास मुख्य सड़क पर 3 फीट गहरे गड्ढे हो चुके हैं। पिछले हफ्ते दो स्कूल वैन और कई मोटरसाइकिलें दुर्घटनाग्रस्त हो चुकी हैं। भारी बारिश के बाद जलभराव से गड्ढे दिखते भी नहीं हैं।',
    originalLanguage: 'hi',
    translatedText:
      'Near Rajghat bridge, the main road has developed 3-feet deep craters and potholes. Last week, two school vans and multiple motorcycles met with accidents. Post heavy rainfall, waterlogging obscures these hazards.',
    category: 'Roads',
    severity: 'Critical',
    infrastructureType: 'Pothole / Road Surface Repair',
    keyDemand: 'Immediate resurfacing of Rajghat connecting link and stormwater runoff drainage repair',
    suggestedAction: 'Deploy urgent asphalt patch team and barricade hazardous culvert sections',
    location: {
      lat: 25.328,
      lng: 83.033,
      areaName: 'Varanasi East (Rajghat)',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      address: 'Rajghat Approach Road, Ward 14',
    },
    status: 'In Progress',
    priorityScore: 92,
    statusHistory: [
      {
        status: 'Submitted',
        timestamp: '2026-09-20T10:00:00Z',
        remarks: 'Citizen submission received with accident photos attached.',
      },
      {
        status: 'Verified',
        timestamp: '2026-09-21T08:45:00Z',
        remarks: 'PWD inspector confirmed 420m damaged carriage-way with public safety hazard.',
      },
      {
        status: 'Project Planned',
        timestamp: '2026-09-23T16:00:00Z',
        remarks: 'Merged into Special Road Maintenance Scheme (PRJ-101).',
      },
      {
        status: 'In Progress',
        timestamp: '2026-09-27T07:30:00Z',
        remarks: 'Bitumen resurfacing crew on site with hot-mix pavers.',
      },
    ],
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-09-27T07:30:00Z',
  },
  {
    id: 'REQ-1044',
    userId: 'demo_user_hyderabad',
    userEmail: 'citizen.hyd@civicpulse.org',
    title: 'Frequent Transformer Explosions and Low Voltage in Falaknuma',
    description:
      'పాతబస్తీ ఫలక్‌నుమా ప్రాంతంలో రోజుకు 5-6 గంటల పాటు విద్యుత్ సరఫరా నిలిచిపోతోంది. ట్రాన్స్‌ఫార్మర్ ఓవర్‌లోడ్ అయి పొగలు వస్తోంది, ఎప్పుడు పేలుతుందోనని భయపడుతున్నాము. గృహోపకరణాలు కాలిపోతున్నాయి.',
    originalLanguage: 'te',
    translatedText:
      'In Old City Falaknuma area, electricity supply trips for 5-6 hours daily. The distribution transformer is overloaded and emitting smoke; residents fear an imminent blast. Domestic electrical appliances are getting damaged due to power surges.',
    category: 'Electricity',
    severity: 'High',
    infrastructureType: 'Distribution Transformer & Cabling',
    keyDemand: 'Install high-capacity 500kVA transformer and replace obsolete aluminum distribution wiring',
    suggestedAction: 'TSSPDCL emergency load-splitting inspection and transformer capacity upgrade',
    location: {
      lat: 17.332,
      lng: 78.468,
      areaName: 'Hyderabad Old City (Falaknuma)',
      district: 'Hyderabad',
      state: 'Telangana',
      address: 'Near Falaknuma Bus Depot, Lane 3',
    },
    status: 'Verified',
    priorityScore: 78,
    statusHistory: [
      {
        status: 'Submitted',
        timestamp: '2026-09-25T14:10:00Z',
        remarks: 'Telugu petition parsed and clustered with 14 neighborhood reports.',
      },
      {
        status: 'Verified',
        timestamp: '2026-09-28T11:00:00Z',
        remarks: 'Discom engineer audited 140% peak load on existing 250kVA transformer.',
      },
    ],
    createdAt: '2026-09-25T14:10:00Z',
    updatedAt: '2026-09-28T11:00:00Z',
  },
  {
    id: 'REQ-1045',
    userId: 'demo_user_kolkata',
    userEmail: 'citizen.kolkata@civicpulse.org',
    title: 'Primary Health Clinic Lacks Basic Maternity and Diagnostic Facilities',
    description:
      'বেলগাছিয়া আরবান প্রাইমারি হেলথ সেন্টারে কোনো আল্ট্রাসাউন্ড বা রক্ত পরীক্ষা মেশিন নেই। গর্ভবতী মায়েদের ৬ কিলোমিটার দূরে আর.জি. কর হাসপাতালে যেতে বাধ্য করা হয়। অবিলম্বে বেসিক ডায়াগনস্টিক স্থাপন করা হোক।',
    originalLanguage: 'bn',
    translatedText:
      'Belgachia Urban Primary Health Centre has no ultrasound or blood diagnostic machines. Expectant mothers are forced to travel 6 km to R.G. Kar Medical College hospital. Basic diagnostic instruments should be installed immediately.',
    category: 'Healthcare',
    severity: 'High',
    infrastructureType: 'Primary Health Center Equipment',
    keyDemand: 'Equip Belgachia UPHC with pathology diagnostic tools and dedicated maternal care unit',
    suggestedAction: 'Sanction National Health Mission diagnostic modernization kit for Ward 4 health post',
    location: {
      lat: 22.604,
      lng: 88.384,
      areaName: 'Kolkata North (Belgachia)',
      district: 'Kolkata',
      state: 'West Bengal',
      address: 'Ward 4 Health Sub-Center, Belgachia Road',
    },
    status: 'Under Review',
    priorityScore: 75,
    statusHistory: [
      {
        status: 'Submitted',
        timestamp: '2026-09-28T09:20:00Z',
        remarks: 'Logged via Bengali citizen feedback terminal.',
      },
      {
        status: 'Under Review',
        timestamp: '2026-09-28T12:00:00Z',
        remarks: 'Cross-referenced against district health deficiency index.',
      },
    ],
    createdAt: '2026-09-28T09:20:00Z',
    updatedAt: '2026-09-28T12:00:00Z',
  },
  {
    id: 'REQ-1046',
    userId: 'demo_user_varanasi_2',
    userEmail: 'citizen.varanasi2@civicpulse.org',
    title: 'Blocked Monsoon Drainage Canal Overflowing onto Shivpur Market',
    description:
      'The storm water drainage canal behind Shivpur vegetable mandi has been blocked by silt and plastic waste. Even with light drizzle, dirty gutter water overflows into shops and houses, causing severe dengue and malaria risk.',
    originalLanguage: 'en',
    translatedText:
      'The storm water drainage canal behind Shivpur vegetable mandi has been blocked by silt and plastic waste. Even with light drizzle, dirty gutter water overflows into shops and houses, causing severe dengue and malaria risk.',
    category: 'Sanitation',
    severity: 'Medium',
    infrastructureType: 'Stormwater Drainage Canal Desilting',
    keyDemand: 'Comprehensive mechanized desilting of Shivpur market canal and culvert reconstruction',
    suggestedAction: 'Dispatch municipal suction excavator and install trash screens before monsoon peak',
    location: {
      lat: 25.354,
      lng: 82.981,
      areaName: 'Varanasi North (Shivpur)',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      address: 'Behind Subzi Mandi, GT Road Shivpur',
    },
    status: 'Submitted',
    priorityScore: 68,
    statusHistory: [
      {
        status: 'Submitted',
        timestamp: '2026-09-29T16:45:00Z',
        remarks: 'Initial complaint filed with photo of stagnant drainage.',
      },
    ],
    createdAt: '2026-09-29T16:45:00Z',
    updatedAt: '2026-09-29T16:45:00Z',
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PRJ-101',
    title: 'Rajghat Corridor Comprehensive Road Restoration & Stormwater Box Culvert',
    category: 'Roads',
    areaName: 'Varanasi East (Rajghat)',
    status: 'In Progress',
    progress: 68,
    budgetAllocated: 38000000, // ₹3.8 Crore
    budgetSpent: 26000000,
    affectedPopulation: 65000,
    expectedCompletion: '2026-12-15',
    beforeImpact:
      '420m severely cratered arterial road with average vehicle speeds under 8 km/h, 14 recorded vehicular accidents in 6 months, severe monsoon waterlogging.',
    afterImpact:
      'Dual-lane paved carriageway with 1.2m reinforced concrete covered box storm drain; zero water stagnation, estimated accident reduction of 85%.',
    lat: 25.328,
    lng: 83.033,
    contractor: 'UP State Bridge & Road Infrastructure Corp.',
    createdAt: '2026-06-10T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z',
  },
  {
    id: 'PRJ-102',
    title: 'Varanasi East Community Health Center (CHC) Expansion & Maternal Ward',
    category: 'Healthcare',
    areaName: 'Varanasi East (Adampur - Rajghat)',
    status: 'In Progress',
    progress: 42,
    budgetAllocated: 52000000, // ₹5.2 Crore
    budgetSpent: 21800000,
    affectedPopulation: 140000,
    expectedCompletion: '2027-03-31',
    beforeImpact:
      'Overburdened 20-bed dispensary handling 350 outpatients daily with zero overnight maternal beds and absent neonatal stabilization unit.',
    afterImpact:
      'Upgraded 60-bed secondary facility with dedicated 20-bed Mother & Child Health wing, digital X-Ray, 24/7 emergency triage.',
    lat: 25.324,
    lng: 83.029,
    contractor: 'Apex Health Infra Projects Ltd.',
    createdAt: '2026-04-15T00:00:00Z',
    updatedAt: '2026-09-25T00:00:00Z',
  },
  {
    id: 'PRJ-103',
    title: 'North Chennai Desalination Secondary Water Distribution Pipeline Network',
    category: 'Water',
    areaName: 'Chennai North (Tondiarpet)',
    status: 'Project Planned',
    progress: 15,
    budgetAllocated: 74000000, // ₹7.4 Crore
    budgetSpent: 8500000,
    affectedPopulation: 180000,
    expectedCompletion: '2027-08-30',
    beforeImpact:
      '48% of households rely on private groundwater tankers paying ₹1,200/month; recurrent saline intrusion in old distribution pipes.',
    afterImpact:
      'Provides 135 LPCD potable water directly to 32,000 households 24/7; saves low-income families over ₹14,000 annually.',
    lat: 13.118,
    lng: 80.287,
    contractor: 'Chennai Metro Water Board',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z',
  },
  {
    id: 'PRJ-104',
    title: 'Falaknuma Underground High-Voltage Cable Line & Substation Revamp',
    category: 'Electricity',
    areaName: 'Hyderabad Old City (Falaknuma)',
    status: 'Completed',
    progress: 100,
    budgetAllocated: 29000000, // ₹2.9 Crore
    budgetSpent: 28400000,
    affectedPopulation: 85000,
    expectedCompletion: '2026-07-31',
    beforeImpact:
      'Frequent tripping with 5.4 hours daily downtime; hazardous overhead dangling wires leading to electrocution hazards.',
    afterImpact:
      'Modernized 33/11kV indoor GIS substation with 100% underground armoured cabling; power availability reached 23.6 hours/day.',
    lat: 17.332,
    lng: 78.468,
    contractor: 'South Power Infra Tech',
    createdAt: '2025-11-01T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
];

export const INITIAL_NATIONAL_PRIORITIES: NationalPriority[] = [
  {
    id: 'priority-jal-jeevan',
    name: 'Jal Jeevan Mission (Clean Tap Water to Every Home)',
    category: 'Water',
    weight: 25,
    description:
      'Universal provision of 55 LPCD potable piped water supply to rural and urban peri-fringe households.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'priority-ayushman-infra',
    name: 'Ayushman Bharat Health Infrastructure Mission (PM-ABHIM)',
    category: 'Healthcare',
    weight: 20,
    description:
      'Filling critical gaps in public healthcare facilities, especially for urban primary centers and critical care blocks.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'priority-pmgsy-urban-roads',
    name: 'Urban Road Safety & PMGSY Connectivity',
    category: 'Roads',
    weight: 20,
    description:
      'Eliminating accident blackspots, ensuring all-weather paved connectivity, and climate-resilient culverts.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'priority-swachh-bharat',
    name: 'Swachh Bharat Mission (Urban Drainage & Solid Waste)',
    category: 'Sanitation',
    weight: 15,
    description:
      '100% mechanized sewer/drainage desilting, eliminating open overflow, and safe storm runoff.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'priority-digital-india',
    name: 'Digital India & Smart Urban Grid Mission',
    category: 'Digital Infrastructure',
    weight: 10,
    description:
      'Underground optical fiber ducting, IoT civic sensors, and reliable public utility telecommunications.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'priority-samagra-shiksha',
    name: 'Samagra Shiksha (Model Public Schools)',
    category: 'Education',
    weight: 10,
    description:
      'Smart classrooms, hygienic sanitation for girl students, and safe school access paths.',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_ISSUE_CLUSTERS: IssueCluster[] = [
  {
    id: 'CLUST-01',
    title: 'Adampur - Rajghat Arterial Road Surface Breakdown Cluster',
    category: 'Roads',
    affectedArea: 'Varanasi East (Rajghat)',
    demandLevel: 'Critical',
    requestCount: 38,
    requestIds: ['REQ-1043'],
    summary:
      'High concentration of citizen reports citing deep potholes, vehicle axle damage, and floodwater concealment between Rajghat bridge and Kashi station road.',
    lat: 25.328,
    lng: 83.033,
    status: 'Integrated into PRJ-101',
    createdAt: '2026-09-18T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z',
  },
  {
    id: 'CLUST-02',
    title: 'Tondiarpet High Road Drinking Water Pipeline Disruption Cluster',
    category: 'Water',
    affectedArea: 'Chennai North (Tondiarpet)',
    demandLevel: 'High',
    requestCount: 29,
    requestIds: ['REQ-1042'],
    summary:
      'Cluster of Tamil and English petitions reporting zero piped municipal pressure and dependence on private water tankers.',
    lat: 13.118,
    lng: 80.287,
    status: 'Prioritized for Capital Scheme',
    createdAt: '2026-09-22T00:00:00Z',
    updatedAt: '2026-09-26T00:00:00Z',
  },
  {
    id: 'CLUST-03',
    title: 'Shivpur Mandi Stormwater Overflow & Open Silt Cluster',
    category: 'Sanitation',
    affectedArea: 'Varanasi North (Shivpur)',
    demandLevel: 'Medium',
    requestCount: 16,
    requestIds: ['REQ-1046'],
    summary:
      'Recurrent drainage blockage behind vegetable wholesale market creating public health hazards and mosquito vectors.',
    lat: 25.354,
    lng: 82.981,
    status: 'Field Inspection Assigned',
    createdAt: '2026-09-28T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z',
  },
  {
    id: 'CLUST-04',
    title: 'Falaknuma Transformer Overheating & Low Voltage Zone',
    category: 'Electricity',
    affectedArea: 'Hyderabad Old City (Falaknuma)',
    demandLevel: 'High',
    requestCount: 22,
    requestIds: ['REQ-1044'],
    summary:
      'Severe power fluctuations, domestic equipment burnouts, and uninsulated distribution cables across 4 congested lanes.',
    lat: 17.332,
    lng: 78.468,
    status: 'Work Order Pending',
    createdAt: '2026-09-24T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z',
  },
];

export const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'REC-201',
    title: 'North Chennai Desalination Piped Feed Grid & Pressure Balancing Reservoir',
    problemAddressed:
      'Persistent citizen complaints regarding 2-week pipeline dry spells and 48% dependency on private water tankers in Tondiarpet.',
    category: 'Water',
    areaName: 'Chennai North (Tondiarpet)',
    affectedPopulation: 180000,
    infrastructureGap: 'Critical (52% deficient piped water coverage)',
    priorityScore: 89,
    estimatedBudget: 68000000, // ₹6.8 Crore
    expectedImpact:
      'Connects 32,000 households with direct 135 LPCD potable water; reduces household monthly water expenses by 85%.',
    evidence:
      'Corroborated by 29 citizen reports, 48% baseline clean water deficit, and high BPL population density in Tondiarpet.',
    confidenceScore: 94,
    explanation:
      'Ranks highest due to high citizen petition density, alignment with National Jal Jeevan Mission weight (25%), and extreme equity factor for coastal low-income workers.',
    duplicateCheck: {
      hasDuplicate: true,
      existingProjectId: 'PRJ-103',
      existingProjectName: 'North Chennai Desalination Secondary Water Distribution Pipeline Network',
      recommendationType: 'expansion',
      notes:
        '⚠️ Potential Duplicate Investment Detected: Project PRJ-103 is currently planned for nearby feeder line. Recommending budgetary expansion of PRJ-103 rather than floating an independent redundant tender.',
    },
    status: 'Approved',
    createdAt: '2026-09-27T00:00:00Z',
  },
  {
    id: 'REC-202',
    title: 'Varanasi East Primary Healthcare Modernization & Blood Storage Unit',
    problemAddressed:
      'High citizen travel distance for basic maternal emergencies and low bed-per-1000 ratio (0.6 vs national norm 2.0).',
    category: 'Healthcare',
    areaName: 'Varanasi East (Adampur - Rajghat)',
    affectedPopulation: 140000,
    infrastructureGap: 'High (0.6 hospital beds per 1,000 vs 2.0 norm)',
    priorityScore: 86,
    estimatedBudget: 42000000, // ₹4.2 Crore
    expectedImpact:
      'Provides emergency obstetric and neonatal care for 12,000 expectant mothers annually; cuts transit time by 45 minutes.',
    evidence:
      'Demographic audit shows 42% BPL households with 61% deficit in institutional healthcare accessibility.',
    confidenceScore: 91,
    explanation:
      'Crucial alignment with PM-ABHIM mission priorities and high vulnerable population concentration in older urban wards.',
    duplicateCheck: {
      hasDuplicate: true,
      existingProjectId: 'PRJ-102',
      existingProjectName: 'Varanasi East Community Health Center (CHC) Expansion & Maternal Ward',
      recommendationType: 'acceleration',
      notes:
        '⚠️ Potential Duplicate Investment Detected: Project PRJ-102 is currently 42% complete at this location. Recommending fund acceleration of PRJ-102 rather than duplicating equipment tenders.',
    },
    status: 'Draft',
    createdAt: '2026-09-28T00:00:00Z',
  },
  {
    id: 'REC-203',
    title: 'Shivpur Wholesale Market Mechanized Storm Drainage & Box Culvert',
    problemAddressed:
      'Recurrent monsoon water stagnation, damaged culverts, and vector disease outbreaks impacting 55,000 traders and residents.',
    category: 'Sanitation',
    areaName: 'Varanasi North (Shivpur)',
    affectedPopulation: 55000,
    infrastructureGap: 'Medium (Drainage capacity 46% deficient)',
    priorityScore: 74,
    estimatedBudget: 24000000, // ₹2.4 Crore
    expectedImpact:
      'Prevents seasonal flooding across 1.8 sq. km market zone; eliminates sewage backflow for 7,500 families.',
    evidence:
      '16 citizen grievances validated with drainage slope measurement showing negative gradient silting.',
    confidenceScore: 87,
    explanation:
      'Clean urban runoff directly safeguards public health and reduces commercial disruption during northeast and monsoon rains.',
    duplicateCheck: {
      hasDuplicate: false,
      recommendationType: 'new',
      notes:
        'No active municipal drainage tenders identified in northern market zone. New capital project recommended.',
    },
    status: 'Draft',
    createdAt: '2026-09-29T00:00:00Z',
  },
];

export const PRESET_PETITIONS = [
  {
    label: 'தமிழ்: குடிநீர் தட்டுப்பாடு (Drinking Water)',
    language: 'ta' as const,
    category: 'Water' as const,
    locationName: 'Chennai North (Tondiarpet)',
    lat: 13.118,
    lng: 80.287,
    text: 'எங்கள் பகுதியில் கடந்த இரண்டு வாரங்களாக குடிநீர் விநியோகம் முற்றிலும் நின்றுவிட்டது. மக்கள் தனியார் லாரிகளிடம் அதிக பணம் கொடுத்து தண்ணீர் வாங்க வேண்டியுள்ளது. தயவுசெய்து உடனடியாக குழாய் அமைத்து தண்ணீர் வழங்கவும்.',
  },
  {
    label: 'हिंदी: खतरनाक गड्ढे व जलभराव (Road Safety)',
    language: 'hi' as const,
    category: 'Roads' as const,
    locationName: 'Varanasi East (Rajghat)',
    lat: 25.328,
    lng: 83.033,
    text: 'राजघाट पुल के पास मुख्य सड़क पर 3 फीट गहरे गड्ढे हो चुके हैं। पिछले हफ्ते दो स्कूल वैन और कई मोटरसाइकिलें दुर्घटनाग्रस्त हो चुकी हैं। भारी बारिश के बाद जलभराव से गड्ढे दिखते भी नहीं हैं।',
  },
  {
    label: 'తెలుగు: ట్రాన్స్‌ఫార్మర్ ఓవర్‌లోడ్ (Power Outages)',
    language: 'te' as const,
    category: 'Electricity' as const,
    locationName: 'Hyderabad Old City (Falaknuma)',
    lat: 17.332,
    lng: 78.468,
    text: 'పాతబస్తీ ఫలక్‌నుమా ప్రాంతంలో రోజుకు 5-6 గంటల పాటు విద్యుత్ సరఫరా నిలిచిపోతోంది. ట్రాన్స్‌ఫార్మర్ ఓవర్‌లోడ్ అయి పొగలు వస్తోంది, ఎప్పుడు పేలుతుందోనని భయపడుతున్నాము. గృహోపకరణాలు కాలిపోతున్నాయి.',
  },
  {
    label: 'বাংলা: স্বাস্থ্যকেন্দ্র ও ল্যাব অভাব (Healthcare)',
    language: 'bn' as const,
    category: 'Healthcare' as const,
    locationName: 'Kolkata North (Belgachia)',
    lat: 22.604,
    lng: 88.384,
    text: 'বেলগাছিয়া আরবান প্রাইমারি হেলথ সেন্টারে কোনো আল্ট্রাসাউন্ড বা রক্ত পরীক্ষা মেশিন নেই। গর্ভবতী মায়েদের ৬ কিলোমিটার দূরে আর.জি. কর হাসপাতালে যেতে বাধ্য করা হয়। অবিলম্বে বেসিক ডায়াগনস্টিক স্থাপন করা হোক।',
  },
  {
    label: 'English: Monsoon Drainage Canal Blockage',
    language: 'en' as const,
    category: 'Sanitation' as const,
    locationName: 'Varanasi North (Shivpur)',
    lat: 25.354,
    lng: 82.981,
    text: 'The storm water drainage canal behind Shivpur vegetable mandi has been blocked by heavy silt and municipal waste. Even minor drizzle causes foul gutter water to submerge the market road and residential basements.',
  },
];

// 0-100 Explainable Priority Scoring Calculation Function
export function calculatePriorityScore(
  demandScore: number, // 0-25
  severity: 'Low' | 'Medium' | 'High' | 'Critical',
  gapPercentage: number, // 0-100%
  population: number,
  bplPercentage: number, // 0-100%
  nationalPriorityWeight: number // 10-30%
): PriorityScoreBreakdown {
  // 1. Citizen Demand Factor (Max 25 pts)
  const factorDemand = Math.min(25, Math.max(5, demandScore));

  // 2. Severity Factor (Max 20 pts)
  const severityMap = { Low: 5, Medium: 10, High: 16, Critical: 20 };
  const factorSeverity = severityMap[severity] || 10;

  // 3. Infrastructure Deficit Gap Factor (Max 20 pts)
  const factorGap = Math.min(20, Math.round((gapPercentage / 100) * 20));

  // 4. Population Impact Factor (Max 15 pts)
  // Scale: 50,000 people -> ~6 pts, 200,000 -> 12 pts, 400,000+ -> 15 pts
  const factorPop = Math.min(15, Math.max(3, Math.round((population / 350000) * 15)));

  // 5. Socio-Economic / Equity Factor (Max 10 pts)
  // Higher BPL / vulnerable proportion gets higher equity score
  const factorEquity = Math.min(10, Math.max(2, Math.round((bplPercentage / 50) * 10)));

  // 6. National Priority Alignment (Max 10 pts)
  const factorNational = Math.min(10, Math.max(2, Math.round((nationalPriorityWeight / 25) * 10)));

  const totalScore = Math.min(
    100,
    Math.round(factorDemand + factorSeverity + factorGap + factorPop + factorEquity + factorNational)
  );

  let rationale = `Composite index computed as: Demand (${factorDemand}/25) + Severity (${factorSeverity}/20) + Deficit Gap (${factorGap}/20) + Population Scale (${factorPop}/15) + Equity Weight (${factorEquity}/10) + National Alignment (${factorNational}/10).`;

  if (totalScore >= 80) {
    rationale += ' Classification: Urgent Priority Capital Allocation.';
  } else if (totalScore >= 65) {
    rationale += ' Classification: High Priority Municipal Scheme.';
  } else {
    rationale += ' Classification: Standard Cyclical Maintenance.';
  }

  return {
    totalScore,
    factors: {
      citizenDemand: factorDemand,
      severity: factorSeverity,
      infrastructureDeficit: factorGap,
      populationImpact: factorPop,
      equityFactor: factorEquity,
      nationalPriority: factorNational,
    },
    rationale,
  };
}
