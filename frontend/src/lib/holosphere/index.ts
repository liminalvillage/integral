/**
 * INTEGRAL HoloSphere Backend Service
 *
 * Uses holosphere@next for local-first data storage and Nostr federation
 */

import HoloSphere from 'holosphere';
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

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface IntegralHoloSphereConfig {
	appName?: string;
	nodeId?: string;
	relays?: string[];
	privateKey?: string;
	logLevel?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
}

const DEFAULT_CONFIG: IntegralHoloSphereConfig = {
	appName: 'integral',
	nodeId: 'integral-node',
	relays: [
		'wss://relay.damus.io',
		'wss://relay.nostr.band',
		'wss://nos.lol'
	],
	logLevel: 'INFO'
};

// ============================================================================
// HOLOSPHERE SERVICE
// ============================================================================

class IntegralHoloSphereService {
	private hs: HoloSphere | null = null;
	private config: IntegralHoloSphereConfig;
	private initialized = false;
	private nodeId: string;

	constructor(config: Partial<IntegralHoloSphereConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.nodeId = this.config.nodeId || 'integral-node';
	}

	// ==========================================================================
	// INITIALIZATION
	// ==========================================================================

	async init(): Promise<void> {
		if (this.initialized) return;

		this.hs = new HoloSphere({
			appName: this.config.appName,
			relays: this.config.relays,
			privateKey: this.config.privateKey,
			logLevel: this.config.logLevel,
			persistence: true,
			backgroundSync: true
		});

		await this.hs.ready();
		this.initialized = true;

		// Initialize node status
		await this.initializeNodeStatus();
	}

	private async initializeNodeStatus(): Promise<void> {
		const existingStatus = await this.hs!.read(this.nodeId, 'node', 'status');
		if (!existingStatus) {
			await this.hs!.write(this.nodeId, 'node', {
				id: 'status',
				nodeId: this.nodeId,
				isRunning: true,
				publicKey: null,
				connectedRelays: this.config.relays?.length || 0,
				knownNodes: 0,
				subsystems: {
					cds: true,
					oad: true,
					itc: true,
					cos: true,
					frs: true
				}
			});
		}
	}

	getHoloSphere(): HoloSphere | null {
		return this.hs;
	}

	isInitialized(): boolean {
		return this.initialized;
	}

	// ==========================================================================
	// NODE OPERATIONS
	// ==========================================================================

	async getNodeStatus(): Promise<NodeStatus> {
		await this.ensureInitialized();
		const status = await this.hs!.read(this.nodeId, 'node', 'status');
		return status || {
			nodeId: this.nodeId,
			isRunning: false,
			publicKey: null,
			connectedRelays: 0,
			knownNodes: 0,
			subsystems: { cds: false, oad: false, itc: false, cos: false, frs: false }
		};
	}

	async startNode(): Promise<{ success: boolean }> {
		await this.ensureInitialized();
		const status = await this.getNodeStatus();
		await this.hs!.write(this.nodeId, 'node', { id: 'status', ...status, isRunning: true });
		await this.logActivity('FED', 'node_started', 'INTEGRAL node started');
		return { success: true };
	}

	async stopNode(): Promise<{ success: boolean }> {
		await this.ensureInitialized();
		const status = await this.getNodeStatus();
		await this.hs!.write(this.nodeId, 'node', { id: 'status', ...status, isRunning: false });
		await this.logActivity('FED', 'node_stopped', 'INTEGRAL node stopped');
		return { success: true };
	}

	// ==========================================================================
	// DASHBOARD OPERATIONS
	// ==========================================================================

	async getDashboardStats(): Promise<DashboardStats> {
		await this.ensureInitialized();

		const [issues, designs, accounts, plans, findings, nodes] = await Promise.all([
			this.hs!.getAll(this.nodeId, 'cds_issues'),
			this.hs!.getAll(this.nodeId, 'oad_versions'),
			this.hs!.getAll(this.nodeId, 'itc_accounts'),
			this.hs!.getAll(this.nodeId, 'cos_plans'),
			this.hs!.getAll(this.nodeId, 'frs_findings'),
			this.hs!.getAll(this.nodeId, 'federation_nodes')
		]);

		const issueList = Object.values(issues || {}) as Issue[];
		const designList = Object.values(designs || {}) as DesignVersion[];
		const accountList = Object.values(accounts || {}) as ITCAccount[];
		const planList = Object.values(plans || {}) as ProductionPlan[];
		const findingList = Object.values(findings || {}) as DiagnosticFinding[];
		const nodeList = Object.values(nodes || {}) as FederatedNode[];

		const activeIssues = issueList.filter(i => i.status !== 'decided' && i.status !== 'dispatched').length;
		const pendingDecisions = issueList.filter(i => i.status === 'deliberation').length;
		const activeDesigns = designList.filter(d => d.status !== 'certified').length;
		const totalLaborHours = accountList.reduce((sum, a) => sum + a.totalEarned, 0);
		const activeTasks = planList.reduce((sum, p) => sum + (p.taskCount - p.completedTasks), 0);
		const activeFindings = findingList.filter(f => f.severity === 'critical' || f.severity === 'moderate').length;

		let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
		if (findingList.some(f => f.severity === 'critical')) {
			systemHealth = 'critical';
		} else if (findingList.some(f => f.severity === 'moderate')) {
			systemHealth = 'warning';
		}

		return {
			activeIssues,
			pendingDecisions,
			activeDesigns,
			totalLaborHours,
			activeTasks,
			activeFindings,
			connectedNodes: nodeList.length,
			systemHealth
		};
	}

