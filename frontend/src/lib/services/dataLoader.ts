/**
 * INTEGRAL Data Loader Service
 *
 * Handles loading data from HoloSphere on startup and seeding initial data if empty.
 * Also sets up real-time subscriptions for data synchronization.
 */

import { getHoloSphereService } from '$lib/holosphere';
import { SEED_DATA } from './seedData';
import {
	issues,
	submissions,
	scenarios,
	votes,
	decisions,
	designSpecs,
	designVersions,
	ecoAssessments,
	certifications,
	itcAccounts,
	laborEvents,
	valuations,
	productionPlans,
	tasks,
	constraints,
	materialInventory,
	signalPackets,
	findings,
	recommendations,
	memories,
	federatedNodes,
	federatedMessages,
	activityFeed,
	dashboardStats
} from '$lib/stores';

const hs = getHoloSphereService();

// ============================================================================
// SEEDING
// ============================================================================

async function seedInitialData(): Promise<void> {
	console.log('[DataLoader] Seeding initial data to HoloSphere...');

	// Seed CDS data
	for (const issue of SEED_DATA.issues) {
		await hs.getHoloSphere()?.write('integral-node', 'cds_issues', issue);
	}
	for (const submission of SEED_DATA.submissions) {
		await hs.getHoloSphere()?.write('integral-node', 'cds_submissions', submission);
	}
	for (const scenario of SEED_DATA.scenarios) {
		await hs.getHoloSphere()?.write('integral-node', 'cds_scenarios', scenario);
	}
	for (const vote of SEED_DATA.votes) {
		const voteWithId = { ...vote, id: `${vote.scenarioId}_${vote.participantId}` };
		await hs.getHoloSphere()?.write('integral-node', 'cds_votes', voteWithId);
	}

	// Seed OAD data
	for (const spec of SEED_DATA.designSpecs) {
		await hs.getHoloSphere()?.write('integral-node', 'oad_specs', spec);
	}
	for (const version of SEED_DATA.designVersions) {
		await hs.getHoloSphere()?.write('integral-node', 'oad_versions', version);
	}

	// Seed ITC data
	for (const account of SEED_DATA.itcAccounts) {
		await hs.getHoloSphere()?.write('integral-node', 'itc_accounts', account);
	}
	for (const labor of SEED_DATA.laborEvents) {
		await hs.getHoloSphere()?.write('integral-node', 'itc_labor_events', labor);
	}

	// Seed COS data
	for (const plan of SEED_DATA.productionPlans) {
		const planWithId = { ...plan, id: plan.planId };
		await hs.getHoloSphere()?.write('integral-node', 'cos_plans', planWithId);
	}
	for (const task of SEED_DATA.tasks) {
		await hs.getHoloSphere()?.write('integral-node', 'cos_tasks', task);
	}
	for (const material of SEED_DATA.materialInventory) {
		const materialWithId = { ...material, id: material.materialId };
		await hs.getHoloSphere()?.write('integral-node', 'cos_inventory', materialWithId);
	}

	// Seed FRS data
	for (const finding of SEED_DATA.findings) {
		await hs.getHoloSphere()?.write('integral-node', 'frs_findings', finding);
	}
	for (const rec of SEED_DATA.recommendations) {
		await hs.getHoloSphere()?.write('integral-node', 'frs_recommendations', rec);
	}

	// Seed Federation data
	for (const node of SEED_DATA.federatedNodes) {
		const nodeWithId = { ...node, id: node.nodeId };
		await hs.getHoloSphere()?.write('integral-node', 'federation_nodes', nodeWithId);
	}
	for (const message of SEED_DATA.federatedMessages) {
		await hs.getHoloSphere()?.write('integral-node', 'federation_messages', message);
	}

	// Seed Activity Feed
	for (const activity of SEED_DATA.activityFeed) {
		await hs.getHoloSphere()?.write('integral-node', 'activity_feed', activity);
	}

	console.log('[DataLoader] Seeding complete!');
}

// ============================================================================
// LOADING
// ============================================================================

