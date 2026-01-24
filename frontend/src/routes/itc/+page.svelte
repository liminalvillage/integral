<script lang="ts">
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, Modal, Input, StatCard, ProgressBar, EmptyState } from '$lib/components/ui';
	import { itcAccounts, currentAccount, laborEvents, valuations } from '$lib/stores';
	import { itcApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import { refreshLaborEvents } from '$lib/services/dataLoader';
	import type { ITCAccount, LaborEvent, AccessValuation } from '$lib/types';
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
		AlertTriangle,
		CheckCircle,
		ShieldCheck,
		ShoppingCart
	} from 'lucide-svelte';

	let activeTab = 'overview';
	let showRecordModal = false;

	// Use laborEvents store for labor events
	$: recentLabor = $laborEvents;

	// Set first account as current if available and not set
	$: if ($itcAccounts.length > 0 && !$currentAccount) {
		currentAccount.set($itcAccounts[0]);
	}

	// Labor recording form state
	let laborTaskDescription = '';
	let laborStartTime = '';
	let laborEndTime = '';
	let laborSkillTier = 'low';
	let laborTaskId = '';
	let isRecordingLabor = false;

	// Verification state
	let verifyingEventId: string | null = null;

	// Redemption state
	let showRedeemModal = false;
	let selectedValuation: AccessValuation | null = null;
	let isRedeeming = false;

	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'labor', label: 'Labor Events' },
		{ id: 'access', label: 'Access & Redemption' },
		{ id: 'policy', label: 'Policies' }
	];

	const skillTierLabels: Record<string, string> = {
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

	const skillTierWeights: Record<string, number> = {
		low: 1.0,
		medium: 1.2,
		high: 1.5,
		expert: 1.8
	};

	function getSkillTierColor(tier: string): string {
		return skillTierColors[tier] || 'info';
	}

	$: totalCirculating = $itcAccounts.reduce((sum, acc) => sum + acc.balance, 0);

	// Calculate this week's credited hours
	$: thisWeekHours = (() => {
		const oneWeekAgo = new Date();
		oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
		return $laborEvents
			.filter(e => new Date(e.startTime) >= oneWeekAgo)
			.reduce((sum, e) => sum + e.hours * (skillTierWeights[e.skillTier] || 1), 0);
	})();

	// Count pending verifications
	$: pendingVerifications = $laborEvents.filter(e => !e.verified).length;

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
			// Refresh labor events from store
			await refreshLaborEvents();
			const weightedHours = labor.hours * (skillTierWeights[labor.skillTier] || 1);
			toasts.success('Labor Recorded', `${labor.hours.toFixed(1)}h recorded (${weightedHours.toFixed(1)} weighted ITC) - pending peer verification`);
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

	async function handleVerifyLabor(event: LaborEvent) {
		if (event.memberId === ($currentAccount?.memberId ?? 'current_user')) {
			toasts.warning('Cannot Self-Verify', 'You cannot verify your own labor contributions');
			return;
		}

		verifyingEventId = event.id;
		try {
			await itcApi.verifyLabor(event.id, $currentAccount?.memberId ?? 'current_user');
			// Update the event in the store
			laborEvents.update(list =>
				list.map(e => e.id === event.id ? { ...e, verified: true } : e)
			);
			toasts.success('Labor Verified', `You verified ${event.memberId}'s ${event.hours}h contribution`);
		} catch (error) {
			toasts.error('Verification Failed', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			verifyingEventId = null;
		}
	}

	async function handleRedeem(valuation: AccessValuation) {
		if (!$currentAccount) {
			toasts.error('No Account', 'Please select an account first');
			return;
		}

		if ($currentAccount.balance < valuation.finalItcCost) {
			toasts.warning('Insufficient Balance', `You need ${valuation.finalItcCost.toFixed(1)} ITC but only have ${$currentAccount.balance.toFixed(1)} ITC`);
			return;
		}

		selectedValuation = valuation;
		showRedeemModal = true;
	}

	async function confirmRedemption() {
		if (!selectedValuation || !$currentAccount) return;

		isRedeeming = true;
		try {
			const result = await itcApi.redeemAccess({
				memberId: $currentAccount.memberId,
				itemId: selectedValuation.itemId,
				redemptionType: 'access'
			});

			// Update account balance
			itcAccounts.update(list =>
				list.map(acc =>
					acc.memberId === $currentAccount!.memberId
						? { ...acc, balance: result.newBalance, totalRedeemed: acc.totalRedeemed + selectedValuation!.finalItcCost }
						: acc
				)
			);

			if ($currentAccount) {
				currentAccount.set({
					...$currentAccount,
					balance: result.newBalance,
					totalRedeemed: $currentAccount.totalRedeemed + selectedValuation.finalItcCost
				});
			}

			toasts.success('Access Granted', `You now have access to ${selectedValuation.itemId}. New balance: ${result.newBalance.toFixed(1)} ITC`);
			showRedeemModal = false;
			selectedValuation = null;
		} catch (error) {
			toasts.error('Redemption Failed', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isRedeeming = false;
		}
	}

	// Sample valuations for demonstration
	const sampleValuations: AccessValuation[] = [
		{
			itemId: 'solar_panel_mount',
			designVersionId: 'ver_1',
			baseWeightedLaborHours: 18.0,
			ecoBurdenAdjustment: 2.5,
			materialScarcityAdjustment: 1.0,
			repairabilityCredit: -1.5,
			longevityCredit: -1.0,
			finalItcCost: 19.0
		},
		{
			itemId: 'modular_greenhouse_frame',
			designVersionId: 'ver_2',
			baseWeightedLaborHours: 32.0,
			ecoBurdenAdjustment: 1.5,
			materialScarcityAdjustment: 3.0,
			repairabilityCredit: -2.0,
			longevityCredit: -1.5,
			finalItcCost: 33.0
		},
		{
			itemId: 'community_tool_rack',
			designVersionId: 'ver_4',
			baseWeightedLaborHours: 8.0,
			ecoBurdenAdjustment: 0.5,
			materialScarcityAdjustment: 0.5,
			repairabilityCredit: -1.0,
			longevityCredit: -0.5,
			finalItcCost: 7.5
		}
	];
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
				value="+{thisWeekHours.toFixed(1)}"
				subtitle="Weighted hours"
				icon={TrendingUp}
				color="warning"
			/>
			<StatCard
				title="Pending Verification"
				value={pendingVerifications}
				subtitle="Need peer review"
				icon={AlertTriangle}
				color={pendingVerifications > 0 ? 'danger' : 'success'}
			/>
		</div>

		<!-- Recent Labor & Top Contributors -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Recent Labor Events -->
			<Card>
				<div class="flex items-center justify-between mb-4">
					<h3 class="section-header mb-0">Recent Labor Events</h3>
					{#if pendingVerifications > 0}
						<Badge variant="warning">{pendingVerifications} need verification</Badge>
					{/if}
				</div>
				<div class="space-y-3">
					{#each recentLabor.slice(0, 5) as labor}
						<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-medium">
									{labor.memberId.charAt(0).toUpperCase()}
								</div>
								<div>
									<p class="text-sm font-medium text-surface-200">{labor.taskLabel}</p>
									<p class="text-xs text-surface-500">{labor.memberId} - {formatDate(labor.startTime)}</p>
								</div>
							</div>
							<div class="text-right flex items-center gap-3">
								<div>
									<p class="text-lg font-semibold text-primary-400">+{labor.hours}h</p>
									<div class="flex items-center gap-1">
										<Badge variant={skillTierColors[labor.skillTier]} size="sm">
											{skillTierLabels[labor.skillTier]}
										</Badge>
									</div>
								</div>
								{#if labor.verified}
									<div class="text-eco-400" title="Verified by peer">
										<ShieldCheck size={20} />
									</div>
								{:else if labor.memberId !== ($currentAccount?.memberId ?? 'current_user')}
									<Button size="sm" variant="success" on:click={() => handleVerifyLabor(labor)} loading={verifyingEventId === labor.id}>
										<CheckCircle size={14} />
										Verify
									</Button>
								{:else}
									<Badge variant="warning" size="sm">Pending</Badge>
								{/if}
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
								{account.memberId.charAt(0).toUpperCase()}
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
							<th class="table-header table-cell">Weighted</th>
							<th class="table-header table-cell">Skill Tier</th>
							<th class="table-header table-cell">Date</th>
							<th class="table-header table-cell">Status</th>
							<th class="table-header table-cell">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each recentLabor as labor}
							<tr class="table-row">
								<td class="table-cell font-medium text-surface-200">{labor.memberId}</td>
								<td class="table-cell text-surface-300">{labor.taskLabel}</td>
								<td class="table-cell text-primary-400 font-medium">{labor.hours}h</td>
								<td class="table-cell text-eco-400 font-medium">{(labor.hours * (skillTierWeights[labor.skillTier] || 1)).toFixed(1)} ITC</td>
								<td class="table-cell">
									<Badge variant={skillTierColors[labor.skillTier]} size="sm">
										{skillTierLabels[labor.skillTier]} ({skillTierWeights[labor.skillTier]}x)
									</Badge>
								</td>
								<td class="table-cell text-surface-400">{formatDate(labor.startTime)}</td>
								<td class="table-cell">
									{#if labor.verified}
										<Badge variant="success" size="sm">
											<ShieldCheck size={12} class="mr-1" />
											Verified
										</Badge>
									{:else}
										<Badge variant="warning" size="sm">Pending</Badge>
									{/if}
								</td>
								<td class="table-cell">
									{#if !labor.verified && labor.memberId !== ($currentAccount?.memberId ?? 'current_user')}
										<Button size="sm" variant="success" on:click={() => handleVerifyLabor(labor)} loading={verifyingEventId === labor.id}>
											Verify
										</Button>
									{:else if !labor.verified}
										<span class="text-xs text-surface-500">Awaiting peer</span>
									{:else}
										<span class="text-xs text-surface-500">-</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="mt-4 p-3 rounded-lg bg-surface-800/50 text-sm text-surface-400">
				<p><strong>Peer Verification:</strong> Labor contributions must be verified by another member before ITC is fully credited. This ensures accountability and accuracy in the cooperative.</p>
			</div>
		</Card>

	{:else if activeTab === 'access'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card>
				<h3 class="section-header">Available Items</h3>
				<p class="text-sm text-surface-400 mb-4">
					Redeem your ITC to access goods and services. Costs include labor, ecological burden, and material adjustments.
				</p>
				<div class="space-y-4">
					{#each sampleValuations as valuation}
						<div class="p-4 rounded-lg bg-surface-800/50">
							<div class="flex justify-between items-start mb-3">
								<div>
									<h4 class="font-medium text-surface-200 capitalize">{valuation.itemId.replace(/_/g, ' ')}</h4>
									<p class="text-xs text-surface-500">Design: {valuation.designVersionId}</p>
								</div>
								<span class="text-xl font-bold text-primary-400">{valuation.finalItcCost.toFixed(1)} ITC</span>
							</div>
							<div class="text-xs text-surface-500 space-y-1 mb-3">
								<div class="flex justify-between">
									<span>Base labor:</span>
									<span>{valuation.baseWeightedLaborHours.toFixed(1)}h</span>
								</div>
								<div class="flex justify-between">
									<span>Eco adjustment:</span>
									<span class="text-warning-400">+{valuation.ecoBurdenAdjustment.toFixed(1)}h</span>
								</div>
								<div class="flex justify-between">
									<span>Scarcity adjustment:</span>
									<span class="text-warning-400">+{valuation.materialScarcityAdjustment.toFixed(1)}h</span>
								</div>
								<div class="flex justify-between">
									<span>Repairability credit:</span>
									<span class="text-eco-400">{valuation.repairabilityCredit.toFixed(1)}h</span>
								</div>
								<div class="flex justify-between">
									<span>Longevity credit:</span>
									<span class="text-eco-400">{valuation.longevityCredit.toFixed(1)}h</span>
								</div>
							</div>
							<Button
								variant="primary"
								size="sm"
								class="w-full"
								on:click={() => handleRedeem(valuation)}
								disabled={($currentAccount?.balance ?? 0) < valuation.finalItcCost}
							>
								<ShoppingCart size={14} />
								{($currentAccount?.balance ?? 0) >= valuation.finalItcCost ? 'Redeem Access' : 'Insufficient Balance'}
							</Button>
						</div>
					{/each}
				</div>
			</Card>

			<Card>
				<h3 class="section-header">How Valuation Works</h3>
				<div class="space-y-4 text-sm text-surface-300">
					<div class="p-3 rounded-lg bg-surface-800/50">
						<h4 class="font-medium text-surface-200 mb-2">Base Labor</h4>
						<p>The weighted labor hours required to produce the item, calculated from actual production records.</p>
					</div>
					<div class="p-3 rounded-lg bg-surface-800/50">
						<h4 class="font-medium text-surface-200 mb-2">Ecological Burden</h4>
						<p>Additional cost reflecting environmental impact - carbon footprint, energy use, and material toxicity.</p>
					</div>
					<div class="p-3 rounded-lg bg-surface-800/50">
						<h4 class="font-medium text-surface-200 mb-2">Scarcity Adjustment</h4>
						<p>Reflects material availability and sourcing difficulty. Scarce materials increase the cost.</p>
					</div>
					<div class="p-3 rounded-lg bg-eco-500/10 border border-eco-500/20">
						<h4 class="font-medium text-eco-400 mb-2">Credits (Reduce Cost)</h4>
						<p>Designs that are repairable and long-lasting earn credits, reducing the final ITC cost.</p>
					</div>
				</div>
			</Card>
		</div>

	{:else if activeTab === 'policy'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card>
				<h3 class="section-header">Skill Tier Weights</h3>
				<p class="text-sm text-surface-400 mb-4">Labor hours are multiplied by skill tier weight to calculate ITC credits.</p>
				<div class="space-y-3">
					{#each Object.entries(skillTierLabels) as [tier, label]}
						<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
							<Badge variant={getSkillTierColor(tier)}>
								{label}
							</Badge>
							<div class="text-right">
								<span class="text-lg font-semibold text-surface-100">{skillTierWeights[tier]}x</span>
								<p class="text-xs text-surface-500">multiplier</p>
							</div>
						</div>
					{/each}
				</div>
			</Card>

			<Card>
				<h3 class="section-header">Decay Parameters</h3>
				<p class="text-sm text-surface-400 mb-4">ITC balances gradually decay to encourage circulation and active participation.</p>
				<div class="space-y-4">
					<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
						<span class="text-surface-300">Grace Period</span>
						<span class="font-semibold text-surface-100">30 days</span>
					</div>
					<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
						<span class="text-surface-300">Half-life</span>
						<span class="font-semibold text-surface-100">180 days</span>
					</div>
					<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
						<span class="text-surface-300">Protected Balance</span>
						<span class="font-semibold text-surface-100">10 ITC</span>
					</div>
					<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
						<span class="text-surface-300">Max Annual Decay</span>
						<span class="font-semibold text-surface-100">25%</span>
					</div>
				</div>
				<div class="mt-4 p-3 rounded-lg bg-warning-500/10 border border-warning-500/20 text-sm text-surface-300">
					<p><strong>Why Decay?</strong> Decay encourages members to use their ITC actively, keeps the economy circulating, and prevents hoarding.</p>
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
				<option value="low">Basic (1.0x) - General tasks, no special skills</option>
				<option value="medium">Intermediate (1.2x) - Some training required</option>
				<option value="high">Advanced (1.5x) - Significant expertise</option>
				<option value="expert">Expert (1.8x) - Specialized professional skills</option>
			</select>
		</div>
		<Input label="Task ID (optional)" placeholder="Link to COS task for automatic tracking" bind:value={laborTaskId} />
		<div class="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20 text-sm text-surface-300">
			<p><strong>Peer Verification:</strong> Your labor will need to be verified by another cooperative member before ITC is fully credited to your account.</p>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showRecordModal = false} disabled={isRecordingLabor}>Cancel</Button>
		<Button variant="primary" on:click={handleRecordLabor} loading={isRecordingLabor}>Record Labor</Button>
	</svelte:fragment>
</Modal>

<!-- Redeem Access Modal -->
<Modal bind:open={showRedeemModal} title="Confirm Redemption" size="md">
	{#if selectedValuation}
		<div class="space-y-4">
			<div class="p-4 rounded-lg bg-surface-800/50 text-center">
				<p class="text-sm text-surface-400 mb-2">You are about to redeem access to:</p>
				<p class="text-xl font-bold text-surface-100 capitalize">{selectedValuation.itemId.replace(/_/g, ' ')}</p>
				<p class="text-3xl font-bold text-primary-400 mt-2">{selectedValuation.finalItcCost.toFixed(1)} ITC</p>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-surface-400">Your current balance:</span>
				<span class="text-surface-200">{$currentAccount?.balance.toFixed(1) ?? 0} ITC</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-surface-400">Balance after redemption:</span>
				<span class="text-eco-400">{(($currentAccount?.balance ?? 0) - selectedValuation.finalItcCost).toFixed(1)} ITC</span>
			</div>
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => { showRedeemModal = false; selectedValuation = null; }} disabled={isRedeeming}>Cancel</Button>
		<Button variant="primary" on:click={confirmRedemption} loading={isRedeeming}>
			<ShoppingCart size={14} />
			Confirm Redemption
		</Button>
	</svelte:fragment>
</Modal>