	async getActivityFeed(limit = 20): Promise<ActivityFeed[]> {
		await this.ensureInitialized();
		const activities = await this.hs!.getAll(this.nodeId, 'activity_feed');
		const activityList = Object.values(activities || {}) as ActivityFeed[];
		return activityList
			.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
			.slice(0, limit);
	}

	async getSystemHealth(): Promise<{
		cds: boolean;
		oad: boolean;
		itc: boolean;
		cos: boolean;
		frs: boolean;
		overall: 'healthy' | 'warning' | 'critical';
	}> {
		const status = await this.getNodeStatus();
		const stats = await this.getDashboardStats();
		return {
			...status.subsystems,
			overall: stats.systemHealth
		};
	}

	// ==========================================================================
	// CDS OPERATIONS
	// ==========================================================================

	async listIssues(status?: string): Promise<Issue[]> {
		await this.ensureInitialized();
		const issues = await this.hs!.getAll(this.nodeId, 'cds_issues');
		let issueList = Object.values(issues || {}) as Issue[];
		if (status) {
			issueList = issueList.filter(i => i.status === status);
		}
		return issueList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}

	async getIssue(id: string): Promise<Issue | null> {
		await this.ensureInitialized();
		return await this.hs!.read(this.nodeId, 'cds_issues', id);
	}

	async createIssue(data: { title: string; description: string; authorId: string }): Promise<Issue> {
		await this.ensureInitialized();
		const issue: Issue = {
			id: this.generateId(),
			title: data.title,
			description: data.description,
			nodeId: this.nodeId,
			status: 'intake',
			createdAt: new Date().toISOString(),
			lastUpdatedAt: new Date().toISOString(),
			submissionCount: 0,
			metadata: { authorId: data.authorId }
		};
		await this.hs!.write(this.nodeId, 'cds_issues', issue);
		await this.logActivity('CDS', 'issue_created', `Issue created: ${issue.title}`);
		return issue;
	}

	async addSubmission(issueId: string, data: { type: string; content: string; authorId: string }): Promise<Submission> {
		await this.ensureInitialized();
		const submission: Submission = {
			id: this.generateId(),
			authorId: data.authorId,
			issueId,
			type: data.type as Submission['type'],
			content: data.content,
			createdAt: new Date().toISOString()
		};
		await this.hs!.write(this.nodeId, 'cds_submissions', submission);

		// Update issue submission count
		const issue = await this.getIssue(issueId);
		if (issue) {
			issue.submissionCount++;
			issue.lastUpdatedAt = new Date().toISOString();
			await this.hs!.write(this.nodeId, 'cds_issues', issue);
		}

		await this.logActivity('CDS', 'submission_added', `Submission added to issue ${issueId}`);
		return submission;
	}

	async listScenarios(issueId: string): Promise<Scenario[]> {
		await this.ensureInitialized();
		const scenarios = await this.hs!.getAll(this.nodeId, 'cds_scenarios');
		const scenarioList = Object.values(scenarios || {}) as Scenario[];
		return scenarioList.filter(s => s.issueId === issueId);
	}

	async createScenario(issueId: string, data: { label: string; parameters: Record<string, unknown> }): Promise<Scenario> {
		await this.ensureInitialized();
		const scenario: Scenario = {
			id: this.generateId(),
			issueId,
			label: data.label,
			parameters: data.parameters
		};
		await this.hs!.write(this.nodeId, 'cds_scenarios', scenario);
		await this.logActivity('CDS', 'scenario_created', `Scenario created: ${scenario.label}`);
		return scenario;
	}

