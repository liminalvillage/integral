<script lang="ts">
	import { onMount } from 'svelte';
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, StatCard, EmptyState, StatusIndicator } from '$lib/components/ui';
	import { federatedNodes, nodeStatus } from '$lib/stores';
	import type { FederatedNode, FederatedMessage } from '$lib/types';
	import {
		Globe,
		Users,
		Radio,
		MessageSquare,
		Send,
		Share2,
		AlertTriangle,
		Lightbulb,
		CheckCircle,
		ExternalLink,
		Copy,
		RefreshCw
	} from 'lucide-svelte';

	let activeTab = 'nodes';
	let messages: FederatedMessage[] = [];

	const tabs = [
		{ id: 'nodes', label: 'Connected Nodes' },
		{ id: 'messages', label: 'Federation Messages' },
		{ id: 'identity', label: 'Node Identity' }
	];

	const messageTypeColors = {
		stress_signature: 'warning',
		best_practice: 'success',
		design_success: 'primary',
		early_warning: 'danger',
		model_template: 'info'
	} as const;

	const messageTypeIcons = {
		stress_signature: AlertTriangle,
		best_practice: Lightbulb,
		design_success: CheckCircle,
		early_warning: AlertTriangle,
		model_template: Share2
	};

	// Mock data
	onMount(() => {
		federatedNodes.set([
			{
				nodeId: 'riverside-coop',
				publicKey: 'npub1abc...xyz',
				lastSeen: new Date(Date.now() - 60000).toISOString(),
				capabilities: ['CDS', 'OAD', 'ITC', 'COS', 'FRS']
			},
			{
				nodeId: 'mountain-collective',
				publicKey: 'npub1def...uvw',
				lastSeen: new Date(Date.now() - 300000).toISOString(),
				capabilities: ['CDS', 'OAD', 'ITC']
			},
			{
				nodeId: 'urban-makers',
				publicKey: 'npub1ghi...rst',
				lastSeen: new Date(Date.now() - 1800000).toISOString(),
				capabilities: ['CDS', 'OAD', 'ITC', 'COS', 'FRS']
			},
			{
				nodeId: 'coastal-workshop',
				publicKey: 'npub1jkl...opq',
				lastSeen: new Date(Date.now() - 7200000).toISOString(),
				capabilities: ['CDS', 'ITC', 'FRS']
			}
		]);

		messages = [
			{
				id: 'msg_1',
				messageType: 'best_practice',
				fromNodeId: 'riverside-coop',
				toScope: 'federation',
				summary: 'Effective labor rotation schedule reduces burnout',
				createdAt: new Date(Date.now() - 3600000).toISOString()
			},
			{
				id: 'msg_2',
				messageType: 'design_success',
				fromNodeId: 'mountain-collective',
				toScope: 'federation',
				summary: 'Modular greenhouse design achieved 0.22 eco-score',
				createdAt: new Date(Date.now() - 86400000).toISOString()
			},
			{
				id: 'msg_3',
				messageType: 'early_warning',
				fromNodeId: 'urban-makers',
				toScope: 'regional',
				summary: 'Supply chain disruption affecting aluminum sourcing',
				createdAt: new Date(Date.now() - 172800000).toISOString()
			}
		];
	});

	function getNodeStatus(lastSeen: string): 'online' | 'warning' | 'offline' {
		const diff = Date.now() - new Date(lastSeen).getTime();
		if (diff < 300000) return 'online'; // 5 minutes
		if (diff < 3600000) return 'warning'; // 1 hour
		return 'offline';
	}

	function formatLastSeen(timestamp: string): string {
		const diff = Date.now() - new Date(timestamp).getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		return `${Math.floor(hours / 24)}d ago`;
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<Header
	title="Federation"
	subtitle="Decentralized network of cooperative nodes"
/>

<PageContainer>
	<!-- Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
		<StatCard
			title="Connected Nodes"
			value={$federatedNodes.length}
			icon={Globe}
			color="primary"
		/>
		<StatCard
			title="Active Relays"
			value={$nodeStatus?.connectedRelays ?? 0}
			icon={Radio}
			color="success"
		/>
		<StatCard
			title="Messages Today"
			value={messages.filter(m => Date.now() - new Date(m.createdAt).getTime() < 86400000).length}
			icon={MessageSquare}
			color="warning"
		/>
		<StatCard
			title="Network Coverage"
			value="Regional"
			icon={Share2}
			color="primary"
		/>
	</div>

	<!-- Tabs -->
	<Tabs {tabs} bind:activeTab class="mb-6" />

	{#if activeTab === 'nodes'}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each $federatedNodes as node}
				<Card variant="hover" class="group">
					<div class="flex items-start justify-between mb-3">
						<div class="flex items-center gap-3">
							<div class="p-2.5 rounded-xl bg-primary-500/10">
								<Globe size={20} class="text-primary-400" />
							</div>
							<div>
								<h3 class="font-medium text-surface-100 group-hover:text-primary-400 transition-colors">
									{node.nodeId}
								</h3>
								<p class="text-xs text-surface-500 font-mono truncate max-w-[180px]">
									{node.publicKey}
								</p>
							</div>
						</div>
						<StatusIndicator
							status={getNodeStatus(node.lastSeen)}
							label={formatLastSeen(node.lastSeen)}
						/>
					</div>

					<div class="flex flex-wrap gap-1 mb-3">
						{#each node.capabilities as cap}
							<Badge variant="info" size="sm">{cap}</Badge>
						{/each}
					</div>

					<div class="flex gap-2 pt-3 border-t border-surface-800">
						<Button variant="ghost" size="sm">
							<MessageSquare size={14} />
							Message
						</Button>
						<Button variant="ghost" size="sm">
							<ExternalLink size={14} />
							Details
						</Button>
					</div>
				</Card>
			{/each}
		</div>

	{:else if activeTab === 'messages'}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Messages List -->
			<div class="lg:col-span-2">
				<Card>
					<div class="flex items-center justify-between mb-4">
						<h3 class="section-header mb-0">Recent Messages</h3>
						<Button variant="primary" size="sm">
							<Send size={14} />
							Send Message
						</Button>
					</div>
					<div class="space-y-3">
						{#each messages as message}
							<div class="p-4 rounded-lg bg-surface-800/50">
								<div class="flex items-start justify-between mb-2">
									<div class="flex items-center gap-2">
										<svelte:component
											this={messageTypeIcons[message.messageType]}
											size={16}
											class="{message.messageType === 'early_warning' ? 'text-red-400' : message.messageType === 'best_practice' ? 'text-eco-400' : 'text-primary-400'}"
										/>
										<Badge variant={messageTypeColors[message.messageType]} size="sm">
											{message.messageType.replace('_', ' ')}
										</Badge>
										<Badge variant="info" size="sm">{message.toScope}</Badge>
									</div>
									<span class="text-xs text-surface-500">{formatLastSeen(message.createdAt)}</span>
								</div>
								<p class="text-sm text-surface-200 mb-2">{message.summary}</p>
								<p class="text-xs text-surface-500">From: {message.fromNodeId}</p>
							</div>
						{/each}
					</div>
				</Card>
			</div>

			<!-- Quick Actions -->
			<div class="space-y-4">
				<Card>
					<h3 class="section-header">Share with Federation</h3>
					<div class="space-y-2">
						<Button variant="secondary" class="w-full justify-start">
							<Lightbulb size={16} />
							Share Best Practice
						</Button>
						<Button variant="secondary" class="w-full justify-start">
							<CheckCircle size={16} />
							Report Design Success
						</Button>
						<Button variant="secondary" class="w-full justify-start">
							<AlertTriangle size={16} />
							Issue Early Warning
						</Button>
					</div>
				</Card>

				<Card>
					<h3 class="section-header">Message Types</h3>
					<div class="space-y-2 text-sm">
						<div class="flex items-center gap-2">
							<Badge variant="success" size="sm">best_practice</Badge>
							<span class="text-surface-400">Proven techniques</span>
						</div>
						<div class="flex items-center gap-2">
							<Badge variant="primary" size="sm">design_success</Badge>
							<span class="text-surface-400">Certified designs</span>
						</div>
						<div class="flex items-center gap-2">
							<Badge variant="danger" size="sm">early_warning</Badge>
							<span class="text-surface-400">Risk alerts</span>
						</div>
						<div class="flex items-center gap-2">
							<Badge variant="warning" size="sm">stress_signature</Badge>
							<span class="text-surface-400">System stress</span>
						</div>
					</div>
				</Card>
			</div>
		</div>

	{:else if activeTab === 'identity'}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card>
				<h3 class="section-header">Node Identity</h3>
				<div class="space-y-4">
					<div>
						<label class="label">Node ID</label>
						<div class="flex items-center gap-2">
							<code class="flex-1 px-3 py-2 bg-surface-800 rounded text-surface-200 font-mono text-sm">
								{$nodeStatus?.nodeId ?? 'Not connected'}
							</code>
							<Button variant="ghost" icon on:click={() => copyToClipboard($nodeStatus?.nodeId ?? '')}>
								<Copy size={16} />
							</Button>
						</div>
					</div>
					<div>
						<label class="label">Public Key (npub)</label>
						<div class="flex items-center gap-2">
							<code class="flex-1 px-3 py-2 bg-surface-800 rounded text-surface-200 font-mono text-sm truncate">
								{$nodeStatus?.publicKey ?? 'Not available'}
							</code>
							<Button variant="ghost" icon on:click={() => copyToClipboard($nodeStatus?.publicKey ?? '')}>
								<Copy size={16} />
							</Button>
						</div>
					</div>
					<div>
						<label class="label">Status</label>
						<div class="flex items-center gap-2">
							<StatusIndicator
								status={$nodeStatus?.isRunning ? 'online' : 'offline'}
								size="lg"
								pulse={$nodeStatus?.isRunning}
							/>
							<span class="text-surface-200">
								{$nodeStatus?.isRunning ? 'Connected' : 'Disconnected'}
							</span>
						</div>
					</div>
				</div>
			</Card>

			<Card>
				<h3 class="section-header">Connected Relays</h3>
				<div class="space-y-3">
					{#each ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol'] as relay}
						<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-2">
								<StatusIndicator status="online" />
								<code class="text-sm text-surface-300 font-mono">{relay}</code>
							</div>
							<Button variant="ghost" size="sm">
								<RefreshCw size={14} />
							</Button>
						</div>
					{/each}
				</div>
				<Button variant="secondary" class="w-full mt-4">
					Add Relay
				</Button>
			</Card>
		</div>
	{/if}
</PageContainer>
