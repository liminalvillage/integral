<script lang="ts">
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, Modal, Input, StatCard, ProgressBar, EmptyState } from '$lib/components/ui';
	import { productionPlans, tasks as tasksStore, materialInventory } from '$lib/stores';
	import { cosApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import { refreshTasks, refreshPlans } from '$lib/services/dataLoader';
	import type { ProductionPlan, TaskInstance } from '$lib/types';
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
		BarChart3
	} from 'lucide-svelte';

	let activeTab = 'plans';
	let showCreateModal = false;

	// Use tasks from store
	$: tasks = $tasksStore;

	// Create plan form state
	let selectedVersionId = 'ver_1';
	let newBatchSize = 10;
	let isCreatingPlan = false;

	// Task action state
	let startingTaskId: string | null = null;
	let completingTaskId: string | null = null;
	let showCompleteModal = false;
	let taskToComplete: TaskInstance | null = null;
	let completeTaskHours = 0;

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

	async function handleCreatePlan() {
		if (!selectedVersionId || newBatchSize < 1) {
			toasts.error('Validation Error', 'Please select a design and enter a valid batch size');
			return;
		}

		isCreatingPlan = true;
		try {
			const plan = await cosApi.createPlan({
				versionId: selectedVersionId,
				batchSize: newBatchSize
			});
			productionPlans.update(list => [plan, ...list]);
			toasts.success('Plan Created', `Batch #${plan.batchId.split('_')[1]} created with ${plan.batchSize} units`);
			showCreateModal = false;
			newBatchSize = 10;
		} catch (error) {
			toasts.error('Failed to Create Plan', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isCreatingPlan = false;
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
			toasts.success('Task Completed', `Task ${taskToComplete.definitionId} marked as done`);
			showCompleteModal = false;
			taskToComplete = null;
		} catch (error) {
			toasts.error('Failed to Complete Task', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			completingTaskId = null;
		}
	}
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
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
			title="Blocked Tasks"
			value={blockedTasks}
			icon={AlertTriangle}
			color="danger"
		/>
		<StatCard
			title="Expected Hours"
			value={$productionPlans.reduce((sum, p) => sum + p.expectedLaborHours, 0)}
			icon={Clock}
			color="warning"
		/>
	</div>

	<!-- Tabs -->
	<Tabs {tabs} bind:activeTab class="mb-6" />

	{#if activeTab === 'plans'}
		<div class="space-y-4">
			{#if $productionPlans.length === 0}
				<EmptyState
					title="No production plans"
					description="Create a plan to start production"
					icon={Factory}
				>
					<Button slot="action" variant="primary" on:click={() => showCreateModal = true}>
						<Plus size={16} />
						New Plan
					</Button>
				</EmptyState>
			{:else}
				{#each $productionPlans as plan}
					<Card variant="hover" class="group">
						<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div class="flex items-center gap-4">
								<div class="p-3 rounded-xl bg-primary-500/10">
									<Boxes size={24} class="text-primary-400" />
								</div>
								<div>
									<div class="flex items-center gap-2 mb-1">
										<h3 class="text-lg font-medium text-surface-100">Batch #{plan.batchId.split('_')[1]}</h3>
										{#if plan.completedTasks === plan.taskCount}
											<Badge variant="success">Complete</Badge>
										{:else if plan.completedTasks > 0}
											<Badge variant="primary">In Progress</Badge>
										{:else}
											<Badge variant="info">Pending</Badge>
										{/if}
									</div>
									<p class="text-sm text-surface-500">
										{plan.batchSize} units · {plan.taskCount} tasks · Created {formatDate(plan.createdAt)}
									</p>
								</div>
							</div>

							<div class="flex items-center gap-6">
								<div class="text-center">
									<p class="text-2xl font-bold text-surface-100">
										{((plan.completedTasks / plan.taskCount) * 100).toFixed(0)}%
									</p>
									<p class="text-xs text-surface-500">Progress</p>
								</div>
								<div class="text-center">
									<p class="text-2xl font-bold text-surface-100">{plan.expectedLaborHours}h</p>
									<p class="text-xs text-surface-500">Est. Labor</p>
								</div>
								<ChevronRight size={20} class="text-surface-600 group-hover:text-primary-400 transition-colors" />
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
				<h3 class="section-header mb-0">Active Tasks</h3>
				<div class="flex gap-2">
					{#each Object.entries(taskStatusColors) as [status, color]}
						<Badge variant={color} size="sm">
							{status.replace('_', ' ')}: {tasks.filter(t => t.status === status).length}
						</Badge>
					{/each}
				</div>
			</div>

			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="text-left">
							<th class="table-header table-cell">Task</th>
							<th class="table-header table-cell">Batch</th>
							<th class="table-header table-cell">Status</th>
							<th class="table-header table-cell">Participants</th>
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
										<div class="flex -space-x-2">
											{#each task.participants.slice(0, 3) as participant}
												<div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs border-2 border-surface-900">
													{participant.charAt(0)}
												</div>
											{/each}
										</div>
									{:else}
										<span class="text-surface-500">Unassigned</span>
									{/if}
								</td>
								<td class="table-cell text-surface-300">{task.actualHours}h</td>
								<td class="table-cell">
									<div class="flex gap-1">
										{#if task.status === 'pending'}
											<Button size="sm" variant="success" icon on:click={() => handleStartTask(task)} loading={startingTaskId === task.id}>
												<Play size={14} />
											</Button>
										{:else if task.status === 'in_progress'}
											<Button size="sm" variant="secondary" icon on:click={() => openCompleteModal(task)} loading={completingTaskId === task.id}>
												<CheckCircle size={14} />
											</Button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>

	{:else if activeTab === 'materials'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card>
				<h3 class="section-header">Material Inventory</h3>
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
									color={material.scarcityIndex > 0.5 ? 'danger' : material.scarcityIndex > 0.3 ? 'warning' : 'success'}
									size="sm"
									class="flex-1"
								/>
								{#if material.scarcityIndex > 0.5}
									<AlertTriangle size={14} class="text-red-400" />
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<Card>
				<h3 class="section-header">Material Flow</h3>
				<div class="space-y-4">
					<div class="flex items-center justify-between p-3 rounded-lg bg-eco-500/10 border border-eco-500/20">
						<div class="flex items-center gap-2">
							<Package size={18} class="text-eco-400" />
							<span class="text-surface-200">Internal Recycle</span>
						</div>
						<span class="text-eco-400 font-semibold">+15 kg</span>
					</div>
					<div class="flex items-center justify-between p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
						<div class="flex items-center gap-2">
							<Package size={18} class="text-primary-400" />
							<span class="text-surface-200">External Procurement</span>
						</div>
						<span class="text-primary-400 font-semibold">+42 kg</span>
					</div>
					<div class="flex items-center justify-between p-3 rounded-lg bg-warning-500/10 border border-warning-500/20">
						<div class="flex items-center gap-2">
							<Wrench size={18} class="text-warning-400" />
							<span class="text-surface-200">Production Use</span>
						</div>
						<span class="text-warning-400 font-semibold">-38 kg</span>
					</div>
				</div>
			</Card>
		</div>

	{:else if activeTab === 'constraints'}
		<Card>
			<h3 class="section-header">Detected Bottlenecks</h3>
			{#if blockedTasks > 0}
				<div class="space-y-3">
					<div class="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
						<div class="flex items-start gap-3">
							<AlertTriangle size={20} class="text-red-400 mt-0.5" />
							<div>
								<h4 class="font-medium text-surface-100">Material Constraint</h4>
								<p class="text-sm text-surface-400 mt-1">
									Solar cells inventory running low. 3 tasks blocked waiting for procurement.
								</p>
								<div class="flex gap-2 mt-3">
									<Badge variant="danger">Severity: 0.72</Badge>
									<Badge variant="info">Type: Material</Badge>
								</div>
							</div>
						</div>
					</div>

					<div class="p-4 rounded-lg bg-warning-500/10 border border-warning-500/20">
						<div class="flex items-start gap-3">
							<AlertTriangle size={20} class="text-warning-400 mt-0.5" />
							<div>
								<h4 class="font-medium text-surface-100">Skill Constraint</h4>
								<p class="text-sm text-surface-400 mt-1">
									Expert-level welding tasks exceeding available capacity.
								</p>
								<div class="flex gap-2 mt-3">
									<Badge variant="warning">Severity: 0.45</Badge>
									<Badge variant="info">Type: Skill</Badge>
								</div>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<EmptyState
					title="No bottlenecks detected"
					description="All production is flowing smoothly"
					icon={CheckCircle}
				/>
			{/if}
		</Card>
	{/if}
</PageContainer>

<!-- Create Plan Modal -->
<Modal bind:open={showCreateModal} title="Create Production Plan" size="md">
	<div class="space-y-4">
		<div>
			<label class="label">Design Version</label>
			<select class="input" bind:value={selectedVersionId}>
				<option value="ver_1">Solar Panel Mount v2.3</option>
				<option value="ver_2">Modular Greenhouse Frame</option>
				<option value="ver_4">Community Tool Library Rack</option>
			</select>
		</div>
		<Input label="Batch Size" type="number" bind:value={newBatchSize} />
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCreateModal = false} disabled={isCreatingPlan}>Cancel</Button>
		<Button variant="primary" on:click={handleCreatePlan} loading={isCreatingPlan}>Create Plan</Button>
	</svelte:fragment>
</Modal>

<!-- Complete Task Modal -->
<Modal bind:open={showCompleteModal} title="Complete Task" size="sm">
	<div class="space-y-4">
		<p class="text-surface-400">Mark task <span class="text-surface-200 font-medium">{taskToComplete?.definitionId}</span> as complete.</p>
		<Input label="Actual Hours Worked" type="number" step="0.5" bind:value={completeTaskHours} />
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCompleteModal = false} disabled={completingTaskId !== null}>Cancel</Button>
		<Button variant="success" on:click={handleCompleteTask} loading={completingTaskId !== null}>Complete Task</Button>
	</svelte:fragment>
</Modal>
