/**
 * INTEGRAL API Client
 *
 * Uses HoloSphere as the backend for local-first data storage and Nostr federation
 */

import { getHoloSphereService } from '$lib/holosphere';
import type {
	NodeStatus,
	DashboardStats,
	Issue,
	Submission,
	Scenario,
	Vote,
	Decision,
	DesignSpec,
	DesignVersion,
	EcoAssessment,
	CertificationRecord,
	LaborEvent,
	ITCAccount,
	AccessValuation,
	ProductionPlan,
	TaskInstance,
	COSConstraint,
	MaterialInventory,
	SignalPacket,
	DiagnosticFinding,
	Recommendation,
	MemoryRecord,
	FederatedNode,
	FederatedMessage,
	ActivityFeed
} from '$lib/types';

// Get the singleton holosphere service
const hs = getHoloSphereService();

// ============================================================================
// NODE API
// ============================================================================

export const nodeApi = {
	getStatus: (): Promise<NodeStatus> => hs.getNodeStatus(),
	start: (): Promise<{ success: boolean }> => hs.startNode(),
	stop: (): Promise<{ success: boolean }> => hs.stopNode()
};

// ============================================================================
// DASHBOARD API
// ============================================================================

export const dashboardApi = {
	getStats: (): Promise<DashboardStats> => hs.getDashboardStats(),

	getActivityFeed: (limit = 20): Promise<ActivityFeed[]> => hs.getActivityFeed(limit),

	getSystemHealth: (): Promise<{
		cds: boolean;
		oad: boolean;
		itc: boolean;
		cos: boolean;
		frs: boolean;
		overall: 'healthy' | 'warning' | 'critical';
	}> => hs.getSystemHealth()
};

// ============================================================================
// CDS API
// ============================================================================

export const cdsApi = {
	// Issues
	listIssues: (status?: string): Promise<Issue[]> => hs.listIssues(status),

	getIssue: (id: string): Promise<Issue | null> => hs.getIssue(id),

	createIssue: (data: { title: string; description: string; authorId: string }): Promise<Issue> =>
		hs.createIssue(data),

	// Submissions
	listSubmissions: (issueId?: string): Promise<Submission[]> => hs.listSubmissions(issueId),

	addSubmission: (
		issueId: string,
		data: { type: string; content: string; authorId: string }
	): Promise<Submission> => hs.addSubmission(issueId, data),

	// Scenarios
	listScenarios: (issueId?: string): Promise<Scenario[]> => hs.listScenarios(issueId),

	createScenario: (
		issueId: string,
		data: { label: string; parameters: Record<string, unknown> }
	): Promise<Scenario> => hs.createScenario(issueId, data),

	// Votes
	listVotes: (scenarioId?: string): Promise<Vote[]> => hs.listVotes(scenarioId),

	// Voting
	castVote: (
		scenarioId: string,
		data: { participantId: string; supportLevel: string }
	): Promise<{ success: boolean }> => hs.castVote(scenarioId, data),

	// Consensus
	evaluateConsensus: (
		scenarioId: string
	): Promise<{ consensusScore: number; objectionIndex: number; directive: string }> =>
		hs.evaluateConsensus(scenarioId),

	// Decisions
	listDecisions: (): Promise<Decision[]> => hs.listDecisions(),

	makeDecision: (issueId: string, scenarioId: string): Promise<Decision> =>
		hs.makeDecision(issueId, scenarioId)
};

// ============================================================================
// OAD API
// ============================================================================

