<script lang="ts">
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Input, Tabs } from '$lib/components/ui';
	import { nodeStatus } from '$lib/stores';
	import {
		Settings,
		User,
		Bell,
		Shield,
		Globe,
		Database,
		Palette,
		Key,
		Save,
		RefreshCw
	} from 'lucide-svelte';

	let activeTab = 'profile';

	const tabs = [
		{ id: 'profile', label: 'Profile' },
		{ id: 'node', label: 'Node Settings' },
		{ id: 'notifications', label: 'Notifications' },
		{ id: 'security', label: 'Security' }
	];
</script>

<Header title="Settings" subtitle="Configure your node and preferences" />

<PageContainer maxWidth="lg">
	<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
		<!-- Sidebar -->
		<div class="lg:col-span-1">
			<Card padding="sm">
				<nav class="space-y-1">
					{#each tabs as tab}
						<button
							class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors {activeTab === tab.id ? 'bg-primary-500/10 text-primary-400' : 'text-surface-400 hover:bg-surface-800 hover:text-surface-100'}"
							on:click={() => activeTab = tab.id}
						>
							{#if tab.id === 'profile'}
								<User size={18} />
							{:else if tab.id === 'node'}
								<Database size={18} />
							{:else if tab.id === 'notifications'}
								<Bell size={18} />
							{:else if tab.id === 'security'}
								<Shield size={18} />
							{/if}
							{tab.label}
						</button>
					{/each}
				</nav>
			</Card>
		</div>

		<!-- Content -->
		<div class="lg:col-span-3">
			{#if activeTab === 'profile'}
				<Card>
					<h3 class="section-header">Profile Settings</h3>
					<div class="space-y-6">
						<div class="flex items-center gap-6">
							<div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold">
								A
							</div>
							<div>
								<Button variant="secondary" size="sm">Change Avatar</Button>
								<p class="text-xs text-surface-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Input label="Display Name" value="Alice" />
							<Input label="Email" type="email" value="alice@example.com" />
						</div>

						<div>
							<label class="label">Bio</label>
							<textarea class="input min-h-[100px]" placeholder="Tell us about yourself..."></textarea>
						</div>

						<div>
							<label class="label">Skills</label>
							<div class="flex flex-wrap gap-2 mb-2">
								<Badge variant="primary">Woodworking</Badge>
								<Badge variant="primary">Electronics</Badge>
								<Badge variant="primary">Design</Badge>
							</div>
							<Input placeholder="Add a skill..." />
						</div>

						<div class="flex justify-end">
							<Button variant="primary">
								<Save size={16} />
								Save Changes
							</Button>
						</div>
					</div>
				</Card>

			{:else if activeTab === 'node'}
				<div class="space-y-6">
					<Card>
						<h3 class="section-header">Node Configuration</h3>
						<div class="space-y-4">
							<Input label="Node ID" value={$nodeStatus?.nodeId ?? ''} disabled />
							<Input label="Federation ID" value="integral-main" />
							<div>
								<label class="label">Connected Relays</label>
								<div class="space-y-2">
									{#each ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol'] as relay}
										<div class="flex items-center gap-2">
											<Input value={relay} class="flex-1" />
											<Button variant="ghost" icon>
												<RefreshCw size={16} />
											</Button>
										</div>
									{/each}
								</div>
								<Button variant="secondary" size="sm" class="mt-2">Add Relay</Button>
							</div>
						</div>
					</Card>

					<Card>
						<h3 class="section-header">Subsystem Settings</h3>
						<div class="space-y-3">
							{#each [
								{ name: 'CDS', label: 'Collaborative Decision System', enabled: true },
								{ name: 'OAD', label: 'Open Access Design', enabled: true },
								{ name: 'ITC', label: 'Integral Time Credits', enabled: true },
								{ name: 'COS', label: 'Cooperative Organization', enabled: true },
								{ name: 'FRS', label: 'Feedback & Review', enabled: true }
							] as system}
								<div class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50">
									<div>
										<p class="font-medium text-surface-200">{system.label}</p>
										<p class="text-xs text-surface-500">{system.name}</p>
									</div>
									<label class="relative inline-flex items-center cursor-pointer">
										<input type="checkbox" checked={system.enabled} class="sr-only peer" />
										<div class="w-11 h-6 bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
									</label>
								</div>
							{/each}
						</div>
					</Card>
				</div>

			{:else if activeTab === 'notifications'}
				<Card>
					<h3 class="section-header">Notification Preferences</h3>
					<div class="space-y-4">
						{#each [
							{ title: 'New Issues', description: 'When new issues are created', enabled: true },
							{ title: 'Decision Updates', description: 'When decisions reach consensus', enabled: true },
							{ title: 'Task Assignments', description: 'When you are assigned to tasks', enabled: true },
							{ title: 'Labor Verification', description: 'When your labor is verified', enabled: true },
							{ title: 'System Findings', description: 'When FRS detects issues', enabled: false },
							{ title: 'Federation Messages', description: 'Messages from other nodes', enabled: true }
						] as pref}
							<div class="flex items-center justify-between p-4 rounded-lg bg-surface-800/50">
								<div>
									<p class="font-medium text-surface-200">{pref.title}</p>
									<p class="text-sm text-surface-500">{pref.description}</p>
								</div>
								<label class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" checked={pref.enabled} class="sr-only peer" />
									<div class="w-11 h-6 bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
								</label>
							</div>
						{/each}
					</div>
				</Card>

			{:else if activeTab === 'security'}
				<div class="space-y-6">
					<Card>
						<h3 class="section-header">Private Key Management</h3>
						<div class="p-4 rounded-lg bg-warning-500/10 border border-warning-500/20 mb-4">
							<div class="flex items-start gap-3">
								<Key size={20} class="text-warning-400 mt-0.5" />
								<div>
									<p class="font-medium text-surface-200">Keep your private key safe</p>
									<p class="text-sm text-surface-400 mt-1">
										Your private key is stored locally and never transmitted. Back it up securely.
									</p>
								</div>
							</div>
						</div>
						<div class="space-y-3">
							<Button variant="secondary">Export Private Key</Button>
							<Button variant="secondary">Import Private Key</Button>
							<Button variant="danger">Regenerate Keys</Button>
						</div>
					</Card>

					<Card>
						<h3 class="section-header">Session Security</h3>
						<div class="space-y-4">
							<div class="flex items-center justify-between p-4 rounded-lg bg-surface-800/50">
								<div>
									<p class="font-medium text-surface-200">Session Timeout</p>
									<p class="text-sm text-surface-500">Auto-logout after inactivity</p>
								</div>
								<select class="input w-32">
									<option>15 minutes</option>
									<option>30 minutes</option>
									<option>1 hour</option>
									<option>Never</option>
								</select>
							</div>
							<div class="flex items-center justify-between p-4 rounded-lg bg-surface-800/50">
								<div>
									<p class="font-medium text-surface-200">Require confirmation</p>
									<p class="text-sm text-surface-500">For sensitive operations</p>
								</div>
								<label class="relative inline-flex items-center cursor-pointer">
									<input type="checkbox" checked class="sr-only peer" />
									<div class="w-11 h-6 bg-surface-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
								</label>
							</div>
						</div>
					</Card>
				</div>
			{/if}
		</div>
	</div>
</PageContainer>
