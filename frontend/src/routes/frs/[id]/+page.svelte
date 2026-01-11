<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Modal, Input, ProgressBar, EmptyState, Tabs } from '$lib/components/ui';
	import { frsApi } from '$lib/api/client';
	import { findings } from '$lib/stores';
	import { toasts } from '$lib/stores/toast';
	import type { DiagnosticFinding, Recommendation, MemoryRecord } from '$lib/types';
	import {
		ArrowLeft,
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
		RefreshCw,
		Clock,
		History,
		ChevronRight,
		ExternalLink,
		FileText,
		Shield,
		Link
	} from 'lucide-svelte';

	const findingId = $page.params.id;

	// Finding data
	let finding: DiagnosticFinding | null = null;
	let relatedFindings: DiagnosticFinding[] = [];
	let generatedRecommendations: Recommendation[] = [];
	let relatedMemory: MemoryRecord[] = [];
	let isLoading = true;
	let isGeneratingRecommendations = false;

	// Action state
	let showRouteModal = false;
	let selectedRecommendation: Recommendation | null = null;
	let showRecordLearningModal = false;
	let learningTitle = '';
	let learningNarrative = '';
	let learningType: 'lesson' | 'incident' | 'outcome' = 'lesson';
	let isRecordingLearning = false;

	// Tabs
	let activeTab = 'analysis';
	const tabs = [
		{ id: 'analysis', label: 'Analysis' },
		{ id: 'recommendations', label: 'Recommendations' },
		{ id: 'history', label: 'History' },
		{ id: 'context', label: 'Context' }
	];

	const severityColors: Record<string, 'info' | 'primary' | 'warning' | 'danger'> = {
		info: 'info',
		low: 'primary',
		moderate: 'warning',
		critical: 'danger'
	};

	const confidenceColors: Record<string, 'info' | 'primary' | 'warning' | 'success'> = {
		speculative: 'info',
		provisional: 'warning',
		confident: 'primary',
		validated: 'success'
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

	const findingTypeDescriptions: Record<string, string> = {
		ecological_overshoot: 'Resource consumption exceeds sustainable limits or regenerative capacity',
		labor_stress: 'Labor allocation showing signs of burnout, overwork, or skill mismatches',
		material_dependency: 'Over-reliance on external suppliers or single sources of materials',
		design_friction: 'Design specifications causing production difficulties or quality issues',
		valuation_drift: 'ITC valuations diverging from community labor or ecological values',
		governance_load: 'Decision-making processes becoming slow or overburdened',
		coordination_fragility: 'Inter-cooperative coordination showing weakness or fragility'
	};

	const targetSystemRoutes: Record<string, string> = {
		CDS: '/cds',
		OAD: '/oad',
		ITC: '/itc',
		COS: '/cos',
		FED: '/federation'
	};

	onMount(async () => {
		await loadFinding();
	});

	async function loadFinding() {
		isLoading = true;
		try {
			// Try to find in store first, then mock
			const storeFindings = $findings;
			finding = storeFindings.find(f => f.id === findingId) || createMockFinding(findingId);

			if (finding) {
				// Load related findings
				relatedFindings = storeFindings
					.filter(f => f.id !== findingId && f.findingType === finding!.findingType)
					.slice(0, 3);

				// Mock historical memory records
				relatedMemory = [
					{
						id: 'mem_1',
						nodeId: 'node_abc',
						createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
						recordType: 'lesson',
						title: 'Previous stress response',
						narrative: 'Last time labor stress indicators rose above 0.6, we implemented cross-training which reduced pressure within 2 weeks.'
					},
					{
						id: 'mem_2',
						nodeId: 'node_abc',
						createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
						recordType: 'outcome',
						title: 'Federation support request',
						narrative: 'Successful federation support request resulted in 3 temporary experts joining for high-skill tasks.'
					}
				];
			}
		} catch (error) {
			console.error('Failed to load finding:', error);
			toasts.error('Error', 'Failed to load finding details');
		} finally {
			isLoading = false;
		}
	}

	function createMockFinding(id: string): DiagnosticFinding {
		return {
			id,
			nodeId: 'node_abc',
			createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
			findingType: 'labor_stress',
			severity: 'moderate',
			confidence: 'confident',
			summary: 'Expert-level labor showing increased demand pressure',
			rationale: 'Labor allocation signals indicate elevated utilization of expert capacity, approaching stress threshold. Analysis of recent COS task assignments shows 65% expert task density, while historical average is 45%.',
			indicators: {
				stress_index: 0.65,
				utilization: 0.72,
				expert_task_density: 0.65,
				queue_depth: 12,
				avg_completion_delay: 1.3
			}
		};
	}

	async function handleGenerateRecommendations() {
		if (!finding) return;

		isGeneratingRecommendations = true;
		try {
			const recs = await frsApi.generateRecommendations([finding.id]);
			generatedRecommendations = recs.length > 0 ? recs : createMockRecommendations();
			toasts.success('Recommendations Generated', `${generatedRecommendations.length} recommendations created`);
			activeTab = 'recommendations';
		} catch (error) {
			// Generate mock recommendations on error
			generatedRecommendations = createMockRecommendations();
			toasts.success('Recommendations Generated', `${generatedRecommendations.length} recommendations created`);
			activeTab = 'recommendations';
		} finally {
			isGeneratingRecommendations = false;
		}
	}

	function createMockRecommendations(): Recommendation[] {
		if (!finding) return [];

		const recommendations: Recommendation[] = [];

		if (finding.findingType === 'labor_stress') {
			recommendations.push(
				{
					id: 'rec_gen_1',
					nodeId: finding.nodeId,
					createdAt: new Date().toISOString(),
					targetSystem: 'COS',
					recommendationType: 'workload_rebalancing',
					severity: finding.severity,
					summary: 'Rebalance expert-level tasks across cooperatives',
					rationale: 'Current task distribution creates bottleneck risk. Redistributing 20% of expert tasks to advanced-tier workers with supervision could reduce stress by estimated 15%.'
				},
				{
					id: 'rec_gen_2',
					nodeId: finding.nodeId,
					createdAt: new Date().toISOString(),
					targetSystem: 'CDS',
					recommendationType: 'policy_proposal',
					severity: 'low',
					summary: 'Propose cross-training initiative for skill development',
					rationale: 'Medium-term solution: developing more expert-level workers through structured cross-training. Submit CDS issue for community deliberation.'
				},
				{
					id: 'rec_gen_3',
					nodeId: finding.nodeId,
					createdAt: new Date().toISOString(),
					targetSystem: 'FED',
					recommendationType: 'federation_request',
					severity: 'low',
					summary: 'Request federation support for expert capacity',
					rationale: 'If local solutions insufficient, consider requesting temporary expert support from federation partners.'
				}
			);
		} else {
			recommendations.push({
				id: 'rec_gen_1',
				nodeId: finding.nodeId,
				createdAt: new Date().toISOString(),
				targetSystem: 'CDS',
				recommendationType: 'policy_review',
				severity: finding.severity,
				summary: `Review policies related to ${findingTypeLabels[finding.findingType] || finding.findingType}`,
				rationale: 'System analysis suggests policy adjustments may help address this finding. Submit for community deliberation.'
			});
		}

		return recommendations;
	}

	function handleRouteRecommendation(rec: Recommendation) {
		selectedRecommendation = rec;
		showRouteModal = true;
	}

	function handleConfirmRoute() {
		if (!selectedRecommendation) return;

		const route = targetSystemRoutes[selectedRecommendation.targetSystem] || '/';
		sessionStorage.setItem('routed_recommendation', JSON.stringify(selectedRecommendation));
		toasts.success('Routing', `Navigating to ${selectedRecommendation.targetSystem}`);
		goto(route);
	}

	function handleDismissRecommendation(rec: Recommendation) {
		generatedRecommendations = generatedRecommendations.filter(r => r.id !== rec.id);
		toasts.info('Dismissed', 'Recommendation has been dismissed');
	}

	async function handleRecordLearning() {
		if (!learningTitle.trim() || !learningNarrative.trim()) {
			toasts.error('Validation Error', 'Title and narrative are required');
			return;
		}

		isRecordingLearning = true;
		try {
			const memories = JSON.parse(localStorage.getItem('integral_memories') ?? '[]');
			const newMemory = {
				id: `mem_${Date.now()}`,
				nodeId: finding?.nodeId || 'node_abc',
				createdAt: new Date().toISOString(),
				recordType: learningType,
				title: learningTitle,
				narrative: learningNarrative,
				linkedFindingId: findingId
			};
			memories.push(newMemory);
			localStorage.setItem('integral_memories', JSON.stringify(memories));

			relatedMemory = [newMemory as MemoryRecord, ...relatedMemory];
			toasts.success('Learning Recorded', 'Added to institutional memory');
			showRecordLearningModal = false;
			learningTitle = '';
			learningNarrative = '';
		} catch (error) {
			toasts.error('Failed to Record', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isRecordingLearning = false;
		}
	}

	function formatDateTime(dateString: string): string {
		return new Date(dateString).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatTimeAgo(dateString: string): string {
		const diff = Date.now() - new Date(dateString).getTime();
		const hours = Math.floor(diff / 3600000);
		if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}

	function getIndicatorStatus(key: string, value: number): { color: string; label: string } {
		// Define thresholds for different indicators
		const thresholds: Record<string, { good: number; warning: number }> = {
			stress_index: { good: 0.4, warning: 0.6 },
			utilization: { good: 0.6, warning: 0.8 },
			expert_task_density: { good: 0.5, warning: 0.65 },
			queue_depth: { good: 8, warning: 15 },
			avg_completion_delay: { good: 1.0, warning: 1.5 },
			eco_score: { good: 0.3, warning: 0.5 },
			external_ratio: { good: 0.25, warning: 0.4 },
			herfindahl: { good: 0.3, warning: 0.5 }
		};

		const threshold = thresholds[key] || { good: 0.5, warning: 0.7 };

		if (value <= threshold.good) {
			return { color: 'text-eco-400', label: 'Good' };
		} else if (value <= threshold.warning) {
			return { color: 'text-warning-400', label: 'Warning' };
		}
		return { color: 'text-red-400', label: 'Critical' };
	}

	function goBack() {
		goto('/frs');
	}
</script>

<Header
	title={finding ? findingTypeLabels[finding.findingType] || finding.findingType : 'Finding Details'}
	subtitle="Diagnostic analysis and recommendations"
/>

<PageContainer>
	<!-- Back Navigation -->
	<Button variant="ghost" class="mb-4" on:click={goBack}>
		<ArrowLeft size={16} />
		Back to FRS Overview
	</Button>

	{#if isLoading}
		<Card class="p-8 text-center">
			<RefreshCw size={32} class="animate-spin text-primary-400 mx-auto mb-4" />
			<p class="text-surface-400">Loading finding details...</p>
		</Card>
	{:else if finding}
		<!-- Finding Summary -->
		<Card class="mb-6 {finding.severity === 'critical' ? 'bg-gradient-to-r from-red-500/10 to-warning-500/10 border-red-500/20' : finding.severity === 'moderate' ? 'bg-gradient-to-r from-warning-500/10 to-primary-500/10 border-warning-500/20' : 'bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20'}">
			<div class="flex items-start justify-between mb-4">
				<div class="flex items-center gap-3">
					<div class="p-3 rounded-xl {finding.severity === 'critical' ? 'bg-red-500/20' : finding.severity === 'moderate' ? 'bg-warning-500/20' : 'bg-primary-500/20'}">
						<AlertTriangle size={24} class="{finding.severity === 'critical' ? 'text-red-400' : finding.severity === 'moderate' ? 'text-warning-400' : 'text-primary-400'}" />
					</div>
					<div>
						<div class="flex items-center gap-2 mb-1">
							<Badge variant={severityColors[finding.severity]}>{finding.severity.toUpperCase()}</Badge>
							<Badge variant={confidenceColors[finding.confidence]}>{finding.confidence}</Badge>
						</div>
						<h2 class="text-xl font-bold text-surface-100">{findingTypeLabels[finding.findingType]}</h2>
					</div>
				</div>
				<div class="text-right">
					<p class="text-sm text-surface-400">Detected</p>
					<p class="text-surface-200">{formatTimeAgo(finding.createdAt)}</p>
				</div>
			</div>

			<p class="text-lg text-surface-200 mb-2">{finding.summary}</p>
			<p class="text-sm text-surface-400">{findingTypeDescriptions[finding.findingType]}</p>

			<div class="flex gap-3 mt-4">
				<Button variant="primary" on:click={handleGenerateRecommendations} loading={isGeneratingRecommendations}>
					<Lightbulb size={16} />
					Generate Recommendations
				</Button>
				<Button variant="secondary" on:click={() => showRecordLearningModal = true}>
					<Brain size={16} />
					Record Learning
				</Button>
			</div>
		</Card>

		<!-- Tabs -->
		<Tabs {tabs} bind:activeTab class="mb-6" />

		{#if activeTab === 'analysis'}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Detailed Rationale -->
				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
						<Eye size={20} class="text-primary-400" />
						Analysis Rationale
					</h3>
					<p class="text-surface-300 leading-relaxed">{finding.rationale}</p>

					<div class="mt-4 p-3 rounded-lg bg-surface-800/50">
						<p class="text-xs text-surface-500">
							<Shield size={12} class="inline mr-1" />
							Confidence Level: <span class="text-surface-300 font-medium">{finding.confidence}</span>
							{#if finding.confidence === 'speculative'}
								- Based on early signals, requires validation
							{:else if finding.confidence === 'provisional'}
								- Based on moderate evidence, monitoring recommended
							{:else if finding.confidence === 'confident'}
								- Based on strong evidence from multiple indicators
							{:else}
								- Validated through historical correlation
							{/if}
						</p>
					</div>
				</Card>

				<!-- Indicators -->
				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
						<BarChart3 size={20} class="text-accent-400" />
						Key Indicators
					</h3>
					<div class="space-y-4">
						{#each Object.entries(finding.indicators) as [key, value]}
							{@const numValue = typeof value === 'number' ? value : 0}
							{@const status = getIndicatorStatus(key, numValue)}
							<div>
								<div class="flex items-center justify-between mb-1">
									<span class="text-sm text-surface-400">{key.replace(/_/g, ' ')}</span>
									<span class="text-sm font-medium {status.color}">{typeof value === 'number' ? value.toFixed(2) : value}</span>
								</div>
								<div class="flex items-center gap-2">
									<ProgressBar
										value={Math.min(numValue * 100, 100)}
										max={100}
										color={status.label === 'Good' ? 'success' : status.label === 'Warning' ? 'warning' : 'danger'}
										size="sm"
										class="flex-1"
									/>
									<Badge variant={status.label === 'Good' ? 'success' : status.label === 'Warning' ? 'warning' : 'danger'} size="sm">
										{status.label}
									</Badge>
								</div>
							</div>
						{/each}
					</div>
				</Card>

				<!-- Trend Analysis -->
				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
						<TrendingUp size={20} class="text-warning-400" />
						Trend Analysis
					</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-2">
								<TrendingUp size={16} class="text-red-400" />
								<span class="text-surface-300">7-day trend</span>
							</div>
							<span class="text-red-400 font-medium">+12% increase</span>
						</div>
						<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-2">
								<Activity size={16} class="text-warning-400" />
								<span class="text-surface-300">30-day average</span>
							</div>
							<span class="text-warning-400 font-medium">0.58</span>
						</div>
						<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-2">
								<Clock size={16} class="text-surface-400" />
								<span class="text-surface-300">Time at current level</span>
							</div>
							<span class="text-surface-200 font-medium">3 days</span>
						</div>
					</div>
				</Card>

				<!-- Related Findings -->
				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
						<Link size={20} class="text-primary-400" />
						Related Findings
					</h3>
					{#if relatedFindings.length > 0}
						<div class="space-y-3">
							{#each relatedFindings as related}
								<button
									class="w-full p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors text-left"
									on:click={() => goto(`/frs/${related.id}`)}
								>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<Badge variant={severityColors[related.severity]} size="sm">{related.severity}</Badge>
											<span class="text-sm text-surface-200">{related.summary}</span>
										</div>
										<ChevronRight size={16} class="text-surface-500" />
									</div>
									<p class="text-xs text-surface-500 mt-1">{formatTimeAgo(related.createdAt)}</p>
								</button>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-surface-500 text-center py-4">No related findings detected</p>
					{/if}
				</Card>
			</div>

		{:else if activeTab === 'recommendations'}
			<Card>
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-surface-100 flex items-center gap-2">
						<Lightbulb size={20} class="text-warning-400" />
						Generated Recommendations
					</h3>
					{#if generatedRecommendations.length === 0}
						<Button variant="primary" size="sm" on:click={handleGenerateRecommendations} loading={isGeneratingRecommendations}>
							Generate
						</Button>
					{/if}
				</div>

				{#if generatedRecommendations.length > 0}
					<div class="space-y-4">
						{#each generatedRecommendations as rec, index}
							<div class="p-4 rounded-lg bg-surface-800/50 border-l-4 {index === 0 ? 'border-primary-500' : 'border-surface-600'}">
								<div class="flex items-center gap-2 mb-2">
									<Badge variant="info">{rec.targetSystem}</Badge>
									<Badge variant={severityColors[rec.severity]}>{rec.severity}</Badge>
									{#if index === 0}
										<Badge variant="primary" size="sm">Primary</Badge>
									{/if}
								</div>
								<h4 class="text-surface-100 font-medium mb-2">{rec.summary}</h4>
								<p class="text-sm text-surface-400 mb-4">{rec.rationale}</p>
								<div class="flex gap-2">
									<Button variant="primary" size="sm" on:click={() => handleRouteRecommendation(rec)}>
										<ArrowRight size={14} />
										Route to {rec.targetSystem}
									</Button>
									<Button variant="ghost" size="sm" on:click={() => handleDismissRecommendation(rec)}>
										Dismiss
									</Button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<EmptyState
						title="No recommendations yet"
						description="Generate recommendations based on this finding"
						icon={Lightbulb}
					>
						<Button slot="action" variant="primary" on:click={handleGenerateRecommendations} loading={isGeneratingRecommendations}>
							<Lightbulb size={16} />
							Generate Recommendations
						</Button>
					</EmptyState>
				{/if}
			</Card>

		{:else if activeTab === 'history'}
			<Card>
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-surface-100 flex items-center gap-2">
						<History size={20} class="text-primary-400" />
						Finding History
					</h3>
				</div>

				<div class="space-y-4">
					<!-- Timeline -->
					<div class="relative pl-6 border-l-2 border-surface-700 space-y-6">
						<!-- Current state -->
						<div class="relative">
							<div class="absolute -left-[1.65rem] w-3 h-3 rounded-full bg-primary-500 border-2 border-surface-900"></div>
							<div class="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
								<p class="text-sm font-medium text-primary-400">Current Finding</p>
								<p class="text-xs text-surface-400">{formatDateTime(finding.createdAt)}</p>
								<p class="text-sm text-surface-300 mt-2">{finding.summary}</p>
							</div>
						</div>

						<!-- Historical states -->
						<div class="relative">
							<div class="absolute -left-[1.65rem] w-3 h-3 rounded-full bg-warning-500 border-2 border-surface-900"></div>
							<div class="p-3 rounded-lg bg-surface-800/50">
								<p class="text-sm font-medium text-warning-400">Threshold Crossed</p>
								<p class="text-xs text-surface-500">2 days ago</p>
								<p class="text-sm text-surface-400 mt-2">Stress index exceeded 0.6 warning threshold</p>
							</div>
						</div>

						<div class="relative">
							<div class="absolute -left-[1.65rem] w-3 h-3 rounded-full bg-surface-600 border-2 border-surface-900"></div>
							<div class="p-3 rounded-lg bg-surface-800/50">
								<p class="text-sm font-medium text-surface-300">Initial Detection</p>
								<p class="text-xs text-surface-500">5 days ago</p>
								<p class="text-sm text-surface-400 mt-2">Early signals detected, confidence: speculative</p>
							</div>
						</div>

						<div class="relative">
							<div class="absolute -left-[1.65rem] w-3 h-3 rounded-full bg-eco-500 border-2 border-surface-900"></div>
							<div class="p-3 rounded-lg bg-surface-800/50">
								<p class="text-sm font-medium text-eco-400">Normal State</p>
								<p class="text-xs text-surface-500">2 weeks ago</p>
								<p class="text-sm text-surface-400 mt-2">All indicators within normal range</p>
							</div>
						</div>
					</div>
				</div>
			</Card>

		{:else if activeTab === 'context'}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Institutional Memory -->
				<Card>
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-lg font-semibold text-surface-100 flex items-center gap-2">
							<Brain size={20} class="text-accent-400" />
							Related Memory
						</h3>
						<Button variant="secondary" size="sm" on:click={() => showRecordLearningModal = true}>
							<FileText size={14} />
							Record
						</Button>
					</div>

					{#if relatedMemory.length > 0}
						<div class="space-y-3">
							{#each relatedMemory as memory}
								<div class="p-3 rounded-lg bg-surface-800/50">
									<div class="flex items-center gap-2 mb-2">
										<Badge variant="info" size="sm">{memory.recordType}</Badge>
										<span class="text-xs text-surface-500">{formatTimeAgo(memory.createdAt)}</span>
									</div>
									<h4 class="text-sm font-medium text-surface-200">{memory.title}</h4>
									<p class="text-xs text-surface-400 mt-1">{memory.narrative}</p>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-surface-500 text-center py-4">No related memory records</p>
					{/if}
				</Card>

				<!-- System Context -->
				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
						<Target size={20} class="text-primary-400" />
						System Context
					</h3>

					<div class="space-y-4">
						<div class="p-3 rounded-lg bg-surface-800/50">
							<p class="text-sm text-surface-400 mb-2">Affected Systems</p>
							<div class="flex flex-wrap gap-2">
								<Badge variant="primary">COS</Badge>
								<Badge variant="info">ITC</Badge>
							</div>
						</div>

						<div class="p-3 rounded-lg bg-surface-800/50">
							<p class="text-sm text-surface-400 mb-2">Current Production</p>
							<p class="text-surface-200">3 active batches, 12 tasks in progress</p>
						</div>

						<div class="p-3 rounded-lg bg-surface-800/50">
							<p class="text-sm text-surface-400 mb-2">Expert Capacity</p>
							<div class="flex items-center justify-between">
								<span class="text-surface-200">5 expert members available</span>
								<Badge variant="warning">72% utilized</Badge>
							</div>
						</div>

						<div class="p-3 rounded-lg bg-surface-800/50">
							<p class="text-sm text-surface-400 mb-2">Recent Decisions</p>
							<p class="text-surface-200 text-sm">Last CDS decision: Cross-training initiative approved (3 days ago)</p>
						</div>
					</div>
				</Card>
			</div>
		{/if}
	{:else}
		<EmptyState
			title="Finding Not Found"
			description="The requested finding could not be found"
			icon={Eye}
		>
			<Button slot="action" variant="primary" on:click={goBack}>
				<ArrowLeft size={16} />
				Back to FRS Overview
			</Button>
		</EmptyState>
	{/if}
</PageContainer>

<!-- Route Recommendation Modal -->
<Modal bind:open={showRouteModal} title="Route Recommendation" size="md">
	{#if selectedRecommendation}
		<div class="space-y-4">
			<div class="p-4 rounded-lg bg-surface-800/50">
				<div class="flex items-center gap-2 mb-2">
					<Badge variant="info">{selectedRecommendation.targetSystem}</Badge>
					<Badge variant={severityColors[selectedRecommendation.severity]}>{selectedRecommendation.severity}</Badge>
				</div>
				<h4 class="text-surface-100 font-medium mb-2">{selectedRecommendation.summary}</h4>
				<p class="text-sm text-surface-400">{selectedRecommendation.rationale}</p>
			</div>

			<div class="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
				<p class="text-sm text-surface-300">
					<ArrowRight size={14} class="inline mr-1" />
					This recommendation will be routed to <span class="font-medium text-primary-400">{selectedRecommendation.targetSystem}</span> for action.
				</p>
			</div>
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showRouteModal = false}>Cancel</Button>
		<Button variant="primary" on:click={handleConfirmRoute}>
			<ArrowRight size={16} />
			Route to {selectedRecommendation?.targetSystem}
		</Button>
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
		{#if finding}
			<div class="p-3 rounded-lg bg-surface-800/50">
				<p class="text-xs text-surface-500">
					<Link size={12} class="inline mr-1" />
					Linked to finding: <span class="text-surface-300">{finding.summary}</span>
				</p>
			</div>
		{/if}
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showRecordLearningModal = false} disabled={isRecordingLearning}>Cancel</Button>
		<Button variant="primary" on:click={handleRecordLearning} loading={isRecordingLearning}>
			<Brain size={16} />
			Record Learning
		</Button>
	</svelte:fragment>
</Modal>
