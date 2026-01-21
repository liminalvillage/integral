/**
 * INTEGRAL Seed Data
 *
 * Contains initial data that gets persisted to HoloSphere on first run.
 * This replaces the hardcoded mock data in page components.
 */

import type {
	Issue,
	Submission,
	Scenario,
	Vote,
	DesignSpec,
	DesignVersion,
	ITCAccount,
	LaborEvent,
	ProductionPlan,
	TaskInstance,
	MaterialInventory,
	DiagnosticFinding,
	Recommendation,
	FederatedNode,
	FederatedMessage,
	ActivityFeed
} from '$lib/types';

// ============================================================================
// TIMESTAMP HELPERS
// ============================================================================

function daysAgo(days: number): string {
	return new Date(Date.now() - 86400000 * days).toISOString();
}

function hoursAgo(hours: number): string {
	return new Date(Date.now() - 3600000 * hours).toISOString();
}

function minutesAgo(minutes: number): string {
	return new Date(Date.now() - 60000 * minutes).toISOString();
}

// ============================================================================
// CDS SEED DATA
// ============================================================================

export const SEED_ISSUES: Issue[] = [
	{
		id: 'issue_1',
		title: 'Community Workshop Equipment Proposal',
		description: 'Proposal to acquire shared woodworking and metalworking equipment for the community workshop space.',
		nodeId: 'integral-node',
		status: 'deliberation',
		createdAt: daysAgo(3),
		lastUpdatedAt: hoursAgo(1),
		submissionCount: 12,
		metadata: { category: 'infrastructure', priority: 'high' }
	},
	{
		id: 'issue_2',
		title: 'ITC Decay Rate Adjustment',
		description: 'Review and potential adjustment of the current ITC decay parameters based on community feedback.',
		nodeId: 'integral-node',
		status: 'context_ready',
		createdAt: daysAgo(7),
		lastUpdatedAt: daysAgo(1),
		submissionCount: 28,
		metadata: { category: 'policy', priority: 'medium' }
	},
	{
		id: 'issue_3',
		title: 'Solar Panel Installation Schedule',
		description: 'Coordinating the installation timeline for the approved solar panel system.',
		nodeId: 'integral-node',
		status: 'decided',
		createdAt: daysAgo(14),
		lastUpdatedAt: daysAgo(2),
		submissionCount: 45,
		metadata: { category: 'infrastructure', priority: 'high', consensusScore: 0.87 }
	},
	{
		id: 'issue_4',
		title: 'New Member Onboarding Process',
		description: 'Improving the onboarding experience for new cooperative members.',
		nodeId: 'integral-node',
		status: 'intake',
		createdAt: hoursAgo(5),
		lastUpdatedAt: hoursAgo(5),
		submissionCount: 3,
		metadata: { category: 'governance', priority: 'low' }
	}
];

export const SEED_SUBMISSIONS: Submission[] = [
	{
		id: 'sub_1',
		authorId: 'member_001',
		issueId: 'issue_1',
		type: 'proposal',
		content: 'I propose we allocate 500 ITC from the community fund for initial equipment purchases.',
		createdAt: daysAgo(3)
	},
	{
		id: 'sub_2',
		authorId: 'member_002',
		issueId: 'issue_1',
		type: 'comment',
		content: 'We should prioritize safety equipment along with the tools.',
		createdAt: daysAgo(2)
	},
	{
		id: 'sub_3',
		authorId: 'member_003',
		issueId: 'issue_2',
		type: 'proposal',
		content: 'Reduce decay rate from 20% to 15% annually to encourage longer-term savings.',
		createdAt: daysAgo(6)
	}
];

export const SEED_SCENARIOS: Scenario[] = [
	{
		id: 'scenario_1',
		issueId: 'issue_1',
		label: 'Full Equipment Package',
		parameters: { budget: 500, priority: 'tools_first' },
		consensusScore: 0.78
	},
	{
		id: 'scenario_2',
		issueId: 'issue_1',
		label: 'Phased Acquisition',
		parameters: { budget: 300, phase: 1 },
		consensusScore: 0.65
	}
];

export const SEED_VOTES: Vote[] = [
	{
		participantId: 'member_001',
		scenarioId: 'scenario_1',
		supportLevel: 'strong_support',
		weight: 1,
		createdAt: daysAgo(1)
	},
	{
		participantId: 'member_002',
		scenarioId: 'scenario_1',
		supportLevel: 'support',
		weight: 1,
		createdAt: daysAgo(1)
	}
];

