/**
 * INTEGRAL API Client
 */

import type {
	NodeStatus,
	DashboardStats,
	Issue,
	Submission,
	Scenario,
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
	DiagnosticFinding,
	Recommendation,
	FederatedNode,
	FederatedMessage,
	ActivityFeed
} from '$lib/types';

const API_BASE = '/api';

class APIError extends Error {
	constructor(public status: number, message: string) {
		super(message);
		this.name = 'APIError';
	}
}

async function request<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const url = `${API_BASE}${endpoint}`;

	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
		...options
	});

	if (!response.ok) {
		const error = await response.text();
		throw new APIError(response.status, error || response.statusText);
	}

	return response.json();
}

// ============================================================================
// NODE API
// ============================================================================

export const nodeApi = {
	getStatus: () => request<NodeStatus>('/node/status'),

	start: () => request<{ success: boolean }>('/node/start', { method: 'POST' }),

	stop: () => request<{ success: boolean }>('/node/stop', { method: 'POST' })
};

// ============================================================================
// DASHBOARD API
// ============================================================================

export const dashboardApi = {
	getStats: () => request<DashboardStats>('/dashboard/stats'),

	getActivityFeed: (limit = 20) =>
		request<ActivityFeed[]>(`/dashboard/activity?limit=${limit}`),

	getSystemHealth: () => request<{
		cds: boolean;
		oad: boolean;
		itc: boolean;
		cos: boolean;
		frs: boolean;
		overall: 'healthy' | 'warning' | 'critical';
	}>('/dashboard/health')
};

// ============================================================================
// CDS API
// ============================================================================