export const oadApi = {
	// Specs
	listSpecs: (): Promise<DesignSpec[]> => hs.listSpecs(),

	createSpec: (data: { purpose: string; functionalRequirements: string[] }): Promise<DesignSpec> =>
		hs.createSpec(data),

	// Versions
	listVersions: (specId?: string): Promise<DesignVersion[]> => hs.listVersions(specId),

	getVersion: (id: string): Promise<DesignVersion | null> => hs.getVersion(id),

	createVersion: (data: {
		specId: string;
		label: string;
		authors: string[];
		parameters: Record<string, unknown>;
	}): Promise<DesignVersion> => hs.createVersion(data),

	// Eco Assessment
	listEcoAssessments: (): Promise<EcoAssessment[]> => hs.listEcoAssessments(),

	getEcoAssessment: (versionId: string): Promise<EcoAssessment | null> =>
		hs.getEcoAssessment(versionId),

	computeEcoAssessment: (versionId: string): Promise<EcoAssessment> =>
		hs.computeEcoAssessment(versionId),

	// Certification
	listCertifications: (): Promise<CertificationRecord[]> => hs.listCertifications(),

	getCertification: (versionId: string): Promise<CertificationRecord | null> =>
		hs.getCertification(versionId),

	requestCertification: (versionId: string, certifiers: string[]): Promise<CertificationRecord> =>
		hs.requestCertification(versionId, certifiers)
};

// ============================================================================
// ITC API
// ============================================================================

export const itcApi = {
	// Accounts
	listAccounts: (): Promise<ITCAccount[]> => hs.listAccounts(),

	getAccount: (memberId: string): Promise<ITCAccount | null> => hs.getAccount(memberId),

	// Labor Events
	listLaborEvents: (memberId?: string, limit = 50): Promise<LaborEvent[]> =>
		hs.listLaborEvents(memberId, limit),

	recordLabor: (data: {
		memberId: string;
		taskId: string;
		taskLabel: string;
		startTime: string;
		endTime: string;
		skillTier: string;
	}): Promise<LaborEvent> => hs.recordLabor(data),

	verifyLabor: (eventId: string, verifierId: string): Promise<LaborEvent> =>
		hs.verifyLabor(eventId, verifierId),

	// Access Valuation
	listValuations: (): Promise<AccessValuation[]> => hs.listValuations(),

	computeValuation: (itemId: string, versionId: string): Promise<AccessValuation> =>
		hs.computeValuation(itemId, versionId),

	getValuation: (itemId: string): Promise<AccessValuation | null> => hs.getValuation(itemId),

	// Redemption
	redeemAccess: (data: {
		memberId: string;
		itemId: string;
		redemptionType: string;
	}): Promise<{ success: boolean; newBalance: number }> => hs.redeemAccess(data),

	// Decay
	applyDecay: (memberId: string): Promise<{ decayAmount: number; newBalance: number }> =>
		hs.applyDecay(memberId)
};

// ============================================================================
// COS API
// ============================================================================

export const cosApi = {
	// Plans
	listPlans: (): Promise<ProductionPlan[]> => hs.listPlans(),

	getPlan: (planId: string): Promise<ProductionPlan | null> => hs.getPlan(planId),

	createPlan: (data: { versionId: string; batchSize: number }): Promise<ProductionPlan> =>
		hs.createPlan(data),

	// Tasks
	listAllTasks: (): Promise<TaskInstance[]> => hs.listAllTasks(),

	listTasks: (planId: string): Promise<TaskInstance[]> => hs.listTasks(planId),

	getTask: (taskId: string): Promise<TaskInstance | null> => hs.getTask(taskId),

	assignTask: (
		taskId: string,
		data: { coopId: string; participantIds: string[] }
	): Promise<TaskInstance> => hs.assignTask(taskId, data),

	startTask: (taskId: string): Promise<TaskInstance> => hs.startTask(taskId),

	completeTask: (taskId: string, actualHours: number): Promise<TaskInstance> =>
		hs.completeTask(taskId, actualHours),

	blockTask: (taskId: string, reason: string): Promise<TaskInstance> =>
		hs.blockTask(taskId, reason),

	// Constraints
	listConstraints: (): Promise<COSConstraint[]> => hs.listConstraints(),

	detectBottlenecks: (planId: string): Promise<COSConstraint[]> => hs.detectBottlenecks(planId),

	// Materials
	listInventory: (): Promise<MaterialInventory[]> => hs.listInventory(),

	getMaterialInventory: (planId: string): Promise<Record<string, number>> =>
		hs.getMaterialInventory(planId)
};

// ============================================================================
// FRS API
// ============================================================================

