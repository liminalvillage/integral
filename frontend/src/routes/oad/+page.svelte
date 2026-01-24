<script lang="ts">
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, Modal, Input, EmptyState, ProgressBar } from '$lib/components/ui';
	import { designVersions, designSpecs, ecoAssessments, certifications } from '$lib/stores';
	import { oadApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import type { DesignVersion, DesignSpec, EcoAssessment, CertificationRecord } from '$lib/types';
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
		Award,
		Eye,
		Send,
		FileSearch,
		Shield,
		ArrowRight
	} from 'lucide-svelte';

	let activeTab = 'all';
	let showCreateModal = false;
	let selectedVersion: DesignVersion | null = null;

	// Create design form state
	let newDesignName = '';
	let newDesignPurpose = '';
	let newDesignRequirements = '';
	let isCreatingDesign = false;

	// View details state
	let showDetailsModal = false;
	let selectedDesignDetails: DesignVersion | null = null;
	let selectedDesignSpec: DesignSpec | null = null;
	let designEcoAssessment: EcoAssessment | null = null;
	let designCertification: CertificationRecord | null = null;
	let isLoadingDetails = false;

	// Action states
	let isSubmittingForReview = false;
	let isRunningEcoAssessment = false;
	let isRequestingCertification = false;

	const tabs = [
		{ id: 'all', label: 'All Designs', count: 0 },
		{ id: 'draft', label: 'Drafts', count: 0 },
		{ id: 'under_review', label: 'Under Review', count: 0 },
		{ id: 'certified', label: 'Certified', count: 0 }
	];

	$: filteredDesigns = activeTab === 'all'
		? $designVersions
		: $designVersions.filter(d => d.status === activeTab);

	$: {
		tabs[0].count = $designVersions.length;
		tabs[1].count = $designVersions.filter(d => d.status === 'draft').length;
		tabs[2].count = $designVersions.filter(d => d.status === 'under_review').length;
		tabs[3].count = $designVersions.filter(d => d.status === 'certified').length;
	}

	// Calculate real average eco score from designs that have one
	$: avgEcoScore = (() => {
		const withScores = $designVersions.filter(d => d.ecoScore !== undefined);
		if (withScores.length === 0) return null;
		const sum = withScores.reduce((acc, d) => acc + (d.ecoScore ?? 0), 0);
		return sum / withScores.length;
	})();

	// Calculate unique contributors
	$: uniqueContributors = new Set($designVersions.flatMap(d => d.authors)).size;

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

	async function handleCreateDesign() {
		if (!newDesignName.trim() || !newDesignPurpose.trim()) {
			toasts.error('Validation Error', 'Name and purpose are required');
			return;
		}

		isCreatingDesign = true;
		try {
			const requirements = newDesignRequirements
				.split('\n')
				.map(r => r.trim())
				.filter(r => r.length > 0);

			const spec = await oadApi.createSpec({
				purpose: newDesignPurpose.trim(),
				functionalRequirements: requirements
			});

			const version = await oadApi.createVersion({
				specId: spec.id,
				label: newDesignName.trim(),
				authors: ['current_user'],
				parameters: {}
			});

			designSpecs.update(list => [spec, ...list]);
			designVersions.update(list => [version, ...list]);
			toasts.success('Design Created', `"${version.label}" has been created as a draft`);
			showCreateModal = false;
			newDesignName = '';
			newDesignPurpose = '';
			newDesignRequirements = '';
		} catch (error) {
			toasts.error('Failed to Create Design', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isCreatingDesign = false;
		}
	}

	async function handleViewDetails(design: DesignVersion) {
		selectedDesignDetails = design;
		showDetailsModal = true;
		isLoadingDetails = true;
		designEcoAssessment = null;
		designCertification = null;
		selectedDesignSpec = null;

		try {
			const [eco, cert, specs] = await Promise.all([
				oadApi.getEcoAssessment(design.id).catch(() => null),
				oadApi.getCertification(design.id).catch(() => null),
				oadApi.listSpecs()
			]);
			designEcoAssessment = eco;
			designCertification = cert;
			selectedDesignSpec = specs.find(s => s.id === design.specId) ?? null;
		} catch (error) {
			console.error('Failed to fetch design details', error);
		} finally {
			isLoadingDetails = false;
		}
	}

	async function handleSubmitForReview() {
		if (!selectedDesignDetails) return;

		isSubmittingForReview = true;
		try {
			// Update status to under_review
			const updatedVersion = { ...selectedDesignDetails, status: 'under_review' as const };
			designVersions.update(list =>
				list.map(v => v.id === selectedDesignDetails!.id ? updatedVersion : v)
			);
			selectedDesignDetails = updatedVersion;
			toasts.success('Submitted for Review', 'Your design has been submitted for peer review');
		} catch (error) {
			toasts.error('Failed to Submit', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isSubmittingForReview = false;
		}
	}

	async function handleRunEcoAssessment() {
		if (!selectedDesignDetails) return;

		isRunningEcoAssessment = true;
		try {
			const assessment = await oadApi.computeEcoAssessment(selectedDesignDetails.id);
			designEcoAssessment = assessment;
			ecoAssessments.update(list => {
				const existing = list.findIndex(a => a.versionId === assessment.versionId);
				if (existing >= 0) {
					list[existing] = assessment;
					return [...list];
				}
				return [assessment, ...list];
			});

			// Update the design version with eco score
			const updatedVersion = { ...selectedDesignDetails, ecoScore: assessment.ecoScore };
			designVersions.update(list =>
				list.map(v => v.id === selectedDesignDetails!.id ? updatedVersion : v)
			);
			selectedDesignDetails = updatedVersion;

			if (assessment.passed) {
				toasts.success('Eco Assessment Complete', `Score: ${assessment.ecoScore.toFixed(2)} - Passed!`);
			} else {
				toasts.warning('Eco Assessment Complete', `Score: ${assessment.ecoScore.toFixed(2)} - Needs improvement`);
			}
		} catch (error) {
			toasts.error('Assessment Failed', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isRunningEcoAssessment = false;
		}
	}

	async function handleRequestCertification() {
		if (!selectedDesignDetails || !designEcoAssessment) return;

		if (!designEcoAssessment.passed) {
			toasts.warning('Cannot Certify', 'Design must pass eco assessment before certification');
			return;
		}

		isRequestingCertification = true;
		try {
			const certification = await oadApi.requestCertification(selectedDesignDetails.id, ['peer_reviewer_1', 'peer_reviewer_2']);
			designCertification = certification;
			certifications.update(list => [certification, ...list]);

			// Update status to certified
			const updatedVersion = { ...selectedDesignDetails, status: 'certified' as const };
			designVersions.update(list =>
				list.map(v => v.id === selectedDesignDetails!.id ? updatedVersion : v)
			);
			selectedDesignDetails = updatedVersion;

			toasts.success('Design Certified', `"${selectedDesignDetails.label}" has been certified by peers`);
		} catch (error) {
			toasts.error('Certification Failed', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isRequestingCertification = false;
		}
	}

	function getWorkflowStep(status: string): number {
		const steps: Record<string, number> = { draft: 1, under_review: 2, certified: 3 };
		return steps[status] ?? 0;
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
				<p class="text-2xl font-bold text-surface-100 {avgEcoScore !== null ? getEcoColor(avgEcoScore) : ''}">{avgEcoScore !== null ? avgEcoScore.toFixed(2) : 'N/A'}</p>
				<p class="text-sm text-surface-500">Avg Eco Score</p>
			</div>
		</Card>
		<Card class="flex items-center gap-4">
			<div class="p-3 rounded-xl bg-accent-500/10">
				<Users size={24} class="text-accent-400" />
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-100">{uniqueContributors}</p>
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
				<Card variant="hover" class="group flex flex-col cursor-pointer" on:click={() => handleViewDetails(design)}>
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
						<button class="btn btn-sm variant-ghost-surface" on:click|stopPropagation={() => handleViewDetails(design)}>
							<Eye size={14} />
							View Details
						</button>
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
			bind:value={newDesignName}
		/>
		<div>
			<label class="label">Purpose</label>
			<textarea
				class="input min-h-[80px] resize-y"
				placeholder="What problem does this design solve?"
				bind:value={newDesignPurpose}
			></textarea>
		</div>
		<div>
			<label class="label">Functional Requirements</label>
			<textarea
				class="input min-h-[80px] resize-y"
				placeholder="List the key requirements (one per line)"
				bind:value={newDesignRequirements}
			></textarea>
		</div>
		<div class="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 text-sm text-surface-300">
			<p><strong>Peer Process:</strong> Your design will go through Draft → Review → Certification. Peers can review and provide feedback before certification.</p>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCreateModal = false} disabled={isCreatingDesign}>Cancel</Button>
		<Button variant="primary" on:click={handleCreateDesign} loading={isCreatingDesign}>Create Design</Button>
	</svelte:fragment>
</Modal>

<!-- Design Details Modal -->
<Modal bind:open={showDetailsModal} title={selectedDesignDetails?.label ?? 'Design Details'} size="xl">
	{#if selectedDesignDetails}
		<div class="space-y-6">
			<!-- Status & Workflow Progress -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Badge variant={statusColors[selectedDesignDetails.status] ?? 'info'} size="lg">
						{selectedDesignDetails.status === 'under_review' ? 'Under Review' : selectedDesignDetails.status.charAt(0).toUpperCase() + selectedDesignDetails.status.slice(1)}
					</Badge>
					{#if selectedDesignDetails.status === 'certified'}
						<Badge variant="success"><CheckCircle size={12} class="mr-1" /> Certified</Badge>
					{/if}
				</div>
				<span class="text-sm text-surface-500">Created {formatDate(selectedDesignDetails.createdAt)}</span>
			</div>

			<!-- Workflow Progress -->
			<div class="p-4 rounded-lg bg-surface-800/30 border border-surface-700">
				<h4 class="text-sm font-medium text-surface-300 mb-3">Design Workflow</h4>
				<div class="flex items-center gap-2">
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-full flex items-center justify-center {getWorkflowStep(selectedDesignDetails.status) >= 1 ? 'bg-primary-500 text-white' : 'bg-surface-700 text-surface-400'}">
							<FileCode size={14} />
						</div>
						<span class="text-sm {getWorkflowStep(selectedDesignDetails.status) >= 1 ? 'text-primary-400' : 'text-surface-500'}">Draft</span>
					</div>
					<ArrowRight size={16} class="text-surface-600" />
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-full flex items-center justify-center {getWorkflowStep(selectedDesignDetails.status) >= 2 ? 'bg-warning-500 text-white' : 'bg-surface-700 text-surface-400'}">
							<FileSearch size={14} />
						</div>
						<span class="text-sm {getWorkflowStep(selectedDesignDetails.status) >= 2 ? 'text-warning-400' : 'text-surface-500'}">Under Review</span>
					</div>
					<ArrowRight size={16} class="text-surface-600" />
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-full flex items-center justify-center {getWorkflowStep(selectedDesignDetails.status) >= 3 ? 'bg-eco-500 text-white' : 'bg-surface-700 text-surface-400'}">
							<Shield size={14} />
						</div>
						<span class="text-sm {getWorkflowStep(selectedDesignDetails.status) >= 3 ? 'text-eco-400' : 'text-surface-500'}">Certified</span>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<h4 class="text-sm font-medium text-surface-400 mb-1">Authors</h4>
					<p class="text-surface-200">{selectedDesignDetails.authors.join(', ')}</p>
				</div>
				{#if selectedDesignSpec}
					<div>
						<h4 class="text-sm font-medium text-surface-400 mb-1">Purpose</h4>
						<p class="text-surface-200">{selectedDesignSpec.purpose}</p>
					</div>
				{/if}
			</div>

			{#if selectedDesignSpec?.functionalRequirements?.length}
				<div>
					<h4 class="text-sm font-medium text-surface-400 mb-2">Functional Requirements</h4>
					<ul class="list-disc list-inside text-sm text-surface-300 space-y-1">
						{#each selectedDesignSpec.functionalRequirements as req}
							<li>{req}</li>
						{/each}
					</ul>
				</div>
			{/if}

			{#if isLoadingDetails}
				<div class="p-4 rounded-lg bg-surface-800/50 text-center">
					<p class="text-sm text-surface-400">Loading details...</p>
				</div>
			{:else}
				<!-- Eco Assessment Section -->
				<div>
					<div class="flex items-center justify-between mb-3">
						<h4 class="text-sm font-medium text-surface-400">Ecological Assessment</h4>
						{#if selectedDesignDetails.status !== 'certified'}
							<Button size="sm" variant="secondary" on:click={handleRunEcoAssessment} loading={isRunningEcoAssessment}>
								<Leaf size={14} />
								{designEcoAssessment ? 'Re-run Assessment' : 'Run Assessment'}
							</Button>
						{/if}
					</div>
					{#if designEcoAssessment}
						<div class="p-4 rounded-lg bg-surface-800/50">
							<div class="flex items-center justify-between mb-3">
								<span class="text-lg font-semibold {getEcoColor(designEcoAssessment.ecoScore)}">
									Score: {designEcoAssessment.ecoScore.toFixed(2)}
								</span>
								<Badge variant={designEcoAssessment.passed ? 'success' : 'warning'}>
									{designEcoAssessment.passed ? 'Passed' : 'Needs Improvement'}
								</Badge>
							</div>
							<ProgressBar
								value={(1 - designEcoAssessment.ecoScore) * 100}
								max={100}
								color={designEcoAssessment.passed ? 'success' : 'warning'}
							/>
							<div class="grid grid-cols-2 gap-2 mt-4 text-sm">
								<div class="flex justify-between p-2 rounded bg-surface-700/50">
									<span class="text-surface-400">Embodied Energy:</span>
									<span class="text-surface-200">{(designEcoAssessment.embodiedEnergyNorm * 100).toFixed(0)}%</span>
								</div>
								<div class="flex justify-between p-2 rounded bg-surface-700/50">
									<span class="text-surface-400">Carbon Intensity:</span>
									<span class="text-surface-200">{(designEcoAssessment.carbonIntensityNorm * 100).toFixed(0)}%</span>
								</div>
								<div class="flex justify-between p-2 rounded bg-surface-700/50">
									<span class="text-surface-400">Toxicity:</span>
									<span class="text-surface-200">{(designEcoAssessment.toxicityNorm * 100).toFixed(0)}%</span>
								</div>
								<div class="flex justify-between p-2 rounded bg-surface-700/50">
									<span class="text-surface-400">Recyclability:</span>
									<span class="text-surface-200">{(designEcoAssessment.recyclabilityNorm * 100).toFixed(0)}%</span>
								</div>
								<div class="flex justify-between p-2 rounded bg-surface-700/50">
									<span class="text-surface-400">Water Use:</span>
									<span class="text-surface-200">{(designEcoAssessment.waterUseNorm * 100).toFixed(0)}%</span>
								</div>
								<div class="flex justify-between p-2 rounded bg-surface-700/50">
									<span class="text-surface-400">Land Use:</span>
									<span class="text-surface-200">{(designEcoAssessment.landUseNorm * 100).toFixed(0)}%</span>
								</div>
								<div class="flex justify-between p-2 rounded bg-surface-700/50 col-span-2">
									<span class="text-surface-400">Repairability:</span>
									<span class="text-surface-200">{(designEcoAssessment.repairabilityNorm * 100).toFixed(0)}%</span>
								</div>
							</div>
						</div>
					{:else}
						<div class="p-4 rounded-lg bg-surface-800/50 text-center">
							<Leaf size={24} class="mx-auto text-surface-500 mb-2" />
							<p class="text-sm text-surface-400">No eco assessment yet. Run an assessment to evaluate the ecological impact.</p>
						</div>
					{/if}
				</div>

				<!-- Certification Section -->
				{#if designCertification}
					<div class="p-4 rounded-lg bg-eco-500/10 border border-eco-500/20">
						<h4 class="text-sm font-medium text-eco-400 mb-2 flex items-center gap-2">
							<Shield size={16} />
							Certification
						</h4>
						<p class="text-sm text-surface-300">Status: <span class="text-eco-400 font-medium capitalize">{designCertification.status}</span></p>
						<p class="text-sm text-surface-300">Certified by: {designCertification.certifiedBy.join(', ')}</p>
						{#if designCertification.certifiedAt}
							<p class="text-sm text-surface-400 mt-1">Certified on {formatDate(designCertification.certifiedAt)}</p>
						{/if}
					</div>
				{/if}
			{/if}

			<!-- Action Buttons -->
			{#if selectedDesignDetails.status !== 'certified'}
				<div class="flex gap-3 pt-4 border-t border-surface-700">
					{#if selectedDesignDetails.status === 'draft'}
						<Button variant="primary" on:click={handleSubmitForReview} loading={isSubmittingForReview}>
							<Send size={14} />
							Submit for Peer Review
						</Button>
					{/if}
					{#if selectedDesignDetails.status === 'under_review' && designEcoAssessment?.passed}
						<Button variant="success" on:click={handleRequestCertification} loading={isRequestingCertification}>
							<Shield size={14} />
							Request Certification
						</Button>
					{/if}
					{#if selectedDesignDetails.status === 'under_review' && !designEcoAssessment}
						<p class="text-sm text-surface-400">Run an eco assessment before requesting certification.</p>
					{/if}
					{#if selectedDesignDetails.status === 'under_review' && designEcoAssessment && !designEcoAssessment.passed}
						<p class="text-sm text-warning-400">Design must pass eco assessment (score &lt; 0.5) before certification.</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showDetailsModal = false}>Close</Button>
	</svelte:fragment>
</Modal>
