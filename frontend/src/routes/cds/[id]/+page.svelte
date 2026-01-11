<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Header, PageContainer } from '$lib/components/layout';
	import {
		Card,
		Button,
		Badge,
		Tabs,
		Modal,
		Input,
		Alert,
		ProgressBar,
		EmptyState,
		StatusIndicator,
		Tooltip
	} from '$lib/components/ui';
	import { Textarea, Select, RadioGroup } from '$lib/components/forms';
	import { issues, selectedIssue } from '$lib/stores';
	import { cdsApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import type { Issue, Submission, Scenario, Vote } from '$lib/types';
	import {
		ArrowLeft,
		MessageSquare,
		Vote as VoteIcon,
		CheckCircle,
		Clock,
		AlertTriangle,
		Users,
		Plus,
		ThumbsUp,
		ThumbsDown,
		Minus,
		FileText,
		Shield,
		Lightbulb,
		Flag,
		Send,
		GitBranch,
		History,
		ChevronRight,
		AlertCircle,
		Scale,
		Gavel,
		RefreshCw,
		Eye,
		Trash2,
		Edit,
		ExternalLink,
		Rocket
	} from 'lucide-svelte';

	// Route params
	$: issueId = $page.params.id;

	// Issue data
	let issue: Issue | null = null;
	let submissions: Submission[] = [];
	let scenarios: Scenario[] = [];
	let votes: Record<string, Vote[]> = {};
	let auditTrail: any[] = [];
	let loading = true;
	let error: string | null = null;

	// UI State
	let activeTab = 'overview';
	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'submissions', label: 'Submissions', count: 0 },
		{ id: 'scenarios', label: 'Scenarios', count: 0 },
		{ id: 'voting', label: 'Voting' },
		{ id: 'audit', label: 'Audit Trail' }
	];

	// Modals
	let showAddSubmissionModal = false;
	let showCreateScenarioModal = false;
	let showVoteModal = false;
	let showAdvancePhaseModal = false;
	let showReviewModal = false;
	let showDispatchModal = false;

	// Submission form
	let submissionType: 'proposal' | 'objection' | 'evidence' | 'comment' | 'signal' = 'comment';
	let submissionContent = '';
	let submissionSeverity = 0.5;
	let submissionScope = 0.5;
	let isSubmitting = false;

	// Scenario form
	let scenarioLabel = '';
	let scenarioDescription = '';
	let scenarioRequiresOAD = false;
	let scenarioRequiresCOS = false;
	let scenarioAffectsITC = false;
	let isCreatingScenario = false;

	// Voting
	let selectedScenarioId = '';
	let voteLevel: 'strong_support' | 'support' | 'neutral' | 'concern' | 'block' = 'support';
	let voteRationale = '';
	let isVoting = false;

	// Phase advancement
	let advanceReason = '';
	let isAdvancing = false;

	// Review
	let reviewReason = '';
	let isRequestingReview = false;

	// Dispatch
	let dispatchNotes = '';
	let isDispatching = false;

	// Consensus calculation
	let consensusScore = 0;
	let objectionIndex = 0;
	let totalVotes = 0;
	let participantCount = 0;

	// Status flow
	const statusFlow = [
		{ status: 'intake', label: 'Intake', icon: FileText, description: 'Issue submitted and under initial review' },
		{ status: 'structured', label: 'Structured', icon: GitBranch, description: 'Issue categorized and framed' },
		{ status: 'context_ready', label: 'Context Ready', icon: Lightbulb, description: 'Evidence and context gathered' },
		{ status: 'deliberation', label: 'Deliberation', icon: Users, description: 'Open for voting and discussion' },
		{ status: 'decided', label: 'Decided', icon: Gavel, description: 'Consensus reached' },
		{ status: 'dispatched', label: 'Dispatched', icon: Rocket, description: 'Implementation in progress' }
	];

	const submissionTypes = [
		{ value: 'proposal', label: 'Proposal', description: 'Suggest a solution or approach' },
		{ value: 'objection', label: 'Objection', description: 'Raise a concern or blocking issue' },
		{ value: 'evidence', label: 'Evidence', description: 'Provide supporting information' },
		{ value: 'comment', label: 'Comment', description: 'General discussion contribution' },
		{ value: 'signal', label: 'Signal', description: 'Quick reaction or sentiment' }
	];

	const voteLevels = [
		{ value: 'strong_support', label: 'Strong Support', weight: 1.0, color: 'success' },
		{ value: 'support', label: 'Support', weight: 0.5, color: 'success' },
		{ value: 'neutral', label: 'Neutral', weight: 0.0, color: 'warning' },
		{ value: 'concern', label: 'Concern', weight: -0.5, color: 'danger' },
		{ value: 'block', label: 'Block', weight: -1.0, color: 'danger' }
	];

	// Load issue data
	onMount(async () => {
		await loadIssue();
	});

	async function loadIssue() {
		loading = true;
		error = null;

		try {
			// Try to get from API first
			const issueData = await cdsApi.getIssue(issueId);
			issue = issueData;

			// Load related data
			const [submissionsData, scenariosData] = await Promise.all([
				cdsApi.listSubmissions(issueId),
				cdsApi.listScenarios(issueId)
			]);

			submissions = submissionsData;
			scenarios = scenariosData;

			// Load votes for each scenario
			for (const scenario of scenarios) {
				const scenarioVotes = await cdsApi.getVotes(scenario.id);
				votes[scenario.id] = scenarioVotes;
			}

			// Calculate consensus
			calculateConsensus();

			// Update tab counts
			tabs[1].count = submissions.length;
			tabs[2].count = scenarios.length;

		} catch (err) {
			// Fallback to mock data for demo
			console.warn('API not available, using mock data');
			loadMockData();
		} finally {
			loading = false;
		}
	}

	function loadMockData() {
		issue = {
			id: issueId,
			title: 'Community Workshop Equipment Proposal',
			description: 'Proposal to acquire shared woodworking and metalworking equipment for the community workshop space. This includes a table saw, drill press, welding station, and associated safety equipment. The goal is to enable members to create and repair items locally, reducing dependency on external suppliers and building community skills.',
			nodeId: 'node_abc',
			status: 'deliberation',
			createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
			lastUpdatedAt: new Date(Date.now() - 3600000).toISOString(),
			submissionCount: 12,
			metadata: {
				category: 'infrastructure',
				priority: 'high',
				author: 'alice',
				stakeholders: ['workshop-committee', 'safety-team', 'finance-team'],
				constraints: ['Budget: 5000 ITC', 'Space: 50sqm available'],
				relatedIssues: ['issue_solar_panels', 'issue_tool_library']
			}
		};

		submissions = [
			{
				id: 'sub_1',
				issueId: issueId,
				authorId: 'alice',
				type: 'proposal',
				content: 'Initial proposal for workshop equipment purchase. Recommend starting with essential woodworking tools: table saw ($800), drill press ($400), and workbenches ($600).',
				createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
				metadata: {}
			},
			{
				id: 'sub_2',
				issueId: issueId,
				authorId: 'bob',
				type: 'evidence',
				content: 'Survey results: 78% of members expressed interest in woodworking, 45% in metalworking. Estimated monthly usage: 120 hours.',
				createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
				metadata: {}
			},
			{
				id: 'sub_3',
				issueId: issueId,
				authorId: 'charlie',
				type: 'objection',
				content: 'Safety concern: We need certified training before operating power tools. Suggest mandatory safety certification program.',
				createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
				metadata: { severity: 0.7, scope: 0.8 }
			},
			{
				id: 'sub_4',
				issueId: issueId,
				authorId: 'diana',
				type: 'comment',
				content: 'I support this proposal. Having local manufacturing capability aligns with our sustainability goals.',
				createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
				metadata: {}
			}
		];

		scenarios = [
			{
				id: 'scenario_1',
				issueId: issueId,
				label: 'Full Equipment Package',
				parameters: {
					budget: 5000,
					timeline: '3 months',
					cosTaskRequired: true,
					oadDesignRequired: false,
					description: 'Purchase complete woodworking and basic metalworking equipment set'
				},
				indicators: {
					memberSatisfaction: 0.85,
					costEfficiency: 0.7,
					safetyRisk: 0.3
				}
			},
			{
				id: 'scenario_2',
				issueId: issueId,
				label: 'Phased Rollout',
				parameters: {
					budget: 2500,
					timeline: '6 months',
					cosTaskRequired: true,
					oadDesignRequired: false,
					description: 'Start with woodworking, add metalworking in phase 2'
				},
				indicators: {
					memberSatisfaction: 0.7,
					costEfficiency: 0.85,
					safetyRisk: 0.2
				}
			},
			{
				id: 'scenario_3',
				issueId: issueId,
				label: 'Partner with Existing Workshop',
				parameters: {
					budget: 1000,
					timeline: '1 month',
					cosTaskRequired: false,
					oadDesignRequired: false,
					description: 'Negotiate access to nearby makerspace instead of building own'
				},
				indicators: {
					memberSatisfaction: 0.5,
					costEfficiency: 0.95,
					safetyRisk: 0.1
				}
			}
		];

		// Mock votes
		votes = {
			'scenario_1': [
				{ id: 'vote_1', scenarioId: 'scenario_1', participantId: 'alice', supportLevel: 'strong_support', weight: 1.0, rationale: 'This is the best long-term investment' },
				{ id: 'vote_2', scenarioId: 'scenario_1', participantId: 'bob', supportLevel: 'support', weight: 1.0, rationale: 'Good option but expensive' },
				{ id: 'vote_3', scenarioId: 'scenario_1', participantId: 'charlie', supportLevel: 'concern', weight: 1.0, rationale: 'Safety training must come first' },
				{ id: 'vote_4', scenarioId: 'scenario_1', participantId: 'diana', supportLevel: 'support', weight: 1.0, rationale: '' }
			],
			'scenario_2': [
				{ id: 'vote_5', scenarioId: 'scenario_2', participantId: 'alice', supportLevel: 'neutral', weight: 1.0, rationale: '' },
				{ id: 'vote_6', scenarioId: 'scenario_2', participantId: 'bob', supportLevel: 'strong_support', weight: 1.0, rationale: 'More cautious approach' },
				{ id: 'vote_7', scenarioId: 'scenario_2', participantId: 'charlie', supportLevel: 'support', weight: 1.0, rationale: 'Better for safety planning' }
			],
			'scenario_3': [
				{ id: 'vote_8', scenarioId: 'scenario_3', participantId: 'eve', supportLevel: 'support', weight: 1.0, rationale: 'Quick win' },
				{ id: 'vote_9', scenarioId: 'scenario_3', participantId: 'frank', supportLevel: 'concern', weight: 1.0, rationale: 'Not sustainable long-term' }
			]
		};

		// Mock audit trail
		auditTrail = [
			{ id: 'audit_1', timestamp: new Date(Date.now() - 86400000 * 3), type: 'issue_created', actor: 'alice', details: 'Issue created' },
			{ id: 'audit_2', timestamp: new Date(Date.now() - 86400000 * 2.5), type: 'submission_added', actor: 'alice', details: 'Initial proposal submitted' },
			{ id: 'audit_3', timestamp: new Date(Date.now() - 86400000 * 2), type: 'issue_structured', actor: 'system', details: 'Issue categorized as infrastructure' },
			{ id: 'audit_4', timestamp: new Date(Date.now() - 86400000 * 1.5), type: 'context_prepared', actor: 'bob', details: 'Survey evidence added' },
			{ id: 'audit_5', timestamp: new Date(Date.now() - 86400000 * 1), type: 'deliberation_opened', actor: 'system', details: 'Voting opened' },
			{ id: 'audit_6', timestamp: new Date(Date.now() - 3600000 * 12), type: 'scenario_created', actor: 'alice', details: 'Full Equipment Package scenario' },
			{ id: 'audit_7', timestamp: new Date(Date.now() - 3600000 * 10), type: 'scenario_created', actor: 'bob', details: 'Phased Rollout scenario' },
			{ id: 'audit_8', timestamp: new Date(Date.now() - 3600000 * 8), type: 'vote_cast', actor: 'alice', details: 'Voted on scenario_1' },
			{ id: 'audit_9', timestamp: new Date(Date.now() - 3600000 * 6), type: 'objection_added', actor: 'charlie', details: 'Safety concern raised' }
		];

		calculateConsensus();
		tabs[1].count = submissions.length;
		tabs[2].count = scenarios.length;
	}

	function calculateConsensus() {
		if (scenarios.length === 0) return;

		// Calculate for the leading scenario
		let bestScore = -2;
		let bestObjIndex = 1;

		for (const scenario of scenarios) {
			const scenarioVotes = votes[scenario.id] || [];
			if (scenarioVotes.length === 0) continue;

			let weightedSum = 0;
			let totalWeight = 0;

			for (const vote of scenarioVotes) {
				const support = voteLevels.find(v => v.value === vote.supportLevel)?.weight || 0;
				weightedSum += vote.weight * support;
				totalWeight += vote.weight;
			}

			const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
			if (score > bestScore) {
				bestScore = score;
				// Calculate objection index from submissions
				const objections = submissions.filter(s => s.type === 'objection');
				bestObjIndex = objections.reduce((sum, obj) => {
					const sev = (obj.metadata as any)?.severity || 0.5;
					const scope = (obj.metadata as any)?.scope || 0.5;
					return sum + (sev * scope);
				}, 0) / Math.max(scenarioVotes.length, 1);
			}

			totalVotes += scenarioVotes.length;
		}

		consensusScore = bestScore;
		objectionIndex = bestObjIndex;

		// Count unique participants
		const allVoters = new Set<string>();
		Object.values(votes).flat().forEach(v => allVoters.add(v.participantId));
		participantCount = allVoters.size;
	}

	function getStatusIndex(status: string): number {
		return statusFlow.findIndex(s => s.status === status);
	}

	function canAdvancePhase(): boolean {
		if (!issue) return false;
		const currentIndex = getStatusIndex(issue.status);
		if (currentIndex === -1 || currentIndex >= statusFlow.length - 1) return false;

		// Validation based on current phase
		switch (issue.status) {
			case 'intake':
				return true; // Can always structure
			case 'structured':
				return submissions.filter(s => s.type === 'evidence').length > 0;
			case 'context_ready':
				return scenarios.length > 0;
			case 'deliberation':
				// Need sufficient votes and consensus
				return consensusScore >= 0.4 && totalVotes >= 3;
			case 'decided':
				return true; // Can dispatch
			default:
				return false;
		}
	}

	function getNextPhase(): string {
		if (!issue) return '';
		const currentIndex = getStatusIndex(issue.status);
		if (currentIndex === -1 || currentIndex >= statusFlow.length - 1) return '';
		return statusFlow[currentIndex + 1].label;
	}

	function getConsensusDirective(): 'approve' | 'revise' | 'escalate' {
		if (consensusScore >= 0.6 && objectionIndex <= 0.3) return 'approve';
		if (consensusScore >= 0.4) return 'revise';
		return 'escalate';
	}

	async function handleAddSubmission() {
		if (!submissionContent.trim()) {
			toasts.error('Required', 'Content is required');
			return;
		}

		isSubmitting = true;
		try {
			const metadata: Record<string, any> = {};
			if (submissionType === 'objection') {
				metadata.severity = submissionSeverity;
				metadata.scope = submissionScope;
			}

			const submission = await cdsApi.addSubmission(issueId, {
				authorId: 'current_user',
				type: submissionType,
				content: submissionContent,
				metadata
			});

			submissions = [...submissions, submission];
			tabs[1].count = submissions.length;

			toasts.success('Submission Added', `Your ${submissionType} has been recorded`);
			showAddSubmissionModal = false;
			submissionContent = '';
			submissionType = 'comment';
		} catch (err) {
			// Demo mode - add locally
			const newSubmission: Submission = {
				id: `sub_${Date.now()}`,
				issueId,
				authorId: 'current_user',
				type: submissionType,
				content: submissionContent,
				createdAt: new Date().toISOString(),
				metadata: submissionType === 'objection' ? { severity: submissionSeverity, scope: submissionScope } : {}
			};
			submissions = [...submissions, newSubmission];
			tabs[1].count = submissions.length;
			calculateConsensus();

			toasts.success('Submission Added', `Your ${submissionType} has been recorded`);
			showAddSubmissionModal = false;
			submissionContent = '';
			submissionType = 'comment';
		} finally {
			isSubmitting = false;
		}
	}

	async function handleCreateScenario() {
		if (!scenarioLabel.trim()) {
			toasts.error('Required', 'Scenario label is required');
			return;
		}

		isCreatingScenario = true;
		try {
			const scenario = await cdsApi.createScenario(issueId, {
				label: scenarioLabel,
				parameters: {
					description: scenarioDescription,
					oadDesignRequired: scenarioRequiresOAD,
					cosTaskRequired: scenarioRequiresCOS,
					itcPolicyChange: scenarioAffectsITC ? {} : null
				},
				indicators: {}
			});

			scenarios = [...scenarios, scenario];
			votes[scenario.id] = [];
			tabs[2].count = scenarios.length;

			toasts.success('Scenario Created', `"${scenarioLabel}" is now available for voting`);
			showCreateScenarioModal = false;
			scenarioLabel = '';
			scenarioDescription = '';
		} catch (err) {
			// Demo mode
			const newScenario: Scenario = {
				id: `scenario_${Date.now()}`,
				issueId,
				label: scenarioLabel,
				parameters: {
					description: scenarioDescription,
					oadDesignRequired: scenarioRequiresOAD,
					cosTaskRequired: scenarioRequiresCOS,
					itcPolicyChange: scenarioAffectsITC ? {} : null
				},
				indicators: {}
			};
			scenarios = [...scenarios, newScenario];
			votes[newScenario.id] = [];
			tabs[2].count = scenarios.length;

			toasts.success('Scenario Created', `"${scenarioLabel}" is now available for voting`);
			showCreateScenarioModal = false;
			scenarioLabel = '';
			scenarioDescription = '';
		} finally {
			isCreatingScenario = false;
		}
	}

	async function handleVote() {
		if (!selectedScenarioId) {
			toasts.error('Required', 'Please select a scenario');
			return;
		}

		isVoting = true;
		try {
			await cdsApi.castVote(selectedScenarioId, {
				participantId: 'current_user',
				supportLevel: voteLevel,
				rationale: voteRationale
			});

			// Update local votes
			const newVote: Vote = {
				id: `vote_${Date.now()}`,
				scenarioId: selectedScenarioId,
				participantId: 'current_user',
				supportLevel: voteLevel,
				weight: 1.0,
				rationale: voteRationale
			};

			// Remove any existing vote from this user on this scenario
			votes[selectedScenarioId] = (votes[selectedScenarioId] || []).filter(v => v.participantId !== 'current_user');
			votes[selectedScenarioId] = [...votes[selectedScenarioId], newVote];
			votes = votes; // Trigger reactivity

			calculateConsensus();

			toasts.success('Vote Recorded', `Your ${voteLevel.replace('_', ' ')} vote has been cast`);
			showVoteModal = false;
			voteRationale = '';
		} catch (err) {
			toasts.error('Vote Failed', 'Could not record your vote');
		} finally {
			isVoting = false;
		}
	}

	async function handleAdvancePhase() {
		if (!issue) return;

		isAdvancing = true;
		try {
			const currentIndex = getStatusIndex(issue.status);
			const nextStatus = statusFlow[currentIndex + 1].status;

			// Call appropriate API based on transition
			switch (issue.status) {
				case 'intake':
					await cdsApi.structureIssue(issueId, {
						categories: [issue.metadata.category as string],
						stakeholders: issue.metadata.stakeholders as string[] || [],
						constraints: issue.metadata.constraints as string[] || []
					});
					break;
				case 'structured':
					await cdsApi.prepareContext(issueId, {
						evidence: submissions.filter(s => s.type === 'evidence').map(s => s.content),
						precedents: [],
						constraints: issue.metadata.constraints as string[] || []
					});
					break;
				case 'context_ready':
					await cdsApi.openDeliberation(issueId);
					break;
				case 'deliberation':
					const directive = getConsensusDirective();
					if (directive === 'approve' && scenarios.length > 0) {
						// Find winning scenario
						let bestScenario = scenarios[0];
						let bestScore = -2;
						for (const s of scenarios) {
							const sVotes = votes[s.id] || [];
							const score = sVotes.reduce((sum, v) => {
								const w = voteLevels.find(l => l.value === v.supportLevel)?.weight || 0;
								return sum + w;
							}, 0) / Math.max(sVotes.length, 1);
							if (score > bestScore) {
								bestScore = score;
								bestScenario = s;
							}
						}
						await cdsApi.makeDecision(issueId, bestScenario.id, {
							directive: 'approve',
							consensusScore,
							objectionIndex
						});
					}
					break;
				case 'decided':
					// Dispatch to other subsystems
					break;
			}

			// Update local state
			issue = { ...issue, status: nextStatus as any };
			toasts.success('Phase Advanced', `Issue moved to ${getNextPhase()}`);
			showAdvancePhaseModal = false;
			advanceReason = '';
		} catch (err) {
			// Demo mode - update locally
			const currentIndex = getStatusIndex(issue!.status);
			const nextStatus = statusFlow[currentIndex + 1].status;
			issue = { ...issue!, status: nextStatus as any };
			toasts.success('Phase Advanced', `Issue moved to ${statusFlow[currentIndex + 1].label}`);
			showAdvancePhaseModal = false;
		} finally {
			isAdvancing = false;
		}
	}

	async function handleRequestReview() {
		if (!reviewReason.trim()) {
			toasts.error('Required', 'Please provide a reason for the review request');
			return;
		}

		isRequestingReview = true;
		try {
			await cdsApi.requestReview(issue!.id, 'current_user', reviewReason);
			issue = { ...issue!, status: 'under_review' as any };
			toasts.success('Review Requested', 'The decision will be reviewed');
			showReviewModal = false;
			reviewReason = '';
		} catch (err) {
			// Demo mode
			issue = { ...issue!, status: 'under_review' as any };
			toasts.success('Review Requested', 'The decision will be reviewed');
			showReviewModal = false;
		} finally {
			isRequestingReview = false;
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatTimeAgo(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ago`;
		if (hours > 0) return `${hours}h ago`;
		return 'Just now';
	}

	function getSubmissionIcon(type: string) {
		switch (type) {
			case 'proposal': return Lightbulb;
			case 'objection': return AlertTriangle;
			case 'evidence': return FileText;
			case 'signal': return Flag;
			default: return MessageSquare;
		}
	}

	function getSubmissionColor(type: string): string {
		switch (type) {
			case 'proposal': return 'text-primary-400';
			case 'objection': return 'text-red-400';
			case 'evidence': return 'text-blue-400';
			case 'signal': return 'text-yellow-400';
			default: return 'text-surface-400';
		}
	}
</script>

<Header
	title={issue?.title || 'Loading...'}
	subtitle="Collaborative Decision System"
/>

<PageContainer>
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
		</div>
	{:else if error}
		<Alert type="error" title="Error Loading Issue">
			{error}
		</Alert>
	{:else if issue}
		<!-- Back Navigation -->
		<div class="mb-6">
			<Button variant="ghost" on:click={() => goto('/cds')}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Back to Issues
			</Button>
		</div>

		<!-- Status Progress -->
		<Card class="mb-6">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-white">Issue Progress</h3>
				{#if canAdvancePhase()}
					<Button variant="primary" size="sm" on:click={() => showAdvancePhaseModal = true}>
						Advance to {getNextPhase()}
						<ChevronRight class="w-4 h-4 ml-1" />
					</Button>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				{#each statusFlow as phase, i}
					{@const currentIndex = getStatusIndex(issue.status)}
					{@const isComplete = i < currentIndex}
					{@const isCurrent = i === currentIndex}
					{@const isPending = i > currentIndex}
					<div class="flex-1">
						<Tooltip content={phase.description}>
							<div
								class="p-3 rounded-lg border transition-all cursor-help
									{isComplete ? 'bg-eco-500/10 border-eco-500/30' :
									isCurrent ? 'bg-primary-500/20 border-primary-500' :
									'bg-surface-800/50 border-surface-700'}"
							>
								<div class="flex items-center gap-2">
									<svelte:component
										this={phase.icon}
										class="w-5 h-5 {isComplete ? 'text-eco-400' : isCurrent ? 'text-primary-400' : 'text-surface-500'}"
									/>
									<span class="text-sm font-medium {isComplete ? 'text-eco-400' : isCurrent ? 'text-white' : 'text-surface-500'}">
										{phase.label}
									</span>
								</div>
							</div>
						</Tooltip>
					</div>
					{#if i < statusFlow.length - 1}
						<div class="w-8 h-0.5 {i < currentIndex ? 'bg-eco-500' : 'bg-surface-700'}"></div>
					{/if}
				{/each}
			</div>
		</Card>

		<!-- Main Content Grid -->
		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Main Panel -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Tabs -->
				<Tabs {tabs} bind:activeTab />

				<!-- Overview Tab -->
				{#if activeTab === 'overview'}
					<Card>
						<div class="space-y-6">
							<div>
								<div class="flex items-center gap-3 mb-4">
									<Badge variant={issue.status === 'decided' || issue.status === 'dispatched' ? 'success' : issue.status === 'deliberation' ? 'primary' : 'info'}>
										{statusFlow.find(s => s.status === issue.status)?.label || issue.status}
									</Badge>
									{#if issue.metadata.priority === 'high'}
										<Badge variant="danger">High Priority</Badge>
									{/if}
									<Badge variant="info">{issue.metadata.category}</Badge>
								</div>
								<p class="text-surface-300 leading-relaxed">{issue.description}</p>
							</div>

							{#if issue.metadata.constraints}
								<div>
									<h4 class="text-sm font-medium text-surface-400 mb-2">Constraints</h4>
									<div class="flex flex-wrap gap-2">
										{#each issue.metadata.constraints as constraint}
											<Badge variant="warning" size="sm">{constraint}</Badge>
										{/each}
									</div>
								</div>
							{/if}

							{#if issue.metadata.stakeholders}
								<div>
									<h4 class="text-sm font-medium text-surface-400 mb-2">Stakeholders</h4>
									<div class="flex flex-wrap gap-2">
										{#each issue.metadata.stakeholders as stakeholder}
											<Badge size="sm">{stakeholder}</Badge>
										{/each}
									</div>
								</div>
							{/if}

							<div class="grid grid-cols-2 gap-4 pt-4 border-t border-surface-700">
								<div>
									<span class="text-sm text-surface-500">Created</span>
									<p class="text-surface-200">{formatDate(issue.createdAt)}</p>
								</div>
								<div>
									<span class="text-sm text-surface-500">Last Updated</span>
									<p class="text-surface-200">{formatDate(issue.lastUpdatedAt)}</p>
								</div>
							</div>
						</div>
					</Card>

					<!-- Quick Actions -->
					<Card>
						<h3 class="text-lg font-semibold text-white mb-4">Actions</h3>
						<div class="flex flex-wrap gap-3">
							<Button variant="secondary" on:click={() => showAddSubmissionModal = true}>
								<Plus class="w-4 h-4 mr-2" />
								Add Submission
							</Button>
							{#if issue.status === 'deliberation' || issue.status === 'context_ready'}
								<Button variant="secondary" on:click={() => showCreateScenarioModal = true}>
									<GitBranch class="w-4 h-4 mr-2" />
									Create Scenario
								</Button>
							{/if}
							{#if issue.status === 'deliberation' && scenarios.length > 0}
								<Button variant="primary" on:click={() => showVoteModal = true}>
									<VoteIcon class="w-4 h-4 mr-2" />
									Cast Vote
								</Button>
							{/if}
							{#if issue.status === 'decided'}
								<Button variant="ghost" on:click={() => showReviewModal = true}>
									<RefreshCw class="w-4 h-4 mr-2" />
									Request Review
								</Button>
							{/if}
						</div>
					</Card>
				{/if}

				<!-- Submissions Tab -->
				{#if activeTab === 'submissions'}
					<div class="flex justify-between items-center mb-4">
						<h3 class="text-lg font-semibold text-white">Submissions ({submissions.length})</h3>
						<Button variant="primary" size="sm" on:click={() => showAddSubmissionModal = true}>
							<Plus class="w-4 h-4 mr-1" />
							Add
						</Button>
					</div>

					{#if submissions.length === 0}
						<EmptyState
							title="No submissions yet"
							description="Be the first to add a proposal, comment, or evidence"
						>
							<Button slot="action" variant="primary" on:click={() => showAddSubmissionModal = true}>
								Add Submission
							</Button>
						</EmptyState>
					{:else}
						<div class="space-y-4">
							{#each submissions as sub}
								<Card variant="hover">
									<div class="flex items-start gap-4">
										<div class="p-2 rounded-lg bg-surface-800">
											<svelte:component this={getSubmissionIcon(sub.type)} class="w-5 h-5 {getSubmissionColor(sub.type)}" />
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2 mb-2">
												<Badge variant={sub.type === 'objection' ? 'danger' : sub.type === 'proposal' ? 'primary' : 'info'} size="sm">
													{sub.type}
												</Badge>
												<span class="text-sm text-surface-500">by {sub.authorId}</span>
												<span class="text-sm text-surface-600">{formatTimeAgo(sub.createdAt)}</span>
											</div>
											<p class="text-surface-300">{sub.content}</p>
											{#if sub.type === 'objection' && sub.metadata}
												{@const severity = sub.metadata['severity'] ?? 0.5}
												{@const scope = sub.metadata['scope'] ?? 0.5}
												<div class="flex gap-4 mt-2 text-sm">
													<span class="text-surface-500">
														Severity: <span class="text-red-400">{(Number(severity) * 100).toFixed(0)}%</span>
													</span>
													<span class="text-surface-500">
														Scope: <span class="text-yellow-400">{(Number(scope) * 100).toFixed(0)}%</span>
													</span>
												</div>
											{/if}
										</div>
									</div>
								</Card>
							{/each}
						</div>
					{/if}
				{/if}

				<!-- Scenarios Tab -->
				{#if activeTab === 'scenarios'}
					<div class="flex justify-between items-center mb-4">
						<h3 class="text-lg font-semibold text-white">Scenarios ({scenarios.length})</h3>
						{#if issue.status === 'deliberation' || issue.status === 'context_ready'}
							<Button variant="primary" size="sm" on:click={() => showCreateScenarioModal = true}>
								<Plus class="w-4 h-4 mr-1" />
								Create
							</Button>
						{/if}
					</div>

					{#if scenarios.length === 0}
						<EmptyState
							title="No scenarios yet"
							description="Create decision scenarios for voting"
						>
							<Button slot="action" variant="primary" on:click={() => showCreateScenarioModal = true}>
								Create Scenario
							</Button>
						</EmptyState>
					{:else}
						<div class="space-y-4">
							{#each scenarios as scenario}
								{@const scenarioVotes = votes[scenario.id] || []}
								{@const voteScore = scenarioVotes.length > 0
									? scenarioVotes.reduce((sum, v) => sum + (voteLevels.find(l => l.value === v.supportLevel)?.weight || 0), 0) / scenarioVotes.length
									: 0}
								<Card variant="hover">
									<div class="flex items-start justify-between mb-4">
										<div>
											<h4 class="text-lg font-medium text-white">{scenario.label}</h4>
											{#if scenario.parameters?.description}
												<p class="text-sm text-surface-400 mt-1">{scenario.parameters.description}</p>
											{/if}
										</div>
										<div class="text-right">
											<div class="text-2xl font-bold {voteScore >= 0.5 ? 'text-eco-400' : voteScore >= 0 ? 'text-yellow-400' : 'text-red-400'}">
												{(voteScore * 100).toFixed(0)}%
											</div>
											<div class="text-sm text-surface-500">{scenarioVotes.length} votes</div>
										</div>
									</div>

									<ProgressBar
										value={(voteScore + 1) * 50}
										max={100}
										color={voteScore >= 0.5 ? 'success' : voteScore >= 0 ? 'warning' : 'danger'}
									/>

									<div class="flex flex-wrap gap-2 mt-4">
										{#if scenario.parameters?.cosTaskRequired}
											<Badge variant="info" size="sm">Requires COS</Badge>
										{/if}
										{#if scenario.parameters?.oadDesignRequired}
											<Badge variant="info" size="sm">Requires OAD</Badge>
										{/if}
										{#if scenario.parameters?.itcPolicyChange}
											<Badge variant="warning" size="sm">Affects ITC</Badge>
										{/if}
									</div>

									{#if issue.status === 'deliberation'}
										<div class="flex gap-2 mt-4 pt-4 border-t border-surface-700">
											<Button size="sm" variant="success" on:click={() => { selectedScenarioId = scenario.id; voteLevel = 'support'; showVoteModal = true; }}>
												<ThumbsUp class="w-3 h-3 mr-1" />
												Support
											</Button>
											<Button size="sm" variant="ghost" on:click={() => { selectedScenarioId = scenario.id; voteLevel = 'concern'; showVoteModal = true; }}>
												<ThumbsDown class="w-3 h-3 mr-1" />
												Concern
											</Button>
										</div>
									{/if}
								</Card>
							{/each}
						</div>
					{/if}
				{/if}

				<!-- Voting Tab -->
				{#if activeTab === 'voting'}
					<Card>
						<h3 class="text-lg font-semibold text-white mb-6">Voting Summary</h3>

						<div class="grid grid-cols-3 gap-4 mb-6">
							<div class="text-center p-4 bg-surface-800 rounded-lg">
								<div class="text-3xl font-bold text-primary-400">{totalVotes}</div>
								<div class="text-sm text-surface-500">Total Votes</div>
							</div>
							<div class="text-center p-4 bg-surface-800 rounded-lg">
								<div class="text-3xl font-bold text-eco-400">{participantCount}</div>
								<div class="text-sm text-surface-500">Participants</div>
							</div>
							<div class="text-center p-4 bg-surface-800 rounded-lg">
								<div class="text-3xl font-bold {consensusScore >= 0.6 ? 'text-eco-400' : consensusScore >= 0.4 ? 'text-yellow-400' : 'text-red-400'}">
									{(consensusScore * 100).toFixed(0)}%
								</div>
								<div class="text-sm text-surface-500">Consensus</div>
							</div>
						</div>

						<div class="space-y-4">
							<div>
								<div class="flex justify-between text-sm mb-2">
									<span class="text-surface-400">Consensus Score</span>
									<span class="text-white">{(consensusScore * 100).toFixed(1)}% (threshold: 60%)</span>
								</div>
								<ProgressBar value={(consensusScore + 1) * 50} max={100} color={consensusScore >= 0.6 ? 'success' : 'warning'} />
							</div>

							<div>
								<div class="flex justify-between text-sm mb-2">
									<span class="text-surface-400">Objection Index</span>
									<span class="text-white">{(objectionIndex * 100).toFixed(1)}% (threshold: 30%)</span>
								</div>
								<ProgressBar value={objectionIndex * 100} max={100} color={objectionIndex <= 0.3 ? 'success' : 'danger'} />
							</div>
						</div>

						{#if issue.status === 'deliberation'}
							<div class="mt-6 p-4 rounded-lg border {getConsensusDirective() === 'approve' ? 'bg-eco-500/10 border-eco-500/30' : getConsensusDirective() === 'revise' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}">
								<div class="flex items-center gap-3">
									{#if getConsensusDirective() === 'approve'}
										<CheckCircle class="w-6 h-6 text-eco-400" />
										<div>
											<p class="font-medium text-eco-400">Ready for Approval</p>
											<p class="text-sm text-surface-400">Consensus threshold met, objection index within limits</p>
										</div>
									{:else if getConsensusDirective() === 'revise'}
										<AlertTriangle class="w-6 h-6 text-yellow-400" />
										<div>
											<p class="font-medium text-yellow-400">Needs Revision</p>
											<p class="text-sm text-surface-400">Address objections before approval</p>
										</div>
									{:else}
										<AlertCircle class="w-6 h-6 text-red-400" />
										<div>
											<p class="font-medium text-red-400">Requires Escalation</p>
											<p class="text-sm text-surface-400">Human deliberation needed</p>
										</div>
									{/if}
								</div>
							</div>
						{/if}

						{#if issue.status === 'deliberation' && scenarios.length > 0}
							<div class="mt-6">
								<Button variant="primary" on:click={() => showVoteModal = true}>
									<VoteIcon class="w-4 h-4 mr-2" />
									Cast Your Vote
								</Button>
							</div>
						{/if}
					</Card>
				{/if}

				<!-- Audit Trail Tab -->
				{#if activeTab === 'audit'}
					<Card>
						<h3 class="text-lg font-semibold text-white mb-4">Audit Trail</h3>
						<div class="space-y-4">
							{#each auditTrail.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) as entry}
								<div class="flex items-start gap-4 p-3 bg-surface-800 rounded-lg">
									<div class="p-2 rounded bg-surface-700">
										<History class="w-4 h-4 text-surface-400" />
									</div>
									<div class="flex-1">
										<div class="flex items-center gap-2">
											<Badge size="sm">{entry.type.replace('_', ' ')}</Badge>
											<span class="text-sm text-surface-500">by {entry.actor}</span>
										</div>
										<p class="text-sm text-surface-300 mt-1">{entry.details}</p>
									</div>
									<span class="text-xs text-surface-500">{formatTimeAgo(entry.timestamp)}</span>
								</div>
							{/each}
						</div>
					</Card>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Consensus Widget -->
				<Card>
					<h3 class="text-sm font-medium text-surface-400 mb-4">Consensus Status</h3>
					<div class="text-center">
						<div class="text-4xl font-bold {consensusScore >= 0.6 ? 'text-eco-400' : consensusScore >= 0.4 ? 'text-yellow-400' : 'text-red-400'}">
							{(consensusScore * 100).toFixed(0)}%
						</div>
						<p class="text-sm text-surface-500 mt-1">
							{consensusScore >= 0.6 ? 'Consensus Reached' : consensusScore >= 0.4 ? 'Building Consensus' : 'Needs Discussion'}
						</p>
					</div>
					<div class="mt-4 space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-surface-500">Votes</span>
							<span class="text-white">{totalVotes}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-surface-500">Participants</span>
							<span class="text-white">{participantCount}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-surface-500">Scenarios</span>
							<span class="text-white">{scenarios.length}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-surface-500">Objections</span>
							<span class="text-white">{submissions.filter(s => s.type === 'objection').length}</span>
						</div>
					</div>
				</Card>

				<!-- Decision Rules Info -->
				<Card>
					<h3 class="text-sm font-medium text-surface-400 mb-4">Decision Rules</h3>
					<div class="space-y-3 text-sm">
						<div class="flex items-start gap-2">
							<CheckCircle class="w-4 h-4 text-eco-400 mt-0.5" />
							<div>
								<p class="text-surface-300">Approve if:</p>
								<p class="text-surface-500">Consensus ≥ 60%, Objections ≤ 30%</p>
							</div>
						</div>
						<div class="flex items-start gap-2">
							<AlertTriangle class="w-4 h-4 text-yellow-400 mt-0.5" />
							<div>
								<p class="text-surface-300">Revise if:</p>
								<p class="text-surface-500">Consensus ≥ 40%, Objections > 30%</p>
							</div>
						</div>
						<div class="flex items-start gap-2">
							<AlertCircle class="w-4 h-4 text-red-400 mt-0.5" />
							<div>
								<p class="text-surface-300">Escalate if:</p>
								<p class="text-surface-500">Consensus &lt; 40%</p>
							</div>
						</div>
					</div>
				</Card>

				<!-- Recent Activity -->
				<Card>
					<h3 class="text-sm font-medium text-surface-400 mb-4">Recent Activity</h3>
					<div class="space-y-3">
						{#each auditTrail.slice(0, 5) as entry}
							<div class="flex items-center gap-3 text-sm">
								<div class="w-2 h-2 rounded-full bg-primary-500"></div>
								<span class="text-surface-300 flex-1 truncate">{entry.details}</span>
								<span class="text-surface-500">{formatTimeAgo(entry.timestamp)}</span>
							</div>
						{/each}
					</div>
				</Card>
			</div>
		</div>
	{/if}
</PageContainer>

<!-- Add Submission Modal -->
<Modal bind:open={showAddSubmissionModal} title="Add Submission" size="lg">
	<div class="space-y-4">
		<div>
			<label class="label">Submission Type</label>
			<div class="grid grid-cols-2 gap-2 mt-2">
				{#each submissionTypes as type}
					<button
						class="p-3 rounded-lg border text-left transition-all
							{submissionType === type.value ? 'bg-primary-500/20 border-primary-500' : 'bg-surface-800 border-surface-700 hover:border-surface-600'}"
						on:click={() => submissionType = type.value}
					>
						<p class="font-medium {submissionType === type.value ? 'text-white' : 'text-surface-300'}">{type.label}</p>
						<p class="text-xs text-surface-500">{type.description}</p>
					</button>
				{/each}
			</div>
		</div>

		<Textarea
			bind:value={submissionContent}
			placeholder="Enter your {submissionType}..."
			rows={4}
		/>

		{#if submissionType === 'objection'}
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label">Severity ({(submissionSeverity * 100).toFixed(0)}%)</label>
					<input
						type="range"
						min="0"
						max="1"
						step="0.1"
						bind:value={submissionSeverity}
						class="w-full mt-2"
					/>
					<p class="text-xs text-surface-500 mt-1">How serious is this concern?</p>
				</div>
				<div>
					<label class="label">Scope ({(submissionScope * 100).toFixed(0)}%)</label>
					<input
						type="range"
						min="0"
						max="1"
						step="0.1"
						bind:value={submissionScope}
						class="w-full mt-2"
					/>
					<p class="text-xs text-surface-500 mt-1">How broadly does it affect the proposal?</p>
				</div>
			</div>
		{/if}
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showAddSubmissionModal = false}>Cancel</Button>
		<Button variant="primary" on:click={handleAddSubmission} loading={isSubmitting}>
			<Send class="w-4 h-4 mr-2" />
			Submit
		</Button>
	</svelte:fragment>
</Modal>

<!-- Create Scenario Modal -->
<Modal bind:open={showCreateScenarioModal} title="Create Scenario" size="lg">
	<div class="space-y-4">
		<Input
			label="Scenario Label"
			placeholder="Brief name for this option"
			bind:value={scenarioLabel}
		/>

		<Textarea
			bind:value={scenarioDescription}
			placeholder="Describe this scenario..."
			rows={3}
		/>

		<div class="space-y-3">
			<label class="label">Subsystem Requirements</label>
			<label class="flex items-center gap-3">
				<input type="checkbox" bind:checked={scenarioRequiresCOS} class="rounded" />
				<span class="text-surface-300">Requires COS (Production Planning)</span>
			</label>
			<label class="flex items-center gap-3">
				<input type="checkbox" bind:checked={scenarioRequiresOAD} class="rounded" />
				<span class="text-surface-300">Requires OAD (Design Review)</span>
			</label>
			<label class="flex items-center gap-3">
				<input type="checkbox" bind:checked={scenarioAffectsITC} class="rounded" />
				<span class="text-surface-300">Affects ITC (Time Credit Policy)</span>
			</label>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCreateScenarioModal = false}>Cancel</Button>
		<Button variant="primary" on:click={handleCreateScenario} loading={isCreatingScenario}>
			<GitBranch class="w-4 h-4 mr-2" />
			Create Scenario
		</Button>
	</svelte:fragment>
</Modal>

<!-- Vote Modal -->
<Modal bind:open={showVoteModal} title="Cast Your Vote" size="md">
	<div class="space-y-4">
		{#if scenarios.length > 0}
			<div>
				<label class="label">Select Scenario</label>
				<select class="input mt-2" bind:value={selectedScenarioId}>
					<option value="">Choose a scenario...</option>
					{#each scenarios as scenario}
						<option value={scenario.id}>{scenario.label}</option>
					{/each}
				</select>
			</div>
		{/if}

		<div>
			<label class="label">Your Position</label>
			<div class="grid grid-cols-5 gap-2 mt-2">
				{#each voteLevels as level}
					<button
						class="p-2 rounded-lg border text-center transition-all
							{voteLevel === level.value ? 'bg-primary-500/20 border-primary-500' : 'bg-surface-800 border-surface-700 hover:border-surface-600'}"
						on:click={() => voteLevel = level.value}
					>
						<p class="text-xs font-medium {voteLevel === level.value ? 'text-white' : 'text-surface-400'}">
							{level.label}
						</p>
					</button>
				{/each}
			</div>
		</div>

		<Textarea
			bind:value={voteRationale}
			placeholder="Optional: Explain your reasoning..."
			rows={2}
		/>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showVoteModal = false}>Cancel</Button>
		<Button variant="primary" on:click={handleVote} loading={isVoting} disabled={!selectedScenarioId}>
			<VoteIcon class="w-4 h-4 mr-2" />
			Submit Vote
		</Button>
	</svelte:fragment>
</Modal>

<!-- Advance Phase Modal -->
<Modal bind:open={showAdvancePhaseModal} title="Advance to {getNextPhase()}" size="md">
	<div class="space-y-4">
		<Alert type="info">
			You are about to move this issue from <strong>{issue?.status}</strong> to <strong>{getNextPhase()}</strong>.
		</Alert>

		<Textarea
			bind:value={advanceReason}
			placeholder="Optional: Add notes about this transition..."
			rows={2}
		/>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showAdvancePhaseModal = false}>Cancel</Button>
		<Button variant="primary" on:click={handleAdvancePhase} loading={isAdvancing}>
			<ChevronRight class="w-4 h-4 mr-2" />
			Advance Phase
		</Button>
	</svelte:fragment>
</Modal>

<!-- Request Review Modal -->
<Modal bind:open={showReviewModal} title="Request Review" size="md">
	<div class="space-y-4">
		<Alert type="warning">
			Requesting a review will create a new issue to evaluate this decision.
		</Alert>

		<Textarea
			bind:value={reviewReason}
			placeholder="Explain why this decision should be reviewed..."
			rows={3}
		/>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showReviewModal = false}>Cancel</Button>
		<Button variant="primary" on:click={handleRequestReview} loading={isRequestingReview}>
			<RefreshCw class="w-4 h-4 mr-2" />
			Submit Review Request
		</Button>
	</svelte:fragment>
</Modal>
