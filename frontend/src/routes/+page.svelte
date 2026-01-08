<script lang="ts">
	import { onMount } from 'svelte';
	import { PageContainer, Header } from '$lib/components/layout';
	import { Card, StatCard, Badge, Button, Alert, ProgressBar, Tooltip } from '$lib/components/ui';
	import { LineChart, DonutChart, BarChart } from '$lib/components/charts';
	import { toasts } from '$lib/stores/toast';
	import { dashboardStats, activityFeed, nodeStatus, findings } from '$lib/stores';
	import {
		Vote,
		Lightbulb,
		Clock,
		Factory,
		Activity,
		Globe,
		TrendingUp,
		Users,
		CheckCircle2,
		AlertTriangle,
		ArrowRight,
		Zap,
		Shield,
		Leaf,
		RefreshCw,
		HelpCircle,
		BookOpen
	} from 'lucide-svelte';

	// Chart data
	let creditHistory = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
		values: [1800, 1950, 2100, 2280, 2350, 2450]
	};

	let resourceAllocation = {
		labels: ['Labor', 'Materials', 'Energy', 'Transport', 'Other'],
		values: [35, 28, 18, 12, 7]
	};

	const systemIcons: Record<string, any> = {
		CDS: Vote,
		OAD: Lightbulb,
		ITC: Clock,
		COS: Factory,
		FRS: Activity,
		FED: Globe
	};

	const systemColors: Record<string, string> = {
		CDS: 'primary',
		OAD: 'success',
		ITC: 'warning',
		COS: 'info',
		FRS: 'danger',
		FED: 'primary'
	};

	let quickActions = [
		{ label: 'Raise Issue', href: '/cds', icon: Vote, color: 'emerald', desc: 'Start a community discussion' },
		{ label: 'Submit Design', href: '/oad', icon: Lightbulb, color: 'amber', desc: 'Share your innovation' },
		{ label: 'Log Labor', href: '/itc', icon: Clock, color: 'blue', desc: 'Record your contributions' },
		{ label: 'View Tasks', href: '/cos', icon: Factory, color: 'purple', desc: 'Check production status' }
	];

	let isLoading = false;

	async function refreshData() {
		isLoading = true;
		await new Promise(resolve => setTimeout(resolve, 1000));
		isLoading = false;
		toasts.success('Dashboard Refreshed', 'All data has been updated');
	}

	function formatTime(timestamp: string): string {
		const diff = Date.now() - new Date(timestamp).getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}

	onMount(() => {
		// Initialize mock data
		dashboardStats.set({
			activeIssues: 12,
			pendingDecisions: 3,
			activeDesigns: 28,
			totalLaborHours: 2450.5,
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
</script>

<PageContainer>
	<Header
		title="Dashboard"
		description="Overview of your INTEGRAL cooperative system"
	>
		<div class="flex items-center gap-3">
			<a href="/docs" class="btn btn-ghost">
				<BookOpen class="w-4 h-4 mr-2" />
				Docs
			</a>
			<Button variant="secondary" on:click={refreshData} disabled={isLoading}>
				<RefreshCw class="w-4 h-4 mr-2 {isLoading ? 'animate-spin' : ''}" />
				Refresh
			</Button>
		</div>
	</Header>

	<!-- System Health Banner -->
	<Card className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 border-primary-500/20 mb-6">
		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<div class="p-3 rounded-xl bg-primary-500/20">
					<Zap class="w-6 h-6 text-primary-400" />
				</div>
				<div>
					<h2 class="text-lg font-semibold text-white">System Status</h2>
					<p class="text-sm text-gray-400">
						All subsystems operational · {$dashboardStats?.connectedNodes || 0} nodes connected
					</p>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-2">
					<span class="relative flex h-3 w-3">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
					</span>
					<span class="text-sm text-gray-300">Live</span>
				</div>
				<Badge variant="success">Healthy</Badge>
			</div>
		</div>
	</Card>

	<!-- Quick Actions -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
		{#each quickActions as action}
			<a
				href={action.href}
				class="group flex flex-col items-center gap-2 p-4 rounded-xl bg-surface-800/50 border border-surface-700
				       hover:border-surface-500 hover:bg-surface-800 transition-all"
			>
				<div class="p-3 rounded-xl bg-{action.color}-500/10 group-hover:bg-{action.color}-500/20 transition-colors">
					<svelte:component this={action.icon} class="w-6 h-6 text-{action.color}-400" />
				</div>
				<span class="text-sm font-medium text-white">{action.label}</span>
				<span class="text-xs text-gray-500">{action.desc}</span>
			</a>
		{/each}
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
		<Tooltip content="Active proposals and decisions awaiting votes in the Collaborative Decision System" position="bottom">
			<StatCard
				title="Active Issues"
				value={$dashboardStats?.activeIssues || 0}
				subtitle="{$dashboardStats?.pendingDecisions || 0} pending decisions"
				icon={Vote}
				color="primary"
				trend="up"
				trendValue="+2 this week"
			/>
		</Tooltip>
		<Tooltip content="Designs currently under review or in the certification process" position="bottom">
			<StatCard
				title="Active Designs"
				value={$dashboardStats?.activeDesigns || 0}
				subtitle="8 awaiting certification"
				icon={Lightbulb}
				color="success"
				trend="up"
				trendValue="+5 new"
			/>
		</Tooltip>
		<Tooltip content="Your current Integral Time Credit balance (weighted labor hours)" position="bottom">
			<StatCard
				title="ITC Balance"
				value={($dashboardStats?.totalLaborHours || 0).toLocaleString()}
				subtitle="Weighted hours this cycle"
				icon={Clock}
				color="warning"
				trend="up"
				trendValue="+127h"
			/>
		</Tooltip>
		<Tooltip content="Production tasks currently in progress across all plans" position="bottom">
			<StatCard
				title="Active Tasks"
				value={$dashboardStats?.activeTasks || 0}
				subtitle="Across 4 production plans"
				icon={Factory}
				color="primary"
				trend="neutral"
				trendValue="On track"
			/>
		</Tooltip>
	</div>

	<!-- Charts Row -->
	<div class="grid lg:grid-cols-2 gap-6 mb-6">
		<!-- Credit Balance History -->
		<Card>
			<div class="flex items-center justify-between mb-4">
				<div>
					<h3 class="font-semibold text-white">ITC Balance History</h3>
					<p class="text-sm text-gray-400">Your credit balance over time</p>
				</div>
				<Badge variant="success">
					<TrendingUp class="w-3 h-3 mr-1" />
					+36%
				</Badge>
			</div>
			<LineChart data={creditHistory} height={200} color="#8b5cf6" />
			<p class="text-xs text-gray-500 mt-3">
				Credits are earned through logged labor and decay over time to prevent hoarding.
			</p>
		</Card>

		<!-- Resource Allocation -->
		<Card>
			<div class="mb-4">
				<h3 class="font-semibold text-white">Resource Allocation</h3>
				<p class="text-sm text-gray-400">How credits are distributed in the cooperative</p>
			</div>
			<DonutChart data={resourceAllocation} size={180} />
			<p class="text-xs text-gray-500 mt-3 text-center">
				Resources are allocated based on democratic decisions and production needs.
			</p>
		</Card>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Activity Feed -->
		<div class="lg:col-span-2">
			<Card>
				<div class="flex items-center justify-between mb-4">
					<div>
						<h3 class="font-semibold text-white">Recent Activity</h3>
						<p class="text-sm text-gray-400">Latest updates from all subsystems</p>
					</div>
					<a href="/frs" class="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
						View all <ArrowRight class="w-4 h-4" />
					</a>
				</div>
				<div class="space-y-3">
					{#each $activityFeed as activity}
						<div class="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-800/50 transition-colors border border-transparent hover:border-surface-700">
							<div class="p-2 rounded-lg bg-surface-800">
								<svelte:component this={systemIcons[activity.system]} class="w-4 h-4 text-gray-400" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm text-gray-200">{activity.summary}</p>
								<div class="flex items-center gap-2 mt-1">
									<Badge variant={systemColors[activity.system]} size="sm">{activity.system}</Badge>
									<span class="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Subsystem Status -->
			<Card>
				<h3 class="font-semibold text-white mb-4">Subsystem Health</h3>
				<div class="space-y-3">
					{#each Object.entries($nodeStatus?.subsystems ?? {}) as [system, active]}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="relative flex h-2 w-2">
									<span class="absolute inline-flex h-full w-full rounded-full {active ? 'bg-emerald-400' : 'bg-red-400'} {active ? 'animate-pulse' : ''}"></span>
								</span>
								<span class="text-sm text-gray-300 uppercase">{system}</span>
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
					<h3 class="font-semibold text-white">Active Findings</h3>
					<Badge variant="warning">{$findings?.length || 0}</Badge>
				</div>
				<div class="space-y-3">
					{#each $findings || [] as finding}
						<div class="p-3 rounded-lg bg-surface-800/50 border-l-2 {finding.severity === 'critical' ? 'border-red-500' : finding.severity === 'moderate' ? 'border-amber-500' : 'border-surface-600'}">
							<div class="flex items-start gap-2">
								<AlertTriangle class="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
								<div>
									<p class="text-sm text-gray-200">{finding.summary}</p>
									<div class="flex items-center gap-2 mt-1">
										<Badge variant={finding.severity === 'critical' ? 'danger' : finding.severity === 'moderate' ? 'warning' : 'info'} size="sm">
											{finding.severity}
										</Badge>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
				<a href="/frs" class="flex items-center justify-center gap-1 mt-4 text-sm text-primary-400 hover:text-primary-300">
					View all findings <ArrowRight class="w-4 h-4" />
				</a>
			</Card>

			<!-- Federation Status -->
			<Card>
				<h3 class="font-semibold text-white mb-4">Federation Network</h3>
				<div class="flex items-center gap-3 mb-4">
					<div class="p-3 rounded-xl bg-purple-500/10">
						<Globe class="w-6 h-6 text-purple-400" />
					</div>
					<div>
						<p class="text-2xl font-bold text-white">{$dashboardStats?.connectedNodes || 0}</p>
						<p class="text-sm text-gray-500">Connected Nodes</p>
					</div>
				</div>
				<ProgressBar
					value={$dashboardStats?.connectedNodes || 0}
					max={15}
					color="#8b5cf6"
				/>
				<p class="text-xs text-gray-500 mt-2">Network coverage</p>
			</Card>
		</div>
	</div>

	<!-- How It Works -->
	<Card className="mt-6">
		<div class="flex items-center gap-3 mb-6">
			<div class="p-3 rounded-xl bg-primary-500/10">
				<HelpCircle class="w-6 h-6 text-primary-400" />
			</div>
			<div>
				<h3 class="font-semibold text-white">How INTEGRAL Works</h3>
				<p class="text-sm text-gray-400">Understanding the cooperative economic system</p>
			</div>
		</div>

		<div class="grid md:grid-cols-3 gap-6">
			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-sm">1</div>
					<h4 class="font-medium text-white">Contribute</h4>
				</div>
				<p class="text-sm text-gray-400 pl-10">
					Log your labor contributions. Time is weighted by skill level, complexity, and context.
					All contributions are recorded in immutable audit logs.
				</p>
			</div>

			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-sm">2</div>
					<h4 class="font-medium text-white">Earn Credits</h4>
				</div>
				<p class="text-sm text-gray-400 pl-10">
					Receive Integral Time Credits (ITC) for your work. Credits represent your contribution
					to the cooperative and can be used to access resources.
				</p>
			</div>

			<div class="space-y-3">
				<div class="flex items-center gap-2">
					<div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white text-sm">3</div>
					<h4 class="font-medium text-white">Participate</h4>
				</div>
				<p class="text-sm text-gray-400 pl-10">
					Vote on decisions, submit designs, and help plan production. Your voice matters
					in the democratic governance of the cooperative.
				</p>
			</div>
		</div>

		<div class="mt-6 pt-6 border-t border-surface-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
			<div class="flex items-center gap-2 text-sm text-gray-400">
				<Leaf class="w-4 h-4 text-emerald-400" />
				<span>All designs are evaluated for ecological sustainability</span>
			</div>
			<a href="/docs" class="btn btn-primary">
				<BookOpen class="w-4 h-4 mr-2" />
				Read Documentation
			</a>
		</div>
	</Card>
</PageContainer>
