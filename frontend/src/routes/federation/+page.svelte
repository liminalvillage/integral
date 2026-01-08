<script lang="ts">
	import { onMount } from 'svelte';
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Tabs, StatCard, EmptyState, StatusIndicator, Modal, Input } from '$lib/components/ui';
	import { federatedNodes, nodeStatus } from '$lib/stores';
	import { federationApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
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

	// Node actions state
	let selectedNode: FederatedNode | null = null;
	let showNodeDetailsModal = false;
	let showMessageNodeModal = false;
	let nodeMessageContent = '';
	let isSendingNodeMessage = false;

	// Send message state
	let showSendMessageModal = false;
	let messageContent = '';
	let messageScope = 'federation';
	let isSendingMessage = false;

	// Best practice state
	let showBestPracticeModal = false;
	let bestPracticeTitle = '';
	let bestPracticeDescription = '';
	let isSharingPractice = false;

	// Design success state
	let showDesignSuccessModal = false;
	let designSuccessTitle = '';
	let designSuccessScore = '';
	let isReportingSuccess = false;

	// Early warning state
	let showWarningModal = false;
	let warningSeverity = 'moderate';
	let warningDescription = '';
	let isIssuingWarning = false;

	// Relay state
	let relays = ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol'];
	let showAddRelayModal = false;
	let newRelayUrl = '';
	let refreshingRelay: string | null = null;

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
		toasts.success('Copied', 'Copied to clipboard');
	}

	function openNodeDetails(node: FederatedNode) {
		selectedNode = node;
		showNodeDetailsModal = true;
	}

	function openMessageNode(node: FederatedNode) {
		selectedNode = node;
		nodeMessageContent = '';
		showMessageNodeModal = true;
	}

	async function handleSendNodeMessage() {
		if (!selectedNode || !nodeMessageContent.trim()) {
			toasts.error('Validation Error', 'Message content is required');
			return;
		}

		isSendingNodeMessage = true;
		try {
			const message = await federationApi.sendMessage({
				messageType: 'model_template',
				toScope: selectedNode.nodeId,
				payload: { content: nodeMessageContent },
				summary: nodeMessageContent.substring(0, 100)
			});
			messages = [message, ...messages];
			toasts.success('Message Sent', `Message sent to ${selectedNode.nodeId}`);
			showMessageNodeModal = false;
			nodeMessageContent = '';
		} catch (error) {
			toasts.error('Failed to Send', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isSendingNodeMessage = false;
		}
	}

	async function handleSendMessage() {
		if (!messageContent.trim()) {
			toasts.error('Validation Error', 'Message content is required');
			return;
		}

		isSendingMessage = true;
		try {
			const message = await federationApi.sendMessage({
				messageType: 'model_template',
				toScope: messageScope,
				payload: { content: messageContent },
				summary: messageContent.substring(0, 100)
			});
			messages = [message, ...messages];
			toasts.success('Message Sent', 'Your message has been broadcast');
			showSendMessageModal = false;
			messageContent = '';
		} catch (error) {
			toasts.error('Failed to Send', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isSendingMessage = false;
		}
	}

	async function handleShareBestPractice() {
		if (!bestPracticeTitle.trim() || !bestPracticeDescription.trim()) {
			toasts.error('Validation Error', 'Title and description are required');
			return;
		}

		isSharingPractice = true;
		try {
			const message = await federationApi.shareBestPractice({
				title: bestPracticeTitle,
				description: bestPracticeDescription,
				benefits: {}
			});
			messages = [message, ...messages];
			toasts.success('Best Practice Shared', 'Your practice has been shared with the federation');
			showBestPracticeModal = false;
			bestPracticeTitle = '';
			bestPracticeDescription = '';
		} catch (error) {
			toasts.error('Failed to Share', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isSharingPractice = false;
		}
	}

	async function handleReportDesignSuccess() {
		if (!designSuccessTitle.trim()) {
			toasts.error('Validation Error', 'Design title is required');
			return;
		}

		isReportingSuccess = true;
		try {
			const message = await federationApi.sendMessage({
				messageType: 'design_success',
				toScope: 'federation',
				payload: { title: designSuccessTitle, ecoScore: designSuccessScore },
				summary: `${designSuccessTitle} achieved ${designSuccessScore} eco-score`
			});
			messages = [message, ...messages];
			toasts.success('Design Success Reported', 'Your design achievement has been shared');
			showDesignSuccessModal = false;
			designSuccessTitle = '';
			designSuccessScore = '';
		} catch (error) {
			toasts.error('Failed to Report', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isReportingSuccess = false;
		}
	}

	async function handleIssueWarning() {
		if (!warningDescription.trim()) {
			toasts.error('Validation Error', 'Warning description is required');
			return;
		}

		isIssuingWarning = true;
		try {
			const message = await federationApi.issueWarning({
				findingId: `finding_${Date.now()}`,
				severity: warningSeverity,
				description: warningDescription
			});
			messages = [message, ...messages];
			toasts.warning('Warning Issued', 'Early warning has been broadcast to the federation');
			showWarningModal = false;
			warningDescription = '';
			warningSeverity = 'moderate';
		} catch (error) {
			toasts.error('Failed to Issue Warning', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isIssuingWarning = false;
		}
	}

	async function handleRefreshRelay(relay: string) {
		refreshingRelay = relay;
		try {
			// Simulate relay refresh (no API endpoint exists)
			await new Promise(resolve => setTimeout(resolve, 1000));
			toasts.success('Relay Refreshed', `Connection to ${relay} refreshed`);
		} catch (error) {
			toasts.error('Failed to Refresh', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			refreshingRelay = null;
		}
	}

	function handleAddRelay() {
		if (!newRelayUrl.trim() || !newRelayUrl.startsWith('wss://')) {
			toasts.error('Validation Error', 'Enter a valid WebSocket URL (wss://)');
			return;
		}

		if (relays.includes(newRelayUrl)) {
			toasts.warning('Already Exists', 'This relay is already in your list');
			return;
		}

		relays = [...relays, newRelayUrl];
		toasts.success('Relay Added', `Added ${newRelayUrl}`);
		showAddRelayModal = false;
		newRelayUrl = '';
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
						<Button variant="ghost" size="sm" on:click={() => openMessageNode(node)}>
							<MessageSquare size={14} />
							Message
						</Button>
						<Button variant="ghost" size="sm" on:click={() => openNodeDetails(node)}>
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
						<Button variant="primary" size="sm" on:click={() => showSendMessageModal = true}>
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
						<Button variant="secondary" class="w-full justify-start" on:click={() => showBestPracticeModal = true}>
							<Lightbulb size={16} />
							Share Best Practice
						</Button>
						<Button variant="secondary" class="w-full justify-start" on:click={() => showDesignSuccessModal = true}>
							<CheckCircle size={16} />
							Report Design Success
						</Button>
						<Button variant="secondary" class="w-full justify-start" on:click={() => showWarningModal = true}>
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
					{#each relays as relay}
						<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
							<div class="flex items-center gap-2">
								<StatusIndicator status="online" />
								<code class="text-sm text-surface-300 font-mono">{relay}</code>
							</div>
							<Button variant="ghost" size="sm" on:click={() => handleRefreshRelay(relay)} loading={refreshingRelay === relay}>
								<RefreshCw size={14} />
							</Button>
						</div>
					{/each}
				</div>
				<Button variant="secondary" class="w-full mt-4" on:click={() => showAddRelayModal = true}>
					Add Relay
				</Button>
			</Card>
		</div>
	{/if}
</PageContainer>

<!-- Node Details Modal -->
<Modal bind:open={showNodeDetailsModal} title={selectedNode?.nodeId ?? 'Node Details'} size="md">
	{#if selectedNode}
		<div class="space-y-4">
			<div>
				<h4 class="text-sm font-medium text-surface-400 mb-1">Public Key</h4>
				<code class="text-surface-200 font-mono text-sm break-all">{selectedNode.publicKey}</code>
			</div>
			<div>
				<h4 class="text-sm font-medium text-surface-400 mb-1">Last Seen</h4>
				<p class="text-surface-200">{formatLastSeen(selectedNode.lastSeen)}</p>
			</div>
			<div>
				<h4 class="text-sm font-medium text-surface-400 mb-1">Capabilities</h4>
				<div class="flex flex-wrap gap-1">
					{#each selectedNode.capabilities as cap}
						<Badge variant="info">{cap}</Badge>
					{/each}
				</div>
			</div>
		</div>
	{/if}
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showNodeDetailsModal = false}>Close</Button>
		<Button variant="primary" on:click={() => { showNodeDetailsModal = false; if (selectedNode) openMessageNode(selectedNode); }}>Send Message</Button>
	</svelte:fragment>
</Modal>

<!-- Message Node Modal -->
<Modal bind:open={showMessageNodeModal} title="Message {selectedNode?.nodeId}" size="md">
	<div class="space-y-4">
		<div>
			<label class="label">Message</label>
			<textarea class="input min-h-[100px] resize-y" placeholder="Enter your message..." bind:value={nodeMessageContent}></textarea>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showMessageNodeModal = false} disabled={isSendingNodeMessage}>Cancel</Button>
		<Button variant="primary" on:click={handleSendNodeMessage} loading={isSendingNodeMessage}>Send Message</Button>
	</svelte:fragment>
</Modal>

<!-- Send Message Modal -->
<Modal bind:open={showSendMessageModal} title="Send Federation Message" size="md">
	<div class="space-y-4">
		<div>
			<label class="label">Scope</label>
			<select class="input" bind:value={messageScope}>
				<option value="federation">Federation (All Nodes)</option>
				<option value="regional">Regional</option>
			</select>
		</div>
		<div>
			<label class="label">Message</label>
			<textarea class="input min-h-[100px] resize-y" placeholder="Enter your message..." bind:value={messageContent}></textarea>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showSendMessageModal = false} disabled={isSendingMessage}>Cancel</Button>
		<Button variant="primary" on:click={handleSendMessage} loading={isSendingMessage}>Send Message</Button>
	</svelte:fragment>
</Modal>

<!-- Best Practice Modal -->
<Modal bind:open={showBestPracticeModal} title="Share Best Practice" size="md">
	<div class="space-y-4">
		<Input label="Title" placeholder="Brief title for this practice" bind:value={bestPracticeTitle} />
		<div>
			<label class="label">Description</label>
			<textarea class="input min-h-[100px] resize-y" placeholder="Describe the practice and its benefits..." bind:value={bestPracticeDescription}></textarea>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showBestPracticeModal = false} disabled={isSharingPractice}>Cancel</Button>
		<Button variant="primary" on:click={handleShareBestPractice} loading={isSharingPractice}>Share Practice</Button>
	</svelte:fragment>
</Modal>

<!-- Design Success Modal -->
<Modal bind:open={showDesignSuccessModal} title="Report Design Success" size="md">
	<div class="space-y-4">
		<Input label="Design Name" placeholder="Name of the successful design" bind:value={designSuccessTitle} />
		<Input label="Eco Score (optional)" placeholder="e.g., 0.22" bind:value={designSuccessScore} />
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showDesignSuccessModal = false} disabled={isReportingSuccess}>Cancel</Button>
		<Button variant="primary" on:click={handleReportDesignSuccess} loading={isReportingSuccess}>Report Success</Button>
	</svelte:fragment>
</Modal>

<!-- Early Warning Modal -->
<Modal bind:open={showWarningModal} title="Issue Early Warning" size="md">
	<div class="space-y-4">
		<div>
			<label class="label">Severity</label>
			<select class="input" bind:value={warningSeverity}>
				<option value="low">Low</option>
				<option value="moderate">Moderate</option>
				<option value="critical">Critical</option>
			</select>
		</div>
		<div>
			<label class="label">Description</label>
			<textarea class="input min-h-[100px] resize-y" placeholder="Describe the risk or issue..." bind:value={warningDescription}></textarea>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showWarningModal = false} disabled={isIssuingWarning}>Cancel</Button>
		<Button variant="danger" on:click={handleIssueWarning} loading={isIssuingWarning}>Issue Warning</Button>
	</svelte:fragment>
</Modal>

<!-- Add Relay Modal -->
<Modal bind:open={showAddRelayModal} title="Add Relay" size="sm">
	<div class="space-y-4">
		<Input label="Relay URL" placeholder="wss://relay.example.com" bind:value={newRelayUrl} />
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showAddRelayModal = false}>Cancel</Button>
		<Button variant="primary" on:click={handleAddRelay}>Add Relay</Button>
	</svelte:fragment>
</Modal>
