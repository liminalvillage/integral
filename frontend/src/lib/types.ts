/**
 * INTEGRAL Frontend Types
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type SkillTier = 'low' | 'medium' | 'high' | 'expert';
export type Severity = 'info' | 'low' | 'moderate' | 'critical';
export type Confidence = 'speculative' | 'provisional' | 'confident' | 'validated';

export interface NodeStatus {
	nodeId: string;
	isRunning: boolean;
	publicKey: string | null;
	connectedRelays: number;
	knownNodes: number;
	subsystems: {
		cds: boolean;
		oad: boolean;
		itc: boolean;
		cos: boolean;
		frs: boolean;
	};
}

// ============================================================================
// CDS TYPES
// ============================================================================

export type IssueStatus =
	| 'intake'
	| 'structured'
	| 'context_ready'
	| 'deliberation'
	| 'decided'
	| 'dispatched'
	| 'under_review'
	| 'reopened';

export type SupportLevel = 'strong_support' | 'support' | 'neutral' | 'concern' | 'block';

export interface Issue {
	id: string;
	title: string;
	description: string;
	nodeId: string;
	status: IssueStatus;
	createdAt: string;
	lastUpdatedAt: string;
	submissionCount: number;
	metadata: Record<string, unknown>;
}

export interface Submission {
	id: string;
	authorId: string;
	issueId: string;
	type: 'proposal' | 'objection' | 'evidence' | 'comment' | 'signal';
	content: string;
	createdAt: string;
}

export interface Vote {
	participantId: string;
	scenarioId: string;
	supportLevel: SupportLevel;
	weight: number;
	createdAt: string;
}

export interface Scenario {
	id: string;
	issueId: string;
	label: string;
	parameters: Record<string, unknown>;
	consensusScore?: number;
	objectionIndex?: number;
}

export interface Decision {
	id: string;
	issueId: string;
	scenarioId: string;
	status: 'approved' | 'amended' | 'revoked';
	consensusScore: number;
	objectionIndex: number;
	decidedAt: string;
}

// ============================================================================
// OAD TYPES
// ============================================================================

export interface DesignSpec {
	id: string;
	nodeId: string;
	purpose: string;
	functionalRequirements: string[];
	createdAt: string;
}

export interface DesignVersion {
	id: string;
	specId: string;
	label: string;
	status: 'draft' | 'under_review' | 'certified';
	authors: string[];
	createdAt: string;
	ecoScore?: number;
}

export interface EcoAssessment {
	versionId: string;
	embodiedEnergyNorm: number;
	carbonIntensityNorm: number;
	toxicityNorm: number;
	recyclabilityNorm: number;
	waterUseNorm: number;
	landUseNorm: number;
	repairabilityNorm: number;
	ecoScore: number;
	passed: boolean;
}

export interface CertificationRecord {
	versionId: string;
	certifiedAt: string;
	certifiedBy: string[];
	status: 'certified' | 'pending' | 'revoked';
	criteriaPassed: string[];
	criteriaFailed: string[];
}

// ============================================================================
// ITC TYPES
// ============================================================================

export interface LaborEvent {
	id: string;
	memberId: string;
	taskId: string;
	taskLabel: string;
	hours: number;
	skillTier: SkillTier;
	startTime: string;
	endTime: string;
	verified: boolean;
}

export interface ITCAccount {
	id: string;
	memberId: string;
	balance: number;
	totalEarned: number;
	totalRedeemed: number;
	totalDecayed: number;
	lastDecayAppliedAt: string;
}

export interface AccessValuation {
	itemId: string;
	designVersionId: string;
	baseWeightedLaborHours: number;
	ecoBurdenAdjustment: number;
	materialScarcityAdjustment: number;
	repairabilityCredit: number;
	longevityCredit: number;
	finalItcCost: number;
}

export interface WeightingPolicy {
	id: string;
	nodeId: string;
	baseWeightsBySkill: Record<SkillTier, number>;
	contextWeights: {
		urgency: number;
		ecoSensitivity: number;
		scarcity: number;
	};
}

// ============================================================================
// COS TYPES
// ============================================================================

export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'done' | 'cancelled';

export interface ProductionPlan {
	planId: string;
	nodeId: string;
	versionId: string;
	batchId: string;
	batchSize: number;
	createdAt: string;
	taskCount: number;
	completedTasks: number;
	expectedLaborHours: number;
}

export interface TaskInstance {
	id: string;
	definitionId: string;
	batchId: string;
	status: TaskStatus;
	assignedCoopId?: string;
	scheduledStart?: string;
	scheduledEnd?: string;
	actualHours: number;
	participants: string[];
	blockReasons: string[];
}

export interface COSConstraint {
	planId: string;
	taskDefinitionId?: string;
	constraintType: 'time' | 'skill' | 'material' | 'tool' | 'space';
	severity: number;
	description: string;
	suggestedActions: string[];
}

export interface MaterialInventory {
	materialId: string;
	name: string;
	quantity: number;
	unit: string;
	scarcityIndex: number;
}

// ============================================================================
// FRS TYPES
// ============================================================================

export type FindingType =
	| 'ecological_overshoot'
	| 'labor_stress'
	| 'material_dependency'
	| 'design_friction'
	| 'valuation_drift'
	| 'governance_load'
	| 'coordination_fragility';

export interface DiagnosticFinding {
	id: string;
	nodeId: string;
	createdAt: string;
	findingType: FindingType;
	severity: Severity;
	confidence: Confidence;
	summary: string;
	rationale: string;
	indicators: Record<string, number>;
}

export interface Recommendation {
	id: string;
	nodeId: string;
	createdAt: string;
	targetSystem: 'OAD' | 'COS' | 'ITC' | 'CDS' | 'FED';
	recommendationType: string;
	severity: Severity;
	summary: string;
	rationale: string;
}

export interface SignalPacket {
	id: string;
	nodeId: string;
	timeWindowStart: string;
	timeWindowEnd: string;
	signalCount: number;
	qualityScore: number;
}

export interface MemoryRecord {
	id: string;
	nodeId: string;
	createdAt: string;
	recordType: 'baseline' | 'incident' | 'intervention' | 'outcome' | 'lesson';
	title: string;
	narrative: string;
}

// ============================================================================
// FEDERATION TYPES
// ============================================================================

export interface FederatedNode {
	nodeId: string;
	publicKey: string;
	lastSeen: string;
	capabilities: string[];
}

export interface FederatedMessage {
	id: string;
	messageType: 'stress_signature' | 'best_practice' | 'design_success' | 'early_warning' | 'model_template';
	fromNodeId: string;
	toScope: 'regional' | 'federation' | 'targeted_nodes';
	summary: string;
	createdAt: string;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
	activeIssues: number;
	pendingDecisions: number;
	activeDesigns: number;
	totalLaborHours: number;
	activeTasks: number;
	activeFindings: number;
	connectedNodes: number;
	systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface TimeSeriesPoint {
	timestamp: string;
	value: number;
}

export interface ActivityFeed {
	id: string;
	type: string;
	system: 'CDS' | 'OAD' | 'ITC' | 'COS' | 'FRS' | 'FED';
	summary: string;
	timestamp: string;
	metadata?: Record<string, unknown>;
}