	async castVote(scenarioId: string, data: { participantId: string; supportLevel: string }): Promise<{ success: boolean }> {
		await this.ensureInitialized();
		const voteId = `${scenarioId}_${data.participantId}`;
		await this.hs!.write(this.nodeId, 'cds_votes', {
			id: voteId,
			scenarioId,
			participantId: data.participantId,
			supportLevel: data.supportLevel,
			weight: 1,
			createdAt: new Date().toISOString()
		});
		await this.logActivity('CDS', 'vote_cast', `Vote cast on scenario ${scenarioId}`);
		return { success: true };
	}

	async evaluateConsensus(scenarioId: string): Promise<{ consensusScore: number; objectionIndex: number; directive: string }> {
		await this.ensureInitialized();
		const votes = await this.hs!.getAll(this.nodeId, 'cds_votes');
		const scenarioVotes = Object.values(votes || {}).filter((v: any) => v.scenarioId === scenarioId);

		const supportWeights: Record<string, number> = {
			strong_support: 1.0,
			support: 0.75,
			neutral: 0.5,
			concern: 0.25,
			block: 0
		};

		let totalWeight = 0;
		let consensusSum = 0;
		let blockCount = 0;

		for (const vote of scenarioVotes as any[]) {
			totalWeight += vote.weight;
			consensusSum += supportWeights[vote.supportLevel] * vote.weight;
			if (vote.supportLevel === 'block') blockCount++;
		}

		const consensusScore = totalWeight > 0 ? consensusSum / totalWeight : 0;
		const objectionIndex = totalWeight > 0 ? blockCount / totalWeight : 0;

		let directive = 'continue_deliberation';
		if (consensusScore >= 0.75 && objectionIndex < 0.1) {
			directive = 'approve';
		} else if (objectionIndex >= 0.3) {
			directive = 'revise_required';
		}

		return { consensusScore, objectionIndex, directive };
	}

	async listDecisions(): Promise<Decision[]> {
		await this.ensureInitialized();
		const decisions = await this.hs!.getAll(this.nodeId, 'cds_decisions');
		return Object.values(decisions || {}) as Decision[];
	}

	async makeDecision(issueId: string, scenarioId: string): Promise<Decision> {
		await this.ensureInitialized();
		const consensus = await this.evaluateConsensus(scenarioId);

		const decision: Decision = {
			id: this.generateId(),
			issueId,
			scenarioId,
			status: consensus.directive === 'approve' ? 'approved' : 'amended',
			consensusScore: consensus.consensusScore,
			objectionIndex: consensus.objectionIndex,
			decidedAt: new Date().toISOString()
		};

		await this.hs!.write(this.nodeId, 'cds_decisions', decision);

		// Update issue status
		const issue = await this.getIssue(issueId);
		if (issue) {
			issue.status = 'decided';
			issue.lastUpdatedAt = new Date().toISOString();
			await this.hs!.write(this.nodeId, 'cds_issues', issue);
		}

		await this.logActivity('CDS', 'decision_made', `Decision made on issue ${issueId}`);
		return decision;
	}

	// ==========================================================================
	// OAD OPERATIONS
	// ==========================================================================

	async listSpecs(): Promise<DesignSpec[]> {
		await this.ensureInitialized();
		const specs = await this.hs!.getAll(this.nodeId, 'oad_specs');
		return Object.values(specs || {}) as DesignSpec[];
	}

	async createSpec(data: { purpose: string; functionalRequirements: string[] }): Promise<DesignSpec> {
		await this.ensureInitialized();
		const spec: DesignSpec = {
			id: this.generateId(),
			nodeId: this.nodeId,
			purpose: data.purpose,
			functionalRequirements: data.functionalRequirements,
			createdAt: new Date().toISOString()
		};
		await this.hs!.write(this.nodeId, 'oad_specs', spec);
		await this.logActivity('OAD', 'spec_created', `Design spec created: ${spec.purpose}`);
		return spec;
	}

	async listVersions(specId?: string): Promise<DesignVersion[]> {
		await this.ensureInitialized();
		const versions = await this.hs!.getAll(this.nodeId, 'oad_versions');
		let versionList = Object.values(versions || {}) as DesignVersion[];
		if (specId) {
			versionList = versionList.filter(v => v.specId === specId);
		}
		return versionList;
	}

	async getVersion(id: string): Promise<DesignVersion | null> {
		await this.ensureInitialized();
		return await this.hs!.read(this.nodeId, 'oad_versions', id);
	}

	async createVersion(data: { specId: string; label: string; authors: string[]; parameters: Record<string, unknown> }): Promise<DesignVersion> {
		await this.ensureInitialized();
		const version: DesignVersion = {
			id: this.generateId(),
			specId: data.specId,
			label: data.label,
			status: 'draft',
			authors: data.authors,
			createdAt: new Date().toISOString()
		};
		await this.hs!.write(this.nodeId, 'oad_versions', version);
		await this.logActivity('OAD', 'version_created', `Design version created: ${version.label}`);
		return version;
	}

