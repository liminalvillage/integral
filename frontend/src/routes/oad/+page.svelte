<script lang="ts">
	import { onMount } from 'svelte';
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, Modal, Input, EmptyState, ProgressBar } from '$lib/components/ui';
	import { designVersions } from '$lib/stores';
	import type { DesignVersion, EcoAssessment } from '$lib/types';
	import {
		Plus,
		Lightbulb,
		CheckCircle,
		Clock,
		Leaf,
		Users,
		ChevronRight,
		FileCode,
		Box,
		Recycle,
		Zap,
		Award
	} from 'lucide-svelte';

	let activeTab = 'all';
	let showCreateModal = false;
	let selectedVersion: DesignVersion | null = null;

	const tabs = [
		{ id: 'all', label: 'All Designs', count: 0 },
		{ id: 'draft', label: 'Drafts', count: 0 },
		{ id: 'under_review', label: 'Under Review', count: 0 },
		{ id: 'certified', label: 'Certified', count: 0 }
	];

	// Mock data
	onMount(() => {
		designVersions.set([
			{
				id: 'ver_1',
				specId: 'spec_1',
				label: 'Solar Panel Mount v2.3',
				status: 'certified',
				authors: ['Alice', 'Bob'],
				createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
				ecoScore: 0.32
			},
			{
				id: 'ver_2',
				specId: 'spec_2',
				label: 'Modular Greenhouse Frame',
				status: 'under_review',
				authors: ['Carol', 'Dave', 'Eve'],
				createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
				ecoScore: 0.45
			},
			{
				id: 'ver_3',
				specId: 'spec_3',
				label: 'Rainwater Collection System',
				status: 'draft',
				authors: ['Frank'],
				createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
				ecoScore: undefined
			},
			{
				id: 'ver_4',
				specId: 'spec_4',
				label: 'Community Tool Library Rack',
				status: 'certified',
				authors: ['Grace', 'Henry'],
				createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
				ecoScore: 0.28
			},
			{
				id: 'ver_5',
				specId: 'spec_5',
				label: 'Composting Bin Design',
				status: 'certified',
				authors: ['Ivy'],
				createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
				ecoScore: 0.18
			}
		]);
	});

	$: filteredDesigns = activeTab === 'all'
		? $designVersions
		: $designVersions.filter(d => d.status === activeTab);

	$: {
		tabs[0].count = $designVersions.length;
		tabs[1].count = $designVersions.filter(d => d.status === 'draft').length;
		tabs[2].count = $designVersions.filter(d => d.status === 'under_review').length;
		tabs[3].count = $designVersions.filter(d => d.status === 'certified').length;
	}

	const statusColors: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
		draft: 'info',
		under_review: 'warning',
		certified: 'success'
	};

	function getEcoColor(score: number | undefined): string {
		if (score === undefined) return 'text-surface-500';
		if (score <= 0.3) return 'text-eco-400';
		if (score <= 0.5) return 'text-warning-400';
		return 'text-red-400';
	}

	function getEcoLabel(score: number | undefined): string {
		if (score === undefined) return 'Not assessed';
		if (score <= 0.3) return 'Excellent';
		if (score <= 0.5) return 'Good';
		return 'Needs improvement';
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<Header
	title="Open Access Design"
	subtitle="Collective engineering and design intelligence"
	showCreateButton
	createButtonLabel="New Design"
	on:create={() => showCreateModal = true}
/>

<PageContainer>
	<!-- Stats Row -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
		<Card class="flex items-center gap-4">
			<div class="p-3 rounded-xl bg-primary-500/10">
				<Lightbulb size={24} class="text-primary-400" />
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-100">{$designVersions.length}</p>
				<p class="text-sm text-surface-500">Total Designs</p>
			</div>
		</Card>
		<Card class="flex items-center gap-4">
			<div class="p-3 rounded-xl bg-eco-500/10">
				<Award size={24} class="text-eco-400" />
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-100">{$designVersions.filter(d => d.status === 'certified').length}</p>
				<p class="text-sm text-surface-500">Certified</p>
			</div>
		</Card>
		<Card class="flex items-center gap-4">
			<div class="p-3 rounded-xl bg-warning-500/10">
				<Leaf size={24} class="text-warning-400" />
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-100">0.31</p>
				<p class="text-sm text-surface-500">Avg Eco Score</p>
			</div>
		</Card>
		<Card class="flex items-center gap-4">
			<div class="p-3 rounded-xl bg-accent-500/10">
				<Users size={24} class="text-accent-400" />
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-100">12</p>
				<p class="text-sm text-surface-500">Contributors</p>
			</div>
		</Card>
	</div>

	<!-- Tabs -->
	<Tabs {tabs} bind:activeTab class="mb-6" />

	<!-- Designs Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#if filteredDesigns.length === 0}
			<div class="col-span-full">
				<EmptyState
					title="No designs found"
					description="Start a new design specification"
					icon={Lightbulb}
				>
					<Button slot="action" variant="primary" on:click={() => showCreateModal = true}>
						<Plus size={16} />
						New Design
					</Button>
				</EmptyState>
			</div>
		{:else}
			{#each filteredDesigns as design}
				<Card variant="hover" class="group flex flex-col">
					<div class="flex items-start justify-between mb-3">
						<Badge variant={statusColors[design.status] ?? 'info'}>
							{design.status === 'under_review' ? 'Under Review' : design.status.charAt(0).toUpperCase() + design.status.slice(1)}
						</Badge>
						{#if design.status === 'certified'}
							<CheckCircle size={18} class="text-eco-400" />
						{/if}
					</div>

					<h3 class="text-lg font-medium text-surface-100 group-hover:text-primary-400 transition-colors mb-2">
						{design.label}
					</h3>

					<div class="flex items-center gap-2 text-sm text-surface-500 mb-4">
						<Users size={14} />
						<span>{design.authors.join(', ')}</span>
					</div>

					<!-- Eco Score -->
					{#if design.ecoScore !== undefined}
						<div class="p-3 rounded-lg bg-surface-800/50 mb-4">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm text-surface-400">Ecological Score</span>
								<span class="text-sm font-medium {getEcoColor(design.ecoScore)}">
									{getEcoLabel(design.ecoScore)}
								</span>
							</div>
							<ProgressBar
								value={(1 - design.ecoScore) * 100}
								max={100}
								color={design.ecoScore <= 0.3 ? 'success' : design.ecoScore <= 0.5 ? 'warning' : 'danger'}
							/>
							<div class="flex items-center justify-between mt-2 text-xs text-surface-500">
								<span>Score: {design.ecoScore.toFixed(2)}</span>
								<span class="flex items-center gap-1">
									<Leaf size={12} />
									Lower is better
								</span>
							</div>
						</div>
					{:else}
						<div class="p-3 rounded-lg bg-surface-800/50 mb-4 text-center">
							<p class="text-sm text-surface-500">Eco assessment pending</p>
						</div>
					{/if}

					<div class="mt-auto pt-3 border-t border-surface-800 flex items-center justify-between">
						<span class="text-xs text-surface-500">{formatDate(design.createdAt)}</span>
						<Button size="sm" variant="ghost">
							View Details
							<ChevronRight size={14} />
						</Button>
					</div>
				</Card>
			{/each}
		{/if}
	</div>
</PageContainer>

<!-- Create Design Modal -->
<Modal bind:open={showCreateModal} title="Create New Design" size="lg">
	<div class="space-y-4">
		<Input
			label="Design Name"
			placeholder="e.g., Solar Panel Mount v1.0"
		/>
		<div>
			<label class="label">Purpose</label>
			<textarea
				class="input min-h-[80px] resize-y"
				placeholder="What problem does this design solve?"
			></textarea>
		</div>
		<div>
			<label class="label">Functional Requirements</label>
			<textarea
				class="input min-h-[80px] resize-y"
				placeholder="List the key requirements (one per line)"
			></textarea>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCreateModal = false}>Cancel</Button>
		<Button variant="primary">Create Design</Button>
	</svelte:fragment>
</Modal>
