<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, Modal, Input, EmptyState, ProgressBar } from '$lib/components/ui';
	import { issues, selectedIssue } from '$lib/stores';
	import { cdsApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import type { Issue, Scenario } from '$lib/types';
	import {
		Plus,
		MessageSquare,
		Vote,
		CheckCircle,
		Clock,
		AlertTriangle,
		Users,
		ChevronRight,
		ThumbsUp,
		ThumbsDown,
		Minus,
		FileText,
		Eye
	} from 'lucide-svelte';

	let activeTab = 'all';
	let showCreateModal = false;
	let newIssueTitle = '';
	let newIssueDescription = '';
	let newIssueCategory = 'governance';
	let isCreatingIssue = false;
	let votingIssueId: string | null = null;
	let votingLevel: string | null = null;

	const tabs = [
		{ id: 'all', label: 'All Issues', count: 0 },
		{ id: 'intake', label: 'Intake', count: 0 },
		{ id: 'deliberation', label: 'Deliberation', count: 0 },
		{ id: 'decided', label: 'Decided', count: 0 }
	];

	// Mock data
	onMount(() => {
		issues.set([
			{
				id: 'issue_1',
				title: 'Community Workshop Equipment Proposal',
				description: 'Proposal to acquire shared woodworking and metalworking equipment for the community workshop space.',
				nodeId: 'node_abc',
				status: 'deliberation',
				createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
				lastUpdatedAt: new Date(Date.now() - 3600000).toISOString(),
				submissionCount: 12,
				metadata: { category: 'infrastructure', priority: 'high' }
			},
			{
				id: 'issue_2',
				title: 'ITC Decay Rate Adjustment',
				description: 'Review and potential adjustment of the current ITC decay parameters based on community feedback.',
				nodeId: 'node_abc',
				status: 'context_ready',
				createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
				lastUpdatedAt: new Date(Date.now() - 86400000).toISOString(),
				submissionCount: 28,
				metadata: { category: 'policy', priority: 'medium' }
			},
			{
				id: 'issue_3',
				title: 'Solar Panel Installation Schedule',
				description: 'Coordinating the installation timeline for the approved solar panel system.',
				nodeId: 'node_abc',
				status: 'decided',
				createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
				lastUpdatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
				submissionCount: 45,
				metadata: { category: 'infrastructure', priority: 'high', consensusScore: 0.87 }
			},
			{
				id: 'issue_4',
				title: 'New Member Onboarding Process',
				description: 'Improving the onboarding experience for new cooperative members.',
				nodeId: 'node_abc',
				status: 'intake',
				createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
				lastUpdatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
				submissionCount: 3,
				metadata: { category: 'governance', priority: 'low' }
			}
		]);
	});

	$: filteredIssues = activeTab === 'all'
		? $issues
		: $issues.filter(i => i.status === activeTab);

	$: {
		tabs[0].count = $issues.length;
		tabs[1].count = $issues.filter(i => i.status === 'intake' || i.status === 'structured' || i.status === 'context_ready').length;
		tabs[2].count = $issues.filter(i => i.status === 'deliberation').length;
		tabs[3].count = $issues.filter(i => i.status === 'decided' || i.status === 'dispatched').length;
	}

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
			toasts.success('Issue Created', `"${issue.title}" has been submitted`);
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

	function viewIssue(issue: Issue) {
		selectedIssue.set(issue);
		goto(`/cds/${issue.id}`);
	}

	async function handleVote(issue: Issue, supportLevel: 'support' | 'neutral' | 'concern') {
		votingIssueId = issue.id;
		votingLevel = supportLevel;

		try {
			const scenarios = await cdsApi.listScenarios(issue.id);
			if (scenarios.length === 0) {
				toasts.warning('No Scenarios', 'This issue has no scenarios to vote on yet');
				return;
			}

			await cdsApi.castVote(scenarios[0].id, {
				participantId: 'current_user',
				supportLevel: supportLevel
			});

			toasts.success('Vote Cast', `Your ${supportLevel} vote has been recorded`);
		} catch (error) {
			toasts.error('Failed to Vote', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			votingIssueId = null;
			votingLevel = null;
		}
	}
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
				<p class="text-2xl font-bold text-surface-100">24</p>
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
				icon={Vote}
			>
				<Button slot="action" variant="primary" on:click={() => showCreateModal = true}>
					<Plus size={16} />
					Create Issue
				</Button>
			</EmptyState>
		{:else}
			{#each filteredIssues as issue}
				<Card variant="hover" class="group cursor-pointer" on:click={() => viewIssue(issue)}>
					<div class="flex items-start justify-between">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-3 mb-2">
								<Badge variant={statusColors[issue.status] ?? 'info'}>
									{statusLabels[issue.status] ?? issue.status}
								</Badge>
								{#if issue.metadata.priority === 'high'}
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
								{#if issue.metadata.consensusScore}
									<span class="flex items-center gap-1 text-eco-400">
										<ThumbsUp size={14} />
										{(issue.metadata.consensusScore * 100).toFixed(0)}% consensus
									</span>
								{/if}
							</div>
						</div>
						<ChevronRight size={20} class="text-surface-600 group-hover:text-primary-400 transition-colors" />
					</div>

					{#if issue.status === 'deliberation'}
						<div class="mt-4 pt-4 border-t border-surface-800">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm text-surface-400">Consensus Progress</span>
								<span class="text-sm font-medium text-primary-400">78%</span>
							</div>
							<ProgressBar value={78} max={100} color="primary" />
							<div class="flex gap-2 mt-3">
								<Button size="sm" variant="success" on:click={() => handleVote(issue, 'support')} loading={votingIssueId === issue.id && votingLevel === 'support'}>
									<ThumbsUp size={14} />
									Support
								</Button>
								<Button size="sm" variant="secondary" on:click={() => handleVote(issue, 'neutral')} loading={votingIssueId === issue.id && votingLevel === 'neutral'}>
									<Minus size={14} />
									Neutral
								</Button>
								<Button size="sm" variant="ghost" on:click={() => handleVote(issue, 'concern')} loading={votingIssueId === issue.id && votingLevel === 'concern'}>
									<ThumbsDown size={14} />
									Concern
								</Button>
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
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCreateModal = false} disabled={isCreatingIssue}>Cancel</Button>
		<Button variant="primary" on:click={handleCreateIssue} loading={isCreatingIssue}>Create Issue</Button>
	</svelte:fragment>
</Modal>