// ============================================================================
// OAD SEED DATA
// ============================================================================

export const SEED_DESIGN_SPECS: DesignSpec[] = [
	{
		id: 'spec_1',
		nodeId: 'integral-node',
		purpose: 'Mounting system for residential solar panels',
		functionalRequirements: ['Weather resistant', 'Adjustable angle', 'Easy installation'],
		createdAt: daysAgo(30)
	},
	{
		id: 'spec_2',
		nodeId: 'integral-node',
		purpose: 'Modular greenhouse structure for year-round growing',
		functionalRequirements: ['Insulated panels', 'Ventilation system', 'Rainwater collection'],
		createdAt: daysAgo(20)
	}
];

export const SEED_DESIGN_VERSIONS: DesignVersion[] = [
	{
		id: 'ver_1',
		specId: 'spec_1',
		label: 'Solar Panel Mount v2.3',
		status: 'certified',
		authors: ['Alice', 'Bob'],
		createdAt: daysAgo(5),
		ecoScore: 0.32
	},
	{
		id: 'ver_2',
		specId: 'spec_2',
		label: 'Modular Greenhouse Frame',
		status: 'under_review',
		authors: ['Carol', 'Dave', 'Eve'],
		createdAt: daysAgo(2),
		ecoScore: 0.45
	},
	{
		id: 'ver_3',
		specId: 'spec_3',
		label: 'Rainwater Collection System',
		status: 'draft',
		authors: ['Frank'],
		createdAt: hoursAgo(8),
		ecoScore: undefined
	},
	{
		id: 'ver_4',
		specId: 'spec_4',
		label: 'Community Tool Library Rack',
		status: 'certified',
		authors: ['Grace', 'Henry'],
		createdAt: daysAgo(12),
		ecoScore: 0.28
	},
	{
		id: 'ver_5',
		specId: 'spec_5',
		label: 'Composting Bin Design',
		status: 'certified',
		authors: ['Ivy'],
		createdAt: daysAgo(20),
		ecoScore: 0.18
	}
];

// ============================================================================
// ITC SEED DATA
// ============================================================================

export const SEED_ITC_ACCOUNTS: ITCAccount[] = [
	{
		id: 'acc_1',
		memberId: 'Alice',
		balance: 127.5,
		totalEarned: 342.0,
		totalRedeemed: 186.5,
		totalDecayed: 28.0,
		lastDecayAppliedAt: daysAgo(7)
	},
	{
		id: 'acc_2',
		memberId: 'Bob',
		balance: 89.2,
		totalEarned: 215.0,
		totalRedeemed: 110.3,
		totalDecayed: 15.5,
		lastDecayAppliedAt: daysAgo(7)
	},
	{
		id: 'acc_3',
		memberId: 'Carol',
		balance: 156.8,
		totalEarned: 423.0,
		totalRedeemed: 245.2,
		totalDecayed: 21.0,
		lastDecayAppliedAt: daysAgo(7)
	},
	{
		id: 'acc_4',
		memberId: 'Dave',
		balance: 45.3,
		totalEarned: 128.0,
		totalRedeemed: 75.7,
		totalDecayed: 7.0,
		lastDecayAppliedAt: daysAgo(7)
	}
];

export const SEED_LABOR_EVENTS: LaborEvent[] = [
	{
		id: 'labor_1',
		memberId: 'Alice',
		taskId: 'task_1',
		taskLabel: 'Solar panel assembly',
		hours: 4.5,
		skillTier: 'high',
		startTime: hoursAgo(6),
		endTime: hoursAgo(1.5),
		verified: true
	},
	{
		id: 'labor_2',
		memberId: 'Bob',
		taskId: 'task_2',
		taskLabel: 'Workshop maintenance',
		hours: 2.0,
		skillTier: 'medium',
		startTime: daysAgo(1),
		endTime: new Date(Date.now() - 86400000 + 7200000).toISOString(),
		verified: true
	},
	{
		id: 'labor_3',
		memberId: 'Carol',
		taskId: 'task_3',
		taskLabel: 'Documentation writing',
		hours: 3.0,
		skillTier: 'medium',
		startTime: daysAgo(2),
		endTime: new Date(Date.now() - 86400000 * 2 + 10800000).toISOString(),
		verified: false
	}
];

// ============================================================================
// COS SEED DATA
// ============================================================================