export async function loadAllData(): Promise<void> {
	console.log('[DataLoader] Loading all data from HoloSphere...');

	// Load all data in parallel
	const [
		issueList,
		submissionList,
		scenarioList,
		voteList,
		decisionList,
		specList,
		versionList,
		ecoList,
		certList,
		accountList,
		laborList,
		valuationList,
		planList,
		taskList,
		constraintList,
		inventoryList,
		packetList,
		findingList,
		recList,
		memoryList,
		nodeList,
		messageList,
		activities
	] = await Promise.all([
		hs.listIssues(),
		hs.listSubmissions(),
		hs.listScenarios(),
		hs.listVotes(),
		hs.listDecisions(),
		hs.listSpecs(),
		hs.listVersions(),
		hs.listEcoAssessments(),
		hs.listCertifications(),
		hs.listAccounts(),
		hs.listLaborEvents(),
		hs.listValuations(),
		hs.listPlans(),
		hs.listAllTasks(),
		hs.listConstraints(),
		hs.listInventory(),
		hs.listSignalPackets(),
		hs.listFindings(),
		hs.listRecommendations(),
		hs.listMemories(),
		hs.listFederatedNodes(),
		hs.listFederationMessages(),
		hs.getActivityFeed()
	]);

	// Check if data needs seeding (if issues are empty, assume fresh start)
	if (issueList.length === 0) {
		console.log('[DataLoader] No existing data found, seeding initial data...');
		await seedInitialData();
		// Re-load after seeding
		return loadAllData();
	}

	// Populate stores
	issues.set(issueList);
	submissions.set(submissionList);
	scenarios.set(scenarioList);
	votes.set(voteList);
	decisions.set(decisionList);
	designSpecs.set(specList);
	designVersions.set(versionList);
	ecoAssessments.set(ecoList);
	certifications.set(certList);
	itcAccounts.set(accountList);
	laborEvents.set(laborList);
	valuations.set(valuationList);
	productionPlans.set(planList);
	tasks.set(taskList);
	constraints.set(constraintList);
	materialInventory.set(inventoryList);
	signalPackets.set(packetList);
	findings.set(findingList);
	recommendations.set(recList);
	memories.set(memoryList);
	federatedNodes.set(nodeList);
	federatedMessages.set(messageList);
	activityFeed.set(activities);

	// Update dashboard stats
	const stats = await hs.getDashboardStats();
	dashboardStats.set(stats);

	console.log('[DataLoader] Data loading complete!');
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

export function setupSubscriptions(): () => void {
	const unsubscribers: (() => void)[] = [];

	// Issues subscription
	const issuesSub = hs.subscribeToIssues((data) => {
		issues.set(data);
	});
	unsubscribers.push(() => issuesSub.unsubscribe());

	// Accounts subscription
	const accountsSub = hs.subscribeToAccounts((data) => {
		itcAccounts.set(data);
	});
	unsubscribers.push(() => accountsSub.unsubscribe());

	// Activity subscription
	const activitySub = hs.subscribeToActivity((data) => {
		activityFeed.set(data);
	});
	unsubscribers.push(() => activitySub.unsubscribe());

	// Designs subscription
	const designsSub = hs.subscribeToDesigns((data) => {
		designVersions.set(data);
	});
	unsubscribers.push(() => designsSub.unsubscribe());

	// Plans subscription
	const plansSub = hs.subscribeToPlans((data) => {
		productionPlans.set(data);
	});
	unsubscribers.push(() => plansSub.unsubscribe());

	// Findings subscription
	const findingsSub = hs.subscribeToFindings((data) => {
		findings.set(data);
	});
	unsubscribers.push(() => findingsSub.unsubscribe());

	// Nodes subscription
	const nodesSub = hs.subscribeToNodes((data) => {
		federatedNodes.set(data);
	});
	unsubscribers.push(() => nodesSub.unsubscribe());

	// Messages subscription
	const messagesSub = hs.subscribeToMessages((data) => {
		federatedMessages.set(data);
	});
	unsubscribers.push(() => messagesSub.unsubscribe());

	// Return cleanup function
	return () => {
		console.log('[DataLoader] Cleaning up subscriptions...');
		unsubscribers.forEach(unsub => unsub());
	};
}

// ============================================================================
// REFRESH HELPERS
// ============================================================================

export async function refreshDashboardStats(): Promise<void> {
	const stats = await hs.getDashboardStats();
	dashboardStats.set(stats);
}

export async function refreshIssues(): Promise<void> {
	const data = await hs.listIssues();
	issues.set(data);
}

export async function refreshDesigns(): Promise<void> {
	const data = await hs.listVersions();
	designVersions.set(data);
}

export async function refreshAccounts(): Promise<void> {
	const data = await hs.listAccounts();
	itcAccounts.set(data);
}

export async function refreshPlans(): Promise<void> {
	const data = await hs.listPlans();
	productionPlans.set(data);
}

export async function refreshTasks(): Promise<void> {
	const data = await hs.listAllTasks();
	tasks.set(data);
}

export async function refreshFindings(): Promise<void> {
	const data = await hs.listFindings();
	findings.set(data);
}

export async function refreshNodes(): Promise<void> {
	const data = await hs.listFederatedNodes();
	federatedNodes.set(data);
}

export async function refreshMessages(): Promise<void> {
	const data = await hs.listFederationMessages();
	federatedMessages.set(data);
}

export async function refreshLaborEvents(): Promise<void> {
	const data = await hs.listLaborEvents();
	laborEvents.set(data);
}

export async function refreshRecommendations(): Promise<void> {
	const data = await hs.listRecommendations();
	recommendations.set(data);
}

export async function refreshMemories(): Promise<void> {
	const data = await hs.listMemories();
	memories.set(data);
}