	async getEcoAssessment(versionId: string): Promise<EcoAssessment | null> {
		await this.ensureInitialized();
		return await this.hs!.read(this.nodeId, 'oad_eco_assessments', versionId);
	}

	async computeEcoAssessment(versionId: string): Promise<EcoAssessment> {
		await this.ensureInitialized();
		// Simulate eco assessment computation
		const assessment: EcoAssessment & { id: string } = {
			id: versionId,
			versionId,
			embodiedEnergyNorm: Math.random() * 0.3 + 0.1,
			carbonIntensityNorm: Math.random() * 0.3 + 0.1,
			toxicityNorm: Math.random() * 0.2 + 0.05,
			recyclabilityNorm: Math.random() * 0.4 + 0.5,
			waterUseNorm: Math.random() * 0.3 + 0.1,
			landUseNorm: Math.random() * 0.3 + 0.1,
			repairabilityNorm: Math.random() * 0.4 + 0.5,
			ecoScore: 0,
			passed: false
		};
		// Calculate eco score (higher is better)
		assessment.ecoScore = (
			(1 - assessment.embodiedEnergyNorm) * 0.2 +
			(1 - assessment.carbonIntensityNorm) * 0.2 +
			(1 - assessment.toxicityNorm) * 0.15 +
			assessment.recyclabilityNorm * 0.15 +
			(1 - assessment.waterUseNorm) * 0.1 +
			(1 - assessment.landUseNorm) * 0.1 +
			assessment.repairabilityNorm * 0.1
		);
		assessment.passed = assessment.ecoScore >= 0.5;

		await this.hs!.write(this.nodeId, 'oad_eco_assessments', assessment);
		await this.logActivity('OAD', 'eco_assessment_computed', `Eco assessment computed for version ${versionId}`);
		return assessment;
	}

	async getCertification(versionId: string): Promise<CertificationRecord | null> {
		await this.ensureInitialized();
		return await this.hs!.read(this.nodeId, 'oad_certifications', versionId);
	}

	async requestCertification(versionId: string, certifiers: string[]): Promise<CertificationRecord> {
		await this.ensureInitialized();
		const cert: CertificationRecord & { id: string } = {
			id: versionId,
			versionId,
			certifiedAt: new Date().toISOString(),
			certifiedBy: certifiers,
			status: 'pending',
			criteriaPassed: [],
			criteriaFailed: []
		};
		await this.hs!.write(this.nodeId, 'oad_certifications', cert);
		await this.logActivity('OAD', 'certification_requested', `Certification requested for version ${versionId}`);
		return cert;
	}

	// ==========================================================================
	// ITC OPERATIONS
	// ==========================================================================

	async listAccounts(): Promise<ITCAccount[]> {
		await this.ensureInitialized();
		const accounts = await this.hs!.getAll(this.nodeId, 'itc_accounts');
		return Object.values(accounts || {}) as ITCAccount[];
	}

	async getAccount(memberId: string): Promise<ITCAccount | null> {
		await this.ensureInitialized();
		let account = await this.hs!.read(this.nodeId, 'itc_accounts', memberId);
		if (!account) {
			// Create default account
			account = {
				id: memberId,
				memberId,
				balance: 0,
				totalEarned: 0,
				totalRedeemed: 0,
				totalDecayed: 0,
				lastDecayAppliedAt: new Date().toISOString()
			};
			await this.hs!.write(this.nodeId, 'itc_accounts', account);
		}
		return account;
	}

	async listLaborEvents(memberId?: string, limit = 50): Promise<LaborEvent[]> {
		await this.ensureInitialized();
		const events = await this.hs!.getAll(this.nodeId, 'itc_labor_events');
		let eventList = Object.values(events || {}) as LaborEvent[];
		if (memberId) {
			eventList = eventList.filter(e => e.memberId === memberId);
		}
		return eventList
			.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
			.slice(0, limit);
	}

