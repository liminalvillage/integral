<script lang="ts">
	import { onMount } from 'svelte';
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, Modal, Input, StatCard, ProgressBar, EmptyState } from '$lib/components/ui';
	import { itcAccounts, currentAccount } from '$lib/stores';
	import { itcApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import type { ITCAccount, LaborEvent } from '$lib/types';
	import {
		Clock,
		Plus,
		TrendingUp,
		TrendingDown,
		Users,
		Wallet,
		ArrowUpRight,
		ArrowDownRight,
		History,
		Timer,
		Award,
		AlertTriangle
	} from 'lucide-svelte';

	let activeTab = 'overview';
	let showRecordModal = false;
	let recentLabor: LaborEvent[] = [];

	// Labor recording form state
	let laborTaskDescription = '';
	let laborStartTime = '';
	let laborEndTime = '';
	let laborSkillTier = 'low';
	let laborTaskId = '';
	let isRecordingLabor = false;

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'labor', label: 'Labor Events' },
		{ id: 'access', label: 'Access & Redemption' },
		{ id: 'policy', label: 'Policies' }
	];

	const skillTierLabels = {
		low: 'Basic',
		medium: 'Intermediate',
		high: 'Advanced',
		expert: 'Expert'
	};

	const skillTierColors: Record<string, string> = {
		low: 'info',
		medium: 'primary',
		high: 'warning',
		expert: 'success'
	};

	function getSkillTierColor(tier: string): string {
		return skillTierColors[tier] || 'info';
	}

	// Mock data
	onMount(() => {
		currentAccount.set({
			id: 'acc_1',
			memberId: 'member_current',
			balance: 127.5,
			totalEarned: 342.0,
			totalRedeemed: 186.5,
			totalDecayed: 28.0,
			lastDecayAppliedAt: new Date(Date.now() - 86400000 * 7).toISOString()
		});

		itcAccounts.set([
			{ id: 'acc_1', memberId: 'Alice', balance: 127.5, totalEarned: 342.0, totalRedeemed: 186.5, totalDecayed: 28.0, lastDecayAppliedAt: '' },
			{ id: 'acc_2', memberId: 'Bob', balance: 89.2, totalEarned: 215.0, totalRedeemed: 110.3, totalDecayed: 15.5, lastDecayAppliedAt: '' },
			{ id: 'acc_3', memberId: 'Carol', balance: 156.8, totalEarned: 423.0, totalRedeemed: 245.2, totalDecayed: 21.0, lastDecayAppliedAt: '' },
			{ id: 'acc_4', memberId: 'Dave', balance: 45.3, totalEarned: 128.0, totalRedeemed: 75.7, totalDecayed: 7.0, lastDecayAppliedAt: '' }
		]);

		recentLabor = [
			{
				id: 'labor_1',
				memberId: 'Alice',
				taskId: 'task_1',
				taskLabel: 'Solar panel assembly',
				hours: 4.5,
				skillTier: 'high',
				startTime: new Date(Date.now() - 3600000 * 6).toISOString(),
				endTime: new Date(Date.now() - 3600000 * 1.5).toISOString(),
				verified: true
			},
			{
				id: 'labor_2',
				memberId: 'Bob',
				taskId: 'task_2',
				taskLabel: 'Workshop maintenance',
				hours: 2.0,
				skillTier: 'medium',
				startTime: new Date(Date.now() - 86400000).toISOString(),
				endTime: new Date(Date.now() - 86400000 + 7200000).toISOString(),
				verified: true
			},
			{
				id: 'labor_3',
				memberId: 'Carol',
				taskId: 'task_3',
				taskLabel: 'Documentation writing',
				hours: 3.0,
				skillTier: 'medium',
				startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
				endTime: new Date(Date.now() - 86400000 * 2 + 10800000).toISOString(),
				verified: false
			}
		];
	});

	$: totalCirculating = $itcAccounts.reduce((sum, acc) => sum + acc.balance, 0);

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleViewAllEvents() {
		activeTab = 'labor';
	}

	async function handleRecordLabor() {
		if (!laborTaskDescription.trim() || !laborStartTime || !laborEndTime) {
			toasts.error('Validation Error', 'Task description and times are required');
			return;
		}

		isRecordingLabor = true;
		try {
			const labor = await itcApi.recordLabor({
				memberId: $currentAccount?.memberId ?? 'current_user',
				taskId: laborTaskId || `task_${Date.now()}`,
				taskLabel: laborTaskDescription.trim(),
				startTime: laborStartTime,
				endTime: laborEndTime,
				skillTier: laborSkillTier
			});
			recentLabor = [labor, ...recentLabor];
			toasts.success('Labor Recorded', `${labor.hours}h recorded for "${labor.taskLabel}"`);
			showRecordModal = false;
			// Reset form
			laborTaskDescription = '';
			laborStartTime = '';
			laborEndTime = '';
			laborSkillTier = 'low';
			laborTaskId = '';
		} catch (error) {
			toasts.error('Failed to Record Labor', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isRecordingLabor = false;
		}
	}
</script>

<Header
	title="Integral Time Credits"
	subtitle="Contribution accounting and access valuation"
	showCreateButton
	createButtonLabel="Record Labor"
	on:create={() => showRecordModal = true}
/>

<PageContainer>
	<!-- Account Overview -->
	{#if $currentAccount}
		<Card class="mb-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20">
			<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="p-4 rounded-2xl bg-primary-500/20">
						<Wallet size={32} class="text-primary-400" />
					</div>
					<div>
						<p class="text-sm text-surface-400">Your Balance</p>
						<p class="text-4xl font-bold text-surface-100">{$currentAccount.balance.toFixed(1)} <span class="text-lg text-surface-400">ITC</span></p>
					</div>
				</div>
				<div class="grid grid-cols-3 gap-6">
					<div class="text-center">
						<p class="flex items-center justify-center gap-1 text-eco-400">
							<ArrowUpRight size={16} />
							{$currentAccount.totalEarned.toFixed(1)}
						</p>
						<p class="text-xs text-surface-500">Total Earned</p>
					</div>
					<div class="text-center">
						<p class="flex items-center justify-center gap-1 text-warning-400">
							<ArrowDownRight size={16} />
							{$currentAccount.totalRedeemed.toFixed(1)}
						</p>
						<p class="text-xs text-surface-500">Redeemed</p>
					</div>
					<div class="text-center">
						<p class="flex items-center justify-center gap-1 text-surface-400">
							<TrendingDown size={16} />
							{$currentAccount.totalDecayed.toFixed(1)}
						</p>
						<p class="text-xs text-surface-500">Decayed</p>
					</div>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Tabs -->
	<Tabs {tabs} bind:activeTab class="mb-6" />

	{#if activeTab === 'overview'}
		<!-- Stats Grid -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
			<StatCard
				title="Circulating ITC"
				value={totalCirculating.toFixed(1)}
				icon={Clock}
				color="primary"
			/>
			<StatCard
				title="Active Members"
				value={$itcAccounts.length}
				icon={Users}
				color="success"
			/>
			<StatCard
				title="This Week"
				value="+48.5"
				subtitle="Hours credited"
				icon={TrendingUp}
				color="warning"
			/>
			<StatCard
				title="Decay Rate"
				value="20%"
				subtitle="Annual max"
				icon={Timer}
				color="danger"
			/>
		</div>

		<!-- Recent Labor & Top Contributors -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Recent Labor Events -->
			<Card>
				<h3 class="section-header">Recent Labor Events</h3>
				<div class="space-y-3">
					{#each recentLabor as labor}
						<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium">
									{labor.memberId.charAt(0)}
								</div>
								<div>
									<p class="text-sm font-medium text-surface-200">{labor.taskLabel}</p>
									<p class="text-xs text-surface-500">{labor.memberId} · {formatDate(labor.startTime)}</p>
								</div>
							</div>
							<div class="text-right">
								<p class="text-lg font-semibold text-primary-400">+{labor.hours}h</p>
								<div class="flex items-center gap-1">
									<Badge variant={skillTierColors[labor.skillTier]} size="sm">
										{skillTierLabels[labor.skillTier]}
									</Badge>
									{#if labor.verified}
										<Badge variant="success" size="sm">Verified</Badge>
									{:else}
										<Badge variant="warning" size="sm">Pending</Badge>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
				<Button variant="ghost" class="w-full mt-4" on:click={handleViewAllEvents}>
					<History size={16} />
					View All Events
				</Button>
			</Card>

			<!-- Member Balances -->
			<Card>
				<h3 class="section-header">Member Balances</h3>
				<div class="space-y-3">
					{#each $itcAccounts.sort((a, b) => b.balance - a.balance) as account, i}
						<div class="flex items-center gap-3">
							<span class="w-6 text-sm text-surface-500 font-medium">#{i + 1}</span>
							<div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium">
								{account.memberId.charAt(0)}
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-surface-200">{account.memberId}</p>
								<ProgressBar
									value={account.balance}
									max={Math.max(...$itcAccounts.map(a => a.balance))}
									color="primary"
									size="sm"
								/>
							</div>
							<p class="text-lg font-semibold text-surface-100">{account.balance.toFixed(1)}</p>
						</div>
					{/each}
				</div>
			</Card>
		</div>

	{:else if activeTab === 'labor'}
		<Card>
			<div class="flex items-center justify-between mb-4">
				<h3 class="section-header mb-0">Labor Events</h3>
				<Button variant="primary" size="sm" on:click={() => showRecordModal = true}>
					<Plus size={16} />
					Record Labor
				</Button>
			</div>

			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="text-left">
							<th class="table-header table-cell">Member</th>
							<th class="table-header table-cell">Task</th>
							<th class="table-header table-cell">Hours</th>
							<th class="table-header table-cell">Skill Tier</th>
							<th class="table-header table-cell">Date</th>
							<th class="table-header table-cell">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each recentLabor as labor}
							<tr class="table-row">
								<td class="table-cell font-medium text-surface-200">{labor.memberId}</td>
								<td class="table-cell text-surface-300">{labor.taskLabel}</td>
								<td class="table-cell text-primary-400 font-medium">{labor.hours}h</td>
								<td class="table-cell">
									<Badge variant={skillTierColors[labor.skillTier]} size="sm">
										{skillTierLabels[labor.skillTier]}
									</Badge>
								</td>
								<td class="table-cell text-surface-400">{formatDate(labor.startTime)}</td>
								<td class="table-cell">
									{#if labor.verified}
										<Badge variant="success" size="sm">Verified</Badge>
									{:else}
										<Badge variant="warning" size="sm">Pending</Badge>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>

	{:else if activeTab === 'access'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card>
				<h3 class="section-header">Access Valuation</h3>
				<p class="text-sm text-surface-400 mb-4">
					ITC costs are computed from weighted labor, ecological burden, and scarcity factors.
				</p>
				<div class="space-y-4">
					<div class="p-4 rounded-lg bg-surface-800/50">
						<div class="flex justify-between mb-2">
							<span class="text-surface-300">Solar Panel Mount</span>
							<span class="text-primary-400 font-semibold">24.5 ITC</span>
						</div>
						<div class="text-xs text-surface-500 space-y-1">
							<div class="flex justify-between">
								<span>Base labor:</span>
								<span>18.0h</span>
							</div>
							<div class="flex justify-between">
								<span>Eco adjustment:</span>
								<span>+2.5h</span>
							</div>
							<div class="flex justify-between">
								<span>Repairability credit:</span>
								<span>-1.5h</span>
							</div>
							<div class="flex justify-between">
								<span>Longevity credit:</span>
								<span>-1.0h</span>
							</div>
						</div>
					</div>
				</div>
			</Card>

			<Card>
				<h3 class="section-header">Recent Redemptions</h3>
				<EmptyState
					title="No recent redemptions"
					description="Redeem ITC to access goods and services"
					icon={Wallet}
				/>
			</Card>
		</div>

	{:else if activeTab === 'policy'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card>
				<h3 class="section-header">Skill Tier Weights</h3>
				<div class="space-y-3">
					{#each Object.entries(skillTierLabels) as [tier, label]}
						<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
							<Badge variant={getSkillTierColor(tier)}>
								{label}
							</Badge>
							<span class="text-lg font-semibold text-surface-100">
								{tier === 'low' ? '1.0x' : tier === 'medium' ? '1.2x' : tier === 'high' ? '1.5x' : '1.8x'}
							</span>
						</div>
					{/each}
				</div>
			</Card>

			<Card>
				<h3 class="section-header">Decay Parameters</h3>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<span class="text-surface-400">Grace Period</span>
						<span class="font-semibold text-surface-100">30 days</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-surface-400">Half-life</span>
						<span class="font-semibold text-surface-100">180 days</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-surface-400">Protected Balance</span>
						<span class="font-semibold text-surface-100">10 ITC</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-surface-400">Max Annual Decay</span>
						<span class="font-semibold text-surface-100">25%</span>
					</div>
				</div>
			</Card>
		</div>
	{/if}
</PageContainer>

<!-- Record Labor Modal -->
<Modal bind:open={showRecordModal} title="Record Labor Event" size="lg">
	<div class="space-y-4">
		<Input label="Task Description" placeholder="What work was performed?" bind:value={laborTaskDescription} />
		<div class="grid grid-cols-2 gap-4">
			<Input label="Start Time" type="datetime-local" bind:value={laborStartTime} />
			<Input label="End Time" type="datetime-local" bind:value={laborEndTime} />
		</div>
		<div>
			<label class="label">Skill Tier</label>
			<select class="input" bind:value={laborSkillTier}>
				<option value="low">Basic (1.0x)</option>
				<option value="medium">Intermediate (1.2x)</option>
				<option value="high">Advanced (1.5x)</option>
				<option value="expert">Expert (1.8x)</option>
			</select>
		</div>
		<Input label="Task ID (optional)" placeholder="Link to COS task" bind:value={laborTaskId} />
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showRecordModal = false} disabled={isRecordingLabor}>Cancel</Button>
		<Button variant="primary" on:click={handleRecordLabor} loading={isRecordingLabor}>Record Labor</Button>
	</svelte:fragment>
</Modal>