export const cdsApi = {
	// Issues
	listIssues: (status?: string) => {
		const params = status ? `?status=${status}` : '';
		return request<Issue[]>(`/cds/issues${params}`);
	},

	getIssue: (id: string) => request<Issue>(`/cds/issues/${id}`),

	createIssue: (data: { title: string; description: string; authorId: string }) =>
		request<Issue>('/cds/issues', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	// Submissions
	addSubmission: (issueId: string, data: { type: string; content: string; authorId: string }) =>
		request<Submission>(`/cds/issues/${issueId}/submissions`, {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	// Scenarios
	listScenarios: (issueId: string) =>
		request<Scenario[]>(`/cds/issues/${issueId}/scenarios`),

	createScenario: (issueId: string, data: { label: string; parameters: Record<string, unknown> }) =>
		request<Scenario>(`/cds/issues/${issueId}/scenarios`, {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	// Voting
	castVote: (scenarioId: string, data: { participantId: string; supportLevel: string }) =>
		request<{ success: boolean }>(`/cds/scenarios/${scenarioId}/vote`, {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	// Consensus
	evaluateConsensus: (scenarioId: string) =>
		request<{ consensusScore: number; objectionIndex: number; directive: string }>(
			`/cds/scenarios/${scenarioId}/evaluate`
		),

	// Decisions
	listDecisions: () => request<Decision[]>('/cds/decisions'),

	makeDecision: (issueId: string, scenarioId: string) =>
		request<Decision>('/cds/decisions', {
			method: 'POST',
			body: JSON.stringify({ issueId, scenarioId })
		})
};

// ============================================================================
// OAD API
// ============================================================================

export const oadApi = {
	// Specs
	listSpecs: () => request<DesignSpec[]>('/oad/specs'),

	createSpec: (data: { purpose: string; functionalRequirements: string[] }) =>
		request<DesignSpec>('/oad/specs', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	// Versions
	listVersions: (specId?: string) => {
		const params = specId ? `?specId=${specId}` : '';
		return request<DesignVersion[]>(`/oad/versions${params}`);
	},

	getVersion: (id: string) => request<DesignVersion>(`/oad/versions/${id}`),

	createVersion: (data: { specId: string; label: string; authors: string[]; parameters: Record<string, unknown> }) =>
		request<DesignVersion>('/oad/versions', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	// Eco Assessment
	getEcoAssessment: (versionId: string) =>
		request<EcoAssessment>(`/oad/versions/${versionId}/eco`),

	computeEcoAssessment: (versionId: string) =>
		request<EcoAssessment>(`/oad/versions/${versionId}/eco/compute`, {
			method: 'POST'
		}),

	// Certification
	getCertification: (versionId: string) =>
		request<CertificationRecord>(`/oad/versions/${versionId}/certification`),

	requestCertification: (versionId: string, certifiers: string[]) =>
		request<CertificationRecord>(`/oad/versions/${versionId}/certification`, {
			method: 'POST',
			body: JSON.stringify({ certifiers })
		})
};

// ============================================================================
// ITC API
// ============================================================================

export const itcApi = {
	// Accounts
	listAccounts: () => request<ITCAccount[]>('/itc/accounts'),

	getAccount: (memberId: string) => request<ITCAccount>(`/itc/accounts/${memberId}`),

	// Labor Events
	listLaborEvents: (memberId?: string, limit = 50) => {
		const params = new URLSearchParams({ limit: limit.toString() });
		if (memberId) params.set('memberId', memberId);
		return request<LaborEvent[]>(`/itc/labor?${params}`);
	},

	recordLabor: (data: {
		memberId: string;
		taskId: string;
		taskLabel: string;
		startTime: string;
		endTime: string;
		skillTier: string;
	}) =>
		request<LaborEvent>('/itc/labor', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	verifyLabor: (eventId: string, verifierId: string) =>
		request<LaborEvent>(`/itc/labor/${eventId}/verify`, {
			method: 'POST',
			body: JSON.stringify({ verifierId })
		}),

	// Access Valuation
	computeValuation: (itemId: string, versionId: string) =>
		request<AccessValuation>('/itc/valuations/compute', {
			method: 'POST',
			body: JSON.stringify({ itemId, versionId })
		}),

	getValuation: (itemId: string) =>
		request<AccessValuation>(`/itc/valuations/${itemId}`),

	// Redemption
	redeemAccess: (data: { memberId: string; itemId: string; redemptionType: string }) =>
		request<{ success: boolean; newBalance: number }>('/itc/redeem', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	// Decay
	applyDecay: (memberId: string) =>
		request<{ decayAmount: number; newBalance: number }>(`/itc/accounts/${memberId}/decay`, {
			method: 'POST'
		})
};

// ============================================================================
// COS API
// ============================================================================

export const cosApi = {
	// Plans
	listPlans: () => request<ProductionPlan[]>('/cos/plans'),

	getPlan: (planId: string) => request<ProductionPlan>(`/cos/plans/${planId}`),

	createPlan: (data: { versionId: string; batchSize: number }) =>
		request<ProductionPlan>('/cos/plans', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	// Tasks
	listTasks: (planId: string) =>
		request<TaskInstance[]>(`/cos/plans/${planId}/tasks`),

	getTask: (taskId: string) =>
		request<TaskInstance>(`/cos/tasks/${taskId}`),

	assignTask: (taskId: string, data: { coopId: string; participantIds: string[] }) =>
		request<TaskInstance>(`/cos/tasks/${taskId}/assign`, {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	startTask: (taskId: string) =>
		request<TaskInstance>(`/cos/tasks/${taskId}/start`, { method: 'POST' }),

	completeTask: (taskId: string, actualHours: number) =>
		request<TaskInstance>(`/cos/tasks/${taskId}/complete`, {
			method: 'POST',
			body: JSON.stringify({ actualHours })
		}),

	blockTask: (taskId: string, reason: string) =>
		request<TaskInstance>(`/cos/tasks/${taskId}/block`, {
			method: 'POST',
			body: JSON.stringify({ reason })
		}),

	// Constraints
	detectBottlenecks: (planId: string) =>
		request<COSConstraint[]>(`/cos/plans/${planId}/bottlenecks`),

	// Materials
	getMaterialInventory: (planId: string) =>
		request<Record<string, number>>(`/cos/plans/${planId}/materials`)
};

// ============================================================================
// FRS API
// ============================================================================

export const frsApi = {
	// Signals
	createSignalPacket: () =>
		request<{ packetId: string; signalCount: number }>('/frs/signals/packet', {
			method: 'POST'
		}),

	// Findings
	listFindings: (severity?: string) => {
		const params = severity ? `?severity=${severity}` : '';
		return request<DiagnosticFinding[]>(`/frs/findings${params}`);
	},

	analyzePacket: (packetId: string) =>
		request<DiagnosticFinding[]>(`/frs/findings/analyze`, {
			method: 'POST',
			body: JSON.stringify({ packetId })
		}),

	// Recommendations
	listRecommendations: (targetSystem?: string) => {
		const params = targetSystem ? `?target=${targetSystem}` : '';
		return request<Recommendation[]>(`/frs/recommendations${params}`);
	},

	generateRecommendations: (findingIds: string[]) =>
		request<Recommendation[]>('/frs/recommendations/generate', {
			method: 'POST',
			body: JSON.stringify({ findingIds })
		}),

	// Dashboard
	getDashboard: () =>
		request<{
			totalSignals: number;
			findingsByType: Record<string, number>;
			activeRecommendations: number;
			systemHealth: 'healthy' | 'warning' | 'critical';
			topIssues: string[];
		}>('/frs/dashboard')
};

// ============================================================================
// FEDERATION API
// ============================================================================

export const federationApi = {
	// Nodes
	listNodes: () => request<FederatedNode[]>('/federation/nodes'),

	queryNode: (nodeId: string) =>
		request<FederatedNode>(`/federation/nodes/${nodeId}`),

	// Messages
	listMessages: (limit = 20) =>
		request<FederatedMessage[]>(`/federation/messages?limit=${limit}`),

	sendMessage: (data: {
		messageType: string;
		toScope: string;
		payload: Record<string, unknown>;
		summary: string;
	}) =>
		request<FederatedMessage>('/federation/messages', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	// Best Practices
	shareBestPractice: (data: { title: string; description: string; benefits: Record<string, number> }) =>
		request<FederatedMessage>('/federation/best-practices', {
			method: 'POST',
			body: JSON.stringify(data)
		}),

	// Warnings
	issueWarning: (data: { findingId: string; severity: string; description: string }) =>
		request<FederatedMessage>('/federation/warnings', {
			method: 'POST',
			body: JSON.stringify(data)
		})
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
	federation: federationApi
};

export default api;