	async recordLabor(data: {
		memberId: string;
		taskId: string;
		taskLabel: string;
		startTime: string;
		endTime: string;
		skillTier: string;
	}): Promise<LaborEvent> {
		await this.ensureInitialized();
		const hours = (new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / (1000 * 60 * 60);
		const event: LaborEvent = {
			id: this.generateId(),
			memberId: data.memberId,
			taskId: data.taskId,
			taskLabel: data.taskLabel,
			hours,
			skillTier: data.skillTier as LaborEvent['skillTier'],
			startTime: data.startTime,
			endTime: data.endTime,
			verified: false
		};
		await this.hs!.write(this.nodeId, 'itc_labor_events', event);

		// Credit ITC to account
		const skillWeights: Record<string, number> = { low: 0.8, medium: 1.0, high: 1.2, expert: 1.5 };
		const itcEarned = hours * (skillWeights[data.skillTier] || 1.0);

		const account = await this.getAccount(data.memberId);
		if (account) {
			account.balance += itcEarned;
			account.totalEarned += itcEarned;
			await this.hs!.write(this.nodeId, 'itc_accounts', account);
		}

		await this.logActivity('ITC', 'labor_recorded', `Labor recorded: ${data.taskLabel} (${hours.toFixed(1)}h)`);
		return event;
	}

	async verifyLabor(eventId: string, verifierId: string): Promise<LaborEvent> {
		await this.ensureInitialized();
		const event = await this.hs!.read(this.nodeId, 'itc_labor_events', eventId) as LaborEvent;
		if (event) {
			event.verified = true;
			await this.hs!.write(this.nodeId, 'itc_labor_events', event);
			await this.logActivity('ITC', 'labor_verified', `Labor verified by ${verifierId}`);
		}
		return event;
	}

	async computeValuation(itemId: string, versionId: string): Promise<AccessValuation> {
		await this.ensureInitialized();
		const ecoAssessment = await this.getEcoAssessment(versionId);

		const valuation: AccessValuation & { id: string } = {
			id: itemId,
			itemId,
			designVersionId: versionId,
			baseWeightedLaborHours: Math.random() * 50 + 10,
			ecoBurdenAdjustment: ecoAssessment ? (1 - ecoAssessment.ecoScore) * 0.2 : 0.1,
			materialScarcityAdjustment: Math.random() * 0.15,
			repairabilityCredit: ecoAssessment ? ecoAssessment.repairabilityNorm * 0.1 : 0.05,
			longevityCredit: Math.random() * 0.1,
			finalItcCost: 0
		};

		valuation.finalItcCost = valuation.baseWeightedLaborHours *
			(1 + valuation.ecoBurdenAdjustment + valuation.materialScarcityAdjustment) *
			(1 - valuation.repairabilityCredit - valuation.longevityCredit);

		await this.hs!.write(this.nodeId, 'itc_valuations', valuation);
		return valuation;
	}

	async getValuation(itemId: string): Promise<AccessValuation | null> {
		await this.ensureInitialized();
		return await this.hs!.read(this.nodeId, 'itc_valuations', itemId);
	}

	async redeemAccess(data: { memberId: string; itemId: string; redemptionType: string }): Promise<{ success: boolean; newBalance: number }> {
		await this.ensureInitialized();
		const valuation = await this.getValuation(data.itemId);
		const account = await this.getAccount(data.memberId);

		if (!account || !valuation) {
			return { success: false, newBalance: account?.balance || 0 };
		}

		if (account.balance < valuation.finalItcCost) {
			return { success: false, newBalance: account.balance };
		}

		account.balance -= valuation.finalItcCost;
		account.totalRedeemed += valuation.finalItcCost;
		await this.hs!.write(this.nodeId, 'itc_accounts', account);

		await this.logActivity('ITC', 'access_redeemed', `Access redeemed for item ${data.itemId}`);
		return { success: true, newBalance: account.balance };
	}

	async applyDecay(memberId: string): Promise<{ decayAmount: number; newBalance: number }> {
		await this.ensureInitialized();
		const account = await this.getAccount(memberId);
		if (!account) {
			return { decayAmount: 0, newBalance: 0 };
		}

		// Apply 0.5% monthly decay
		const decayRate = 0.005;
		const decayAmount = account.balance * decayRate;
		account.balance -= decayAmount;
		account.totalDecayed += decayAmount;
		account.lastDecayAppliedAt = new Date().toISOString();

		await this.hs!.write(this.nodeId, 'itc_accounts', account);
		return { decayAmount, newBalance: account.balance };
	}

	// ==========================================================================
	// COS OPERATIONS
	// ==========================================================================

	async listPlans(): Promise<ProductionPlan[]> {
		await this.ensureInitialized();
		const plans = await this.hs!.getAll(this.nodeId, 'cos_plans');
		return Object.values(plans || {}) as ProductionPlan[];
	}

	async getPlan(planId: string): Promise<ProductionPlan | null> {
		await this.ensureInitialized();
		return await this.hs!.read(this.nodeId, 'cos_plans', planId);
	}

	async createPlan(data: { versionId: string; batchSize: number }): Promise<ProductionPlan> {
		await this.ensureInitialized();
		const planId = this.generateId();
		const plan: ProductionPlan & { id: string } = {
			id: planId,
			planId,
			nodeId: this.nodeId,
			versionId: data.versionId,
			batchId: this.generateId(),
			batchSize: data.batchSize,
			createdAt: new Date().toISOString(),
			taskCount: Math.ceil(data.batchSize / 5) * 3,
			completedTasks: 0,
			expectedLaborHours: data.batchSize * 2
		};
		await this.hs!.write(this.nodeId, 'cos_plans', plan);
		await this.logActivity('COS', 'plan_created', `Production plan created for batch size ${data.batchSize}`);
		return plan;
	}

	async listTasks(planId: string): Promise<TaskInstance[]> {
		await this.ensureInitialized();
		const tasks = await this.hs!.getAll(this.nodeId, 'cos_tasks');
		const taskList = Object.values(tasks || {}) as TaskInstance[];
		return taskList.filter(t => t.batchId === planId);
	}

	async getTask(taskId: string): Promise<TaskInstance | null> {
		await this.ensureInitialized();
		return await this.hs!.read(this.nodeId, 'cos_tasks', taskId);
	}

	async assignTask(taskId: string, data: { coopId: string; participantIds: string[] }): Promise<TaskInstance> {
		await this.ensureInitialized();
		const task = await this.getTask(taskId) as TaskInstance;
		if (task) {
			task.assignedCoopId = data.coopId;
			task.participants = data.participantIds;
			await this.hs!.write(this.nodeId, 'cos_tasks', task);
			await this.logActivity('COS', 'task_assigned', `Task ${taskId} assigned to ${data.coopId}`);
		}
		return task;
	}

	async startTask(taskId: string): Promise<TaskInstance> {
		await this.ensureInitialized();
		const task = await this.getTask(taskId) as TaskInstance;
		if (task) {
			task.status = 'in_progress';
			task.scheduledStart = new Date().toISOString();
			await this.hs!.write(this.nodeId, 'cos_tasks', task);
			await this.logActivity('COS', 'task_started', `Task ${taskId} started`);
		}
		return task;
	}

	async completeTask(taskId: string, actualHours: number): Promise<TaskInstance> {
		await this.ensureInitialized();
		const task = await this.getTask(taskId) as TaskInstance;
		if (task) {
			task.status = 'done';
			task.actualHours = actualHours;
			task.scheduledEnd = new Date().toISOString();
			await this.hs!.write(this.nodeId, 'cos_tasks', task);

			// Update plan completed task count
			const plan = await this.getPlan(task.batchId);
			if (plan) {
				plan.completedTasks++;
				await this.hs!.write(this.nodeId, 'cos_plans', { ...plan, id: plan.planId });
			}

			await this.logActivity('COS', 'task_completed', `Task ${taskId} completed in ${actualHours}h`);
		}
		return task;
	}

	async blockTask(taskId: string, reason: string): Promise<TaskInstance> {
		await this.ensureInitialized();
		const task = await this.getTask(taskId) as TaskInstance;
		if (task) {
			task.status = 'blocked';
			task.blockReasons.push(reason);
			await this.hs!.write(this.nodeId, 'cos_tasks', task);
			await this.logActivity('COS', 'task_blocked', `Task ${taskId} blocked: ${reason}`);
		}
		return task;
	}

	async detectBottlenecks(planId: string): Promise<COSConstraint[]> {
		await this.ensureInitialized();
		const constraints = await this.hs!.getAll(this.nodeId, 'cos_constraints');
		const constraintList = Object.values(constraints || {}) as COSConstraint[];
		return constraintList.filter(c => c.planId === planId);
	}

	async getMaterialInventory(planId: string): Promise<Record<string, number>> {
		await this.ensureInitialized();
		const inventory = await this.hs!.read(this.nodeId, 'cos_inventory', planId);
		return inventory || {};
	}

	// ==========================================================================
	// FRS OPERATIONS
	// ==========================================================================

	async createSignalPacket(): Promise<{ packetId: string; signalCount: number }> {
		await this.ensureInitialized();
		const packetId = this.generateId();
		const signalCount = Math.floor(Math.random() * 50) + 10;

		await this.hs!.write(this.nodeId, 'frs_signal_packets', {
			id: packetId,
			nodeId: this.nodeId,
			timeWindowStart: new Date(Date.now() - 3600000).toISOString(),
			timeWindowEnd: new Date().toISOString(),
			signalCount,
			qualityScore: Math.random() * 0.3 + 0.7
		});

		await this.logActivity('FRS', 'signal_packet_created', `Signal packet created with ${signalCount} signals`);
		return { packetId, signalCount };
	}

	async listFindings(severity?: string): Promise<DiagnosticFinding[]> {
		await this.ensureInitialized();
		const findings = await this.hs!.getAll(this.nodeId, 'frs_findings');
		let findingList = Object.values(findings || {}) as DiagnosticFinding[];
		if (severity) {
			findingList = findingList.filter(f => f.severity === severity);
		}
		return findingList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}

	async analyzePacket(packetId: string): Promise<DiagnosticFinding[]> {
		await this.ensureInitialized();
		// Simulate analysis generating findings
		const findingTypes: DiagnosticFinding['findingType'][] = [
			'ecological_overshoot', 'labor_stress', 'material_dependency',
			'design_friction', 'valuation_drift', 'governance_load', 'coordination_fragility'
		];
		const severities: DiagnosticFinding['severity'][] = ['info', 'low', 'moderate', 'critical'];
		const confidences: DiagnosticFinding['confidence'][] = ['speculative', 'provisional', 'confident', 'validated'];

		const findings: DiagnosticFinding[] = [];
		const numFindings = Math.floor(Math.random() * 3) + 1;

		for (let i = 0; i < numFindings; i++) {
			const finding: DiagnosticFinding = {
				id: this.generateId(),
				nodeId: this.nodeId,
				createdAt: new Date().toISOString(),
				findingType: findingTypes[Math.floor(Math.random() * findingTypes.length)],
				severity: severities[Math.floor(Math.random() * severities.length)],
				confidence: confidences[Math.floor(Math.random() * confidences.length)],
				summary: `Finding from packet ${packetId} analysis`,
				rationale: 'Automated analysis detected potential issue',
				indicators: { signalStrength: Math.random(), trendDirection: Math.random() - 0.5 }
			};
			findings.push(finding);
			await this.hs!.write(this.nodeId, 'frs_findings', finding);
		}

		await this.logActivity('FRS', 'packet_analyzed', `Packet ${packetId} analyzed, ${findings.length} findings`);
		return findings;
	}

	async listRecommendations(targetSystem?: string): Promise<Recommendation[]> {
		await this.ensureInitialized();
		const recommendations = await this.hs!.getAll(this.nodeId, 'frs_recommendations');
		let recList = Object.values(recommendations || {}) as Recommendation[];
		if (targetSystem) {
			recList = recList.filter(r => r.targetSystem === targetSystem);
		}
		return recList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}

	async generateRecommendations(findingIds: string[]): Promise<Recommendation[]> {
		await this.ensureInitialized();
		const recommendations: Recommendation[] = [];

		for (const findingId of findingIds) {
			const finding = await this.hs!.read(this.nodeId, 'frs_findings', findingId) as DiagnosticFinding;
			if (finding) {
				const targetSystems: Recommendation['targetSystem'][] = ['OAD', 'COS', 'ITC', 'CDS', 'FED'];
				const rec: Recommendation = {
					id: this.generateId(),
					nodeId: this.nodeId,
					createdAt: new Date().toISOString(),
					targetSystem: targetSystems[Math.floor(Math.random() * targetSystems.length)],
					recommendationType: 'policy_adjustment',
					severity: finding.severity,
					summary: `Recommendation based on finding: ${finding.summary}`,
					rationale: finding.rationale
				};
				recommendations.push(rec);
				await this.hs!.write(this.nodeId, 'frs_recommendations', rec);
			}
		}

		await this.logActivity('FRS', 'recommendations_generated', `${recommendations.length} recommendations generated`);
		return recommendations;
	}

	async getFRSDashboard(): Promise<{
		totalSignals: number;
		findingsByType: Record<string, number>;
		activeRecommendations: number;
		systemHealth: 'healthy' | 'warning' | 'critical';
		topIssues: string[];
	}> {
		await this.ensureInitialized();
		const [packets, findings, recommendations] = await Promise.all([
			this.hs!.getAll(this.nodeId, 'frs_signal_packets'),
			this.hs!.getAll(this.nodeId, 'frs_findings'),
			this.hs!.getAll(this.nodeId, 'frs_recommendations')
		]);

		const packetList = Object.values(packets || {}) as any[];
		const findingList = Object.values(findings || {}) as DiagnosticFinding[];
		const recList = Object.values(recommendations || {}) as Recommendation[];

		const findingsByType: Record<string, number> = {};
		for (const finding of findingList) {
			findingsByType[finding.findingType] = (findingsByType[finding.findingType] || 0) + 1;
		}

		let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
		if (findingList.some(f => f.severity === 'critical')) {
			systemHealth = 'critical';
		} else if (findingList.some(f => f.severity === 'moderate')) {
			systemHealth = 'warning';
		}

		return {
			totalSignals: packetList.reduce((sum, p) => sum + (p.signalCount || 0), 0),
			findingsByType,
			activeRecommendations: recList.length,
			systemHealth,
			topIssues: findingList.slice(0, 5).map(f => f.summary)
		};
	}

	// ==========================================================================
	// FEDERATION OPERATIONS
	// ==========================================================================

	async listFederatedNodes(): Promise<FederatedNode[]> {
		await this.ensureInitialized();
		const nodes = await this.hs!.getAll(this.nodeId, 'federation_nodes');
		return Object.values(nodes || {}) as FederatedNode[];
	}

	async queryNode(nodeId: string): Promise<FederatedNode | null> {
		await this.ensureInitialized();
		return await this.hs!.read(this.nodeId, 'federation_nodes', nodeId);
	}

	async listFederationMessages(limit = 20): Promise<FederatedMessage[]> {
		await this.ensureInitialized();
		const messages = await this.hs!.getAll(this.nodeId, 'federation_messages');
		const messageList = Object.values(messages || {}) as FederatedMessage[];
		return messageList
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, limit);
	}

