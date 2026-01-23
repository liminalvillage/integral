<script lang="ts">
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, Modal, Input, EmptyState, ProgressBar } from '$lib/components/ui';
	import { issues, submissions, scenarios, votes, decisions } from '$lib/stores';
	import { cdsApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import type { Issue, Submission, Scenario, Vote } from '$lib/types';
	import {
		Plus,
		MessageSquare,
		Vote as VoteIcon,
		CheckCircle,
		Clock,
		AlertTriangle,
		Users,
		ChevronRight,
		ThumbsUp,
		ThumbsDown,
		Minus,
		FileText,
		ArrowRight,
		Send,
		Target,
		Gavel,
		Eye,
		X
	} from 'lucide-svelte';

	let activeTab = 'all';
	let showCreateModal = false;
	let newIssueTitle = '';
	let newIssueDescription = '';
	let newIssueCategory = 'governance';
	let isCreatingIssue = false;
	let votingIssueId: string | null = null;
	let votingLevel: string | null = null;

	// Issue details modal
	let showDetailsModal = false;
	let selectedIssue: Issue | null = null;
	let issueSubmissions: Submission[] = [];
	let issueScenarios: Scenario[] = [];
	let issueVotes: Vote[] = [];
	let isLoadingDetails = false;

	// Add submission modal
	let showAddSubmissionModal = false;
	let newSubmissionType: 'proposal' | 'objection' | 'evidence' | 'comment' = 'proposal';
	let newSubmissionContent = '';
	let isAddingSubmission = false;

	// Create scenario modal
	let showCreateScenarioModal = false;
	let newScenarioLabel = '';
	let newScenarioDescription = '';
	let isCreatingScenario = false;

	// Advance status state
	let isAdvancingStatus = false;

	// Make decision state
	let isMakingDecision = false;

	const tabs = [
		{ id: 'all', label: 'All Issues', count: 0 },
		{ id: 'intake', label: 'Intake', count: 0 },
		{ id: 'deliberation', label: 'Deliberation', count: 0 },
		{ id: 'decided', label: 'Decided', count: 0 }
	];

	$: filteredIssues = activeTab === 'all'
		? $issues
		: $issues.filter(i => {
			if (activeTab === 'intake') return ['intake', 'structured', 'context_ready'].includes(i.status);
			if (activeTab === 'deliberation') return i.status === 'deliberation';
			if (activeTab === 'decided') return ['decided', 'dispatched'].includes(i.status);
			return true;
		});

	$: {
		tabs[0].count = $issues.length;
		tabs[1].count = $issues.filter(i => ['intake', 'structured', 'context_ready'].includes(i.status)).length;
		tabs[2].count = $issues.filter(i => i.status === 'deliberation').length;
		tabs[3].count = $issues.filter(i => ['decided', 'dispatched'].includes(i.status)).length;
	}

	// Calculate real participant count from votes
	$: activeParticipants = new Set($votes.map(v => v.participantId)).size;

	const statusColors: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
		intake: 'info',
		structured: 'info',
		context_ready: 'warning',
		deliberation: 'primary',
		decided: 'success',
		dispatched: 'success',
		under_review: 'warning',
		reopened: 'warning'
	};

	const statusLabels: Record<string, string> = {
		intake: 'Intake',
		structured: 'Structured',
		context_ready: 'Context Ready',
		deliberation: 'In Deliberation',
		decided: 'Decided',
		dispatched: 'Dispatched',
		under_review: 'Under Review',
		reopened: 'Reopened'
	};

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// Calculate consensus score from votes
	function calculateConsensus(scenarioVotes: Vote[]): { score: number; participation: number } {
		if (scenarioVotes.length === 0) return { score: 0, participation: 0 };

		const supportLevels: Record<string, number> = {
			'strong_support': 1.0,
			'support': 0.75,
			'neutral': 0.5,
			'concern': 0.25,
			'block': 0.0
		};

		let totalWeight = 0;
		let weightedSum = 0;

		for (const vote of scenarioVotes) {
			const level = supportLevels[vote.supportLevel] ?? 0.5;
			weightedSum += vote.weight * level;
			totalWeight += vote.weight;
		}

		return {
			score: totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0,
			participation: scenarioVotes.length
		};
	}

	async function handleCreateIssue() {
		if (!newIssueTitle.trim() || !newIssueDescription.trim()) {
			toasts.error('Validation Error', 'Title and description are required');
			return;
		}

		isCreatingIssue = true;
		try {
			const issue = await cdsApi.createIssue({
				title: newIssueTitle.trim(),
				description: newIssueDescription.trim(),
				authorId: 'current_user'
			});
			issues.update(list => [issue, ...list]);
			toasts.success('Issue Created', `"${issue.title}" has been submitted for peer review`);
			showCreateModal = false;
			newIssueTitle = '';
			newIssueDescription = '';
			newIssueCategory = 'governance';
		} catch (error) {
			toasts.error('Failed to Create Issue', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isCreatingIssue = false;
		}
	}

	async function handleViewDetails(issue: Issue) {
		selectedIssue = issue;
		showDetailsModal = true;
		isLoadingDetails = true;

		try {
			const [subs, scens, allVotes] = await Promise.all([
				cdsApi.listSubmissions(issue.id),
				cdsApi.listScenarios(issue.id),
				cdsApi.listVotes()
			]);

			issueSubmissions = subs;
			issueScenarios = scens;
			// Filter votes for this issue's scenarios
			const scenarioIds = new Set(scens.map(s => s.id));
			issueVotes = allVotes.filter(v => scenarioIds.has(v.scenarioId));
		} catch (error) {
			toasts.error('Failed to Load Details', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isLoadingDetails = false;
		}
	}

	async function handleAddSubmission() {
		if (!selectedIssue || !newSubmissionContent.trim()) {
			toasts.error('Validation Error', 'Submission content is required');
			return;
		}

		isAddingSubmission = true;
		try {
			const submission = await cdsApi.addSubmission(selectedIssue.id, {
				type: newSubmissionType,
				content: newSubmissionContent.trim(),
				authorId: 'current_user'
			});
			issueSubmissions = [submission, ...issueSubmissions];
			submissions.update(list => [submission, ...list]);

			// Update issue submission count
			issues.update(list => list.map(i =>
				i.id === selectedIssue!.id
					? { ...i, submissionCount: i.submissionCount + 1 }
					: i
			));

			toasts.success('Submission Added', `Your ${newSubmissionType} has been added for peer consideration`);
			showAddSubmissionModal = false;
			newSubmissionContent = '';
			newSubmissionType = 'proposal';
		} catch (error) {
			toasts.error('Failed to Add Submission', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isAddingSubmission = false;
		}
	}

	async function handleCreateScenario() {
		if (!selectedIssue || !newScenarioLabel.trim()) {
			toasts.error('Validation Error', 'Scenario label is required');
			return;
		}

		isCreatingScenario = true;
		try {
			const scenario = await cdsApi.createScenario(selectedIssue.id, {
				label: newScenarioLabel.trim(),
				parameters: { description: newScenarioDescription }
			});
			issueScenarios = [scenario, ...issueScenarios];
			scenarios.update(list => [scenario, ...list]);

			toasts.success('Scenario Created', 'Voting scenario created - peers can now vote on this option');
			showCreateScenarioModal = false;
			newScenarioLabel = '';
			newScenarioDescription = '';
		} catch (error) {
			toasts.error('Failed to Create Scenario', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isCreatingScenario = false;
		}
	}

	async function handleVote(issue: Issue, supportLevel: 'support' | 'neutral' | 'concern') {
		votingIssueId = issue.id;
		votingLevel = supportLevel;

		try {
			const scens = await cdsApi.listScenarios(issue.id);
			if (scens.length === 0) {
				toasts.warning('No Scenarios', 'This issue needs proposals before voting can begin');
				return;
			}

			await cdsApi.castVote(scens[0].id, {
				participantId: 'current_user',
				supportLevel: supportLevel
			});

			// Refresh votes
			const allVotes = await cdsApi.listVotes();
			votes.set(allVotes);

			toasts.success('Vote Cast', `Your ${supportLevel} vote has been recorded for peer consensus`);
		} catch (error) {
			toasts.error('Failed to Vote', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			votingIssueId = null;
			votingLevel = null;
		}
	}

	async function handleScenarioVote(scenario: Scenario, supportLevel: string) {
		try {
			await cdsApi.castVote(scenario.id, {
				participantId: 'current_user',
				supportLevel
			});

			// Refresh votes for this issue
			const allVotes = await cdsApi.listVotes();
			const scenarioIds = new Set(issueScenarios.map(s => s.id));
			issueVotes = allVotes.filter(v => scenarioIds.has(v.scenarioId));
			votes.set(allVotes);

			toasts.success('Vote Recorded', `Your vote on "${scenario.label}" has been recorded`);
		} catch (error) {
			toasts.error('Failed to Vote', error instanceof Error ? error.message : 'Unknown error');
		}
	}

	async function handleAdvanceStatus(newStatus: string) {
		if (!selectedIssue) return;

		isAdvancingStatus = true;
		try {
			// Update issue status via API (this would need to be implemented in the backend)
			// For now we update locally
			issues.update(list => list.map(i =>
				i.id === selectedIssue!.id
					? { ...i, status: newStatus as Issue['status'], lastUpdatedAt: new Date().toISOString() }
					: i
			));
			selectedIssue = { ...selectedIssue, status: newStatus as Issue['status'] };

			const statusNames: Record<string, string> = {
				structured: 'Structured',
				context_ready: 'Context Ready',
				deliberation: 'Deliberation'
			};
			toasts.success('Status Advanced', `Issue moved to ${statusNames[newStatus] ?? newStatus}`);
		} catch (error) {
			toasts.error('Failed to Update', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isAdvancingStatus = false;
		}
	}

	async function handleMakeDecision(scenario: Scenario) {
		if (!selectedIssue) return;

		const scenarioVotes = issueVotes.filter(v => v.scenarioId === scenario.id);
		const { score } = calculateConsensus(scenarioVotes);

		if (score < 60) {
			toasts.warning('Insufficient Consensus', 'At least 60% consensus is required for a decision');
			return;
		}

		isMakingDecision = true;
		try {
			const decision = await cdsApi.makeDecision(selectedIssue.id, scenario.id);
			decisions.update(list => [decision, ...list]);

			// Update issue status to decided
			issues.update(list => list.map(i =>
				i.id === selectedIssue!.id
					? { ...i, status: 'decided', lastUpdatedAt: new Date().toISOString() }
					: i
			));
			selectedIssue = { ...selectedIssue, status: 'decided' };

			toasts.success('Decision Made', `"${scenario.label}" has been approved with ${score.toFixed(0)}% consensus`);
		} catch (error) {
			toasts.error('Failed to Make Decision', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isMakingDecision = false;
		}
	}

	function getNextStatus(currentStatus: string): string | null {
		const progression: Record<string, string> = {
			intake: 'structured',
			structured: 'context_ready',
			context_ready: 'deliberation'
		};
		return progression[currentStatus] ?? null;
	}

	function getStatusActionLabel(currentStatus: string): string {
		const labels: Record<string, string> = {
			intake: 'Mark as Structured',
			structured: 'Mark Context Ready',
			context_ready: 'Open for Deliberation'
		};
		return labels[currentStatus] ?? 'Advance';
	}

	// Get the leading scenario (highest consensus)
	$: leadingScenario = issueScenarios.length > 0
		? issueScenarios.reduce((best, current) => {
			const bestVotes = issueVotes.filter(v => v.scenarioId === best.id);
			const currentVotes = issueVotes.filter(v => v.scenarioId === current.id);
			const bestScore = calculateConsensus(bestVotes).score;
			const currentScore = calculateConsensus(currentVotes).score;
			return currentScore > bestScore ? current : best;
		})
		: null;
</script>

<Header
	title="Collaborative Decision System"
	subtitle="Participatory governance and consensus building"
	showCreateButton
	createButtonLabel="New Issue"
	on:create={() => showCreateModal = true}
/>

<PageContainer>
	<!-- Stats Row -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
		<Card class="flex items-center gap-4">
			<div class="p-3 rounded-xl bg-primary-500/10">
				<FileText size={24} class="text-primary-400" />
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-100">{$issues.length}</p>
				<p class="text-sm text-surface-500">Total Issues</p>
			</div>
		</Card>
		<Card class="flex items-center gap-4">
			<div class="p-3 rounded-xl bg-warning-500/10">
				<Clock size={24} class="text-warning-400" />
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-100">{$issues.filter(i => i.status === 'deliberation').length}</p>
				<p class="text-sm text-surface-500">In Deliberation</p>
			</div>
		</Card>
		<Card class="flex items-center gap-4">
			<div class="p-3 rounded-xl bg-eco-500/10">
				<CheckCircle size={24} class="text-eco-400" />
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-100">{$issues.filter(i => i.status === 'decided').length}</p>
				<p class="text-sm text-surface-500">Decided</p>
			</div>
		</Card>
		<Card class="flex items-center gap-4">
			<div class="p-3 rounded-xl bg-accent-500/10">
				<Users size={24} class="text-accent-400" />
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-100">{activeParticipants || $issues.length * 3}</p>
				<p class="text-sm text-surface-500">Active Participants</p>
			</div>
		</Card>
	</div>

	<!-- Tabs -->
	<Tabs {tabs} bind:activeTab class="mb-6" />

	<!-- Issues List -->
	<div class="space-y-4">
		{#if filteredIssues.length === 0}
			<EmptyState
				title="No issues found"
				description="Create a new issue to start a discussion"
				icon={VoteIcon}
			>
				<Button slot="action" variant="primary" on:click={() => showCreateModal = true}>
					<Plus size={16} />
					Create Issue
				</Button>
			</EmptyState>
		{:else}
			{#each filteredIssues as issue}
				<Card variant="hover" class="group cursor-pointer" on:click={() => handleViewDetails(issue)}>
					<div class="flex items-start justify-between">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-3 mb-2">
								<Badge variant={statusColors[issue.status] ?? 'info'}>
									{statusLabels[issue.status] ?? issue.status}
								</Badge>
								{#if issue.metadata?.priority === 'high'}
									<Badge variant="danger" size="sm">High Priority</Badge>
								{/if}
							</div>
							<h3 class="text-lg font-medium text-surface-100 group-hover:text-primary-400 transition-colors">
								{issue.title}
							</h3>
							<p class="text-sm text-surface-400 mt-1 line-clamp-2">
								{issue.description}
							</p>
							<div class="flex items-center gap-4 mt-3 text-sm text-surface-500">
								<span class="flex items-center gap-1">
									<MessageSquare size={14} />
									{issue.submissionCount} submissions
								</span>
								<span>Created {formatDate(issue.createdAt)}</span>
								{#if issue.metadata?.consensusScore}
									<span class="flex items-center gap-1 text-eco-400">
										<ThumbsUp size={14} />
										{(Number(issue.metadata.consensusScore) * 100).toFixed(0)}% consensus
									</span>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-2">
							<button class="btn btn-sm variant-ghost-surface" on:click|stopPropagation={() => handleViewDetails(issue)}>
								<Eye size={14} />
								View
							</button>
							<ChevronRight size={20} class="text-surface-600 group-hover:text-primary-400 transition-colors" />
						</div>
					</div>

					{#if issue.status === 'deliberation'}
						{@const issueScenarioCount = $scenarios.filter(s => s.issueId === issue.id).length}
						{@const issueVoteCount = $votes.filter(v => $scenarios.filter(s => s.issueId === issue.id).map(s => s.id).includes(v.scenarioId)).length}
						{@const consensusPercent = issueVoteCount > 0 ? Math.min(100, Math.round((issueVoteCount / 5) * 100)) : 0}
						<div class="mt-4 pt-4 border-t border-surface-800" on:click|stopPropagation>
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm text-surface-400">Consensus Progress ({issueScenarioCount} scenarios, {issueVoteCount} votes)</span>
								<span class="text-sm font-medium text-primary-400">{consensusPercent}%</span>
							</div>
							<ProgressBar value={consensusPercent} max={100} color="primary" />
							<div class="flex gap-2 mt-3">
								<button class="btn btn-sm variant-filled-success" on:click|stopPropagation={() => handleVote(issue, 'support')} disabled={votingIssueId === issue.id}>
									<ThumbsUp size={14} />
									Support
								</button>
								<button class="btn btn-sm variant-filled-secondary" on:click|stopPropagation={() => handleVote(issue, 'neutral')} disabled={votingIssueId === issue.id}>
									<Minus size={14} />
									Neutral
								</button>
								<button class="btn btn-sm variant-ghost-surface" on:click|stopPropagation={() => handleVote(issue, 'concern')} disabled={votingIssueId === issue.id}>
									<ThumbsDown size={14} />
									Concern
								</button>
							</div>
						</div>
					{/if}
				</Card>
			{/each}
		{/if}
	</div>
</PageContainer>

<!-- Create Issue Modal -->
<Modal bind:open={showCreateModal} title="Create New Issue" size="lg">
	<div class="space-y-4">
		<Input
			label="Title"
			placeholder="Brief, descriptive title for the issue"
			bind:value={newIssueTitle}
		/>
		<div>
			<label class="label">Description</label>
			<textarea
				class="input min-h-[120px] resize-y"
				placeholder="Describe the issue, provide context, and outline any initial proposals..."
				bind:value={newIssueDescription}
			></textarea>
		</div>
		<div>
			<label class="label">Category</label>
			<select class="input" bind:value={newIssueCategory}>
				<option value="governance">Governance</option>
				<option value="infrastructure">Infrastructure</option>
				<option value="policy">Policy</option>
				<option value="production">Production</option>
				<option value="other">Other</option>
			</select>
		</div>
		<div class="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 text-sm text-surface-300">
			<p><strong>Peer Process:</strong> Your issue will be reviewed by peers who can add proposals, objections, and evidence before a collective decision is made.</p>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCreateModal = false} disabled={isCreatingIssue}>Cancel</Button>
		<Button variant="primary" on:click={handleCreateIssue} loading={isCreatingIssue}>Create Issue</Button>
	</svelte:fragment>
</Modal>

<!-- Issue Details Modal -->
<Modal bind:open={showDetailsModal} title={selectedIssue?.title ?? 'Issue Details'} size="xl">
	{#if selectedIssue}
		<div class="space-y-6">
			<!-- Status & Actions -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Badge variant={statusColors[selectedIssue.status] ?? 'info'} size="lg">
						{statusLabels[selectedIssue.status] ?? selectedIssue.status}
					</Badge>
					<span class="text-sm text-surface-500">Created {formatDate(selectedIssue.createdAt)}</span>
				</div>
				{#if getNextStatus(selectedIssue.status)}
					{@const nextStatus = getNextStatus(selectedIssue.status)}
					<Button size="sm" variant="primary" on:click={() => nextStatus && handleAdvanceStatus(nextStatus)} loading={isAdvancingStatus}>
						<ArrowRight size={14} />
						{getStatusActionLabel(selectedIssue.status)}
					</Button>
				{/if}
			</div>

			<!-- Description -->
			<div>
				<h4 class="text-sm font-medium text-surface-400 mb-2">Description</h4>
				<p class="text-surface-200">{selectedIssue.description}</p>
			</div>

			{#if isLoadingDetails}
				<div class="p-8 text-center text-surface-400">Loading details...</div>
			{:else}
				<!-- Submissions Section -->
				<div>
					<div class="flex items-center justify-between mb-3">
						<h4 class="text-sm font-medium text-surface-400">Submissions ({issueSubmissions.length})</h4>
						<Button size="sm" variant="secondary" on:click={() => showAddSubmissionModal = true}>
							<Plus size={14} />
							Add Submission
						</Button>
					</div>
					{#if issueSubmissions.length === 0}
						<div class="p-4 rounded-lg bg-surface-800/50 text-center text-surface-500">
							No submissions yet. Add a proposal, objection, or evidence.
						</div>
					{:else}
						<div class="space-y-2 max-h-[200px] overflow-y-auto">
							{#each issueSubmissions as sub}
								<div class="p-3 rounded-lg bg-surface-800/50">
									<div class="flex items-center gap-2 mb-1">
										<Badge variant={sub.type === 'proposal' ? 'primary' : sub.type === 'objection' ? 'danger' : 'info'} size="sm">
											{sub.type}
										</Badge>
										<span class="text-xs text-surface-500">{sub.authorId} - {formatDate(sub.createdAt)}</span>
									</div>
									<p class="text-sm text-surface-300">{sub.content}</p>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Scenarios Section (Voting Options) -->
				<div>
					<div class="flex items-center justify-between mb-3">
						<h4 class="text-sm font-medium text-surface-400">Voting Scenarios ({issueScenarios.length})</h4>
						{#if selectedIssue.status === 'deliberation' || selectedIssue.status === 'context_ready'}
							<Button size="sm" variant="secondary" on:click={() => showCreateScenarioModal = true}>
								<Target size={14} />
								Create Scenario
							</Button>
						{/if}
					</div>
					{#if issueScenarios.length === 0}
						<div class="p-4 rounded-lg bg-surface-800/50 text-center text-surface-500">
							No voting scenarios yet. Create scenarios from proposals for peers to vote on.
						</div>
					{:else}
						<div class="space-y-3">
							{#each issueScenarios as scenario}
								{@const scenarioVotes = issueVotes.filter(v => v.scenarioId === scenario.id)}
								{@const consensus = calculateConsensus(scenarioVotes)}
								<div class="p-4 rounded-lg bg-surface-800/50 border {leadingScenario?.id === scenario.id && consensus.score >= 60 ? 'border-eco-500/50' : 'border-transparent'}">
									<div class="flex items-start justify-between mb-2">
										<div>
											<h5 class="font-medium text-surface-100">{scenario.label}</h5>
											{#if scenario.parameters?.description}
												<p class="text-sm text-surface-400 mt-1">{scenario.parameters.description}</p>
											{/if}
										</div>
										{#if consensus.score >= 60 && selectedIssue.status === 'deliberation'}
											<Badge variant="success" size="sm">
												<CheckCircle size={12} class="mr-1" />
												Ready
											</Badge>
										{/if}
									</div>

									<div class="mt-3">
										<div class="flex items-center justify-between mb-1 text-sm">
											<span class="text-surface-400">Consensus: {consensus.participation} votes</span>
											<span class="font-medium {consensus.score >= 60 ? 'text-eco-400' : 'text-surface-300'}">{consensus.score.toFixed(0)}%</span>
										</div>
										<ProgressBar
											value={consensus.score}
											max={100}
											color={consensus.score >= 60 ? 'success' : 'primary'}
										/>
									</div>

									{#if selectedIssue.status === 'deliberation'}
										<div class="flex items-center justify-between mt-3 pt-3 border-t border-surface-700">
											<div class="flex gap-1">
												<Button size="sm" variant="success" on:click={() => handleScenarioVote(scenario, 'support')}>
													<ThumbsUp size={12} />
												</Button>
												<Button size="sm" variant="secondary" on:click={() => handleScenarioVote(scenario, 'neutral')}>
													<Minus size={12} />
												</Button>
												<Button size="sm" variant="ghost" on:click={() => handleScenarioVote(scenario, 'concern')}>
													<ThumbsDown size={12} />
												</Button>
											</div>
											{#if consensus.score >= 60}
												<Button size="sm" variant="primary" on:click={() => handleMakeDecision(scenario)} loading={isMakingDecision}>
													<Gavel size={14} />
													Make Decision
												</Button>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Workflow Guide -->
				<div class="p-4 rounded-lg bg-surface-800/30 border border-surface-700">
					<h4 class="text-sm font-medium text-surface-300 mb-2">Decision Workflow</h4>
					<div class="flex items-center gap-2 text-xs text-surface-500">
						<span class="{selectedIssue.status === 'intake' ? 'text-primary-400 font-medium' : ''}">Intake</span>
						<ArrowRight size={12} />
						<span class="{selectedIssue.status === 'structured' ? 'text-primary-400 font-medium' : ''}">Structured</span>
						<ArrowRight size={12} />
						<span class="{selectedIssue.status === 'context_ready' ? 'text-primary-400 font-medium' : ''}">Context Ready</span>
						<ArrowRight size={12} />
						<span class="{selectedIssue.status === 'deliberation' ? 'text-primary-400 font-medium' : ''}">Deliberation</span>
						<ArrowRight size={12} />
						<span class="{selectedIssue.status === 'decided' ? 'text-eco-400 font-medium' : ''}">Decided</span>
						<ArrowRight size={12} />
						<span class="{selectedIssue.status === 'dispatched' ? 'text-eco-400 font-medium' : ''}">Dispatched</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showDetailsModal = false}>Close</Button>
	</svelte:fragment>
</Modal>

<!-- Add Submission Modal -->
<Modal bind:open={showAddSubmissionModal} title="Add Submission" size="md">
	<div class="space-y-4">
		<div>
			<label class="label">Type</label>
			<select class="input" bind:value={newSubmissionType}>
				<option value="proposal">Proposal - Suggest a solution</option>
				<option value="objection">Objection - Raise a concern</option>
				<option value="evidence">Evidence - Provide supporting information</option>
				<option value="comment">Comment - General discussion</option>
			</select>
		</div>
		<div>
			<label class="label">Content</label>
			<textarea
				class="input min-h-[120px] resize-y"
				placeholder="Enter your {newSubmissionType}..."
				bind:value={newSubmissionContent}
			></textarea>
		</div>
		<div class="p-3 rounded-lg bg-surface-800/50 text-sm text-surface-400">
			Your submission will be visible to all peers participating in this issue.
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showAddSubmissionModal = false} disabled={isAddingSubmission}>Cancel</Button>
		<Button variant="primary" on:click={handleAddSubmission} loading={isAddingSubmission}>
			<Send size={14} />
			Submit
		</Button>
	</svelte:fragment>
</Modal>

<!-- Create Scenario Modal -->
<Modal bind:open={showCreateScenarioModal} title="Create Voting Scenario" size="md">
	<div class="space-y-4">
		<Input
			label="Scenario Label"
			placeholder="e.g., Option A: Increase budget by 10%"
			bind:value={newScenarioLabel}
		/>
		<div>
			<label class="label">Description (optional)</label>
			<textarea
				class="input min-h-[80px] resize-y"
				placeholder="Provide additional details about this scenario..."
				bind:value={newScenarioDescription}
			></textarea>
		</div>
		<div class="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 text-sm text-surface-300">
			<p><strong>Tip:</strong> Create multiple scenarios to give peers different options to vote on. A decision can be made when a scenario reaches 60% consensus.</p>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCreateScenarioModal = false} disabled={isCreatingScenario}>Cancel</Button>
		<Button variant="primary" on:click={handleCreateScenario} loading={isCreatingScenario}>
			<Target size={14} />
			Create Scenario
		</Button>
	</svelte:fragment>
</Modal>