export const SEED_PRODUCTION_PLANS: ProductionPlan[] = [
	{
		planId: 'plan_1',
		nodeId: 'integral-node',
		versionId: 'ver_1',
		batchId: 'batch_47',
		batchSize: 10,
		createdAt: daysAgo(3),
		taskCount: 45,
		completedTasks: 32,
		expectedLaborHours: 180
	},
	{
		planId: 'plan_2',
		nodeId: 'integral-node',
		versionId: 'ver_2',
		batchId: 'batch_48',
		batchSize: 5,
		createdAt: daysAgo(1),
		taskCount: 25,
		completedTasks: 8,
		expectedLaborHours: 95
	},
	{
		planId: 'plan_3',
		nodeId: 'integral-node',
		versionId: 'ver_4',
		batchId: 'batch_49',
		batchSize: 20,
		createdAt: hoursAgo(5),
		taskCount: 80,
		completedTasks: 0,
		expectedLaborHours: 320
	}
];

export const SEED_TASKS: TaskInstance[] = [
	{
		id: 'task_1',
		definitionId: 'def_1',
		batchId: 'batch_47',
		status: 'in_progress',
		assignedCoopId: 'coop_a',
		scheduledStart: hoursAgo(2),
		actualHours: 1.5,
		participants: ['Alice', 'Bob'],
		blockReasons: []
	},
	{
		id: 'task_2',
		definitionId: 'def_2',
		batchId: 'batch_47',
		status: 'pending',
		actualHours: 0,
		participants: [],
		blockReasons: []
	},
	{
		id: 'task_3',
		definitionId: 'def_3',
		batchId: 'batch_48',
		status: 'blocked',
		actualHours: 0,
		participants: ['Carol'],
		blockReasons: ['Waiting for materials', 'Tool unavailable']
	},
	{
		id: 'task_4',
		definitionId: 'def_4',
		batchId: 'batch_47',
		status: 'done',
		actualHours: 3.5,
		participants: ['Dave', 'Eve'],
		blockReasons: []
	}
];

export const SEED_MATERIAL_INVENTORY: MaterialInventory[] = [
	{ materialId: 'mat_1', name: 'Aluminum Extrusion', quantity: 45, unit: 'kg', scarcityIndex: 0.2 },
	{ materialId: 'mat_2', name: 'Steel Bolts (M8)', quantity: 200, unit: 'pcs', scarcityIndex: 0.1 },
	{ materialId: 'mat_3', name: 'Solar Cells', quantity: 80, unit: 'pcs', scarcityIndex: 0.6 },
	{ materialId: 'mat_4', name: 'Tempered Glass', quantity: 12, unit: 'm²', scarcityIndex: 0.4 }
];

// ============================================================================
// FRS SEED DATA
// ============================================================================

export const SEED_FINDINGS: DiagnosticFinding[] = [
	{
		id: 'find_1',
		nodeId: 'integral-node',
		createdAt: hoursAgo(1),
		findingType: 'labor_stress',
		severity: 'moderate',
		confidence: 'confident',
		summary: 'Expert-level labor showing increased demand pressure',
		rationale: 'Labor allocation signals indicate 65% utilization of expert capacity, approaching stress threshold.',
		indicators: { stress_index: 0.65, utilization: 0.72 }
	},
	{
		id: 'find_2',
		nodeId: 'integral-node',
		createdAt: hoursAgo(2),
		findingType: 'ecological_overshoot',
		severity: 'low',
		confidence: 'provisional',
		summary: 'Material sourcing approaching sustainability threshold',
		rationale: 'External procurement ratio increased 15% this cycle, approaching autonomy limits.',
		indicators: { eco_score: 0.48, external_ratio: 0.35 }
	},
	{
		id: 'find_3',
		nodeId: 'integral-node',
		createdAt: daysAgo(1),
		findingType: 'material_dependency',
		severity: 'low',
		confidence: 'confident',
		summary: 'Solar cell supply chain concentration detected',
		rationale: 'Single supplier accounts for 78% of solar cell procurement.',
		indicators: { herfindahl: 0.61, critical_external: 0.15 }
	}
];

export const SEED_RECOMMENDATIONS: Recommendation[] = [
	{
		id: 'rec_1',
		nodeId: 'integral-node',
		createdAt: minutesAgo(30),
		targetSystem: 'COS',
		recommendationType: 'workload_rebalancing',
		severity: 'moderate',
		summary: 'Rebalance expert-level tasks across cooperatives',
		rationale: 'Current distribution creates bottleneck risk. Consider cross-training or task redistribution.'
	},
	{
		id: 'rec_2',
		nodeId: 'integral-node',
		createdAt: hoursAgo(1.5),
		targetSystem: 'CDS',
		recommendationType: 'policy_review',
		severity: 'low',
		summary: 'Review material procurement policies',
		rationale: 'Diversifying suppliers would reduce dependency risk and improve autonomy index.'
	}
];