	async sendFederationMessage(data: {
		messageType: string;
		toScope: string;
		payload: Record<string, unknown>;
		summary: string;
	}): Promise<FederatedMessage> {
		await this.ensureInitialized();
		const message: FederatedMessage = {
			id: this.generateId(),
			messageType: data.messageType as FederatedMessage['messageType'],
			fromNodeId: this.nodeId,
			toScope: data.toScope as FederatedMessage['toScope'],
			summary: data.summary,
			createdAt: new Date().toISOString()
		};
		await this.hs!.write(this.nodeId, 'federation_messages', message);
		await this.logActivity('FED', 'message_sent', `Federation message sent: ${data.summary}`);
		return message;
	}

	async shareBestPractice(data: { title: string; description: string; benefits: Record<string, number> }): Promise<FederatedMessage> {
		return this.sendFederationMessage({
			messageType: 'best_practice',
			toScope: 'federation',
			payload: data,
			summary: data.title
		});
	}

	async issueWarning(data: { findingId: string; severity: string; description: string }): Promise<FederatedMessage> {
		return this.sendFederationMessage({
			messageType: 'early_warning',
			toScope: 'regional',
			payload: data,
			summary: data.description
		});
	}

	// ==========================================================================
	// SUBSCRIPTION HELPERS
	// ==========================================================================

