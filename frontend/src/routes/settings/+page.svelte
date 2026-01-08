<script lang="ts">
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Input, Tabs, Modal } from '$lib/components/ui';
	import { nodeStatus } from '$lib/stores';
	import { toasts } from '$lib/stores/toast';
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
		RefreshCw,
		Upload
	} from 'lucide-svelte';

	let activeTab = 'profile';

	const tabs = [
		{ id: 'profile', label: 'Profile' },
		{ id: 'node', label: 'Node Settings' },
		{ id: 'notifications', label: 'Notifications' },
		{ id: 'security', label: 'Security' }
	];

	// Profile state
	let displayName = 'Alice';
	let email = 'alice@example.com';
	let bio = '';
	let skills = ['Woodworking', 'Electronics', 'Design'];
	let newSkill = '';
	let isSavingProfile = false;
	let avatarUrl = '';

	// File input ref
	let avatarInput: HTMLInputElement;

	// Relay state
	let relays = ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol'];
	let refreshingRelay: string | null = null;
	let showAddRelayModal = false;
	let newRelayUrl = '';

	// Key management state
	let showImportKeyModal = false;
	let importedKey = '';
	let showConfirmRegenerateModal = false;

	function handleChangeAvatar() {
		avatarInput.click();
	}

	function handleAvatarSelected(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		if (file.size > 2 * 1024 * 1024) {
			toasts.error('File Too Large', 'Avatar must be under 2MB');
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			avatarUrl = reader.result as string;
			localStorage.setItem('integral_avatar', avatarUrl);
			toasts.success('Avatar Updated', 'Your avatar has been changed');
		};
		reader.readAsDataURL(file);
	}

	async function handleSaveProfile() {
		isSavingProfile = true;
		try {
			localStorage.setItem('integral_user_profile', JSON.stringify({
				displayName,
				email,
				bio,
				skills
			}));
			toasts.success('Profile Saved', 'Your changes have been saved');
		} catch (error) {
			toasts.error('Failed to Save', error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isSavingProfile = false;
		}
	}

	function handleAddSkill() {
		if (!newSkill.trim()) return;
		if (skills.includes(newSkill.trim())) {
			toasts.warning('Duplicate Skill', 'This skill is already in your list');
			return;
		}
		skills = [...skills, newSkill.trim()];
		newSkill = '';
	}

	function handleRemoveSkill(skill: string) {
		skills = skills.filter(s => s !== skill);
	}

	async function handleRefreshRelay(relay: string) {
		refreshingRelay = relay;
		try {
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

	function handleExportPrivateKey() {
		const key = localStorage.getItem('integral_private_key') ?? 'nsec1example_key_not_set';
		const blob = new Blob([key], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'integral-private-key.txt';
		a.click();
		URL.revokeObjectURL(url);
		toasts.warning('Key Exported', 'Keep this file secure!');
	}

	function handleImportPrivateKey() {
		if (!importedKey.trim() || !importedKey.startsWith('nsec')) {
			toasts.error('Invalid Key', 'Please enter a valid nsec private key');
			return;
		}
		localStorage.setItem('integral_private_key', importedKey);
		toasts.success('Key Imported', 'Your private key has been imported');
		showImportKeyModal = false;
		importedKey = '';
	}

	function handleRegenerateKeys() {
		const newKey = 'nsec1' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
			.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 59);
		localStorage.setItem('integral_private_key', newKey);
		toasts.success('Keys Regenerated', 'New keys have been generated');
		showConfirmRegenerateModal = false;
	}
</script>

<input type="file" accept="image/*" class="hidden" bind:this={avatarInput} on:change={handleAvatarSelected} />

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
							{#if avatarUrl}
								<img src={avatarUrl} alt="Avatar" class="w-20 h-20 rounded-full object-cover" />
							{:else}
								<div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-bold">
									{displayName.charAt(0).toUpperCase()}
								</div>
							{/if}
							<div>
								<Button variant="secondary" size="sm" on:click={handleChangeAvatar}>Change Avatar</Button>
								<p class="text-xs text-surface-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Input label="Display Name" bind:value={displayName} />
							<Input label="Email" type="email" bind:value={email} />
						</div>

						<div>
							<label class="label">Bio</label>
							<textarea class="input min-h-[100px]" placeholder="Tell us about yourself..." bind:value={bio}></textarea>
						</div>

						<div>
							<label class="label">Skills</label>
							<div class="flex flex-wrap gap-2 mb-2">
								{#each skills as skill}
									<button class="group" on:click={() => handleRemoveSkill(skill)}>
										<Badge variant="primary">{skill} <span class="ml-1 opacity-50 group-hover:opacity-100">&times;</span></Badge>
									</button>
								{/each}
							</div>
							<div class="flex gap-2">
								<Input placeholder="Add a skill..." bind:value={newSkill} on:keydown={(e) => e.key === 'Enter' && handleAddSkill()} />
								<Button variant="secondary" on:click={handleAddSkill}>Add</Button>
							</div>
						</div>

						<div class="flex justify-end">
							<Button variant="primary" on:click={handleSaveProfile} loading={isSavingProfile}>
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
									{#each relays as relay}
										<div class="flex items-center gap-2">
											<Input value={relay} class="flex-1" disabled />
											<Button variant="ghost" icon on:click={() => handleRefreshRelay(relay)} loading={refreshingRelay === relay}>
												<RefreshCw size={16} />
											</Button>
										</div>
									{/each}
								</div>
								<Button variant="secondary" size="sm" class="mt-2" on:click={() => showAddRelayModal = true}>Add Relay</Button>
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
							<Button variant="secondary" on:click={handleExportPrivateKey}>Export Private Key</Button>
							<Button variant="secondary" on:click={() => showImportKeyModal = true}>Import Private Key</Button>
							<Button variant="danger" on:click={() => showConfirmRegenerateModal = true}>Regenerate Keys</Button>
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

<!-- Import Key Modal -->
<Modal bind:open={showImportKeyModal} title="Import Private Key" size="md">
	<div class="space-y-4">
		<div class="p-4 rounded-lg bg-warning-500/10 border border-warning-500/20">
			<p class="text-sm text-surface-300">This will replace your current private key. Make sure you have backed up your existing key.</p>
		</div>
		<Input label="Private Key (nsec)" placeholder="nsec1..." bind:value={importedKey} />
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showImportKeyModal = false}>Cancel</Button>
		<Button variant="primary" on:click={handleImportPrivateKey}>Import Key</Button>
	</svelte:fragment>
</Modal>

<!-- Confirm Regenerate Modal -->
<Modal bind:open={showConfirmRegenerateModal} title="Regenerate Keys?" size="sm">
	<div class="space-y-4">
		<div class="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
			<p class="text-sm text-surface-300">This will create new keys and your old identity will be lost. This action cannot be undone.</p>
		</div>
		<p class="text-surface-400">Are you sure you want to regenerate your keys?</p>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showConfirmRegenerateModal = false}>Cancel</Button>
		<Button variant="danger" on:click={handleRegenerateKeys}>Regenerate Keys</Button>
	</svelte:fragment>
</Modal>
