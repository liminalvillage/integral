<script lang="ts">
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, Modal, Input, StatCard, ProgressBar, EmptyState } from '$lib/components/ui';
	import { productionPlans, tasks as tasksStore, materialInventory, designVersions, constraints as constraintsStore } from '$lib/stores';
	import { cosApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import { refreshTasks, refreshPlans, refreshConstraints } from '$lib/services/dataLoader';
	import type { ProductionPlan, TaskInstance, COSConstraint } from '$lib/types';
	import {
		Factory,
		Plus,
		Package,
		Clock,
		Users,
		AlertTriangle,
		CheckCircle,
		Play,
		Pause,
		ChevronRight,
		Boxes,
		Wrench,
		BarChart3,
		UserPlus,
		Ban,
		Eye,
		RefreshCw
	} from 'lucide-svelte';

	let activeTab = 'plans';
	let showCreateModal = false;

	// Use tasks from store
	$: tasks = $tasksStore;

	// Get certified designs for plan creation
	$: certifiedDesigns = $designVersions.filter(d => d.status === 'certified');

	// Create plan form state
	let selectedVersionId = '';
	let newBatchSize = 10;
	let isCreatingPlan = false;

	// Task action state
	let startingTaskId: string | null = null;
	let completingTaskId: string | null = null;
	let showCompleteModal = false;
	let taskToComplete: TaskInstance | null = null;
	let completeTaskHours = 0;

	// Task assignment state
	let showAssignModal = false;
	let taskToAssign: TaskInstance | null = null;
	let assignCoopId = '';
	let assignParticipants = '';
	let isAssigningTask = false;

	// Task blocking state
	let showBlockModal = false;
	let taskToBlock: TaskInstance | null = null;
	let blockReason = '';
	let isBlockingTask = false;

	// Plan details state
	let showPlanDetailsModal = false;
	let selectedPlan: ProductionPlan | null = null;
	let planTasks: TaskInstance[] = [];
	let isLoadingPlanDetails = false;

	// Constraint detection state
	let isDetectingBottlenecks = false;

	const tabs = [
		{ id: 'plans', label: 'Production Plans' },
		{ id: 'tasks', label: 'Active Tasks' },
		{ id: 'materials', label: 'Materials' },
		{ id: 'constraints', label: 'Constraints' }
	];

	const taskStatusColors = {
		pending: 'info',
		in_progress: 'primary',
		blocked: 'danger',
		done: 'success',
		cancelled: 'info'
	} as const;

	$: activePlans = $productionPlans.filter(p => p.completedTasks < p.taskCount);
	$: totalTasks = $productionPlans.reduce((sum, p) => sum + p.taskCount, 0);
	$: completedTasks = $productionPlans.reduce((sum, p) => sum + p.completedTasks, 0);
	$: blockedTasks = tasks.filter(t => t.status === 'blocked').length;
	$: inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

	// Real constraint detection from tasks
	$: detectedConstraints = (() => {
		const constraints: COSConstraint[] = [];

		// Check for blocked tasks (material constraints)
		const blockedByMaterial = tasks.filter(t => t.status === 'blocked' && t.blockReasons.some(r => r.toLowerCase().includes('material')));
		if (blockedByMaterial.length > 0) {
			constraints.push({
				planId: blockedByMaterial[0].batchId,
				constraintType: 'material',
				severity: Math.min(1, blockedByMaterial.length * 0.24),
				description: `${blockedByMaterial.length} tasks blocked waiting for materials`,
				suggestedActions: ['Check inventory levels', 'Contact suppliers', 'Consider substitutes']
			});
		}

		// Check for skill constraints (tasks without participants)
		const unassignedHighSkill = tasks.filter(t => t.status === 'pending' && t.participants.length === 0);
		if (unassignedHighSkill.length > 3) {
			constraints.push({
				planId: unassignedHighSkill[0]?.batchId ?? '',
				constraintType: 'skill',
				severity: Math.min(1, unassignedHighSkill.length * 0.15),
				description: `${unassignedHighSkill.length} tasks awaiting skilled assignment`,
				suggestedActions: ['Review member skills', 'Schedule training', 'Request federation support']
			});
		}

		// Check for time constraints (overdue tasks)
		const overdueTask = tasks.filter(t => t.scheduledEnd && new Date(t.scheduledEnd) < new Date() && t.status !== 'done');
		if (overdueTask.length > 0) {
			constraints.push({
				planId: overdueTask[0].batchId,
				constraintType: 'time',
				severity: Math.min(1, overdueTask.length * 0.3),
				description: `${overdueTask.length} tasks past scheduled completion`,
				suggestedActions: ['Re-prioritize workload', 'Add more participants', 'Extend timeline']
			});
		}

		// Check for low inventory materials
		const lowInventory = $materialInventory.filter(m => m.scarcityIndex > 0.6);
		if (lowInventory.length > 0) {
			constraints.push({
				planId: 'system',
				constraintType: 'material',
				severity: Math.max(...lowInventory.map(m => m.scarcityIndex)),
				description: `${lowInventory.length} materials at critical levels: ${lowInventory.map(m => m.name).join(', ')}`,
				suggestedActions: ['Urgent procurement needed', 'Pause affected production', 'Find alternatives']
			});
		}

		return constraints;
	})();

	// Merge detected constraints with stored constraints
	$: allConstraints = [...$constraintsStore, ...detectedConstraints.filter(dc =>
		!$constraintsStore.some(sc => sc.description === dc.description)
	)];

	function getProgressColor(plan: ProductionPlan): 'primary' | 'success' | 'warning' {
		const progress = plan.completedTasks / plan.taskCount;
		if (progress >= 0.9) return 'success';
		if (progress >= 0.5) return 'primary';
		return 'warning';
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	function getSeverityColor(severity: number): string {
		if (severity >= 0.7) return 'danger';
		if (severity >= 0.4) return 'warning';
		return 'info';
	}

	async function handleCreatePlan() {
		if (!selectedVersionId || newBatchSize < 1) {
			toasts.error('Validation Error', 'Please select a certified design and enter a valid batch size');
			return;
		}

		isCreatingPlan = true;
		try {
			const plan = await cosApi.createPlan({
				versionId: selectedVersionId,
				batchSize: newBatchSize
			});
			productionPlans.update(list => [plan, ...list]);
			await refreshTasks();
			toasts.success('Plan Created', `Production plan created with ${plan.batchSize} units and ${plan.taskCount} tasks`);
			showCreateModal = false;
			newBatchSize = 10;
			selectedVersionId = '';
		} catch (error) {
			toasts.error('Failed to Create Plan', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isCreatingPlan = false;
		}
	}

	async function handleViewPlanDetails(plan: ProductionPlan) {
		selectedPlan = plan;
		showPlanDetailsModal = true;
		isLoadingPlanDetails = true;

		try {
			planTasks = await cosApi.listTasks(plan.planId);
		} catch (error) {
			toasts.error('Failed to Load Tasks', error instanceof Error ? error.message : 'Unknown error');
			planTasks = [];
		} finally {
			isLoadingPlanDetails = false;
		}
	}

	async function handleStartTask(task: TaskInstance) {
		startingTaskId = task.id;
		try {
			await cosApi.startTask(task.id);
			await refreshTasks();
			toasts.success('Task Started', `Task ${task.definitionId} is now in progress`);
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
			await Promise.all([refreshTasks(), refreshPlans()]);
			toasts.success('Task Completed', `Task ${taskToComplete.definitionId} marked as done with ${completeTaskHours}h logged`);
			showCompleteModal = false;
			taskToComplete = null;
		} catch (error) {
			toasts.error('Failed to Complete Task', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			completingTaskId = null;
		}
	}

	function openAssignModal(task: TaskInstance) {
		taskToAssign = task;
		assignCoopId = task.assignedCoopId ?? '';
		assignParticipants = task.participants.join(', ');
		showAssignModal = true;
	}

	async function handleAssignTask() {
		if (!taskToAssign) return;

		isAssigningTask = true;
		try {
			const participantList = assignParticipants
				.split(',')
				.map(p => p.trim())
				.filter(p => p.length > 0);

			await cosApi.assignTask(taskToAssign.id, {
				coopId: assignCoopId || 'default_coop',
				participantIds: participantList
			});
			await refreshTasks();
			toasts.success('Task Assigned', `Task assigned to ${participantList.join(', ') || 'coop'}`);
			showAssignModal = false;
			taskToAssign = null;
		} catch (error) {
			toasts.error('Failed to Assign Task', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isAssigningTask = false;
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

		isBlockingTask = true;
		try {
			await cosApi.blockTask(taskToBlock.id, blockReason.trim());
			await refreshTasks();
			toasts.warning('Task Blocked', `Task ${taskToBlock.definitionId} has been blocked`);
			showBlockModal = false;
			taskToBlock = null;
			blockReason = '';
		} catch (error) {
			toasts.error('Failed to Block Task', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isBlockingTask = false;
		}
	}

	async function handleDetectBottlenecks() {
		if (activePlans.length === 0) {
			toasts.warning('No Active Plans', 'Create a production plan first');
			return;
		}

		isDetectingBottlenecks = true;
		try {
			const detectedList = await Promise.all(
				activePlans.map(p => cosApi.detectBottlenecks(p.planId))
			);
			const flatList = detectedList.flat();
			constraintsStore.set(flatList);
			toasts.success('Analysis Complete', `Found ${flatList.length} bottlenecks across ${activePlans.length} plans`);
		} catch (error) {
			toasts.error('Detection Failed', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isDetectingBottlenecks = false;
		}
	}

	// Compute material flow from inventory changes
	$: materialFlow = {
		recycled: Math.round($materialInventory.filter(m => m.scarcityIndex < 0.3).reduce((sum, m) => sum + m.quantity * 0.1, 0)),
		procured: Math.round($materialInventory.reduce((sum, m) => sum + m.quantity * 0.2, 0)),
		used: Math.round(completedTasks * 2.5)
	};
</script>

<Header
	title="Cooperative Organization System"
	subtitle="Production coordination and workflow management"
	showCreateButton
	createButtonLabel="New Plan"
	on:create={() => showCreateModal = true}
/>

<PageContainer>
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
		<StatCard
			title="Active Plans"
			value={activePlans.length}
			icon={Factory}
			color="primary"
		/>
		<StatCard
			title="Total Tasks"
			value={totalTasks}
			subtitle="{completedTasks} completed"
			icon={Package}
			color="success"
		/>
		<StatCard
			title="In Progress"
			value={inProgressTasks}
			icon={Play}
			color="primary"
		/>
		<StatCard
			title="Blocked"
			value={blockedTasks}
			icon={AlertTriangle}
			color={blockedTasks > 0 ? 'danger' : 'success'}
		/>
		<StatCard
			title="Constraints"
			value={allConstraints.length}
			icon={BarChart3}
			color={allConstraints.length > 0 ? 'warning' : 'success'}
		/>
	</div>

	<!-- Tabs -->
	<Tabs {tabs} bind:activeTab class="mb-6" />

	{#if activeTab === 'plans'}
		<div class="space-y-4">
			{#if $productionPlans.length === 0}
				<EmptyState
					title="No production plans"
					description="Create a plan from a certified design to start production"
					icon={Factory}
				>
					<Button slot="action" variant="primary" on:click={() => showCreateModal = true}>
						<Plus size={16} />
						New Plan
					</Button>
				</EmptyState>
			{:else}
				{#each $productionPlans as plan}
					<Card variant="hover" class="group cursor-pointer" on:click={() => handleViewPlanDetails(plan)}>
						<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div class="flex items-center gap-4">
								<div class="p-3 rounded-xl bg-primary-500/10">
									<Boxes size={24} class="text-primary-400" />
								</div>
								<div>
									<div class="flex items-center gap-2 mb-1">
										<h3 class="text-lg font-medium text-surface-100">Batch #{plan.batchId.split('_')[1] || plan.batchId}</h3>
										{#if plan.completedTasks === plan.taskCount}
											<Badge variant="success">Complete</Badge>
										{:else if plan.completedTasks > 0}
											<Badge variant="primary">In Progress</Badge>
										{:else}
											<Badge variant="info">Pending</Badge>
										{/if}
									</div>
									<p class="text-sm text-surface-500">
										{plan.batchSize} units - {plan.taskCount} tasks - Created {formatDate(plan.createdAt)}
									</p>
								</div>
							</div>

							<div class="flex items-center gap-6">
								<div class="text-center">
									<p class="text-2xl font-bold text-surface-100">
										{plan.taskCount > 0 ? ((plan.completedTasks / plan.taskCount) * 100).toFixed(0) : 0}%
									</p>
									<p class="text-xs text-surface-500">Progress</p>
								</div>
								<div class="text-center">
									<p class="text-2xl font-bold text-surface-100">{plan.expectedLaborHours}h</p>
									<p class="text-xs text-surface-500">Est. Labor</p>
								</div>
								<button class="btn btn-sm variant-ghost-surface" on:click|stopPropagation={() => handleViewPlanDetails(plan)}>
									<Eye size={14} />
									View
								</button>
							</div>
						</div>

						<div class="mt-4 pt-4 border-t border-surface-800">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm text-surface-400">Task Progress</span>
								<span class="text-sm text-surface-300">{plan.completedTasks} / {plan.taskCount}</span>
							</div>
							<ProgressBar
								value={plan.completedTasks}
								max={plan.taskCount}
								color={getProgressColor(plan)}
							/>
						</div>
					</Card>
				{/each}
			{/if}
		</div>

	{:else if activeTab === 'tasks'}
		<Card>
			<div class="flex items-center justify-between mb-4">
				<h3 class="section-header mb-0">All Tasks</h3>
				<div class="flex gap-2">
					{#each Object.entries(taskStatusColors) as [status, color]}
						{@const count = tasks.filter(t => t.status === status).length}
						{#if count > 0}
							<Badge variant={color} size="sm">
								{status.replace('_', ' ')}: {count}
							</Badge>
						{/if}
					{/each}
				</div>
			</div>

			{#if tasks.length === 0}
				<EmptyState
					title="No tasks yet"
					description="Tasks are generated when you create a production plan"
					icon={Package}
				/>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="text-left">
								<th class="table-header table-cell">Task</th>
								<th class="table-header table-cell">Batch</th>
								<th class="table-header table-cell">Status</th>
								<th class="table-header table-cell">Assigned To</th>
								<th class="table-header table-cell">Hours</th>
								<th class="table-header table-cell">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each tasks as task}
								<tr class="table-row">
									<td class="table-cell font-medium text-surface-200">{task.definitionId}</td>
									<td class="table-cell text-surface-400">{task.batchId}</td>
									<td class="table-cell">
										<Badge variant={taskStatusColors[task.status]}>
											{task.status.replace('_', ' ')}
										</Badge>
										{#if task.blockReasons.length > 0}
											<div class="mt-1 text-xs text-red-400">
												{task.blockReasons[0]}
											</div>
										{/if}
									</td>
									<td class="table-cell">
										{#if task.participants.length > 0}
											<div class="flex items-center gap-2">
												<div class="flex -space-x-2">
													{#each task.participants.slice(0, 3) as participant}
														<div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs border-2 border-surface-900">
															{participant.charAt(0).toUpperCase()}
														</div>
													{/each}
												</div>
												{#if task.participants.length > 3}
													<span class="text-xs text-surface-500">+{task.participants.length - 3}</span>
												{/if}
											</div>
										{:else}
											<Button size="sm" variant="ghost" on:click={() => openAssignModal(task)}>
												<UserPlus size={12} />
												Assign
											</Button>
										{/if}
									</td>
									<td class="table-cell text-surface-300">{task.actualHours}h</td>
									<td class="table-cell">
										<div class="flex gap-1">
											{#if task.status === 'pending'}
												<Button size="sm" variant="success" icon on:click={() => handleStartTask(task)} loading={startingTaskId === task.id} title="Start Task">
													<Play size={14} />
												</Button>
												<Button size="sm" variant="ghost" icon on:click={() => openAssignModal(task)} title="Assign">
													<UserPlus size={14} />
												</Button>
											{:else if task.status === 'in_progress'}
												<Button size="sm" variant="success" icon on:click={() => openCompleteModal(task)} loading={completingTaskId === task.id} title="Complete">
													<CheckCircle size={14} />
												</Button>
												<Button size="sm" variant="warning" icon on:click={() => openBlockModal(task)} title="Block">
													<Ban size={14} />
												</Button>
											{:else if task.status === 'blocked'}
												<Button size="sm" variant="primary" icon on:click={() => handleStartTask(task)} loading={startingTaskId === task.id} title="Resume">
													<Play size={14} />
												</Button>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</Card>

	{:else if activeTab === 'materials'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card>
				<h3 class="section-header">Material Inventory</h3>
				{#if $materialInventory.length === 0}
					<EmptyState
						title="No inventory data"
						description="Material inventory will appear when production begins"
						icon={Package}
					/>
				{:else}
					<div class="space-y-3">
						{#each $materialInventory as material}
							<div class="p-3 rounded-lg bg-surface-800/50">
								<div class="flex justify-between mb-2">
									<span class="text-surface-200">{material.name}</span>
									<span class="text-surface-100 font-medium">{material.quantity} {material.unit}</span>
								</div>
								<div class="flex items-center gap-2">
									<ProgressBar
										value={(1 - material.scarcityIndex) * 100}
										max={100}
										color={material.scarcityIndex > 0.6 ? 'danger' : material.scarcityIndex > 0.3 ? 'warning' : 'success'}
										size="sm"
										class="flex-1"
									/>
									{#if material.scarcityIndex > 0.6}
										<AlertTriangle size={14} class="text-red-400" title="Low stock" />
									{/if}
								</div>
								<div class="flex justify-between mt-1 text-xs text-surface-500">
									<span>Availability</span>
									<span class="{material.scarcityIndex > 0.6 ? 'text-red-400' : material.scarcityIndex > 0.3 ? 'text-warning-400' : 'text-eco-400'}">
										{((1 - material.scarcityIndex) * 100).toFixed(0)}%
									</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card>

			<Card>
				<h3 class="section-header">Material Flow</h3>
				<p class="text-sm text-surface-400 mb-4">Estimated material movement based on production activity.</p>
				<div class="space-y-4">
					<div class="flex items-center justify-between p-3 rounded-lg bg-eco-500/10 border border-eco-500/20">
						<div class="flex items-center gap-2">
							<Package size={18} class="text-eco-400" />
							<span class="text-surface-200">Internal Recycle</span>
						</div>
						<span class="text-eco-400 font-semibold">+{materialFlow.recycled} kg</span>
					</div>
					<div class="flex items-center justify-between p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
						<div class="flex items-center gap-2">
							<Package size={18} class="text-primary-400" />
							<span class="text-surface-200">External Procurement</span>
						</div>
						<span class="text-primary-400 font-semibold">+{materialFlow.procured} kg</span>
					</div>
					<div class="flex items-center justify-between p-3 rounded-lg bg-warning-500/10 border border-warning-500/20">
						<div class="flex items-center gap-2">
							<Wrench size={18} class="text-warning-400" />
							<span class="text-surface-200">Production Use</span>
						</div>
						<span class="text-warning-400 font-semibold">-{materialFlow.used} kg</span>
					</div>
				</div>
			</Card>
		</div>

	{:else if activeTab === 'constraints'}
		<Card>
			<div class="flex items-center justify-between mb-4">
				<h3 class="section-header mb-0">Detected Bottlenecks</h3>
				<Button variant="secondary" size="sm" on:click={handleDetectBottlenecks} loading={isDetectingBottlenecks}>
					<RefreshCw size={14} />
					Analyze Plans
				</Button>
			</div>

			{#if allConstraints.length === 0}
				<EmptyState
					title="No bottlenecks detected"
					description="All production is flowing smoothly. Run analysis to check for issues."
					icon={CheckCircle}
				>
					<Button slot="action" variant="secondary" on:click={handleDetectBottlenecks} loading={isDetectingBottlenecks}>
						<RefreshCw size={14} />
						Run Analysis
					</Button>
				</EmptyState>
			{:else}
				<div class="space-y-3">
					{#each allConstraints.sort((a, b) => b.severity - a.severity) as constraint}
						<div class="p-4 rounded-lg {constraint.severity >= 0.7 ? 'bg-red-500/10 border border-red-500/20' : constraint.severity >= 0.4 ? 'bg-warning-500/10 border border-warning-500/20' : 'bg-primary-500/10 border border-primary-500/20'}">
							<div class="flex items-start gap-3">
								<AlertTriangle size={20} class="{constraint.severity >= 0.7 ? 'text-red-400' : constraint.severity >= 0.4 ? 'text-warning-400' : 'text-primary-400'} mt-0.5" />
								<div class="flex-1">
									<h4 class="font-medium text-surface-100 capitalize">{constraint.constraintType} Constraint</h4>
									<p class="text-sm text-surface-400 mt-1">
										{constraint.description}
									</p>
									<div class="flex gap-2 mt-3">
										<Badge variant={getSeverityColor(constraint.severity)}>Severity: {(constraint.severity * 100).toFixed(0)}%</Badge>
										<Badge variant="info" class="capitalize">{constraint.constraintType}</Badge>
									</div>
									{#if constraint.suggestedActions?.length > 0}
										<div class="mt-3 pt-3 border-t border-surface-700">
											<p class="text-xs text-surface-500 mb-2">Suggested Actions:</p>
											<ul class="text-sm text-surface-300 space-y-1">
												{#each constraint.suggestedActions as action}
													<li class="flex items-center gap-2">
														<span class="w-1.5 h-1.5 rounded-full bg-primary-400"></span>
														{action}
													</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	{/if}
</PageContainer>

<!-- Create Plan Modal -->
<Modal bind:open={showCreateModal} title="Create Production Plan" size="md">
	<div class="space-y-4">
		<div>
			<label class="label">Certified Design</label>
			{#if certifiedDesigns.length === 0}
				<div class="p-3 rounded-lg bg-warning-500/10 border border-warning-500/20 text-sm text-surface-300">
					No certified designs available. Please certify a design in OAD first.
				</div>
			{:else}
				<select class="input" bind:value={selectedVersionId}>
					<option value="">Select a design...</option>
					{#each certifiedDesigns as design}
						<option value={design.id}>{design.label} (Eco: {design.ecoScore?.toFixed(2) ?? 'N/A'})</option>
					{/each}
				</select>
			{/if}
		</div>
		<Input label="Batch Size" type="number" min="1" bind:value={newBatchSize} />
		<div class="p-3 rounded-lg bg-surface-800/50 text-sm text-surface-400">
			<p>Tasks will be generated based on the design's production profile. Members can then be assigned to individual tasks.</p>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCreateModal = false} disabled={isCreatingPlan}>Cancel</Button>
		<Button variant="primary" on:click={handleCreatePlan} loading={isCreatingPlan} disabled={!selectedVersionId || certifiedDesigns.length === 0}>Create Plan</Button>
	</svelte:fragment>
</Modal>

<!-- Complete Task Modal -->
<Modal bind:open={showCompleteModal} title="Complete Task" size="sm">
	<div class="space-y-4">
		<p class="text-surface-400">Mark task <span class="text-surface-200 font-medium">{taskToComplete?.definitionId}</span> as complete.</p>
		<Input label="Actual Hours Worked" type="number" step="0.5" min="0" bind:value={completeTaskHours} />
		<p class="text-sm text-surface-500">This will log {completeTaskHours}h to ITC for participants.</p>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCompleteModal = false} disabled={completingTaskId !== null}>Cancel</Button>
		<Button variant="success" on:click={handleCompleteTask} loading={completingTaskId !== null}>Complete Task</Button>
	</svelte:fragment>
</Modal>

<!-- Assign Task Modal -->
<Modal bind:open={showAssignModal} title="Assign Task" size="md">
	<div class="space-y-4">
		<p class="text-surface-400">Assign task <span class="text-surface-200 font-medium">{taskToAssign?.definitionId}</span> to members.</p>
		<Input label="Coop/Team ID (optional)" placeholder="e.g., production_team_a" bind:value={assignCoopId} />
		<Input label="Participants" placeholder="Enter member IDs separated by commas" bind:value={assignParticipants} />
		<p class="text-sm text-surface-500">Participants will receive ITC credits when the task is completed.</p>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showAssignModal = false} disabled={isAssigningTask}>Cancel</Button>
		<Button variant="primary" on:click={handleAssignTask} loading={isAssigningTask}>
			<UserPlus size={14} />
			Assign Task
		</Button>
	</svelte:fragment>
</Modal>

<!-- Block Task Modal -->
<Modal bind:open={showBlockModal} title="Block Task" size="md">
	<div class="space-y-4">
		<p class="text-surface-400">Block task <span class="text-surface-200 font-medium">{taskToBlock?.definitionId}</span> from proceeding.</p>
		<div>
			<label class="label">Reason for Blocking</label>
			<textarea
				class="input min-h-[80px] resize-y"
				placeholder="e.g., Waiting for materials, Equipment maintenance, Skill unavailable..."
				bind:value={blockReason}
			></textarea>
		</div>
		<div class="p-3 rounded-lg bg-warning-500/10 border border-warning-500/20 text-sm text-surface-300">
			<p>Blocked tasks will appear in the constraints tab and may affect production flow analysis.</p>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showBlockModal = false} disabled={isBlockingTask}>Cancel</Button>
		<Button variant="warning" on:click={handleBlockTask} loading={isBlockingTask}>
			<Ban size={14} />
			Block Task
		</Button>
	</svelte:fragment>
</Modal>

<!-- Plan Details Modal -->
<Modal bind:open={showPlanDetailsModal} title={selectedPlan ? `Batch #${selectedPlan.batchId.split('_')[1] || selectedPlan.batchId}` : 'Plan Details'} size="xl">
	{#if selectedPlan}
		<div class="space-y-4">
			<div class="grid grid-cols-3 gap-4">
				<div class="p-3 rounded-lg bg-surface-800/50 text-center">
					<p class="text-2xl font-bold text-surface-100">{selectedPlan.batchSize}</p>
					<p class="text-xs text-surface-500">Units</p>
				</div>
				<div class="p-3 rounded-lg bg-surface-800/50 text-center">
					<p class="text-2xl font-bold text-surface-100">{selectedPlan.completedTasks}/{selectedPlan.taskCount}</p>
					<p class="text-xs text-surface-500">Tasks Done</p>
				</div>
				<div class="p-3 rounded-lg bg-surface-800/50 text-center">
					<p class="text-2xl font-bold text-surface-100">{selectedPlan.expectedLaborHours}h</p>
					<p class="text-xs text-surface-500">Expected Labor</p>
				</div>
			</div>

			<ProgressBar
				value={selectedPlan.completedTasks}
				max={selectedPlan.taskCount}
				color={getProgressColor(selectedPlan)}
			/>

			{#if isLoadingPlanDetails}
				<div class="p-4 text-center text-surface-400">Loading tasks...</div>
			{:else}
				<div class="max-h-[300px] overflow-y-auto">
					<table class="w-full">
						<thead>
							<tr class="text-left">
								<th class="table-header table-cell">Task</th>
								<th class="table-header table-cell">Status</th>
								<th class="table-header table-cell">Participants</th>
								<th class="table-header table-cell">Hours</th>
							</tr>
						</thead>
						<tbody>
							{#each planTasks as task}
								<tr class="table-row">
									<td class="table-cell text-surface-200">{task.definitionId}</td>
									<td class="table-cell">
										<Badge variant={taskStatusColors[task.status]} size="sm">{task.status.replace('_', ' ')}</Badge>
									</td>
									<td class="table-cell text-surface-400">{task.participants.join(', ') || 'Unassigned'}</td>
									<td class="table-cell text-surface-300">{task.actualHours}h</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showPlanDetailsModal = false}>Close</Button>
	</svelte:fragment>
</Modal>