// ============================================================================
// FEDERATION SEED DATA
// ============================================================================

export const SEED_FEDERATED_NODES: FederatedNode[] = [
	{
		nodeId: 'riverside-coop',
		publicKey: 'npub1abc123xyz789riverside',
		lastSeen: minutesAgo(1),
		capabilities: ['CDS', 'OAD', 'ITC', 'COS', 'FRS']
	},
	{
		nodeId: 'mountain-collective',
		publicKey: 'npub1def456uvw321mountain',
		lastSeen: minutesAgo(5),
		capabilities: ['CDS', 'OAD', 'ITC']
	},
	{
		nodeId: 'urban-makers',
		publicKey: 'npub1ghi789rst654urban',
		lastSeen: minutesAgo(30),
		capabilities: ['CDS', 'OAD', 'ITC', 'COS', 'FRS']
	},
	{
		nodeId: 'coastal-workshop',
		publicKey: 'npub1jkl012opq987coastal',
		lastSeen: hoursAgo(2),
		capabilities: ['CDS', 'ITC', 'FRS']
	}
];

export const SEED_FEDERATED_MESSAGES: FederatedMessage[] = [
	{
		id: 'msg_1',
		messageType: 'best_practice',
		fromNodeId: 'riverside-coop',
		toScope: 'federation',
		summary: 'Effective labor rotation schedule reduces burnout',
		createdAt: hoursAgo(1)
	},
	{
		id: 'msg_2',
		messageType: 'design_success',
		fromNodeId: 'mountain-collective',
		toScope: 'federation',
		summary: 'Modular greenhouse design achieved 0.22 eco-score',
		createdAt: daysAgo(1)
	},
	{
		id: 'msg_3',
		messageType: 'early_warning',
		fromNodeId: 'urban-makers',
		toScope: 'regional',
		summary: 'Supply chain disruption affecting aluminum sourcing',
		createdAt: daysAgo(2)
	}
];

// ============================================================================
// ACTIVITY FEED SEED DATA
// ============================================================================

export const SEED_ACTIVITY_FEED: ActivityFeed[] = [
	{
		id: 'act_1',
		type: 'decision_made',
		system: 'CDS',
		summary: 'Community workshop proposal approved with 87% consensus',
		timestamp: minutesAgo(5)
	},
	{
		id: 'act_2',
		type: 'design_certified',
		system: 'OAD',
		summary: 'Solar panel mount v2.3 passed ecological assessment',
		timestamp: minutesAgo(15)
	},
	{
		id: 'act_3',
		type: 'labor_recorded',
		system: 'ITC',
		summary: '24 hours of collective labor credited across 8 members',
		timestamp: minutesAgo(30)
	},
	{
		id: 'act_4',
		type: 'task_completed',
		system: 'COS',
		summary: 'Batch #47 assembly phase completed ahead of schedule',
		timestamp: hoursAgo(1)
	},
	{
		id: 'act_5',
		type: 'node_joined',
		system: 'FED',
		summary: 'New node "riverside-coop" joined the federation',
		timestamp: hoursAgo(2)
	}
];

// ============================================================================
// COMBINED SEED DATA EXPORT
// ============================================================================

export const SEED_DATA = {
	// CDS
	issues: SEED_ISSUES,
	submissions: SEED_SUBMISSIONS,
	scenarios: SEED_SCENARIOS,
	votes: SEED_VOTES,

	// OAD
	designSpecs: SEED_DESIGN_SPECS,
	designVersions: SEED_DESIGN_VERSIONS,

	// ITC
	itcAccounts: SEED_ITC_ACCOUNTS,
	laborEvents: SEED_LABOR_EVENTS,

	// COS
	productionPlans: SEED_PRODUCTION_PLANS,
	tasks: SEED_TASKS,
	materialInventory: SEED_MATERIAL_INVENTORY,

	// FRS
	findings: SEED_FINDINGS,
	recommendations: SEED_RECOMMENDATIONS,

	// Federation
	federatedNodes: SEED_FEDERATED_NODES,
	federatedMessages: SEED_FEDERATED_MESSAGES,

	// Activity
	activityFeed: SEED_ACTIVITY_FEED
};
