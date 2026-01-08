<script lang="ts">
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, StatCard, Badge, ProgressBar, StatusIndicator } from '$lib/components/ui';
	import { dashboardStats, activityFeed, nodeStatus, findings } from '$lib/stores';
	import {
		Vote,
		Lightbulb,
		Clock,
		Factory,
		Activity,
		Globe,
		Users,
		TrendingUp,
		AlertTriangle,
		CheckCircle,
		ArrowRight,
		Zap
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	// Mock data for demonstration
	onMount(() => {
		dashboardStats.set({
			activeIssues: 12,
			pendingDecisions: 3,
			activeDesigns: 28,
			totalLaborHours: 1247.5,
			activeTasks: 45,
			activeFindings: 5,
			connectedNodes: 7,
			systemHealth: 'healthy'
		});

		activityFeed.set([
			{
				id: '1',
				type: 'decision_made',
				system: 'CDS',
				summary: 'Community workshop proposal approved with 87% consensus',
				timestamp: new Date(Date.now() - 300000).toISOString()
			},
			{
				id: '2',
				type: 'design_certified',
				system: 'OAD',
				summary: 'Solar panel mount v2.3 passed ecological assessment',
				timestamp: new Date(Date.now() - 900000).toISOString()
			},
			{
				id: '3',
				type: 'labor_recorded',
				system: 'ITC',
				summary: '24 hours of collective labor credited across 8 members',
				timestamp: new Date(Date.now() - 1800000).toISOString()
			},
			{
				id: '4',
				type: 'task_completed',
				system: 'COS',
				summary: 'Batch #47 assembly phase completed ahead of schedule',
				timestamp: new Date(Date.now() - 3600000).toISOString()
			},
			{
				id: '5',
				type: 'node_joined',
				system: 'FED',
				summary: 'New node "riverside-coop" joined the federation',
				timestamp: new Date(Date.now() - 7200000).toISOString()
			}
		]);

		findings.set([
			{
				id: '1',
				nodeId: 'node_abc',
				createdAt: new Date().toISOString(),
				findingType: 'labor_stress',
				severity: 'moderate',
				confidence: 'confident',
				summary: 'Expert-level labor showing increased demand',
				rationale: 'Labor allocation signals indicate potential bottleneck',
				indicators: { stress_index: 0.65 }
			},
			{
				id: '2',
				nodeId: 'node_abc',
				createdAt: new Date().toISOString(),
				findingType: 'ecological_overshoot',
				severity: 'low',
				confidence: 'provisional',
				summary: 'Material sourcing approaching sustainability threshold',
				rationale: 'External procurement ratio increased 15% this cycle',
				indicators: { eco_score: 0.48 }
			}
		]);
	});

	const systemColors = {
		CDS: 'primary',
		OAD: 'success',
		ITC: 'warning',
		COS: 'info',
		FRS: 'danger',
		FED: 'primary'
	} as const;

	const systemIcons = {
		CDS: Vote,
		OAD: Lightbulb,
		ITC: Clock,
		COS: Factory,
		FRS: Activity,
		FED: Globe
	};

	function formatTime(timestamp: string): string {
		const diff = Date.now() - new Date(timestamp).getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}
</script>

<Header title="Dashboard" subtitle="System overview and real-time metrics" />

<PageContainer>
	<!-- System Health Banner -->
	<div class="mb-6">
		<Card class="bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div class="p-3 rounded-xl bg-primary-500/20">
						<Zap size={24} class="text-primary-400" />
					</div>
					<div>
						<h2 class="text-lg font-semibold text-surface-100">System Status</h2>
						<p class="text-sm text-surface-400">
							All subsystems operational · {$dashboardStats.connectedNodes} nodes connected
						</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<StatusIndicator status="online" size="lg" pulse label="Live" />
					<Badge variant="success">Healthy</Badge>
				</div>
			</div>
		</Card>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
		<StatCard
			title="Active Issues"
			value={$dashboardStats.activeIssues}
			subtitle="{$dashboardStats.pendingDecisions} pending decisions"
			icon={Vote}
			color="primary"
			trend="up"
			trendValue="+2 this week"
		/>
		<StatCard
			title="Active Designs"
			value={$dashboardStats.activeDesigns}
			subtitle="8 awaiting certification"
			icon={Lightbulb}
			color="success"
			trend="up"
			trendValue="+5 new"
		/>
		<StatCard
			title="Labor Hours"
			value={$dashboardStats.totalLaborHours.toLocaleString()}
			subtitle="ITC credited this cycle"
			icon={Clock}
			color="warning"
			trend="up"
			trendValue="+127h"
		/>
		<StatCard
			title="Active Tasks"
			value={$dashboardStats.activeTasks}
			subtitle="Across 4 production plans"
			icon={Factory}
			color="primary"
			trend="neutral"
			trendValue="On track"
		/>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Activity Feed -->
		<div class="lg:col-span-2">
			<Card>
				<div class="flex items-center justify-between mb-4">
					<h3 class="section-header mb-0">Recent Activity</h3>
					<a href="/activity" class="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
						View all <ArrowRight size={14} />
					</a>
				</div>
				<div class="space-y-3">
					{#each $activityFeed as activity}
						<div class="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-800/50 transition-colors">
							<div class="p-2 rounded-lg bg-surface-800">
								<svelte:component this={systemIcons[activity.system]} size={16} class="text-surface-400" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm text-surface-200">{activity.summary}</p>
								<div class="flex items-center gap-2 mt-1">
									<Badge variant={systemColors[activity.system]} size="sm">{activity.system}</Badge>
									<span class="text-xs text-surface-500">{formatTime(activity.timestamp)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>

		<!-- System Health & Findings -->
		<div class="space-y-6">
			<!-- Subsystem Status -->
			<Card>
				<h3 class="section-header">Subsystems</h3>
				<div class="space-y-3">
					{#each Object.entries($nodeStatus?.subsystems ?? {}) as [system, active]}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<StatusIndicator status={active ? 'online' : 'offline'} />
								<span class="text-sm text-surface-300 uppercase">{system}</span>
							</div>
							<Badge variant={active ? 'success' : 'danger'} size="sm">
								{active ? 'Online' : 'Offline'}
							</Badge>
						</div>
					{/each}
				</div>
			</Card>

			<!-- Active Findings -->
			<Card>
				<div class="flex items-center justify-between mb-4">
					<h3 class="section-header mb-0">Active Findings</h3>
					<Badge variant="warning">{$findings.length}</Badge>
				</div>
				<div class="space-y-3">
					{#each $findings as finding}
						<div class="p-3 rounded-lg bg-surface-800/50 border-l-2 {finding.severity === 'critical' ? 'border-red-500' : finding.severity === 'moderate' ? 'border-warning-500' : 'border-surface-600'}">
							<div class="flex items-start gap-2">
								<AlertTriangle size={14} class="text-warning-400 mt-0.5 flex-shrink-0" />
								<div>
									<p class="text-sm text-surface-200">{finding.summary}</p>
									<div class="flex items-center gap-2 mt-1">
										<Badge variant={finding.severity === 'critical' ? 'danger' : finding.severity === 'moderate' ? 'warning' : 'info'} size="sm">
											{finding.severity}
										</Badge>
										<span class="text-xs text-surface-500">{finding.confidence}</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
				<a href="/frs" class="flex items-center justify-center gap-1 mt-4 text-sm text-primary-400 hover:text-primary-300">
					View all findings <ArrowRight size={14} />
				</a>
			</Card>

			<!-- Federation Status -->
			<Card>
				<h3 class="section-header">Federation</h3>
				<div class="flex items-center gap-3 mb-4">
					<div class="p-3 rounded-xl bg-primary-500/10">
						<Globe size={24} class="text-primary-400" />
					</div>
					<div>
						<p class="text-2xl font-bold text-surface-100">{$dashboardStats.connectedNodes}</p>
						<p class="text-sm text-surface-500">Connected Nodes</p>
					</div>
				</div>
				<ProgressBar
					value={$dashboardStats.connectedNodes}
					max={15}
					color="primary"
					showLabel
				>
					Network coverage
				</ProgressBar>
			</Card>
		</div>
	</div>
</PageContainer>
