<script lang="ts">
	import { Header } from '$lib/components/layout';
	import {
		Button,
		Card,
		Input,
		Modal,
		Badge,
		Alert,
		ProgressBar,
		StatCard,
		Tabs,
		EmptyState,
		StatusIndicator,
		Tooltip
	} from '$lib/components/ui';
	import {
		FormField,
		Select,
		Textarea,
		Checkbox,
		RadioGroup
	} from '$lib/components/forms';
	import { LineChart, DonutChart } from '$lib/components/charts';
	import { toasts } from '$lib/stores/toast';
	import {
		Vote,
		Lightbulb,
		Clock,
		Factory,
		Activity,
		Users,
		CheckCircle,
		ArrowRight,
		Zap,
		Target,
		Trophy,
		Sparkles,
		Play,
		Pause,
		RotateCcw,
		ChevronRight
	} from 'lucide-svelte';

	// Journey state
	type JourneyPhase = 'intro' | 'cds' | 'oad' | 'itc' | 'cos' | 'frs' | 'complete';
	let currentPhase: JourneyPhase = 'intro';
	let currentStep = 0;
	let journeyStarted = false;
	let isAutoPlaying = false;
	let autoPlayInterval: ReturnType<typeof setInterval> | null = null;

	// CDS - Collaborative Decision System data
	let issueTitle = '';
	let issueDescription = '';
	let selectedScenario = '';
	let userVote = 0;
	let cdsComplete = false;

	// OAD - Open Access Design data
	let designName = '';
	let designVersion = '1.0.0';
	let ecoScore = 0;
	let designCertified = false;
	let oadComplete = false;

	// ITC - Integral Time Credits data
	let laborHours = 4;
	let laborType = '';
	let skillTier = '';
	let calculatedCredits = 0;
	let itcComplete = false;

	// COS - Cooperative Organization System data
	let planName = '';
	let taskCount = 3;
	let resourcesAllocated = false;
	let cosComplete = false;

	// FRS - Feedback & Review System data
	let diagnosticRun = false;
	let healthScore = 0;
	let recommendations: string[] = [];
	let frsComplete = false;

	// Stats tracking
	let journeyStats = {
		decisionsParticipated: 0,
		designsReviewed: 0,
		creditsEarned: 0,
		tasksCompleted: 0,
		issuesResolved: 0
	};

	// Phase configuration
	const phases: Array<{ id: JourneyPhase; label: string; icon: typeof Sparkles; color: string }> = [
		{ id: 'intro', label: 'Introduction', icon: Sparkles, color: 'primary' },
		{ id: 'cds', label: 'Decisions', icon: Vote, color: 'emerald' },
		{ id: 'oad', label: 'Designs', icon: Lightbulb, color: 'amber' },
		{ id: 'itc', label: 'Time Credits', icon: Clock, color: 'blue' },
		{ id: 'cos', label: 'Production', icon: Factory, color: 'purple' },
		{ id: 'frs', label: 'Feedback', icon: Activity, color: 'rose' },
		{ id: 'complete', label: 'Complete', icon: Trophy, color: 'primary' }
	];

	const scenarioOptions = [
		{ value: 'approve', label: 'Approve Proposal', description: 'Accept the community proposal' },
		{ value: 'modify', label: 'Modify Proposal', description: 'Suggest changes before approval' },
		{ value: 'defer', label: 'Defer Decision', description: 'Gather more information' }
	];

	const laborTypeOptions = [
		{ value: 'development', label: 'Software Development' },
		{ value: 'design', label: 'Design Work' },
		{ value: 'maintenance', label: 'Maintenance' },
		{ value: 'community', label: 'Community Work' }
	];

	const skillTierOptions = [
		{ value: 'basic', label: 'Basic (1.0x)', description: 'Entry-level work' },
		{ value: 'intermediate', label: 'Intermediate (1.5x)', description: 'Skilled contribution' },
		{ value: 'expert', label: 'Expert (2.0x)', description: 'Specialized expertise' }
	];

	// Chart data
	$: progressChartData = {
		labels: ['CDS', 'OAD', 'ITC', 'COS', 'FRS'],
		values: [
			cdsComplete ? 100 : 0,
			oadComplete ? 100 : 0,
			itcComplete ? 100 : 0,
			cosComplete ? 100 : 0,
			frsComplete ? 100 : 0
		]
	};

	$: creditHistoryData = {
		labels: ['Start', 'CDS', 'OAD', 'ITC', 'COS', 'FRS'],
		values: [0, cdsComplete ? 10 : 0, oadComplete ? 25 : 0, calculatedCredits || 0, cosComplete ? calculatedCredits + 15 : 0, frsComplete ? calculatedCredits + 25 : 0]
	};

	// Functions
	function startJourney() {
		journeyStarted = true;
		currentPhase = 'cds';
		currentStep = 0;
		toasts.success('Journey Started!', 'Let\'s explore the INTEGRAL system together.');
	}

	function resetJourney() {
		stopAutoPlay();
		journeyStarted = false;
		currentPhase = 'intro';
		currentStep = 0;
		cdsComplete = false;
		oadComplete = false;
		itcComplete = false;
		cosComplete = false;
		frsComplete = false;
		issueTitle = '';
		issueDescription = '';
		selectedScenario = '';
		userVote = 0;
		designName = '';
		ecoScore = 0;
		designCertified = false;
		laborHours = 4;
		laborType = '';
		skillTier = '';
		calculatedCredits = 0;
		planName = '';
		resourcesAllocated = false;
		diagnosticRun = false;
		healthScore = 0;
		recommendations = [];
		journeyStats = {
			decisionsParticipated: 0,
			designsReviewed: 0,
			creditsEarned: 0,
			tasksCompleted: 0,
			issuesResolved: 0
		};
		toasts.info('Journey Reset', 'Ready to start fresh!');
	}

	function toggleAutoPlay() {
		if (isAutoPlaying) {
			stopAutoPlay();
		} else {
			startAutoPlay();
		}
	}

	function startAutoPlay() {
		isAutoPlaying = true;
		autoPlayInterval = setInterval(() => {
			advanceJourney();
		}, 3000);
		toasts.info('Auto-play Started', 'The journey will advance automatically.');
	}

	function stopAutoPlay() {
		isAutoPlaying = false;
		if (autoPlayInterval) {
			clearInterval(autoPlayInterval);
			autoPlayInterval = null;
		}
	}

	function advanceJourney() {
		switch (currentPhase) {
			case 'intro':
				startJourney();
				break;
			case 'cds':
				if (!issueTitle) {
					issueTitle = 'Community Solar Panel Initiative';
					issueDescription = 'Proposal to install solar panels on community buildings';
				} else if (!selectedScenario) {
					selectedScenario = 'approve';
				} else if (userVote === 0) {
					userVote = 85;
					journeyStats.decisionsParticipated++;
				} else {
					completeCDS();
				}
				break;
			case 'oad':
				if (!designName) {
					designName = 'Solar Panel Mount v2';
				} else if (ecoScore === 0) {
					calculateEcoScore();
				} else if (!designCertified) {
					certifyDesign();
				} else {
					completeOAD();
				}
				break;
			case 'itc':
				if (!laborType) {
					laborType = 'development';
				} else if (!skillTier) {
					skillTier = 'intermediate';
				} else if (calculatedCredits === 0) {
					calculateCredits();
				} else {
					completeITC();
				}
				break;
			case 'cos':
				if (!planName) {
					planName = 'Solar Installation Phase 1';
				} else if (!resourcesAllocated) {
					allocateResources();
				} else {
					completeCOS();
				}
				break;
			case 'frs':
				if (!diagnosticRun) {
					runDiagnostics();
				} else {
					completeFRS();
				}
				break;
			case 'complete':
				stopAutoPlay();
				break;
		}
	}

	function completeCDS() {
		cdsComplete = true;
		journeyStats.decisionsParticipated++;
		currentPhase = 'oad';
		toasts.success('CDS Complete!', 'You participated in the decision-making process.');
	}

	function calculateEcoScore() {
		ecoScore = Math.floor(Math.random() * 30) + 10; // 10-40 score (lower is better)
		journeyStats.designsReviewed++;
		toasts.info('Eco Score Calculated', `Score: ${ecoScore} (lower is better)`);
	}

	function certifyDesign() {
		designCertified = true;
		toasts.success('Design Certified!', 'The design meets ecological standards.');
	}

	function completeOAD() {
		oadComplete = true;
		currentPhase = 'itc';
		toasts.success('OAD Complete!', 'Design reviewed and certified.');
	}

	function calculateCredits() {
		const multiplier = skillTier === 'basic' ? 1 : skillTier === 'intermediate' ? 1.5 : 2;
		calculatedCredits = Math.round(laborHours * multiplier * 10);
		journeyStats.creditsEarned = calculatedCredits;
	}

	function completeITC() {
		itcComplete = true;
		currentPhase = 'cos';
		toasts.success('ITC Complete!', `You earned ${calculatedCredits} time credits.`);
	}

	function allocateResources() {
		resourcesAllocated = true;
		journeyStats.tasksCompleted = taskCount;
		toasts.info('Resources Allocated', 'Production plan resources ready.');
	}

	function completeCOS() {
		cosComplete = true;
		currentPhase = 'frs';
		toasts.success('COS Complete!', 'Production plan created and scheduled.');
	}

	function runDiagnostics() {
		diagnosticRun = true;
		healthScore = Math.floor(Math.random() * 15) + 85; // 85-100%
		recommendations = [
			'Consider increasing labor verification frequency',
			'Design eco-scores trending positively',
			'Production efficiency above target'
		];
		journeyStats.issuesResolved = recommendations.length;
		toasts.info('Diagnostics Complete', `System health: ${healthScore}%`);
	}

	function completeFRS() {
		frsComplete = true;
		currentPhase = 'complete';
		stopAutoPlay();
		toasts.success('Journey Complete!', 'You\'ve explored all INTEGRAL subsystems!');
	}

	function getPhaseIndex(phase: JourneyPhase): number {
		return phases.findIndex(p => p.id === phase);
	}

	function goToPhase(phase: JourneyPhase) {
		if (phase === 'intro' || phase === 'complete') return;
		currentPhase = phase;
	}

	$: completedPhases = [cdsComplete, oadComplete, itcComplete, cosComplete, frsComplete].filter(Boolean).length;
	$: overallProgress = (completedPhases / 5) * 100;