	subscribeToIssues(callback: (issues: Issue[]) => void): { unsubscribe: () => void } {
		if (!this.hs) return { unsubscribe: () => {} };

		const sub = this.hs.subscribe(this.nodeId, 'cds_issues', async () => {
			const issues = await this.listIssues();
			callback(issues);
		});

		return { unsubscribe: () => sub.then(s => s.unsubscribe()) };
	}

	subscribeToAccounts(callback: (accounts: ITCAccount[]) => void): { unsubscribe: () => void } {
		if (!this.hs) return { unsubscribe: () => {} };

		const sub = this.hs.subscribe(this.nodeId, 'itc_accounts', async () => {
			const accounts = await this.listAccounts();
			callback(accounts);
		});

		return { unsubscribe: () => sub.then(s => s.unsubscribe()) };
	}

	subscribeToActivity(callback: (activities: ActivityFeed[]) => void): { unsubscribe: () => void } {
		if (!this.hs) return { unsubscribe: () => {} };

		const sub = this.hs.subscribe(this.nodeId, 'activity_feed', async () => {
			const activities = await this.getActivityFeed();
			callback(activities);
		});

		return { unsubscribe: () => sub.then(s => s.unsubscribe()) };
	}

	// ==========================================================================
	// UTILITY METHODS
	// ==========================================================================

	private async ensureInitialized(): Promise<void> {
		if (!this.initialized) {
			await this.init();
		}
	}

	private generateId(): string {
		return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
	}

	private async logActivity(system: ActivityFeed['system'], type: string, summary: string): Promise<void> {
		if (!this.hs) return;

		const activity: ActivityFeed = {
			id: this.generateId(),
			type,
			system,
			summary,
			timestamp: new Date().toISOString()
		};
		await this.hs.write(this.nodeId, 'activity_feed', activity);
	}
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: IntegralHoloSphereService | null = null;

export function getHoloSphereService(config?: Partial<IntegralHoloSphereConfig>): IntegralHoloSphereService {
	if (!instance) {
		instance = new IntegralHoloSphereService(config);
	}
	return instance;
}

export function resetHoloSphereService(): void {
	instance = null;
}

export { IntegralHoloSphereService };
export default getHoloSphereService;
