/**
 * INTEGRAL Frontend Stores
 *
 * Provides reactive stores backed by HoloSphere local-first storage
 */

import { writable, derived, readable, get } from 'svelte/store';
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

// ============================================================================
// APP STATE
// ============================================================================

export const isConnected = writable(false);
export const isLoading = writable(false);
export const currentNodeId = writable<string>('');
export const sidebarOpen = writable(true);

// Error handling
export const errorMessage = writable<string | null>(null);
export const successMessage = writable<string | null>(null);

export function showError(message: string, duration = 5000) {
	errorMessage.set(message);
	if (duration > 0) {
		setTimeout(() => errorMessage.set(null), duration);
	}
}

export function showSuccess(message: string, duration = 3000) {
	successMessage.set(message);
	if (duration > 0) {
		setTimeout(() => successMessage.set(null), duration);
	}
}

// ============================================================================
// NODE STATUS
// ============================================================================

export const nodeStatus = writable<NodeStatus | null>(null);

// ============================================================================
// DASHBOARD
// ============================================================================

export const dashboardStats = writable<DashboardStats>({
	activeIssues: 0,
	pendingDecisions: 0,
	activeDesigns: 0,
	totalLaborHours: 0,
	activeTasks: 0,
	activeFindings: 0,
	connectedNodes: 0,
	systemHealth: 'healthy'
});

export const activityFeed = writable<ActivityFeed[]>([]);

// ============================================================================
// CDS STORES
// ============================================================================

export const issues = writable<Issue[]>([]);
export const selectedIssue = writable<Issue | null>(null);
export const submissions = writable<Submission[]>([]);
export const scenarios = writable<Scenario[]>([]);
export const votes = writable<Vote[]>([]);
export const decisions = writable<Decision[]>([]);

export const issuesByStatus = derived(issues, ($issues) => {
	const grouped: Record<string, Issue[]> = {};
	for (const issue of $issues) {
		if (!grouped[issue.status]) {
			grouped[issue.status] = [];
		}
		grouped[issue.status].push(issue);
	}
	return grouped;
});

// ============================================================================
// OAD STORES
// ============================================================================

export const designSpecs = writable<DesignSpec[]>([]);
export const designVersions = writable<DesignVersion[]>([]);
export const selectedDesign = writable<DesignVersion | null>(null);
export const ecoAssessments = writable<EcoAssessment[]>([]);
export const certifications = writable<CertificationRecord[]>([]);

export const certifiedDesigns = derived(designVersions, ($versions) =>
	$versions.filter((v) => v.status === 'certified')
);

// ============================================================================
// ITC STORES
// ============================================================================

export const itcAccounts = writable<ITCAccount[]>([]);
export const currentAccount = writable<ITCAccount | null>(null);
export const laborEvents = writable<LaborEvent[]>([]);
export const valuations = writable<AccessValuation[]>([]);

export const totalCirculatingITC = derived(itcAccounts, ($accounts) =>
	$accounts.reduce((sum, acc) => sum + acc.balance, 0)
);

// ============================================================================
// COS STORES
// ============================================================================

export const productionPlans = writable<ProductionPlan[]>([]);
export const selectedPlan = writable<ProductionPlan | null>(null);
export const tasks = writable<TaskInstance[]>([]);
export const constraints = writable<COSConstraint[]>([]);
export const materialInventory = writable<MaterialInventory[]>([]);

export const activePlans = derived(productionPlans, ($plans) =>
	$plans.filter((p) => p.completedTasks < p.taskCount)
);

// ============================================================================
// FRS STORES
// ============================================================================

export const findings = writable<DiagnosticFinding[]>([]);

export const findingsBySeverity = derived(findings, ($findings) => {
	const grouped: Record<string, DiagnosticFinding[]> = {
		critical: [],
		moderate: [],
		low: [],
		info: []
	};
	for (const finding of $findings) {
		grouped[finding.severity].push(finding);
	}
	return grouped;
});

export const criticalFindings = derived(findings, ($findings) =>
	$findings.filter((f) => f.severity === 'critical')
);

export const signalPackets = writable<SignalPacket[]>([]);
export const recommendations = writable<Recommendation[]>([]);
export const memories = writable<MemoryRecord[]>([]);

// ============================================================================
// FEDERATION STORES
// ============================================================================

export const federatedNodes = writable<FederatedNode[]>([]);
export const federatedMessages = writable<FederatedMessage[]>([]);

export const connectedNodeCount = derived(federatedNodes, ($nodes) => $nodes.length);

// ============================================================================
// REAL-TIME CLOCK
// ============================================================================

export const currentTime = readable(new Date(), (set) => {
	const interval = setInterval(() => {
		set(new Date());
	}, 1000);

	return () => clearInterval(interval);
});

// ============================================================================
// THEME
// ============================================================================

export const theme = writable<'dark' | 'light'>('dark');

// ============================================================================
// NAVIGATION
// ============================================================================

export type NavSection = 'dashboard' | 'cds' | 'oad' | 'itc' | 'cos' | 'frs' | 'federation' | 'settings';

export const currentSection = writable<NavSection>('dashboard');