export const frsApi = {
	// Signals
	listSignalPackets: (): Promise<SignalPacket[]> => hs.listSignalPackets(),

	createSignalPacket: (): Promise<{ packetId: string; signalCount: number }> =>
		hs.createSignalPacket(),

	// Findings
	listFindings: (severity?: string): Promise<DiagnosticFinding[]> => hs.listFindings(severity),

	analyzePacket: (packetId: string): Promise<DiagnosticFinding[]> => hs.analyzePacket(packetId),

	// Recommendations
	listRecommendations: (targetSystem?: string): Promise<Recommendation[]> =>
		hs.listRecommendations(targetSystem),

	generateRecommendations: (findingIds: string[]): Promise<Recommendation[]> =>
		hs.generateRecommendations(findingIds),

	// Memories
	listMemories: (): Promise<MemoryRecord[]> => hs.listMemories(),

	createMemory: (data: { recordType: MemoryRecord['recordType']; title: string; narrative: string }): Promise<MemoryRecord> =>
		hs.createMemory(data),

	// Dashboard
	getDashboard: (): Promise<{
		totalSignals: number;
		findingsByType: Record<string, number>;
		activeRecommendations: number;
		systemHealth: 'healthy' | 'warning' | 'critical';
		topIssues: string[];
	}> => hs.getFRSDashboard()
};

// ============================================================================
// FEDERATION API
// ============================================================================

export const federationApi = {
	// Nodes
	listNodes: (): Promise<FederatedNode[]> => hs.listFederatedNodes(),

	queryNode: (nodeId: string): Promise<FederatedNode | null> => hs.queryNode(nodeId),

	// Messages
	listMessages: (limit = 20): Promise<FederatedMessage[]> => hs.listFederationMessages(limit),

	sendMessage: (data: {
		messageType: string;
		toScope: string;
		payload: Record<string, unknown>;
		summary: string;
	}): Promise<FederatedMessage> => hs.sendFederationMessage(data),

	// Best Practices
	shareBestPractice: (data: {
		title: string;
		description: string;
		benefits: Record<string, number>;
	}): Promise<FederatedMessage> => hs.shareBestPractice(data),

	// Warnings
	issueWarning: (data: {
		findingId: string;
		severity: string;
		description: string;
	}): Promise<FederatedMessage> => hs.issueWarning(data)
};

// ============================================================================
// SUBSCRIPTION HELPERS
// ============================================================================

export const subscriptions = {
	subscribeToIssues: (callback: (issues: Issue[]) => void) => hs.subscribeToIssues(callback),
	subscribeToAccounts: (callback: (accounts: ITCAccount[]) => void) =>
		hs.subscribeToAccounts(callback),
	subscribeToActivity: (callback: (activities: ActivityFeed[]) => void) =>
		hs.subscribeToActivity(callback),
	subscribeToDesigns: (callback: (designs: DesignVersion[]) => void) =>
		hs.subscribeToDesigns(callback),
	subscribeToPlans: (callback: (plans: ProductionPlan[]) => void) =>
		hs.subscribeToPlans(callback),
	subscribeToFindings: (callback: (findings: DiagnosticFinding[]) => void) =>
		hs.subscribeToFindings(callback),
	subscribeToNodes: (callback: (nodes: FederatedNode[]) => void) =>
		hs.subscribeToNodes(callback),
	subscribeToMessages: (callback: (messages: FederatedMessage[]) => void) =>
		hs.subscribeToMessages(callback)
};

// ============================================================================
// HOLOSPHERE ACCESS
// ============================================================================

export const holosphere = {
	getService: () => hs,
	init: () => hs.init(),
	isInitialized: () => hs.isInitialized()
};

// ============================================================================
// EXPORT CLIENT
// ============================================================================

export const api = {
	node: nodeApi,
	dashboard: dashboardApi,
	cds: cdsApi,
	oad: oadApi,
	itc: itcApi,
	cos: cosApi,
	frs: frsApi,
	federation: federationApi,
	subscriptions,
	holosphere
};

export default api;
