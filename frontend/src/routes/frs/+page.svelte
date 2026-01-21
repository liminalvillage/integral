<script lang="ts">
	import { goto } from '$app/navigation';
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, StatCard, ProgressBar, EmptyState, Modal, Input } from '$lib/components/ui';
	import { findings, recommendations as recommendationsStore, memories } from '$lib/stores';
	import { frsApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import { refreshRecommendations, refreshMemories } from '$lib/services/dataLoader';
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
		ArrowRight
	} from 'lucide-svelte';

	let activeTab = 'overview';

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
			// Store in HoloSphere
			await frsApi.createMemory({
				recordType: learningType,
				title: learningTitle,
				narrative: learningNarrative
			});

			// Refresh memories from store
			await refreshMemories();

			toasts.success('Learning Recorded', 'Institutional memory updated');
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
						{$findings.length} active findings · {recommendations.length} recommendations
					</p>
				</div>
			</div>
			<Badge variant={systemHealth === 'healthy' ? 'success' : systemHealth === 'warning' ? 'warning' : 'danger'}>
				{systemHealth.toUpperCase()}
			</Badge>
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
				color="danger"
			/>
			<StatCard
				title="Moderate"
				value={moderateCount}
				icon={Activity}
				color="warning"
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
										<span class="text-xs text-surface-500">·</span>
										<span class="text-xs text-surface-500">{formatTime(finding.createdAt)}</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Recommendations -->
			<Card>
				<div class="flex items-center justify-between mb-4">
					<h3 class="section-header mb-0">Recommendations</h3>
					<Badge variant="primary">{recommendations.length} pending</Badge>
				</div>
				<div class="space-y-3">
					{#each recommendations as rec}
						<div class="p-4 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-2 mb-2">
								<Lightbulb size={16} class="text-primary-400" />
								<Badge variant="info" size="sm">{rec.targetSystem}</Badge>
								<Badge variant={severityColors[rec.severity]} size="sm">{rec.severity}</Badge>
							</div>
							<p class="text-sm text-surface-200 mb-2">{rec.summary}</p>
							<p class="text-xs text-surface-500">{rec.rationale}</p>
							<div class="flex gap-2 mt-3">
								<Button size="sm" variant="primary" on:click={() => handleReviewRecommendation(rec)}>Review</Button>
								<Button size="sm" variant="ghost" on:click={() => handleDismissRecommendation(rec)}>Dismiss</Button>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>

		<!-- Indicator Trends -->
		<Card class="mt-6">
			<h3 class="section-header">System Indicators</h3>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div>
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm text-surface-400">Autonomy Index</span>
						<span class="text-lg font-semibold text-eco-400">0.72</span>
					</div>
					<ProgressBar value={72} max={100} color="success" />
					<p class="text-xs text-surface-500 mt-1">Target: > 0.7</p>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm text-surface-400">Fragility Index</span>
						<span class="text-lg font-semibold text-warning-400">0.38</span>
					</div>
					<ProgressBar value={38} max={100} color="warning" />
					<p class="text-xs text-surface-500 mt-1">Target: &lt; 0.3</p>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm text-surface-400">Ecological Score</span>
						<span class="text-lg font-semibold text-primary-400">0.31</span>
					</div>
					<ProgressBar value={69} max={100} color="primary" />
					<p class="text-xs text-surface-500 mt-1">Target: &lt; 0.5</p>
				</div>
			</div>
		</Card>

	{:else if activeTab === 'findings'}
		<Card>
			<h3 class="section-header">All Diagnostic Findings</h3>
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
					description="Record learnings to build institutional knowledge"
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
			<textarea class="input min-h-[120px] resize-y" placeholder="Describe the learning, context, and implications..." bind:value={learningNarrative}></textarea>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showRecordLearningModal = false} disabled={isRecordingLearning}>Cancel</Button>
		<Button variant="primary" on:click={handleRecordLearning} loading={isRecordingLearning}>Record Learning</Button>
	</svelte:fragment>
</Modal>
