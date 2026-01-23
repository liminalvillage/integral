<script lang="ts">
	import { goto } from '$app/navigation';
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, StatCard, ProgressBar, EmptyState, Modal, Input } from '$lib/components/ui';
	import { findings, recommendations as recommendationsStore, memories, designVersions, itcAccounts, productionPlans, tasks, laborEvents, federatedNodes, issues, votes, materialInventory } from '$lib/stores';
	import { frsApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import { refreshRecommendations, refreshMemories, refreshFindings } from '$lib/services/dataLoader';
	import type { DiagnosticFinding, Recommendation, MemoryRecord } from '$lib/types';
	import {
		Activity,
		AlertTriangle,
		CheckCircle,
		TrendingUp,
		TrendingDown,
		Brain,
		Lightbulb,
		Target,
		Eye,
		BarChart3,
		Zap,
		ArrowRight,
		RefreshCw
	} from 'lucide-svelte';

	let activeTab = 'overview';
	let isGeneratingSignals = false;

	// Use recommendations from store
	$: recommendations = $recommendationsStore;

	// Recommendation actions state
	let selectedRecommendation: Recommendation | null = null;
	let showReviewModal = false;
	let showModifyModal = false;
	let modifiedSummary = '';
	let modifiedRationale = '';

	// Record learning state
	let showRecordLearningModal = false;
	let learningTitle = '';
	let learningNarrative = '';
	let learningType: 'lesson' | 'incident' | 'outcome' = 'lesson';
	let isRecordingLearning = false;

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'findings', label: 'Findings' },
		{ id: 'recommendations', label: 'Recommendations' },
		{ id: 'memory', label: 'Memory' }
	];

	const severityColors: Record<string, string> = {
		info: 'info',
		low: 'primary',
		moderate: 'warning',
		critical: 'danger'
	};

	const findingTypeLabels: Record<string, string> = {
		ecological_overshoot: 'Ecological Overshoot',
		labor_stress: 'Labor Stress',
		material_dependency: 'Material Dependency',
		design_friction: 'Design Friction',
		valuation_drift: 'Valuation Drift',
		governance_load: 'Governance Load',
		coordination_fragility: 'Coordination Fragility'
	};

	const findingTypeIcons: Record<string, typeof Activity> = {
		ecological_overshoot: TrendingUp,
		labor_stress: Activity,
		material_dependency: Target,
		design_friction: Lightbulb,
		valuation_drift: BarChart3,
		governance_load: Brain,
		coordination_fragility: Zap
	};

	$: criticalCount = $findings.filter(f => f.severity === 'critical').length;
	$: moderateCount = $findings.filter(f => f.severity === 'moderate').length;
	$: systemHealth = criticalCount > 0 ? 'critical' : moderateCount > 2 ? 'warning' : 'healthy';

	// Calculate Autonomy Index from real data
	// Based on: local decision capacity, self-sufficiency, peer participation
	$: autonomyIndex = (() => {
		let score = 0.5; // baseline

		// Factor 1: Active governance participation (issues with votes)
		const issuesWithVotes = $issues.filter(i => i.status === 'deliberation' || i.status === 'decided').length;
		score += Math.min(0.15, issuesWithVotes * 0.03);

		// Factor 2: Labor self-sufficiency (verified labor events)
		const verifiedLabor = $laborEvents.filter(e => e.verified).length;
		const totalLabor = $laborEvents.length;
		if (totalLabor > 0) {
			score += (verifiedLabor / totalLabor) * 0.15;
		}

		// Factor 3: Design certification rate
		const certifiedDesigns = $designVersions.filter(d => d.status === 'certified').length;
		const totalDesigns = $designVersions.length;
		if (totalDesigns > 0) {
			score += (certifiedDesigns / totalDesigns) * 0.1;
		}

		// Factor 4: Task completion rate
		const completedTaskCount = $tasks.filter(t => t.status === 'done').length;
		const totalTasks = $tasks.length;
		if (totalTasks > 0) {
			score += (completedTaskCount / totalTasks) * 0.1;
		}

		return Math.min(1, Math.max(0, score));
	})();

	// Calculate Fragility Index from real data
	// Based on: blocked tasks, critical findings, dependency on external nodes
	$: fragilityIndex = (() => {
		let score = 0.1; // baseline

		// Factor 1: Blocked tasks
		const blockedTasks = $tasks.filter(t => t.status === 'blocked').length;
		score += Math.min(0.3, blockedTasks * 0.1);

		// Factor 2: Critical findings
		score += Math.min(0.25, criticalCount * 0.12);

		// Factor 3: Moderate findings
		score += Math.min(0.15, moderateCount * 0.05);

		// Factor 4: Material scarcity
		const highScarcityMaterials = $materialInventory.filter(m => m.scarcityIndex > 0.6).length;
		score += Math.min(0.15, highScarcityMaterials * 0.05);

		// Factor 5: Pending decisions (governance bottleneck)
		const pendingIssues = $issues.filter(i => i.status === 'intake' || i.status === 'deliberation').length;
		score += Math.min(0.1, pendingIssues * 0.02);

		return Math.min(1, Math.max(0, score));
	})();

	// Calculate average Ecological Score from certified designs
	$: avgEcoScore = (() => {
		const withScores = $designVersions.filter(d => d.ecoScore !== undefined);
		if (withScores.length === 0) return 0.5; // neutral if no data
		return withScores.reduce((sum, d) => sum + (d.ecoScore ?? 0), 0) / withScores.length;
	})();

	function formatTime(timestamp: string): string {
		const diff = Date.now() - new Date(timestamp).getTime();
		const hours = Math.floor(diff / 3600000);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}

	function handleViewAllFindings() {
		activeTab = 'findings';
	}

	function handleReviewRecommendation(rec: Recommendation) {
		selectedRecommendation = rec;
		showReviewModal = true;
	}

	function handleDismissRecommendation(rec: Recommendation) {
		recommendationsStore.update(recs => recs.filter(r => r.id !== rec.id));
		toasts.info('Recommendation Dismissed', 'The recommendation has been dismissed');
	}

	function handleAcceptAndRoute(rec: Recommendation) {
		const routes: Record<string, string> = {
			CDS: '/cds',
			OAD: '/oad',
			ITC: '/itc',
			COS: '/cos',
			FED: '/federation'
		};

		sessionStorage.setItem('routed_recommendation', JSON.stringify(rec));
		recommendationsStore.update(recs => recs.filter(r => r.id !== rec.id));
		toasts.success('Recommendation Accepted', `Routing to ${rec.targetSystem}`);
		goto(routes[rec.targetSystem] ?? '/');
	}

	function handleOpenModify(rec: Recommendation) {
		selectedRecommendation = rec;
		modifiedSummary = rec.summary;
		modifiedRationale = rec.rationale;
		showModifyModal = true;
	}

	function handleSaveModification() {
		if (!selectedRecommendation) return;

		recommendationsStore.update(recs =>
			recs.map(r =>
				r.id === selectedRecommendation!.id
					? { ...r, summary: modifiedSummary, rationale: modifiedRationale }
					: r
			)
		);
		toasts.success('Recommendation Updated', 'Changes have been saved');
		showModifyModal = false;
		selectedRecommendation = null;
	}

	async function handleRecordLearning() {
		if (!learningTitle.trim() || !learningNarrative.trim()) {
			toasts.error('Validation Error', 'Title and narrative are required');
			return;
		}

		isRecordingLearning = true;
		try {
			await frsApi.createMemory({
				recordType: learningType,
				title: learningTitle,
				narrative: learningNarrative
			});

			await refreshMemories();

			toasts.success('Learning Recorded', 'Institutional memory updated for peer benefit');
			showRecordLearningModal = false;
			learningTitle = '';
			learningNarrative = '';
			learningType = 'lesson';
		} catch (error) {
			toasts.error('Failed to Record', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isRecordingLearning = false;
		}
	}

	async function handleGenerateSignals() {
		isGeneratingSignals = true;
		try {
			const result = await frsApi.createSignalPacket();
			if (result.signalCount > 0) {
				const newFindings = await frsApi.analyzePacket(result.packetId);
				if (newFindings.length > 0) {
					await refreshFindings();
					const newRecs = await frsApi.generateRecommendations(newFindings.map(f => f.id));
					if (newRecs.length > 0) {
						await refreshRecommendations();
					}
					toasts.success('Analysis Complete', `Generated ${newFindings.length} findings and ${newRecs.length} recommendations`);
				} else {
					toasts.info('No Issues Found', 'System analysis found no new issues');
				}
			} else {
				toasts.info('No Signals', 'No new signals to analyze');
			}
		} catch (error) {
			toasts.error('Analysis Failed', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isGeneratingSignals = false;
		}
	}

	function getAutonomyColor(score: number): string {
		if (score >= 0.7) return 'text-eco-400';
		if (score >= 0.5) return 'text-warning-400';
		return 'text-red-400';
	}

	function getFragilityColor(score: number): string {
		if (score <= 0.3) return 'text-eco-400';
		if (score <= 0.5) return 'text-warning-400';
		return 'text-red-400';
	}

	function getEcoColor(score: number): string {
		if (score <= 0.3) return 'text-eco-400';
		if (score <= 0.5) return 'text-warning-400';
		return 'text-red-400';
	}
</script>

<Header
	title="Feedback & Review System"
	subtitle="Monitoring, diagnosis, and system learning"
/>

<PageContainer>
	<!-- System Health Banner -->
	<Card class="mb-6 {systemHealth === 'healthy' ? 'bg-gradient-to-r from-eco-500/10 to-primary-500/10 border-eco-500/20' : systemHealth === 'warning' ? 'bg-gradient-to-r from-warning-500/10 to-primary-500/10 border-warning-500/20' : 'bg-gradient-to-r from-red-500/10 to-warning-500/10 border-red-500/20'}">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<div class="p-3 rounded-xl {systemHealth === 'healthy' ? 'bg-eco-500/20' : systemHealth === 'warning' ? 'bg-warning-500/20' : 'bg-red-500/20'}">
					{#if systemHealth === 'healthy'}
						<CheckCircle size={24} class="text-eco-400" />
					{:else}
						<AlertTriangle size={24} class="{systemHealth === 'warning' ? 'text-warning-400' : 'text-red-400'}" />
					{/if}
				</div>
				<div>
					<h2 class="text-lg font-semibold text-surface-100">System Health: <span class="capitalize">{systemHealth}</span></h2>
					<p class="text-sm text-surface-400">
						{$findings.length} active findings - {recommendations.length} recommendations
					</p>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<Button variant="secondary" size="sm" on:click={handleGenerateSignals} loading={isGeneratingSignals}>
					<RefreshCw size={14} />
					Run Analysis
				</Button>
				<Badge variant={systemHealth === 'healthy' ? 'success' : systemHealth === 'warning' ? 'warning' : 'danger'}>
					{systemHealth.toUpperCase()}
				</Badge>
			</div>
		</div>
	</Card>

	<!-- Tabs -->
	<Tabs {tabs} bind:activeTab class="mb-6" />

	{#if activeTab === 'overview'}
		<!-- Stats Grid -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
			<StatCard
				title="Active Findings"
				value={$findings.length}
				icon={Eye}
				color="primary"
			/>
			<StatCard
				title="Critical"
				value={criticalCount}
				icon={AlertTriangle}
				color={criticalCount > 0 ? 'danger' : 'success'}
			/>
			<StatCard
				title="Moderate"
				value={moderateCount}
				icon={Activity}
				color={moderateCount > 2 ? 'warning' : 'primary'}
			/>
			<StatCard
				title="Recommendations"
				value={recommendations.length}
				icon={Lightbulb}
				color="success"
			/>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Recent Findings -->
			<Card>
				<div class="flex items-center justify-between mb-4">
					<h3 class="section-header mb-0">Recent Findings</h3>
					<Button variant="ghost" size="sm" on:click={handleViewAllFindings}>
						View All <ArrowRight size={14} />
					</Button>
				</div>
				{#if $findings.length === 0}
					<EmptyState
						title="No findings"
						description="Run analysis to detect system issues"
						icon={CheckCircle}
					>
						<Button slot="action" variant="secondary" on:click={handleGenerateSignals} loading={isGeneratingSignals}>
							<RefreshCw size={14} />
							Run Analysis
						</Button>
					</EmptyState>
				{:else}
					<div class="space-y-3">
						{#each $findings.slice(0, 4) as finding}
							<div class="p-3 rounded-lg bg-surface-800/50 border-l-2 {finding.severity === 'critical' ? 'border-red-500' : finding.severity === 'moderate' ? 'border-warning-500' : 'border-primary-500'}">
								<div class="flex items-start gap-3">
									<svelte:component
										this={findingTypeIcons[finding.findingType] ?? Activity}
										size={18}
										class="{finding.severity === 'critical' ? 'text-red-400' : finding.severity === 'moderate' ? 'text-warning-400' : 'text-primary-400'} mt-0.5"
									/>
									<div class="flex-1 min-w-0">
										<p class="text-sm text-surface-200">{finding.summary}</p>
										<div class="flex items-center gap-2 mt-1">
											<Badge variant={severityColors[finding.severity]} size="sm">
												{finding.severity}
											</Badge>
											<span class="text-xs text-surface-500">{finding.confidence}</span>
											<span class="text-xs text-surface-500">-</span>
											<span class="text-xs text-surface-500">{formatTime(finding.createdAt)}</span>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card>

			<!-- Recommendations -->
			<Card>
				<div class="flex items-center justify-between mb-4">
					<h3 class="section-header mb-0">Recommendations</h3>
					<Badge variant="primary">{recommendations.length} pending</Badge>
				</div>
				{#if recommendations.length === 0}
					<EmptyState
						title="No recommendations"
						description="System is operating normally"
						icon={CheckCircle}
					/>
				{:else}
					<div class="space-y-3">
						{#each recommendations.slice(0, 3) as rec}
							<div class="p-4 rounded-lg bg-surface-800/50">
								<div class="flex items-center gap-2 mb-2">
									<Lightbulb size={16} class="text-primary-400" />
									<Badge variant="info" size="sm">{rec.targetSystem}</Badge>
									<Badge variant={severityColors[rec.severity]} size="sm">{rec.severity}</Badge>
								</div>
								<p class="text-sm text-surface-200 mb-2">{rec.summary}</p>
								<p class="text-xs text-surface-500 line-clamp-2">{rec.rationale}</p>
								<div class="flex gap-2 mt-3">
									<Button size="sm" variant="primary" on:click={() => handleReviewRecommendation(rec)}>Review</Button>
									<Button size="sm" variant="ghost" on:click={() => handleDismissRecommendation(rec)}>Dismiss</Button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card>
		</div>

		<!-- System Indicators - Now calculated from real data -->
		<Card class="mt-6">
			<h3 class="section-header">System Indicators</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div>
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm text-surface-400">Autonomy Index</span>
						<span class="text-lg font-semibold {getAutonomyColor(autonomyIndex)}">{autonomyIndex.toFixed(2)}</span>
					</div>
					<ProgressBar value={autonomyIndex * 100} max={100} color={autonomyIndex >= 0.7 ? 'success' : autonomyIndex >= 0.5 ? 'warning' : 'danger'} />
					<p class="text-xs text-surface-500 mt-1">Target: &gt; 0.7 (self-governance capacity)</p>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm text-surface-400">Fragility Index</span>
						<span class="text-lg font-semibold {getFragilityColor(fragilityIndex)}">{fragilityIndex.toFixed(2)}</span>
					</div>
					<ProgressBar value={fragilityIndex * 100} max={100} color={fragilityIndex <= 0.3 ? 'success' : fragilityIndex <= 0.5 ? 'warning' : 'danger'} />
					<p class="text-xs text-surface-500 mt-1">Target: &lt; 0.3 (system resilience)</p>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm text-surface-400">Avg Ecological Score</span>
						<span class="text-lg font-semibold {getEcoColor(avgEcoScore)}">{avgEcoScore.toFixed(2)}</span>
					</div>
					<ProgressBar value={(1 - avgEcoScore) * 100} max={100} color={avgEcoScore <= 0.3 ? 'success' : avgEcoScore <= 0.5 ? 'warning' : 'danger'} />
					<p class="text-xs text-surface-500 mt-1">Target: &lt; 0.5 (ecological impact)</p>
				</div>
			</div>
			<div class="mt-4 p-3 rounded-lg bg-surface-800/30 text-sm text-surface-400">
				<p><strong>How indicators are calculated:</strong> Autonomy reflects governance participation, labor verification, and task completion. Fragility measures blocked tasks, critical findings, and material scarcity. Ecological score averages across certified designs.</p>
			</div>
		</Card>

	{:else if activeTab === 'findings'}
		<Card>
			<div class="flex items-center justify-between mb-4">
				<h3 class="section-header mb-0">All Diagnostic Findings</h3>
				<Button variant="secondary" size="sm" on:click={handleGenerateSignals} loading={isGeneratingSignals}>
					<RefreshCw size={14} />
					Refresh Analysis
				</Button>
			</div>
			{#if $findings.length === 0}
				<EmptyState
					title="No findings"
					description="Run analysis to detect system issues"
					icon={CheckCircle}
				>
					<Button slot="action" variant="secondary" on:click={handleGenerateSignals} loading={isGeneratingSignals}>
						<RefreshCw size={14} />
						Run Analysis
					</Button>
				</EmptyState>
			{:else}
				<div class="space-y-4">
					{#each $findings as finding}
						<div class="p-4 rounded-lg bg-surface-800/50 border-l-4 {finding.severity === 'critical' ? 'border-red-500' : finding.severity === 'moderate' ? 'border-warning-500' : finding.severity === 'low' ? 'border-primary-500' : 'border-surface-600'}">
							<div class="flex items-start justify-between mb-2">
								<div class="flex items-center gap-2">
									<Badge variant={severityColors[finding.severity]}>{finding.severity}</Badge>
									<Badge variant="info">{findingTypeLabels[finding.findingType]}</Badge>
								</div>
								<span class="text-xs text-surface-500">{formatTime(finding.createdAt)}</span>
							</div>
							<h4 class="text-surface-100 font-medium mb-1">{finding.summary}</h4>
							<p class="text-sm text-surface-400 mb-3">{finding.rationale}</p>
							<div class="flex flex-wrap gap-2">
								{#each Object.entries(finding.indicators) as [key, value]}
									<span class="px-2 py-1 rounded bg-surface-700 text-xs text-surface-300">
										{key}: {typeof value === 'number' ? value.toFixed(2) : value}
									</span>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>

	{:else if activeTab === 'recommendations'}
		<Card>
			<h3 class="section-header">System Recommendations</h3>
			{#if recommendations.length === 0}
				<EmptyState
					title="No recommendations"
					description="The system is operating within normal parameters"
					icon={CheckCircle}
				/>
			{:else}
				<div class="space-y-4">
					{#each recommendations as rec}
						<div class="p-4 rounded-lg bg-surface-800/50">
							<div class="flex items-start justify-between mb-3">
								<div class="flex items-center gap-2">
									<Lightbulb size={18} class="text-primary-400" />
									<Badge variant="info">{rec.targetSystem}</Badge>
									<Badge variant={severityColors[rec.severity]}>{rec.severity}</Badge>
								</div>
								<span class="text-xs text-surface-500">{formatTime(rec.createdAt)}</span>
							</div>
							<h4 class="text-surface-100 font-medium mb-2">{rec.summary}</h4>
							<p class="text-sm text-surface-400 mb-4">{rec.rationale}</p>
							<div class="flex gap-2">
								<Button variant="primary" size="sm" on:click={() => handleAcceptAndRoute(rec)}>Accept & Route to {rec.targetSystem}</Button>
								<Button variant="secondary" size="sm" on:click={() => handleOpenModify(rec)}>Modify</Button>
								<Button variant="ghost" size="sm" on:click={() => handleDismissRecommendation(rec)}>Dismiss</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>

	{:else if activeTab === 'memory'}
		<Card>
			<div class="flex items-center justify-between mb-4">
				<h3 class="section-header mb-0">Institutional Memory</h3>
				<Button variant="primary" size="sm" on:click={() => showRecordLearningModal = true}>
					Record Learning
				</Button>
			</div>
			{#if $memories.length === 0}
				<EmptyState
					title="No memory records"
					description="Record learnings to build institutional knowledge for peers"
					icon={Brain}
				>
					<Button slot="action" variant="primary" on:click={() => showRecordLearningModal = true}>
						Record Learning
					</Button>
				</EmptyState>
			{:else}
				<div class="space-y-4">
					{#each $memories as memory}
						<div class="p-4 rounded-lg bg-surface-800/50">
							<div class="flex items-start justify-between mb-2">
								<div class="flex items-center gap-2">
									<Badge variant="info">{memory.recordType}</Badge>
								</div>
								<span class="text-xs text-surface-500">{formatTime(memory.createdAt)}</span>
							</div>
							<h4 class="text-surface-100 font-medium mb-2">{memory.title}</h4>
							<p class="text-sm text-surface-400">{memory.narrative}</p>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	{/if}
</PageContainer>

<!-- Review Recommendation Modal -->
<Modal bind:open={showReviewModal} title="Review Recommendation" size="md">
	{#if selectedRecommendation}
		<div class="space-y-4">
			<div class="flex items-center gap-2">
				<Badge variant="info">{selectedRecommendation.targetSystem}</Badge>
				<Badge variant={severityColors[selectedRecommendation.severity]}>{selectedRecommendation.severity}</Badge>
			</div>
			<div>
				<h4 class="text-sm font-medium text-surface-400 mb-1">Summary</h4>
				<p class="text-surface-200">{selectedRecommendation.summary}</p>
			</div>
			<div>
				<h4 class="text-sm font-medium text-surface-400 mb-1">Rationale</h4>
				<p class="text-surface-300">{selectedRecommendation.rationale}</p>
			</div>
			<div class="p-3 rounded-lg bg-surface-800/50 text-sm text-surface-400">
				<p><strong>Action:</strong> Accept to route this recommendation to the {selectedRecommendation.targetSystem} system, or modify/dismiss as needed.</p>
			</div>
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="ghost" on:click={() => { showReviewModal = false; if (selectedRecommendation) handleDismissRecommendation(selectedRecommendation); }}>Dismiss</Button>
		<Button variant="secondary" on:click={() => { showReviewModal = false; if (selectedRecommendation) handleOpenModify(selectedRecommendation); }}>Modify</Button>
		<Button variant="primary" on:click={() => { showReviewModal = false; if (selectedRecommendation) handleAcceptAndRoute(selectedRecommendation); }}>Accept & Route</Button>
	</svelte:fragment>
</Modal>

<!-- Modify Recommendation Modal -->
<Modal bind:open={showModifyModal} title="Modify Recommendation" size="md">
	<div class="space-y-4">
		<Input label="Summary" bind:value={modifiedSummary} />
		<div>
			<label class="label">Rationale</label>
			<textarea class="input min-h-[80px] resize-y" bind:value={modifiedRationale}></textarea>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showModifyModal = false}>Cancel</Button>
		<Button variant="primary" on:click={handleSaveModification}>Save Changes</Button>
	</svelte:fragment>
</Modal>

<!-- Record Learning Modal -->
<Modal bind:open={showRecordLearningModal} title="Record Institutional Learning" size="md">
	<div class="space-y-4">
		<Input label="Title" placeholder="Brief title for this learning" bind:value={learningTitle} />
		<div>
			<label class="label">Type</label>
			<select class="input" bind:value={learningType}>
				<option value="lesson">Lesson Learned</option>
				<option value="incident">Incident Record</option>
				<option value="outcome">Outcome Documentation</option>
			</select>
		</div>
		<div>
			<label class="label">Narrative</label>
			<textarea class="input min-h-[120px] resize-y" placeholder="Describe the learning, context, and implications for future peer reference..." bind:value={learningNarrative}></textarea>
		</div>
		<div class="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 text-sm text-surface-300">
			<p><strong>Peer Benefit:</strong> This learning will be stored in institutional memory and available to all peers in the federation.</p>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showRecordLearningModal = false} disabled={isRecordingLearning}>Cancel</Button>
		<Button variant="primary" on:click={handleRecordLearning} loading={isRecordingLearning}>Record Learning</Button>
	</svelte:fragment>
</Modal>