</script>

<Header
	title="INTEGRAL User Journey"
	subtitle="Experience the complete cooperative economic system workflow"
/>

<div class="p-6 space-y-6">
	<!-- Progress Overview -->
	<Card variant="gradient" padding="lg">
		<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
			<div>
				<h2 class="text-xl font-bold text-white mb-2">System Exploration Journey</h2>
				<p class="text-surface-400">
					Walk through all five subsystems of INTEGRAL to understand how they work together
					in a cooperative economic system.
				</p>
			</div>
			<div class="flex gap-3">
				{#if !journeyStarted}
					<Button variant="primary" size="lg" on:click={startJourney}>
						<Play class="w-5 h-5 mr-2" />
						Start Journey
					</Button>
				{:else}
					<Button variant="secondary" on:click={toggleAutoPlay}>
						{#if isAutoPlaying}
							<Pause class="w-4 h-4 mr-2" />
							Pause
						{:else}
							<Play class="w-4 h-4 mr-2" />
							Auto-play
						{/if}
					</Button>
					<Button variant="ghost" on:click={resetJourney}>
						<RotateCcw class="w-4 h-4 mr-2" />
						Reset
					</Button>
				{/if}
			</div>
		</div>

		{#if journeyStarted}
			<div class="mt-6">
				<div class="flex justify-between text-sm text-surface-400 mb-2">
					<span>Overall Progress</span>
					<span>{completedPhases}/5 Subsystems Complete</span>
				</div>
				<ProgressBar value={overallProgress} max={100} color="primary" size="lg" />
			</div>
		{/if}
	</Card>

	<!-- Phase Navigation -->
	{#if journeyStarted}
		<div class="flex flex-wrap gap-2">
			{#each phases as phase, i}
				{@const isActive = currentPhase === phase.id}
				{@const isCompleted = phase.id === 'cds' ? cdsComplete : phase.id === 'oad' ? oadComplete : phase.id === 'itc' ? itcComplete : phase.id === 'cos' ? cosComplete : phase.id === 'frs' ? frsComplete : phase.id === 'complete' && completedPhases === 5}
				{@const isAccessible = phase.id !== 'intro'}
				<button
					class="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
						{isActive ? 'bg-primary-500/20 border-primary-500 text-white' :
						isCompleted ? 'bg-eco-500/10 border-eco-500/30 text-eco-400' :
						'bg-surface-800/50 border-surface-700 text-surface-400 hover:border-surface-600'}"
					on:click={() => goToPhase(phase.id)}
					disabled={!isAccessible}
				>
					{#if isCompleted && phase.id !== 'complete'}
						<CheckCircle class="w-4 h-4 text-eco-400" />
					{:else}
						<svelte:component this={phase.icon} class="w-4 h-4" />
					{/if}
					<span>{phase.label}</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Main Content Area -->
	<div class="grid gap-6 lg:grid-cols-3">
		<div class="lg:col-span-2 space-y-6">
			<!-- Introduction Phase -->
			{#if currentPhase === 'intro'}
				<Card>
					<div class="text-center py-8">
						<div class="inline-flex p-4 rounded-2xl bg-primary-500/20 mb-6">
							<Sparkles class="w-12 h-12 text-primary-400" />
						</div>
						<h3 class="text-2xl font-bold text-white mb-4">Welcome to the INTEGRAL Journey</h3>
						<p class="text-surface-400 max-w-xl mx-auto mb-8">
							INTEGRAL is a federated, post-monetary cooperative economic system. You'll explore
							five interconnected subsystems that work together to enable democratic governance,
							sustainable design, fair labor accounting, efficient production, and continuous improvement.
						</p>
						<div class="grid grid-cols-5 gap-4 max-w-2xl mx-auto mb-8">
							{#each phases.slice(1, 6) as phase}
								<Tooltip content={phase.label}>
									<div class="p-3 rounded-xl bg-surface-800 border border-surface-700">
										<svelte:component this={phase.icon} class="w-6 h-6 mx-auto text-surface-400" />
									</div>
								</Tooltip>
							{/each}
						</div>
						<Button variant="primary" size="lg" on:click={startJourney}>
							Begin Journey
							<ArrowRight class="w-5 h-5 ml-2" />
						</Button>
					</div>
				</Card>
			{/if}

			<!-- CDS Phase -->
			{#if currentPhase === 'cds'}
				<Card>
					<div class="flex items-center gap-3 mb-6">
						<div class="p-2 rounded-lg bg-emerald-500/20">
							<Vote class="w-6 h-6 text-emerald-400" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-white">Collaborative Decision System</h3>
							<p class="text-sm text-surface-400">Participate in democratic governance</p>
						</div>
					</div>

					<div class="space-y-6">
						{#if !issueTitle}
							<div class="space-y-4">
								<Alert type="info">
									Create or review an issue for community decision-making.
								</Alert>
								<Input
									label="Issue Title"
									placeholder="Enter a proposal or issue..."
									bind:value={issueTitle}
								/>
								<Textarea
									bind:value={issueDescription}
									placeholder="Describe the issue or proposal..."
									rows={3}
								/>
								<Button variant="primary" on:click={() => issueTitle = issueTitle || 'Community Initiative'}>
									Submit Issue
								</Button>
							</div>
						{:else if !selectedScenario}
							<div class="space-y-4">
								<Alert type="success" title={issueTitle}>
									{issueDescription || 'This issue is now open for voting.'}
								</Alert>
								<h4 class="font-medium text-white">Select Your Position</h4>
								<RadioGroup
									bind:value={selectedScenario}
									options={scenarioOptions}
									name="scenario"
								/>
								<Button variant="primary" disabled={!selectedScenario} on:click={() => {}}>
									Confirm Position
								</Button>
							</div>
						{:else if userVote === 0}
							<div class="space-y-4">
								<Alert type="info">
									Cast your weighted vote. Your influence is based on your stake and reputation.
								</Alert>
								<div class="p-4 bg-surface-800 rounded-lg">
									<div class="flex justify-between items-center mb-4">
										<span class="text-surface-400">Your Vote Weight</span>
										<Badge variant="primary">{userVote || 0}%</Badge>
									</div>
									<input
										type="range"
										min="0"
										max="100"
										bind:value={userVote}
										class="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer"
									/>
								</div>
								<Button variant="primary" disabled={userVote === 0} on:click={() => journeyStats.decisionsParticipated++}>
									Submit Vote
								</Button>
							</div>
						{:else}
							<div class="space-y-4">
								<Alert type="success" title="Vote Submitted!">
									Your vote of {userVote}% weight has been recorded.
								</Alert>
								<div class="p-4 bg-surface-800 rounded-lg">
									<h4 class="font-medium text-white mb-3">Voting Results</h4>
									<ProgressBar value={75} max={100} color="success" showLabel>
										Community Consensus
									</ProgressBar>
								</div>
								<Button variant="primary" on:click={completeCDS}>
									Continue to Design Phase
									<ChevronRight class="w-4 h-4 ml-2" />
								</Button>
							</div>
						{/if}
					</div>
				</Card>
			{/if}

			<!-- OAD Phase -->
			{#if currentPhase === 'oad'}
				<Card>
					<div class="flex items-center gap-3 mb-6">
						<div class="p-2 rounded-lg bg-amber-500/20">
							<Lightbulb class="w-6 h-6 text-amber-400" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-white">Open Access Design</h3>
							<p class="text-sm text-surface-400">Create and certify sustainable designs</p>
						</div>
					</div>

					<div class="space-y-6">
						{#if !designName}
							<div class="space-y-4">
								<Alert type="info">
									Submit a new design or review an existing one.
								</Alert>
								<Input
									label="Design Name"
									placeholder="Enter design name..."
									bind:value={designName}
								/>
								<div class="flex gap-4">
									<Input
										label="Version"
										bind:value={designVersion}
										disabled
									/>
								</div>
								<Button variant="primary" on:click={() => designName = designName || 'Sustainable Design v1'}>
									Submit Design
								</Button>
							</div>
						{:else if ecoScore === 0}
							<div class="space-y-4">
								<Alert type="success" title={designName}>
									Design submitted. Running ecological assessment...
								</Alert>
								<Button variant="primary" on:click={calculateEcoScore}>
									<Zap class="w-4 h-4 mr-2" />
									Calculate Eco Score
								</Button>
							</div>
						{:else if !designCertified}
							<div class="space-y-4">
								<Alert type="info" title="Ecological Assessment Complete">
									Eco Score: {ecoScore} (lower is better)
								</Alert>
								<div class="p-4 bg-surface-800 rounded-lg">
									<ProgressBar value={100 - ecoScore} max={100} color={ecoScore < 30 ? 'success' : ecoScore < 50 ? 'warning' : 'danger'} showLabel>
										Sustainability Rating
									</ProgressBar>
								</div>
								<Button variant="success" on:click={certifyDesign}>
									<CheckCircle class="w-4 h-4 mr-2" />
									Certify Design
								</Button>
							</div>
						{:else}
							<div class="space-y-4">
								<Alert type="success" title="Design Certified!">
									{designName} has been certified for production.
								</Alert>
								<div class="flex gap-4">
									<StatCard
										title="Eco Score"
										value={ecoScore}
										subtitle="Lower is better"
										color="success"
									/>
									<StatCard
										title="Status"
										value="Certified"
										subtitle={designVersion}
										color="primary"
									/>
								</div>
								<Button variant="primary" on:click={completeOAD}>
									Continue to Time Credits
									<ChevronRight class="w-4 h-4 ml-2" />
								</Button>
							</div>
						{/if}
					</div>
				</Card>
			{/if}

			<!-- ITC Phase -->
			{#if currentPhase === 'itc'}
				<Card>
					<div class="flex items-center gap-3 mb-6">
						<div class="p-2 rounded-lg bg-blue-500/20">
							<Clock class="w-6 h-6 text-blue-400" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-white">Integral Time Credits</h3>
							<p class="text-sm text-surface-400">Log labor and earn credits</p>
						</div>
					</div>

					<div class="space-y-6">
						{#if !laborType}
							<div class="space-y-4">
								<Alert type="info">
									Log your labor contribution to earn time credits.
								</Alert>
								<div>
									<label class="text-sm text-surface-400 mb-2 block">Hours Worked</label>
									<input
										type="range"
										min="1"
										max="8"
										bind:value={laborHours}
										class="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer"
									/>
									<div class="text-center text-white font-bold mt-2">{laborHours} hours</div>
								</div>
								<Select
									bind:value={laborType}
									options={laborTypeOptions}
									placeholder="Select labor type"
								/>
							</div>
						{:else if !skillTier}
							<div class="space-y-4">
								<Alert type="info">
									Select your skill tier for this work.
								</Alert>
								<RadioGroup
									bind:value={skillTier}
									options={skillTierOptions}
									name="skill"
								/>
								<Button variant="primary" disabled={!skillTier} on:click={calculateCredits}>
									Calculate Credits
								</Button>
							</div>
						{:else if calculatedCredits === 0}
							<div class="space-y-4">
								<Alert type="info">
									Calculating your time credits...
								</Alert>
								<Button variant="primary" on:click={calculateCredits}>
									Calculate Now
								</Button>
							</div>
						{:else}
							<div class="space-y-4">
								<Alert type="success" title="Credits Calculated!">
									You earned {calculatedCredits} ITC for {laborHours} hours of {laborType} work.
								</Alert>
								<div class="grid grid-cols-3 gap-4">
									<StatCard
										title="Hours"
										value={laborHours}
										color="primary"
									/>
									<StatCard
										title="Multiplier"
										value={skillTier === 'basic' ? '1.0x' : skillTier === 'intermediate' ? '1.5x' : '2.0x'}
										color="warning"
									/>
									<StatCard
										title="Credits"
										value={calculatedCredits}
										subtitle="ITC"
										color="success"
									/>
								</div>
								<Button variant="primary" on:click={completeITC}>
									Continue to Production
									<ChevronRight class="w-4 h-4 ml-2" />
								</Button>
							</div>
						{/if}
					</div>
				</Card>
			{/if}

			<!-- COS Phase -->
			{#if currentPhase === 'cos'}
				<Card>
					<div class="flex items-center gap-3 mb-6">
						<div class="p-2 rounded-lg bg-purple-500/20">
							<Factory class="w-6 h-6 text-purple-400" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-white">Cooperative Organization System</h3>
							<p class="text-sm text-surface-400">Plan and coordinate production</p>
						</div>
					</div>

					<div class="space-y-6">
						{#if !planName}
							<div class="space-y-4">
								<Alert type="info">
									Create a production plan for your certified design.
								</Alert>
								<Input
									label="Plan Name"
									placeholder="Enter production plan name..."
									bind:value={planName}
								/>
								<div>
									<label class="text-sm text-surface-400 mb-2 block">Number of Tasks</label>
									<input
										type="range"
										min="1"
										max="10"
										bind:value={taskCount}
										class="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer"
									/>
									<div class="text-center text-white font-bold mt-2">{taskCount} tasks</div>
								</div>
								<Button variant="primary" on:click={() => planName = planName || 'Production Plan'}>
									Create Plan
								</Button>
							</div>
						{:else if !resourcesAllocated}
							<div class="space-y-4">
								<Alert type="success" title={planName}>
									Plan created with {taskCount} tasks. Allocating resources...
								</Alert>
								<div class="space-y-2">
									{#each Array(taskCount) as _, i}
										<div class="p-3 bg-surface-800 rounded-lg flex items-center justify-between">
											<span class="text-surface-300">Task {i + 1}</span>
											<Badge variant="info">Pending</Badge>
										</div>
									{/each}
								</div>
								<Button variant="primary" on:click={allocateResources}>
									<Target class="w-4 h-4 mr-2" />
									Allocate Resources
								</Button>
							</div>
						{:else}
							<div class="space-y-4">
								<Alert type="success" title="Resources Allocated!">
									All {taskCount} tasks have been scheduled and assigned.
								</Alert>
								<div class="space-y-2">
									{#each Array(taskCount) as _, i}
										<div class="p-3 bg-surface-800 rounded-lg flex items-center justify-between">
											<span class="text-surface-300">Task {i + 1}</span>
											<Badge variant="success">Assigned</Badge>
										</div>
									{/each}
								</div>
								<Button variant="primary" on:click={completeCOS}>
									Continue to Feedback
									<ChevronRight class="w-4 h-4 ml-2" />
								</Button>
							</div>
						{/if}
					</div>
				</Card>
			{/if}

			<!-- FRS Phase -->
			{#if currentPhase === 'frs'}
				<Card>
					<div class="flex items-center gap-3 mb-6">
						<div class="p-2 rounded-lg bg-rose-500/20">
							<Activity class="w-6 h-6 text-rose-400" />
						</div>
						<div>
							<h3 class="text-lg font-semibold text-white">Feedback & Review System</h3>
							<p class="text-sm text-surface-400">Monitor and optimize the system</p>
						</div>
					</div>

					<div class="space-y-6">
						{#if !diagnosticRun}
							<div class="space-y-4">
								<Alert type="info">
									Run system diagnostics to check health and get recommendations.
								</Alert>
								<Button variant="primary" on:click={runDiagnostics}>
									<Activity class="w-4 h-4 mr-2" />
									Run Diagnostics
								</Button>
							</div>
						{:else}
							<div class="space-y-4">
								<Alert type="success" title="Diagnostics Complete">
									System health score: {healthScore}%
								</Alert>
								<div class="p-4 bg-surface-800 rounded-lg">
									<ProgressBar value={healthScore} max={100} color={healthScore >= 90 ? 'success' : healthScore >= 70 ? 'warning' : 'danger'} showLabel>
										System Health
									</ProgressBar>
								</div>
								<div class="space-y-2">
									<h4 class="font-medium text-white">Recommendations</h4>
									{#each recommendations as rec}
										<div class="p-3 bg-surface-800 rounded-lg flex items-start gap-3">
											<CheckCircle class="w-5 h-5 text-eco-400 flex-shrink-0 mt-0.5" />
											<span class="text-surface-300 text-sm">{rec}</span>
										</div>
									{/each}
								</div>
								<Button variant="primary" on:click={completeFRS}>
									Complete Journey
									<Trophy class="w-4 h-4 ml-2" />
								</Button>
							</div>
						{/if}
					</div>
				</Card>
			{/if}

			<!-- Complete Phase -->
			{#if currentPhase === 'complete'}
				<Card variant="gradient" padding="lg">
					<div class="text-center py-8">
						<div class="inline-flex p-4 rounded-2xl bg-primary-500/20 mb-6">
							<Trophy class="w-12 h-12 text-primary-400" />
						</div>
						<h3 class="text-2xl font-bold text-white mb-4">Journey Complete!</h3>
						<p class="text-surface-400 max-w-xl mx-auto mb-8">
							Congratulations! You've successfully explored all five subsystems of INTEGRAL.
							You now understand how democratic decisions, sustainable designs, fair labor credits,
							efficient production, and continuous feedback work together.
						</p>
						<div class="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-2xl mx-auto mb-8">
							<StatCard title="Decisions" value={journeyStats.decisionsParticipated} color="success" />
							<StatCard title="Designs" value={journeyStats.designsReviewed} color="warning" />
							<StatCard title="Credits" value={journeyStats.creditsEarned} color="primary" />
							<StatCard title="Tasks" value={journeyStats.tasksCompleted} color="danger" />
							<StatCard title="Resolved" value={journeyStats.issuesResolved} color="success" />
						</div>
						<Button variant="primary" size="lg" on:click={resetJourney}>
							<RotateCcw class="w-5 h-5 mr-2" />
							Start New Journey
						</Button>
					</div>
				</Card>
			{/if}
		</div>

		<!-- Sidebar Stats -->
		<div class="space-y-6">
			<Card>
				<h3 class="font-semibold text-white mb-4">Journey Statistics</h3>
				<div class="space-y-4">
					<div class="flex justify-between items-center">
						<span class="text-surface-400">Decisions Made</span>
						<Badge variant="success">{journeyStats.decisionsParticipated}</Badge>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-surface-400">Designs Reviewed</span>
						<Badge variant="warning">{journeyStats.designsReviewed}</Badge>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-surface-400">Credits Earned</span>
						<Badge variant="primary">{journeyStats.creditsEarned} ITC</Badge>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-surface-400">Tasks Created</span>
						<Badge variant="info">{journeyStats.tasksCompleted}</Badge>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-surface-400">Issues Resolved</span>
						<Badge variant="success">{journeyStats.issuesResolved}</Badge>
					</div>
				</div>
			</Card>

			{#if journeyStarted && completedPhases > 0}
				<Card>
					<h3 class="font-semibold text-white mb-4">Subsystem Progress</h3>
					<DonutChart data={progressChartData} size={180} />
				</Card>
			{/if}

			{#if calculatedCredits > 0}
				<Card>
					<h3 class="font-semibold text-white mb-4">Credit History</h3>
					<LineChart data={creditHistoryData} height={150} color="#10b981" />
				</Card>
			{/if}

			<Card>
				<h3 class="font-semibold text-white mb-4">Subsystem Status</h3>
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Vote class="w-4 h-4 text-emerald-400" />
							<span class="text-surface-300">CDS</span>
						</div>
						<StatusIndicator status={cdsComplete ? 'online' : currentPhase === 'cds' ? 'pending' : 'offline'} />
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Lightbulb class="w-4 h-4 text-amber-400" />
							<span class="text-surface-300">OAD</span>
						</div>
						<StatusIndicator status={oadComplete ? 'online' : currentPhase === 'oad' ? 'pending' : 'offline'} />
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Clock class="w-4 h-4 text-blue-400" />
							<span class="text-surface-300">ITC</span>
						</div>
						<StatusIndicator status={itcComplete ? 'online' : currentPhase === 'itc' ? 'pending' : 'offline'} />
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Factory class="w-4 h-4 text-purple-400" />
							<span class="text-surface-300">COS</span>
						</div>
						<StatusIndicator status={cosComplete ? 'online' : currentPhase === 'cos' ? 'pending' : 'offline'} />
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Activity class="w-4 h-4 text-rose-400" />
							<span class="text-surface-300">FRS</span>
						</div>
						<StatusIndicator status={frsComplete ? 'online' : currentPhase === 'frs' ? 'pending' : 'offline'} />
					</div>
				</div>
			</Card>
		</div>
	</div>
</div>
