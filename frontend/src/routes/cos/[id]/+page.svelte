<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Modal, Input, ProgressBar, EmptyState, Tabs } from '$lib/components/ui';
	import { cosApi, itcApi, oadApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import type { ProductionPlan, TaskInstance, COSConstraint, MaterialInventory, DesignVersion } from '$lib/types';
	import {
		ArrowLeft,
		Factory,
		Package,
		Clock,
		Users,
		AlertTriangle,
		CheckCircle,
		Play,
		Pause,
		XCircle,
		Plus,
		RefreshCw,
		Calendar,
		Wrench,
		Boxes,
		Link,
		ExternalLink,
		ChevronRight,
		Timer,
		BarChart3,
		Leaf,
		Shield
	} from 'lucide-svelte';

	const planId = $page.params.id;

	// Plan data
	let plan: ProductionPlan | null = null;
	let tasks: TaskInstance[] = [];
	let constraints: COSConstraint[] = [];
	let materials: MaterialInventory[] = [];
	let linkedDesign: DesignVersion | null = null;
	let isLoading = true;

	// Task action state
	let startingTaskId: string | null = null;
	let completingTaskId: string | null = null;
	let blockingTaskId: string | null = null;
	let assigningTaskId: string | null = null;

	// Modals
	let showCompleteModal = false;
	let taskToComplete: TaskInstance | null = null;
	let completeTaskHours = 0;

	let showBlockModal = false;
	let taskToBlock: TaskInstance | null = null;
	let blockReason = '';

	let showAssignModal = false;
	let taskToAssign: TaskInstance | null = null;
	let assignCoopId = '';
	let assignParticipants = '';

	// Tabs
	let activeTab = 'tasks';
	const tabs = [
		{ id: 'tasks', label: 'Tasks' },
		{ id: 'materials', label: 'Materials' },
		{ id: 'schedule', label: 'Schedule' },
		{ id: 'constraints', label: 'Constraints' }
	];

	const taskStatusColors: Record<string, 'info' | 'primary' | 'danger' | 'success' | 'warning'> = {
		pending: 'info',
		in_progress: 'primary',
		blocked: 'danger',
		done: 'success',
		cancelled: 'warning'
	};

	const taskStatusLabels: Record<string, string> = {
		pending: 'Pending',
		in_progress: 'In Progress',
		blocked: 'Blocked',
		done: 'Done',
		cancelled: 'Cancelled'
	};

	onMount(async () => {
		await loadPlan();
	});

	async function loadPlan() {
		isLoading = true;
		try {
			// Try to fetch plan
			plan = await cosApi.getPlan(planId) || createMockPlan(planId);

			if (plan) {
				// Load tasks for this plan
				tasks = await cosApi.listTasks(plan.planId) || createMockTasks(plan.batchId);

				// Load constraints
				constraints = await cosApi.detectBottlenecks(plan.planId) || createMockConstraints();

				// Load materials
				materials = createMockMaterials();

				// Load linked design
				linkedDesign = {
					id: plan.versionId,
					specId: 'spec_1',
					label: plan.versionId === 'ver_1' ? 'Solar Panel Mount v2.3' : 'Modular Design',
					status: 'certified',
					authors: ['Alice', 'Bob'],
					createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
					ecoScore: 0.32
				};
			}
		} catch (error) {
			console.error('Failed to load plan:', error);
			toasts.error('Error', 'Failed to load production plan');
		} finally {
			isLoading = false;
		}
	}

	function createMockPlan(id: string): ProductionPlan {
		return {
			planId: id,
			nodeId: 'node_abc',
			versionId: 'ver_1',
			batchId: 'batch_' + id.slice(-2),
			batchSize: 10,
			createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
			taskCount: 45,
			completedTasks: 32,
			expectedLaborHours: 180
		};
	}

	function createMockTasks(batchId: string): TaskInstance[] {
		return [
			{
				id: 'task_1',
				definitionId: 'Frame Assembly',
				batchId,
				status: 'done',
				assignedCoopId: 'coop_metalworks',
				scheduledStart: new Date(Date.now() - 86400000 * 2).toISOString(),
				scheduledEnd: new Date(Date.now() - 86400000).toISOString(),
				actualHours: 8.5,
				participants: ['Alice', 'Bob', 'Carol'],
				blockReasons: []
			},
			{
				id: 'task_2',
				definitionId: 'Mount Bracket Welding',
				batchId,
				status: 'done',
				assignedCoopId: 'coop_metalworks',
				scheduledStart: new Date(Date.now() - 86400000).toISOString(),
				actualHours: 4.0,
				participants: ['Dave'],
				blockReasons: []
			},
			{
				id: 'task_3',
				definitionId: 'Solar Cell Integration',
				batchId,
				status: 'in_progress',
				assignedCoopId: 'coop_electronics',
				scheduledStart: new Date(Date.now() - 3600000 * 4).toISOString(),
				actualHours: 2.5,
				participants: ['Eve', 'Frank'],
				blockReasons: []
			},
			{
				id: 'task_4',
				definitionId: 'Wiring Harness',
				batchId,
				status: 'blocked',
				assignedCoopId: 'coop_electronics',
				actualHours: 0,
				participants: ['Grace'],
				blockReasons: ['Waiting for connectors', 'Skill verification pending']
			},
			{
				id: 'task_5',
				definitionId: 'Quality Testing',
				batchId,
				status: 'pending',
				actualHours: 0,
				participants: [],
				blockReasons: []
			},
			{
				id: 'task_6',
				definitionId: 'Final Assembly',
				batchId,
				status: 'pending',
				actualHours: 0,
				participants: [],
				blockReasons: []
			},
			{
				id: 'task_7',
				definitionId: 'Documentation',
				batchId,
				status: 'pending',
				actualHours: 0,
				participants: [],
				blockReasons: []
			}
		];
	}

	function createMockConstraints(): COSConstraint[] {
		return [
			{
				planId: planId,
				taskDefinitionId: 'task_4',
				constraintType: 'material',
				severity: 0.72,
				description: 'Electrical connectors inventory running low',
				suggestedActions: ['Order from supplier B', 'Use alternative connector type']
			},
			{
				planId: planId,
				constraintType: 'skill',
				severity: 0.45,
				description: 'Expert-level soldering capacity limited',
				suggestedActions: ['Schedule training session', 'Request federation support']
			}
		];
	}

	function createMockMaterials(): MaterialInventory[] {
		return [
			{ materialId: 'mat_1', name: 'Aluminum Extrusion', quantity: 45, unit: 'kg', scarcityIndex: 0.2 },
			{ materialId: 'mat_2', name: 'Steel Bolts M8', quantity: 200, unit: 'pcs', scarcityIndex: 0.1 },
			{ materialId: 'mat_3', name: 'Solar Cells', quantity: 80, unit: 'pcs', scarcityIndex: 0.6 },
			{ materialId: 'mat_4', name: 'Electrical Connectors', quantity: 25, unit: 'pcs', scarcityIndex: 0.75 },
			{ materialId: 'mat_5', name: 'Wire 12AWG', quantity: 150, unit: 'm', scarcityIndex: 0.15 },
			{ materialId: 'mat_6', name: 'Tempered Glass', quantity: 12, unit: 'm²', scarcityIndex: 0.4 }
		];
	}

	// Task statistics
	$: taskStats = {
		pending: tasks.filter(t => t.status === 'pending').length,
		inProgress: tasks.filter(t => t.status === 'in_progress').length,
		blocked: tasks.filter(t => t.status === 'blocked').length,
		done: tasks.filter(t => t.status === 'done').length,
		cancelled: tasks.filter(t => t.status === 'cancelled').length
	};

	$: totalActualHours = tasks.reduce((sum, t) => sum + t.actualHours, 0);
	$: progressPercent = plan ? (plan.completedTasks / plan.taskCount) * 100 : 0;

	function formatDateTime(dateString: string): string {
		return new Date(dateString).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	async function handleStartTask(task: TaskInstance) {
		startingTaskId = task.id;
		try {
			const updated = await cosApi.startTask(task.id);
			tasks = tasks.map(t => t.id === task.id ? { ...t, status: 'in_progress', scheduledStart: new Date().toISOString() } : t);
			toasts.success('Task Started', `"${task.definitionId}" is now in progress`);
		} catch (error) {
			toasts.error('Failed to Start Task', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			startingTaskId = null;
		}
	}

	function openCompleteModal(task: TaskInstance) {
		taskToComplete = task;
		completeTaskHours = task.actualHours || 0;
		showCompleteModal = true;
	}

	async function handleCompleteTask() {
		if (!taskToComplete) return;

		completingTaskId = taskToComplete.id;
		try {
			await cosApi.completeTask(taskToComplete.id, completeTaskHours);
			tasks = tasks.map(t => t.id === taskToComplete!.id ? { ...t, status: 'done', actualHours: completeTaskHours } : t);

			// Update plan progress
			if (plan) {
				plan.completedTasks += 1;
			}

			toasts.success('Task Completed', `"${taskToComplete.definitionId}" marked as done with ${completeTaskHours}h logged`);
			showCompleteModal = false;
			taskToComplete = null;
		} catch (error) {
			toasts.error('Failed to Complete Task', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			completingTaskId = null;
		}
	}

	function openBlockModal(task: TaskInstance) {
		taskToBlock = task;
		blockReason = '';
		showBlockModal = true;
	}

	async function handleBlockTask() {
		if (!taskToBlock || !blockReason.trim()) {
			toasts.error('Validation Error', 'Please provide a reason for blocking');
			return;
		}

		blockingTaskId = taskToBlock.id;
		try {
			await cosApi.blockTask(taskToBlock.id, blockReason.trim());
			tasks = tasks.map(t => t.id === taskToBlock!.id ? {
				...t,
				status: 'blocked',
				blockReasons: [...t.blockReasons, blockReason.trim()]
			} : t);
			toasts.warning('Task Blocked', `"${taskToBlock.definitionId}" has been blocked`);
			showBlockModal = false;
			taskToBlock = null;
		} catch (error) {
			toasts.error('Failed to Block Task', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			blockingTaskId = null;
		}
	}

	function openAssignModal(task: TaskInstance) {
		taskToAssign = task;
		assignCoopId = task.assignedCoopId || '';
		assignParticipants = task.participants.join(', ');
		showAssignModal = true;
	}

	async function handleAssignTask() {
		if (!taskToAssign) return;

		assigningTaskId = taskToAssign.id;
		try {
			const participantList = assignParticipants.split(',').map(p => p.trim()).filter(p => p);
			await cosApi.assignTask(taskToAssign.id, {
				coopId: assignCoopId,
				participantIds: participantList
			});
			tasks = tasks.map(t => t.id === taskToAssign!.id ? {
				...t,
				assignedCoopId: assignCoopId,
				participants: participantList
			} : t);
			toasts.success('Task Assigned', `"${taskToAssign.definitionId}" has been assigned`);
			showAssignModal = false;
			taskToAssign = null;
		} catch (error) {
			toasts.error('Failed to Assign Task', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			assigningTaskId = null;
		}
	}

	async function handleUnblockTask(task: TaskInstance) {
		tasks = tasks.map(t => t.id === task.id ? { ...t, status: 'pending', blockReasons: [] } : t);
		toasts.success('Task Unblocked', `"${task.definitionId}" is now pending`);
	}

	function goBack() {
		goto('/cos');
	}

	function getScarcityColor(index: number): 'success' | 'warning' | 'danger' {
		if (index <= 0.3) return 'success';
		if (index <= 0.6) return 'warning';
		return 'danger';
	}
</script>

<Header
	title={plan ? `Batch #${plan.batchId.split('_')[1]}` : 'Production Plan'}
	subtitle="Production coordination and task management"
/>

<PageContainer>
	<!-- Back Navigation -->
	<Button variant="ghost" class="mb-4" on:click={goBack}>
		<ArrowLeft size={16} />
		Back to COS Overview
	</Button>

	{#if isLoading}
		<Card class="p-8 text-center">
			<RefreshCw size={32} class="animate-spin text-primary-400 mx-auto mb-4" />
			<p class="text-surface-400">Loading production plan...</p>
		</Card>
	{:else if plan}
		<!-- Plan Overview -->
		<Card class="mb-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20">
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
				<div class="flex items-center gap-4">
					<div class="p-4 rounded-2xl bg-primary-500/20">
						<Factory size={32} class="text-primary-400" />
					</div>
					<div>
						<div class="flex items-center gap-2 mb-1">
							<h2 class="text-2xl font-bold text-surface-100">Batch #{plan.batchId.split('_')[1]}</h2>
							{#if plan.completedTasks === plan.taskCount}
								<Badge variant="success">Complete</Badge>
							{:else if taskStats.inProgress > 0}
								<Badge variant="primary">In Progress</Badge>
							{:else if taskStats.blocked > 0}
								<Badge variant="danger">Blocked</Badge>
							{:else}
								<Badge variant="info">Pending</Badge>
							{/if}
						</div>
						<p class="text-surface-400">{plan.batchSize} units · Created {formatDate(plan.createdAt)}</p>
					</div>
				</div>

				<div class="flex items-center gap-6">
					<div class="text-center">
						<p class="text-3xl font-bold text-surface-100">{progressPercent.toFixed(0)}%</p>
						<p class="text-xs text-surface-500">Progress</p>
					</div>
					<div class="text-center">
						<p class="text-3xl font-bold text-primary-400">{totalActualHours.toFixed(1)}h</p>
						<p class="text-xs text-surface-500">of {plan.expectedLaborHours}h est.</p>
					</div>
				</div>
			</div>

			<div>
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm text-surface-400">Task Progress</span>
					<span class="text-sm text-surface-300">{taskStats.done} / {plan.taskCount} tasks completed</span>
				</div>
				<ProgressBar
					value={taskStats.done}
					max={plan.taskCount}
					color={progressPercent >= 90 ? 'success' : progressPercent >= 50 ? 'primary' : 'warning'}
				/>
			</div>
		</Card>

		<!-- Task Status Summary -->
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
			<Card class="flex items-center gap-3">
				<div class="p-2 rounded-lg bg-surface-800">
					<Clock size={20} class="text-surface-400" />
				</div>
				<div>
					<p class="text-xl font-bold text-surface-100">{taskStats.pending}</p>
					<p class="text-xs text-surface-500">Pending</p>
				</div>
			</Card>
			<Card class="flex items-center gap-3">
				<div class="p-2 rounded-lg bg-primary-500/20">
					<Play size={20} class="text-primary-400" />
				</div>
				<div>
					<p class="text-xl font-bold text-primary-400">{taskStats.inProgress}</p>
					<p class="text-xs text-surface-500">In Progress</p>
				</div>
			</Card>
			<Card class="flex items-center gap-3">
				<div class="p-2 rounded-lg bg-red-500/20">
					<XCircle size={20} class="text-red-400" />
				</div>
				<div>
					<p class="text-xl font-bold text-red-400">{taskStats.blocked}</p>
					<p class="text-xs text-surface-500">Blocked</p>
				</div>
			</Card>
			<Card class="flex items-center gap-3">
				<div class="p-2 rounded-lg bg-eco-500/20">
					<CheckCircle size={20} class="text-eco-400" />
				</div>
				<div>
					<p class="text-xl font-bold text-eco-400">{taskStats.done}</p>
					<p class="text-xs text-surface-500">Done</p>
				</div>
			</Card>
			<Card class="flex items-center gap-3">
				<div class="p-2 rounded-lg bg-warning-500/20">
					<AlertTriangle size={20} class="text-warning-400" />
				</div>
				<div>
					<p class="text-xl font-bold text-warning-400">{constraints.length}</p>
					<p class="text-xs text-surface-500">Constraints</p>
				</div>
			</Card>
		</div>

		<!-- Linked Design -->
		{#if linkedDesign}
			<Card class="mb-6">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<Link size={20} class="text-primary-400" />
						<div>
							<p class="text-sm text-surface-400">Linked Design</p>
							<p class="text-lg font-medium text-surface-100">{linkedDesign.label}</p>
						</div>
						<Badge variant="success">
							<CheckCircle size={12} class="mr-1" />
							Certified
						</Badge>
						{#if linkedDesign.ecoScore}
							<Badge variant={linkedDesign.ecoScore <= 0.3 ? 'success' : linkedDesign.ecoScore <= 0.5 ? 'warning' : 'danger'}>
								<Leaf size={12} class="mr-1" />
								Eco: {linkedDesign.ecoScore.toFixed(2)}
							</Badge>
						{/if}
					</div>
					<Button variant="ghost" size="sm" on:click={() => goto(`/oad/${linkedDesign?.id}`)}>
						<ExternalLink size={14} />
						View Design
					</Button>
				</div>
			</Card>
		{/if}

		<!-- Tabs -->
		<Tabs {tabs} bind:activeTab class="mb-6" />

		{#if activeTab === 'tasks'}
			<!-- Tasks List -->
			<div class="space-y-3">
				{#each tasks as task}
					<Card variant="hover" class="group">
						<div class="flex items-start justify-between">
							<div class="flex items-start gap-4">
								<div class="p-3 rounded-xl {task.status === 'done' ? 'bg-eco-500/20' : task.status === 'in_progress' ? 'bg-primary-500/20' : task.status === 'blocked' ? 'bg-red-500/20' : 'bg-surface-800'}">
									{#if task.status === 'done'}
										<CheckCircle size={20} class="text-eco-400" />
									{:else if task.status === 'in_progress'}
										<Play size={20} class="text-primary-400" />
									{:else if task.status === 'blocked'}
										<XCircle size={20} class="text-red-400" />
									{:else}
										<Clock size={20} class="text-surface-400" />
									{/if}
								</div>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<h4 class="font-medium text-surface-100">{task.definitionId}</h4>
										<Badge variant={taskStatusColors[task.status]} size="sm">
											{taskStatusLabels[task.status]}
										</Badge>
									</div>

									{#if task.assignedCoopId}
										<p class="text-sm text-surface-400 mb-2">Assigned to: {task.assignedCoopId}</p>
									{/if}

									{#if task.participants.length > 0}
										<div class="flex items-center gap-2 mb-2">
											<Users size={14} class="text-surface-500" />
											<div class="flex -space-x-2">
												{#each task.participants.slice(0, 4) as participant}
													<div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs border-2 border-surface-900" title={participant}>
														{participant.charAt(0)}
													</div>
												{/each}
												{#if task.participants.length > 4}
													<div class="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center text-surface-300 text-xs border-2 border-surface-900">
														+{task.participants.length - 4}
													</div>
												{/if}
											</div>
											<span class="text-xs text-surface-500">{task.participants.join(', ')}</span>
										</div>
									{/if}

									{#if task.blockReasons.length > 0}
										<div class="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
											<p class="text-xs text-red-400 font-medium mb-1">Block Reasons:</p>
											<ul class="text-xs text-surface-400 space-y-0.5">
												{#each task.blockReasons as reason}
													<li>- {reason}</li>
												{/each}
											</ul>
										</div>
									{/if}

									{#if task.scheduledStart}
										<div class="flex items-center gap-4 mt-2 text-xs text-surface-500">
											<span class="flex items-center gap-1">
												<Calendar size={12} />
												Started: {formatDateTime(task.scheduledStart)}
											</span>
											{#if task.actualHours > 0}
												<span class="flex items-center gap-1">
													<Timer size={12} />
													{task.actualHours}h logged
												</span>
											{/if}
										</div>
									{/if}
								</div>
							</div>

							<div class="flex items-center gap-2">
								{#if task.status === 'pending'}
									<Button size="sm" variant="ghost" on:click={() => openAssignModal(task)}>
										<Users size={14} />
										Assign
									</Button>
									<Button size="sm" variant="success" on:click={() => handleStartTask(task)} loading={startingTaskId === task.id}>
										<Play size={14} />
										Start
									</Button>
								{:else if task.status === 'in_progress'}
									<Button size="sm" variant="ghost" on:click={() => openBlockModal(task)}>
										<Pause size={14} />
										Block
									</Button>
									<Button size="sm" variant="primary" on:click={() => openCompleteModal(task)} loading={completingTaskId === task.id}>
										<CheckCircle size={14} />
										Complete
									</Button>
								{:else if task.status === 'blocked'}
									<Button size="sm" variant="warning" on:click={() => handleUnblockTask(task)}>
										<RefreshCw size={14} />
										Unblock
									</Button>
								{:else if task.status === 'done'}
									<Button size="sm" variant="ghost" on:click={() => goto(`/itc/${task.id}`)}>
										<ExternalLink size={14} />
										View ITC
									</Button>
								{/if}
							</div>
						</div>
					</Card>
				{/each}
			</div>

		{:else if activeTab === 'materials'}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
						<Package size={20} class="text-primary-400" />
						Material Requirements
					</h3>

					<div class="space-y-3">
						{#each materials as material}
							<div class="p-3 rounded-lg bg-surface-800/50">
								<div class="flex items-center justify-between mb-2">
									<span class="text-surface-200">{material.name}</span>
									<div class="flex items-center gap-2">
										<span class="text-surface-100 font-medium">{material.quantity} {material.unit}</span>
										{#if material.scarcityIndex > 0.6}
											<AlertTriangle size={14} class="text-red-400" />
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-xs text-surface-500">Availability:</span>
									<ProgressBar
										value={(1 - material.scarcityIndex) * 100}
										max={100}
										color={getScarcityColor(material.scarcityIndex)}
										size="sm"
										class="flex-1"
									/>
									<span class="text-xs text-surface-400">{((1 - material.scarcityIndex) * 100).toFixed(0)}%</span>
								</div>
							</div>
						{/each}
					</div>
				</Card>

				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
						<BarChart3 size={20} class="text-accent-400" />
						Material Flow
					</h3>

					<div class="space-y-4">
						<div class="p-4 rounded-lg bg-eco-500/10 border border-eco-500/20">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<RefreshCw size={18} class="text-eco-400" />
									<span class="text-surface-200">Internal Recycle</span>
								</div>
								<span class="text-eco-400 font-semibold">+12.5 kg</span>
							</div>
							<p class="text-xs text-surface-500 mt-1">Reclaimed from previous batches</p>
						</div>

						<div class="p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Package size={18} class="text-primary-400" />
									<span class="text-surface-200">External Procurement</span>
								</div>
								<span class="text-primary-400 font-semibold">+38.2 kg</span>
							</div>
							<p class="text-xs text-surface-500 mt-1">Ordered from federation suppliers</p>
						</div>

						<div class="p-4 rounded-lg bg-warning-500/10 border border-warning-500/20">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Wrench size={18} class="text-warning-400" />
									<span class="text-surface-200">Production Consumption</span>
								</div>
								<span class="text-warning-400 font-semibold">-42.1 kg</span>
							</div>
							<p class="text-xs text-surface-500 mt-1">Used in current batch production</p>
						</div>

						<div class="p-4 rounded-lg bg-surface-800">
							<div class="flex items-center justify-between">
								<span class="text-surface-300">Net Material Balance</span>
								<span class="text-surface-100 font-bold">+8.6 kg</span>
							</div>
						</div>
					</div>
				</Card>
			</div>

		{:else if activeTab === 'schedule'}
			<Card>
				<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
					<Calendar size={20} class="text-primary-400" />
					Task Schedule
				</h3>

				<div class="space-y-2">
					{#each tasks as task, index}
						{@const width = task.status === 'done' ? 100 : task.status === 'in_progress' ? 60 : 0}
						{@const offset = index * 8}
						<div class="flex items-center gap-4">
							<div class="w-32 text-sm text-surface-400 truncate">{task.definitionId}</div>
							<div class="flex-1 h-8 bg-surface-800 rounded relative overflow-hidden">
								<div
									class="absolute h-full rounded transition-all {task.status === 'done' ? 'bg-eco-500/60' : task.status === 'in_progress' ? 'bg-primary-500/60' : task.status === 'blocked' ? 'bg-red-500/60' : 'bg-surface-700'}"
									style="width: {width}%; left: {offset}%"
								></div>
								{#if task.actualHours > 0}
									<span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-surface-300">{task.actualHours}h</span>
								{/if}
							</div>
							<Badge variant={taskStatusColors[task.status]} size="sm" class="w-20 justify-center">
								{taskStatusLabels[task.status]}
							</Badge>
						</div>
					{/each}
				</div>

				<div class="mt-6 pt-4 border-t border-surface-800">
					<div class="flex items-center justify-between text-sm">
						<div class="flex items-center gap-4">
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded bg-eco-500/60"></div>
								<span class="text-surface-400">Done</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded bg-primary-500/60"></div>
								<span class="text-surface-400">In Progress</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded bg-red-500/60"></div>
								<span class="text-surface-400">Blocked</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded bg-surface-700"></div>
								<span class="text-surface-400">Pending</span>
							</div>
						</div>
						<div class="text-surface-400">
							Est. completion: <span class="text-surface-200 font-medium">3 days</span>
						</div>
					</div>
				</div>
			</Card>

		{:else if activeTab === 'constraints'}
			<Card>
				<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
					<AlertTriangle size={20} class="text-warning-400" />
					Detected Constraints
				</h3>

				{#if constraints.length > 0}
					<div class="space-y-4">
						{#each constraints as constraint}
							<div class="p-4 rounded-lg {constraint.severity > 0.6 ? 'bg-red-500/10 border border-red-500/20' : 'bg-warning-500/10 border border-warning-500/20'}">
								<div class="flex items-start gap-3">
									<AlertTriangle size={20} class="{constraint.severity > 0.6 ? 'text-red-400' : 'text-warning-400'} mt-0.5" />
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-2">
											<h4 class="font-medium text-surface-100">{constraint.constraintType.charAt(0).toUpperCase() + constraint.constraintType.slice(1)} Constraint</h4>
											<Badge variant={constraint.severity > 0.6 ? 'danger' : 'warning'} size="sm">
												Severity: {(constraint.severity * 100).toFixed(0)}%
											</Badge>
										</div>
										<p class="text-sm text-surface-400 mb-3">{constraint.description}</p>

										{#if constraint.taskDefinitionId}
											<p class="text-xs text-surface-500 mb-2">Affects task: <span class="text-surface-300">{constraint.taskDefinitionId}</span></p>
										{/if}

										<div>
											<p class="text-xs text-surface-500 mb-1">Suggested Actions:</p>
											<ul class="text-sm text-surface-300 space-y-1">
												{#each constraint.suggestedActions as action}
													<li class="flex items-center gap-2">
														<ChevronRight size={12} class="text-surface-500" />
														{action}
													</li>
												{/each}
											</ul>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<EmptyState
						title="No constraints detected"
						description="Production is flowing smoothly"
						icon={CheckCircle}
					/>
				{/if}
			</Card>
		{/if}
	{:else}
		<EmptyState
			title="Plan Not Found"
			description="The requested production plan could not be found"
			icon={Factory}
		>
			<Button slot="action" variant="primary" on:click={goBack}>
				<ArrowLeft size={16} />
				Back to COS Overview
			</Button>
		</EmptyState>
	{/if}
</PageContainer>

<!-- Complete Task Modal -->
<Modal bind:open={showCompleteModal} title="Complete Task" size="md">
	{#if taskToComplete}
		<div class="space-y-4">
			<div class="p-4 rounded-lg bg-surface-800/50">
				<h4 class="font-medium text-surface-100 mb-2">{taskToComplete.definitionId}</h4>
				<div class="text-sm text-surface-400">
					<p>Participants: {taskToComplete.participants.join(', ') || 'None assigned'}</p>
					{#if taskToComplete.scheduledStart}
						<p>Started: {formatDateTime(taskToComplete.scheduledStart)}</p>
					{/if}
				</div>
			</div>

			<Input
				label="Actual Hours Worked"
				type="number"
				step="0.5"
				bind:value={completeTaskHours}
			/>

			<div class="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
				<p class="text-sm text-surface-300">
					<Shield size={14} class="inline mr-1" />
					{completeTaskHours}h will be logged to ITC for each participant.
				</p>
			</div>
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCompleteModal = false} disabled={completingTaskId !== null}>Cancel</Button>
		<Button variant="success" on:click={handleCompleteTask} loading={completingTaskId !== null}>
			<CheckCircle size={16} />
			Complete Task
		</Button>
	</svelte:fragment>
</Modal>

<!-- Block Task Modal -->
<Modal bind:open={showBlockModal} title="Block Task" size="md">
	{#if taskToBlock}
		<div class="space-y-4">
			<div class="p-4 rounded-lg bg-surface-800/50">
				<h4 class="font-medium text-surface-100 mb-2">{taskToBlock.definitionId}</h4>
				<p class="text-sm text-surface-400">This task will be marked as blocked until the issue is resolved.</p>
			</div>

			<div>
				<label class="label">Block Reason</label>
				<textarea
					class="input min-h-[100px] resize-y"
					placeholder="Describe why this task is blocked..."
					bind:value={blockReason}
				></textarea>
			</div>
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showBlockModal = false} disabled={blockingTaskId !== null}>Cancel</Button>
		<Button variant="danger" on:click={handleBlockTask} loading={blockingTaskId !== null}>
			<XCircle size={16} />
			Block Task
		</Button>
	</svelte:fragment>
</Modal>

<!-- Assign Task Modal -->
<Modal bind:open={showAssignModal} title="Assign Task" size="md">
	{#if taskToAssign}
		<div class="space-y-4">
			<div class="p-4 rounded-lg bg-surface-800/50">
				<h4 class="font-medium text-surface-100 mb-2">{taskToAssign.definitionId}</h4>
			</div>

			<div>
				<label class="label">Cooperative</label>
				<select class="input" bind:value={assignCoopId}>
					<option value="">Select a cooperative...</option>
					<option value="coop_metalworks">Metalworks Cooperative</option>
					<option value="coop_electronics">Electronics Cooperative</option>
					<option value="coop_assembly">Assembly Cooperative</option>
					<option value="coop_qa">Quality Assurance Cooperative</option>
				</select>
			</div>

			<Input
				label="Participants (comma-separated)"
				placeholder="Alice, Bob, Carol"
				bind:value={assignParticipants}
			/>
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showAssignModal = false} disabled={assigningTaskId !== null}>Cancel</Button>
		<Button variant="primary" on:click={handleAssignTask} loading={assigningTaskId !== null}>
			<Users size={16} />
			Assign Task
		</Button>
	</svelte:fragment>
</Modal>
