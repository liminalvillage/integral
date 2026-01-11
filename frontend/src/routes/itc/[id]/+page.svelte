<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Modal, Input, ProgressBar, EmptyState } from '$lib/components/ui';
	import { itcApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import type { LaborEvent, ITCAccount, AccessValuation, WeightingPolicy, SkillTier } from '$lib/types';
	import {
		ArrowLeft,
		Clock,
		User,
		CheckCircle,
		XCircle,
		AlertTriangle,
		TrendingUp,
		TrendingDown,
		Calculator,
		Zap,
		Leaf,
		Package,
		Award,
		History,
		Link,
		Timer,
		Wallet,
		RefreshCw,
		Shield,
		FileText,
		ExternalLink
	} from 'lucide-svelte';

	const laborId = $page.params.id;

	// Labor event data
	let laborEvent: LaborEvent | null = null;
	let memberAccount: ITCAccount | null = null;
	let isLoading = true;
	let isVerifying = false;

	// Credit calculation breakdown
	let creditBreakdown: {
		baseHours: number;
		skillMultiplier: number;
		skillTierCredits: number;
		urgencyWeight: number;
		ecoWeight: number;
		scarcityWeight: number;
		contextBonus: number;
		totalCredits: number;
	} | null = null;

	// Weighting policy
	let weightingPolicy: WeightingPolicy | null = null;

	// Related data
	let relatedLabor: LaborEvent[] = [];
	let relatedValuations: AccessValuation[] = [];

	// Verification modal
	let showVerifyModal = false;
	let verificationNotes = '';

	// Redemption modal
	let showRedeemModal = false;
	let selectedItem: AccessValuation | null = null;
	let isRedeeming = false;

	// Decay simulation
	let decayProjection: { days: number; balance: number }[] = [];

	const skillTierLabels: Record<string, string> = {
		low: 'Basic',
		medium: 'Intermediate',
		high: 'Advanced',
		expert: 'Expert'
	};

	const skillTierMultipliers: Record<string, number> = {
		low: 1.0,
		medium: 1.2,
		high: 1.5,
		expert: 1.8
	};

	const skillTierColors: Record<string, 'info' | 'primary' | 'warning' | 'success'> = {
		low: 'info',
		medium: 'primary',
		high: 'warning',
		expert: 'success'
	};

	onMount(async () => {
		await loadLaborEvent();
	});

	async function loadLaborEvent() {
		isLoading = true;
		try {
			// In a real app, we'd fetch by ID. For demo, create mock data based on ID
			const events = await itcApi.listLaborEvents(undefined, 100);
			laborEvent = events.find(e => e.id === laborId) || createMockLaborEvent(laborId);

			if (laborEvent) {
				// Load member account
				memberAccount = await itcApi.getAccount(laborEvent.memberId) || createMockAccount(laborEvent.memberId);

				// Calculate credit breakdown
				calculateCreditBreakdown();

				// Generate decay projection
				generateDecayProjection();

				// Load related labor events from same member
				relatedLabor = events
					.filter(e => e.memberId === laborEvent!.memberId && e.id !== laborId)
					.slice(0, 5);

				// Mock related valuations
				relatedValuations = [
					{
						itemId: 'item_1',
						designVersionId: 'ver_1',
						baseWeightedLaborHours: 18.0,
						ecoBurdenAdjustment: 2.5,
						materialScarcityAdjustment: 1.2,
						repairabilityCredit: -1.5,
						longevityCredit: -1.0,
						finalItcCost: 19.2
					},
					{
						itemId: 'item_2',
						designVersionId: 'ver_2',
						baseWeightedLaborHours: 8.5,
						ecoBurdenAdjustment: 0.8,
						materialScarcityAdjustment: 0.3,
						repairabilityCredit: -0.5,
						longevityCredit: -0.3,
						finalItcCost: 8.8
					}
				];
			}
		} catch (error) {
			console.error('Failed to load labor event:', error);
			toasts.error('Error', 'Failed to load labor event details');
		} finally {
			isLoading = false;
		}
	}

	function createMockLaborEvent(id: string): LaborEvent {
		return {
			id,
			memberId: 'Alice',
			taskId: 'task_' + id.slice(-1),
			taskLabel: 'Solar panel assembly and testing',
			hours: 4.5,
			skillTier: 'high' as SkillTier,
			startTime: new Date(Date.now() - 3600000 * 6).toISOString(),
			endTime: new Date(Date.now() - 3600000 * 1.5).toISOString(),
			verified: false
		};
	}

	function createMockAccount(memberId: string): ITCAccount {
		return {
			id: 'acc_' + memberId.toLowerCase(),
			memberId,
			balance: 127.5,
			totalEarned: 342.0,
			totalRedeemed: 186.5,
			totalDecayed: 28.0,
			lastDecayAppliedAt: new Date(Date.now() - 86400000 * 7).toISOString()
		};
	}

	function calculateCreditBreakdown() {
		if (!laborEvent) return;

		const baseHours = laborEvent.hours;
		const skillMultiplier = skillTierMultipliers[laborEvent.skillTier] || 1.0;
		const skillTierCredits = baseHours * skillMultiplier;

		// Mock context weights (in real app, these come from WeightingPolicy)
		const urgencyWeight = 1.15; // 15% urgency bonus
		const ecoWeight = 1.0; // No eco adjustment for this task
		const scarcityWeight = 1.0; // No scarcity adjustment

		const contextBonus = skillTierCredits * (urgencyWeight * ecoWeight * scarcityWeight - 1);
		const totalCredits = skillTierCredits + contextBonus;

		creditBreakdown = {
			baseHours,
			skillMultiplier,
			skillTierCredits,
			urgencyWeight,
			ecoWeight,
			scarcityWeight,
			contextBonus,
			totalCredits
		};
	}

	function generateDecayProjection() {
		if (!memberAccount) return;

		const gracePeriodDays = 30;
		const halfLifeDays = 180;
		const protectedBalance = 10;
		const maxAnnualDecay = 0.25;

		decayProjection = [];
		let balance = memberAccount.balance;

		for (let day = 0; day <= 365; day += 30) {
			if (day <= gracePeriodDays) {
				decayProjection.push({ days: day, balance });
			} else {
				// Simplified decay calculation
				const decayablePortion = Math.max(0, balance - protectedBalance);
				const decayFactor = Math.pow(0.5, (day - gracePeriodDays) / halfLifeDays);
				const projectedBalance = protectedBalance + decayablePortion * decayFactor;
				decayProjection.push({ days: day, balance: Math.max(projectedBalance, protectedBalance) });
			}
		}
	}

	function formatDateTime(dateString: string): string {
		return new Date(dateString).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	function calculateDuration(start: string, end: string): string {
		const diff = new Date(end).getTime() - new Date(start).getTime();
		const hours = Math.floor(diff / 3600000);
		const minutes = Math.floor((diff % 3600000) / 60000);
		return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
	}

	async function handleVerify() {
		if (!laborEvent) return;

		isVerifying = true;
		try {
			const verified = await itcApi.verifyLabor(laborEvent.id, 'current_user');
			laborEvent = verified;
			toasts.success('Labor Verified', 'The labor event has been verified and credits awarded');
			showVerifyModal = false;
		} catch (error) {
			toasts.error('Verification Failed', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isVerifying = false;
		}
	}

	async function handleRedeem() {
		if (!selectedItem || !memberAccount) return;

		isRedeeming = true;
		try {
			const result = await itcApi.redeemAccess({
				memberId: memberAccount.memberId,
				itemId: selectedItem.itemId,
				redemptionType: 'access'
			});

			if (result.success) {
				memberAccount.balance = result.newBalance;
				toasts.success('Access Granted', `Successfully redeemed ${selectedItem.finalItcCost.toFixed(1)} ITC`);
				showRedeemModal = false;
				selectedItem = null;
			}
		} catch (error) {
			toasts.error('Redemption Failed', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isRedeeming = false;
		}
	}

	function openRedeemModal(valuation: AccessValuation) {
		selectedItem = valuation;
		showRedeemModal = true;
	}

	function goBack() {
		goto('/itc');
	}
</script>

<Header
	title={laborEvent?.taskLabel ?? 'Labor Event Details'}
	subtitle="ITC credit calculation and verification"
/>

<PageContainer>
	<!-- Back Navigation -->
	<Button variant="ghost" class="mb-4" on:click={goBack}>
		<ArrowLeft size={16} />
		Back to ITC Overview
	</Button>

	{#if isLoading}
		<Card class="p-8 text-center">
			<RefreshCw size={32} class="animate-spin text-primary-400 mx-auto mb-4" />
			<p class="text-surface-400">Loading labor event details...</p>
		</Card>
	{:else if laborEvent}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Main Content - 2 columns -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Labor Event Summary -->
				<Card>
					<div class="flex items-start justify-between mb-4">
						<div class="flex items-center gap-3">
							<Badge variant={laborEvent.verified ? 'success' : 'warning'}>
								{#if laborEvent.verified}
									<CheckCircle size={12} class="mr-1" />
									Verified
								{:else}
									<Clock size={12} class="mr-1" />
									Pending Verification
								{/if}
							</Badge>
							<Badge variant={skillTierColors[laborEvent.skillTier]}>
								{skillTierLabels[laborEvent.skillTier]} ({skillTierMultipliers[laborEvent.skillTier]}x)
							</Badge>
						</div>
						{#if !laborEvent.verified}
							<Button variant="primary" size="sm" on:click={() => showVerifyModal = true}>
								<Shield size={14} />
								Verify Labor
							</Button>
						{/if}
					</div>

					<h2 class="text-2xl font-bold text-surface-100 mb-2">{laborEvent.taskLabel}</h2>

					<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
						<div class="p-3 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-2 text-surface-500 text-sm mb-1">
								<User size={14} />
								Member
							</div>
							<p class="text-surface-100 font-medium">{laborEvent.memberId}</p>
						</div>
						<div class="p-3 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-2 text-surface-500 text-sm mb-1">
								<Clock size={14} />
								Duration
							</div>
							<p class="text-surface-100 font-medium">{laborEvent.hours}h</p>
							<p class="text-xs text-surface-500">{calculateDuration(laborEvent.startTime, laborEvent.endTime)}</p>
						</div>
						<div class="p-3 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-2 text-surface-500 text-sm mb-1">
								<Timer size={14} />
								Start Time
							</div>
							<p class="text-surface-100 font-medium text-sm">{formatDateTime(laborEvent.startTime)}</p>
						</div>
						<div class="p-3 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-2 text-surface-500 text-sm mb-1">
								<Timer size={14} />
								End Time
							</div>
							<p class="text-surface-100 font-medium text-sm">{formatDateTime(laborEvent.endTime)}</p>
						</div>
					</div>

					{#if laborEvent.taskId}
						<div class="mt-4 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Link size={14} class="text-primary-400" />
									<span class="text-sm text-surface-300">Linked to COS Task:</span>
									<span class="text-primary-400 font-mono text-sm">{laborEvent.taskId}</span>
								</div>
								<Button variant="ghost" size="sm" on:click={() => goto(`/cos/${laborEvent?.taskId}`)}>
									<ExternalLink size={14} />
									View Task
								</Button>
							</div>
						</div>
					{/if}
				</Card>

				<!-- Credit Calculation Breakdown -->
				{#if creditBreakdown}
					<Card>
						<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
							<Calculator size={20} class="text-primary-400" />
							Credit Calculation Breakdown
						</h3>

						<div class="space-y-4">
							<!-- Base Hours -->
							<div class="p-4 rounded-lg bg-surface-800/50">
								<div class="flex items-center justify-between mb-2">
									<span class="text-surface-300">Base Hours Worked</span>
									<span class="text-xl font-bold text-surface-100">{creditBreakdown.baseHours}h</span>
								</div>
								<p class="text-sm text-surface-500">Raw time recorded for this task</p>
							</div>

							<!-- Skill Tier Multiplier -->
							<div class="p-4 rounded-lg bg-surface-800/50">
								<div class="flex items-center justify-between mb-2">
									<div class="flex items-center gap-2">
										<Award size={16} class="text-warning-400" />
										<span class="text-surface-300">Skill Tier Multiplier</span>
									</div>
									<span class="text-lg font-semibold text-warning-400">×{creditBreakdown.skillMultiplier}</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<span class="text-surface-500">{skillTierLabels[laborEvent.skillTier]} skill level</span>
									<span class="text-surface-300">{creditBreakdown.baseHours}h × {creditBreakdown.skillMultiplier} = {creditBreakdown.skillTierCredits.toFixed(2)} ITC</span>
								</div>
							</div>

							<!-- Context Factors -->
							<div class="p-4 rounded-lg bg-surface-800/50">
								<h4 class="text-sm font-medium text-surface-400 mb-3">Context Factors</h4>
								<div class="grid grid-cols-3 gap-4">
									<div class="text-center p-3 rounded-lg bg-surface-900/50">
										<Zap size={18} class="text-warning-400 mx-auto mb-1" />
										<p class="text-xs text-surface-500 mb-1">Urgency</p>
										<p class="font-semibold text-surface-100">×{creditBreakdown.urgencyWeight}</p>
									</div>
									<div class="text-center p-3 rounded-lg bg-surface-900/50">
										<Leaf size={18} class="text-eco-400 mx-auto mb-1" />
										<p class="text-xs text-surface-500 mb-1">Eco Sensitivity</p>
										<p class="font-semibold text-surface-100">×{creditBreakdown.ecoWeight}</p>
									</div>
									<div class="text-center p-3 rounded-lg bg-surface-900/50">
										<Package size={18} class="text-accent-400 mx-auto mb-1" />
										<p class="text-xs text-surface-500 mb-1">Scarcity</p>
										<p class="font-semibold text-surface-100">×{creditBreakdown.scarcityWeight}</p>
									</div>
								</div>
								{#if creditBreakdown.contextBonus > 0}
									<div class="mt-3 flex items-center justify-between text-sm">
										<span class="text-surface-500">Context bonus applied:</span>
										<span class="text-eco-400 font-medium">+{creditBreakdown.contextBonus.toFixed(2)} ITC</span>
									</div>
								{/if}
							</div>

							<!-- Total Credits -->
							<div class="p-4 rounded-lg bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30">
								<div class="flex items-center justify-between">
									<div>
										<span class="text-surface-300">Total Credits Earned</span>
										{#if !laborEvent.verified}
											<p class="text-xs text-warning-400 mt-1">Pending verification</p>
										{/if}
									</div>
									<span class="text-3xl font-bold text-primary-400">{creditBreakdown.totalCredits.toFixed(2)} ITC</span>
								</div>
							</div>
						</div>
					</Card>
				{/if}

				<!-- Verification History -->
				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
						<Shield size={20} class="text-eco-400" />
						Verification Status
					</h3>

					{#if laborEvent.verified}
						<div class="p-4 rounded-lg bg-eco-500/10 border border-eco-500/20">
							<div class="flex items-start gap-3">
								<CheckCircle size={24} class="text-eco-400 flex-shrink-0 mt-1" />
								<div>
									<p class="text-surface-100 font-medium">Verified</p>
									<p class="text-sm text-surface-400 mt-1">
										This labor event has been verified. Credits have been added to {laborEvent.memberId}'s account.
									</p>
									<div class="mt-3 text-sm text-surface-500">
										<p>Verified by: <span class="text-surface-300">Carol</span></p>
										<p>Verified at: <span class="text-surface-300">{formatDateTime(new Date().toISOString())}</span></p>
									</div>
								</div>
							</div>
						</div>
					{:else}
						<div class="p-4 rounded-lg bg-warning-500/10 border border-warning-500/20">
							<div class="flex items-start gap-3">
								<AlertTriangle size={24} class="text-warning-400 flex-shrink-0 mt-1" />
								<div class="flex-1">
									<p class="text-surface-100 font-medium">Pending Verification</p>
									<p class="text-sm text-surface-400 mt-1">
										This labor event is waiting for verification. Credits will be awarded once verified by an authorized member.
									</p>
									<div class="mt-4">
										<h4 class="text-sm font-medium text-surface-300 mb-2">Verification Requirements:</h4>
										<ul class="text-sm text-surface-400 space-y-1">
											<li class="flex items-center gap-2">
												<div class="w-1.5 h-1.5 rounded-full bg-surface-500"></div>
												At least one witness or supervisor confirmation
											</li>
											<li class="flex items-center gap-2">
												<div class="w-1.5 h-1.5 rounded-full bg-surface-500"></div>
												Task completion evidence (if applicable)
											</li>
											<li class="flex items-center gap-2">
												<div class="w-1.5 h-1.5 rounded-full bg-surface-500"></div>
												No duplicate claims for the same time period
											</li>
										</ul>
									</div>
									<Button variant="primary" class="mt-4" on:click={() => showVerifyModal = true}>
										<Shield size={16} />
										Verify This Labor Event
									</Button>
								</div>
							</div>
						</div>
					{/if}
				</Card>

				<!-- Access Valuation & Redemption -->
				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
						<Wallet size={20} class="text-accent-400" />
						Access Valuation & Redemption
					</h3>

					<p class="text-sm text-surface-400 mb-4">
						Use your ITC balance to access goods, services, and equipment. Costs are calculated from weighted labor, ecological factors, and scarcity.
					</p>

					<div class="space-y-3">
						{#each relatedValuations as valuation}
							<div class="p-4 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors">
								<div class="flex items-center justify-between mb-3">
									<div>
										<p class="font-medium text-surface-100">
											{valuation.itemId === 'item_1' ? 'Solar Panel Mount v2.3' : 'Hand Tool Set'}
										</p>
										<p class="text-xs text-surface-500">Design: {valuation.designVersionId}</p>
									</div>
									<div class="text-right">
										<p class="text-xl font-bold text-primary-400">{valuation.finalItcCost.toFixed(1)} ITC</p>
										<p class="text-xs text-surface-500">
											{memberAccount && memberAccount.balance >= valuation.finalItcCost ? 'Affordable' : 'Insufficient balance'}
										</p>
									</div>
								</div>

								<div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-3">
									<div class="p-2 rounded bg-surface-900/50">
										<span class="text-surface-500">Base labor:</span>
										<span class="text-surface-300 ml-1">{valuation.baseWeightedLaborHours}h</span>
									</div>
									<div class="p-2 rounded bg-surface-900/50">
										<span class="text-surface-500">Eco burden:</span>
										<span class="text-warning-400 ml-1">+{valuation.ecoBurdenAdjustment}h</span>
									</div>
									<div class="p-2 rounded bg-surface-900/50">
										<span class="text-surface-500">Repairability:</span>
										<span class="text-eco-400 ml-1">{valuation.repairabilityCredit}h</span>
									</div>
									<div class="p-2 rounded bg-surface-900/50">
										<span class="text-surface-500">Longevity:</span>
										<span class="text-eco-400 ml-1">{valuation.longevityCredit}h</span>
									</div>
								</div>

								<Button
									variant={memberAccount && memberAccount.balance >= valuation.finalItcCost ? 'primary' : 'secondary'}
									size="sm"
									class="w-full"
									disabled={!memberAccount || memberAccount.balance < valuation.finalItcCost}
									on:click={() => openRedeemModal(valuation)}
								>
									{memberAccount && memberAccount.balance >= valuation.finalItcCost ? 'Redeem Access' : 'Insufficient Balance'}
								</Button>
							</div>
						{/each}
					</div>
				</Card>
			</div>

			<!-- Sidebar - 1 column -->
			<div class="space-y-6">
				<!-- Account Summary -->
				{#if memberAccount}
					<Card class="bg-gradient-to-br from-primary-500/10 to-accent-500/10 border-primary-500/20">
						<h3 class="text-lg font-semibold text-surface-100 mb-4">{memberAccount.memberId}'s Account</h3>

						<div class="text-center mb-4">
							<p class="text-4xl font-bold text-surface-100">{memberAccount.balance.toFixed(1)}</p>
							<p class="text-sm text-surface-400">ITC Balance</p>
						</div>

						<div class="space-y-3">
							<div class="flex items-center justify-between text-sm">
								<span class="text-surface-400 flex items-center gap-2">
									<TrendingUp size={14} class="text-eco-400" />
									Total Earned
								</span>
								<span class="text-surface-100">{memberAccount.totalEarned.toFixed(1)} ITC</span>
							</div>
							<div class="flex items-center justify-between text-sm">
								<span class="text-surface-400 flex items-center gap-2">
									<Wallet size={14} class="text-warning-400" />
									Redeemed
								</span>
								<span class="text-surface-100">{memberAccount.totalRedeemed.toFixed(1)} ITC</span>
							</div>
							<div class="flex items-center justify-between text-sm">
								<span class="text-surface-400 flex items-center gap-2">
									<TrendingDown size={14} class="text-surface-500" />
									Decayed
								</span>
								<span class="text-surface-100">{memberAccount.totalDecayed.toFixed(1)} ITC</span>
							</div>
						</div>
					</Card>
				{/if}

				<!-- Decay Projection -->
				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
						<Timer size={18} class="text-surface-400" />
						Decay Projection
					</h3>

					<p class="text-sm text-surface-400 mb-4">
						Credits decay over time to encourage circulation. Grace period: 30 days, Half-life: 180 days.
					</p>

					<div class="space-y-2">
						{#each decayProjection as point}
							<div class="flex items-center gap-3">
								<span class="text-xs text-surface-500 w-16">{point.days} days</span>
								<div class="flex-1">
									<ProgressBar
										value={point.balance}
										max={memberAccount?.balance ?? 100}
										color={point.balance > (memberAccount?.balance ?? 0) * 0.7 ? 'success' : point.balance > (memberAccount?.balance ?? 0) * 0.4 ? 'warning' : 'danger'}
										size="sm"
									/>
								</div>
								<span class="text-sm font-medium text-surface-300 w-16 text-right">{point.balance.toFixed(1)}</span>
							</div>
						{/each}
					</div>

					<div class="mt-4 p-3 rounded-lg bg-surface-800/50 text-xs text-surface-400">
						<p><strong>Protected balance:</strong> 10 ITC (never decays)</p>
						<p><strong>Max annual decay:</strong> 25%</p>
					</div>
				</Card>

				<!-- Related Labor Events -->
				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
						<History size={18} class="text-surface-400" />
						Recent Labor by {laborEvent.memberId}
					</h3>

					{#if relatedLabor.length > 0}
						<div class="space-y-2">
							{#each relatedLabor as event}
								<button
									class="w-full p-3 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors text-left"
									on:click={() => goto(`/itc/${event.id}`)}
								>
									<div class="flex items-center justify-between">
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium text-surface-200 truncate">{event.taskLabel}</p>
											<p class="text-xs text-surface-500">{formatDate(event.startTime)}</p>
										</div>
										<div class="text-right ml-2">
											<p class="text-sm font-semibold text-primary-400">+{event.hours}h</p>
											{#if event.verified}
												<CheckCircle size={12} class="text-eco-400 ml-auto" />
											{/if}
										</div>
									</div>
								</button>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-surface-500 text-center py-4">No other labor events found</p>
					{/if}

					<Button variant="ghost" class="w-full mt-4" on:click={() => goto('/itc')}>
						View All Labor Events
					</Button>
				</Card>

				<!-- Weighting Policy -->
				<Card>
					<h3 class="text-lg font-semibold text-surface-100 mb-4">Weighting Policy</h3>

					<div class="space-y-3">
						<div>
							<h4 class="text-sm font-medium text-surface-400 mb-2">Skill Tier Weights</h4>
							{#each Object.entries(skillTierLabels) as [tier, label]}
								<div class="flex items-center justify-between text-sm py-1">
									<Badge variant={skillTierColors[tier]} size="sm">{label}</Badge>
									<span class="text-surface-300">×{skillTierMultipliers[tier]}</span>
								</div>
							{/each}
						</div>

						<div class="border-t border-surface-800 pt-3">
							<h4 class="text-sm font-medium text-surface-400 mb-2">Context Weights</h4>
							<div class="space-y-1 text-sm">
								<div class="flex items-center justify-between">
									<span class="text-surface-400">Urgency range:</span>
									<span class="text-surface-300">1.0 - 1.5×</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-surface-400">Eco sensitivity:</span>
									<span class="text-surface-300">0.8 - 1.2×</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-surface-400">Scarcity:</span>
									<span class="text-surface-300">1.0 - 1.3×</span>
								</div>
							</div>
						</div>
					</div>
				</Card>
			</div>
		</div>
	{:else}
		<EmptyState
			title="Labor Event Not Found"
			description="The requested labor event could not be found"
			icon={FileText}
		>
			<Button slot="action" variant="primary" on:click={goBack}>
				<ArrowLeft size={16} />
				Back to ITC Overview
			</Button>
		</EmptyState>
	{/if}
</PageContainer>

<!-- Verification Modal -->
<Modal bind:open={showVerifyModal} title="Verify Labor Event" size="md">
	{#if laborEvent}
		<div class="space-y-4">
			<div class="p-4 rounded-lg bg-surface-800/50">
				<h4 class="font-medium text-surface-100 mb-2">{laborEvent.taskLabel}</h4>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<span class="text-surface-500">Member:</span>
						<span class="text-surface-300 ml-2">{laborEvent.memberId}</span>
					</div>
					<div>
						<span class="text-surface-500">Hours:</span>
						<span class="text-surface-300 ml-2">{laborEvent.hours}h</span>
					</div>
					<div>
						<span class="text-surface-500">Skill Tier:</span>
						<span class="text-surface-300 ml-2">{skillTierLabels[laborEvent.skillTier]}</span>
					</div>
					<div>
						<span class="text-surface-500">Credits:</span>
						<span class="text-primary-400 font-medium ml-2">{creditBreakdown?.totalCredits.toFixed(2)} ITC</span>
					</div>
				</div>
			</div>

			<div class="p-4 rounded-lg bg-warning-500/10 border border-warning-500/20">
				<div class="flex items-start gap-2">
					<AlertTriangle size={18} class="text-warning-400 flex-shrink-0 mt-0.5" />
					<div class="text-sm">
						<p class="text-surface-200">By verifying this labor event, you confirm that:</p>
						<ul class="text-surface-400 mt-2 space-y-1">
							<li>• The work described was actually performed</li>
							<li>• The hours claimed are accurate</li>
							<li>• The skill tier is appropriate for the work</li>
						</ul>
					</div>
				</div>
			</div>

			<div>
				<label class="label">Verification Notes (optional)</label>
				<textarea
					class="input min-h-[80px] resize-y"
					placeholder="Add any notes about this verification..."
					bind:value={verificationNotes}
				></textarea>
			</div>
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showVerifyModal = false} disabled={isVerifying}>Cancel</Button>
		<Button variant="success" on:click={handleVerify} loading={isVerifying}>
			<CheckCircle size={16} />
			Confirm Verification
		</Button>
	</svelte:fragment>
</Modal>

<!-- Redemption Modal -->
<Modal bind:open={showRedeemModal} title="Redeem Access" size="md">
	{#if selectedItem && memberAccount}
		<div class="space-y-4">
			<div class="p-4 rounded-lg bg-surface-800/50">
				<h4 class="font-medium text-surface-100 mb-2">
					{selectedItem.itemId === 'item_1' ? 'Solar Panel Mount v2.3' : 'Hand Tool Set'}
				</h4>
				<p class="text-sm text-surface-400 mb-3">Design Version: {selectedItem.designVersionId}</p>

				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-surface-500">Base labor hours:</span>
						<span class="text-surface-300">{selectedItem.baseWeightedLaborHours}h</span>
					</div>
					<div class="flex justify-between">
						<span class="text-surface-500">Eco burden adjustment:</span>
						<span class="text-warning-400">+{selectedItem.ecoBurdenAdjustment}h</span>
					</div>
					<div class="flex justify-between">
						<span class="text-surface-500">Scarcity adjustment:</span>
						<span class="text-warning-400">+{selectedItem.materialScarcityAdjustment}h</span>
					</div>
					<div class="flex justify-between">
						<span class="text-surface-500">Repairability credit:</span>
						<span class="text-eco-400">{selectedItem.repairabilityCredit}h</span>
					</div>
					<div class="flex justify-between">
						<span class="text-surface-500">Longevity credit:</span>
						<span class="text-eco-400">{selectedItem.longevityCredit}h</span>
					</div>
					<div class="flex justify-between pt-2 border-t border-surface-700">
						<span class="text-surface-300 font-medium">Final cost:</span>
						<span class="text-primary-400 font-bold">{selectedItem.finalItcCost.toFixed(1)} ITC</span>
					</div>
				</div>
			</div>

			<div class="p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-surface-400">Your current balance</p>
						<p class="text-xl font-bold text-surface-100">{memberAccount.balance.toFixed(1)} ITC</p>
					</div>
					<div class="text-right">
						<p class="text-sm text-surface-400">After redemption</p>
						<p class="text-xl font-bold text-eco-400">
							{(memberAccount.balance - selectedItem.finalItcCost).toFixed(1)} ITC
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showRedeemModal = false} disabled={isRedeeming}>Cancel</Button>
		<Button variant="primary" on:click={handleRedeem} loading={isRedeeming}>
			<Wallet size={16} />
			Confirm Redemption
		</Button>
	</svelte:fragment>
</Modal>
