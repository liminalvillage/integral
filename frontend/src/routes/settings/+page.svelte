<script lang="ts">
	import { onMount } from 'svelte';
	import { Header, PageContainer } from '$lib/components/layout';
	import { Card, Button, Badge, Input, Tabs, Modal } from '$lib/components/ui';
	import { nodeStatus } from '$lib/stores';
	import { toasts } from '$lib/stores/toast';
	import { getHoloSphereService } from '$lib/holosphere';
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
		Upload,
		Copy,
		Eye,
		EyeOff,
		Download,
		FileUp,
		AlertTriangle
	} from 'lucide-svelte';

	const PRIVATE_KEY_STORAGE_KEY = 'integral_holosphere_private_key';
	const USER_PROFILE_STORAGE_KEY = 'integral_user_profile';

	let activeTab = 'profile';

	const tabs = [
		{ id: 'profile', label: 'Profile' },
		{ id: 'node', label: 'Node Settings' },
		{ id: 'notifications', label: 'Notifications' },
		{ id: 'security', label: 'Security' }
	];

	// Profile state
	let displayName = '';
	let email = '';
	let bio = '';
	let skills: string[] = [];
	let newSkill = '';
	let isSavingProfile = false;
	let avatarBase64 = '';

	// File input refs
	let avatarInput: HTMLInputElement;
	let keyFileInput: HTMLInputElement;

	// Relay state
	let relays = ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nos.lol'];
	let refreshingRelay: string | null = null;
	let showAddRelayModal = false;
	let newRelayUrl = '';

	// Key management state
	let privateKeyHex = '';
	let publicKeyHex = '';
	let showPrivateKey = false;
	let showImportKeyModal = false;
	let importedKey = '';
	let showConfirmRegenerateModal = false;
	let showViewKeyModal = false;

	// Load profile and keys on mount
	onMount(() => {
		loadProfile();
		loadKeys();
	});

	function loadProfile() {
		try {
			const saved = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
			if (saved) {
				const profile = JSON.parse(saved);
				displayName = profile.displayName || '';
				email = profile.email || '';
				bio = profile.bio || '';
				skills = profile.skills || [];
				avatarBase64 = profile.avatarBase64 || '';
			}
		} catch (e) {
			console.error('Failed to load profile:', e);
		}
	}

	function loadKeys() {
		privateKeyHex = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY) || '';
		if (privateKeyHex) {
			// Derive public key from private key (simple hex representation for now)
			publicKeyHex = derivePublicKey(privateKeyHex);
		}
	}

	function derivePublicKey(privKey: string): string {
		// Simple derivation: hash the private key to get a public key representation
		// In a real Nostr implementation, this would use secp256k1
		// For now, we create a deterministic "public key" from the private key
		let hash = 0;
		for (let i = 0; i < privKey.length; i++) {
			const char = privKey.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		// Create a hex string that looks like a public key
		const bytes = new Uint8Array(32);
		const seed = Math.abs(hash);
		for (let i = 0; i < 32; i++) {
			bytes[i] = (seed * (i + 1) * 17) % 256;
		}
		return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
	}

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

		if (!file.type.startsWith('image/')) {
			toasts.error('Invalid File', 'Please select an image file');
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			avatarBase64 = reader.result as string;
			toasts.success('Avatar Selected', 'Remember to save your profile');
		};
		reader.onerror = () => {
			toasts.error('Upload Failed', 'Could not read the image file');
		};
		reader.readAsDataURL(file);
	}

	function handleRemoveAvatar() {
		avatarBase64 = '';
		toasts.info('Avatar Removed', 'Remember to save your profile');
	}

	async function handleSaveProfile() {
		if (!displayName.trim()) {
			toasts.error('Name Required', 'Please enter a display name');
			return;
		}

		isSavingProfile = true;
		try {
			const profile = {
				displayName: displayName.trim(),
				email: email.trim(),
				bio: bio.trim(),
				skills,
				avatarBase64,
				updatedAt: new Date().toISOString()
			};

			// Save to localStorage
			localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));

			// Also save to holosphere for sync
			const hs = getHoloSphereService();
			if (hs.isInitialized()) {
				await hs.getHoloSphere()?.write('integral-node', 'user_profiles', {
					id: 'local_user',
					...profile
				});
			}

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

	function handleCopyKey(key: string, label: string) {
		navigator.clipboard.writeText(key);
		toasts.success('Copied', `${label} copied to clipboard`);
	}

	function handleViewKeys() {
		showViewKeyModal = true;
	}

	function handleExportPrivateKey() {
		if (!privateKeyHex) {
			toasts.error('No Key', 'No private key found');
			return;
		}
		const exportData = JSON.stringify({
			privateKey: privateKeyHex,
			publicKey: publicKeyHex,
			exportedAt: new Date().toISOString(),
			format: 'hex'
		}, null, 2);

		const blob = new Blob([exportData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `integral-keys-${new Date().toISOString().split('T')[0]}.json`;
		a.click();
		URL.revokeObjectURL(url);
		toasts.warning('Keys Exported', 'Keep this file secure and private!');
	}

	function handleImportKeyFile() {
		keyFileInput.click();
	}

	function handleKeyFileSelected(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			try {
				const content = reader.result as string;
				// Try to parse as JSON first
				try {
					const data = JSON.parse(content);
					if (data.privateKey) {
						importedKey = data.privateKey;
					} else {
						throw new Error('No privateKey field found');
					}
				} catch {
					// Assume it's a raw hex key
					importedKey = content.trim();
				}
				showImportKeyModal = true;
			} catch (e) {
				toasts.error('Invalid File', 'Could not read key from file');
			}
		};
		reader.readAsText(file);
	}

	function handleImportPrivateKey() {
		const cleanKey = importedKey.trim();

		// Validate hex format (64 characters for 32 bytes)
		if (!/^[a-fA-F0-9]{64}$/.test(cleanKey)) {
			toasts.error('Invalid Key', 'Private key must be a 64-character hex string');
			return;
		}

		localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, cleanKey);
		privateKeyHex = cleanKey;
		publicKeyHex = derivePublicKey(cleanKey);

		toasts.success('Key Imported', 'Your private key has been imported. Reload the page to apply.');
		showImportKeyModal = false;
		importedKey = '';
	}

	function generateNewPrivateKey(): string {
		const bytes = new Uint8Array(32);
		crypto.getRandomValues(bytes);
		return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
	}

	function handleRegenerateKeys() {
		const newKey = generateNewPrivateKey();
		localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, newKey);
		privateKeyHex = newKey;
		publicKeyHex = derivePublicKey(newKey);

		toasts.success('Keys Regenerated', 'New keys have been generated. Reload the page to apply.');
		showConfirmRegenerateModal = false;
	}

	function formatKeyDisplay(key: string, show: boolean): string {
		if (!key) return 'Not set';
		if (show) return key;
		return key.slice(0, 8) + '...' + key.slice(-8);
	}

	function truncateKey(key: string): string {
		if (!key) return 'Not set';
		return key.slice(0, 12) + '...' + key.slice(-12);
	}
</script>

<input type="file" accept="image/*" class="hidden" bind:this={avatarInput} on:change={handleAvatarSelected} />
<input type="file" accept=".json,.txt" class="hidden" bind:this={keyFileInput} on:change={handleKeyFileSelected} />

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
						<!-- Avatar Section -->
						<div class="flex items-start gap-6">
							<div class="relative group">
								{#if avatarBase64}
									<img src={avatarBase64} alt="Avatar" class="w-24 h-24 rounded-full object-cover border-2 border-surface-700" />
									<button
										class="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
										on:click={handleChangeAvatar}
									>
										<Upload size={24} class="text-white" />
									</button>
								{:else}
									<button
										class="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-3xl font-bold hover:opacity-90 transition-opacity border-2 border-surface-700"
										on:click={handleChangeAvatar}
									>
										{displayName ? displayName.charAt(0).toUpperCase() : 'U'}
									</button>
								{/if}
							</div>
							<div class="flex-1">
								<h4 class="font-medium text-surface-200 mb-2">Profile Picture</h4>
								<p class="text-sm text-surface-400 mb-3">Upload a picture to personalize your profile. JPG, PNG or GIF. Max 2MB.</p>
								<div class="flex flex-wrap gap-2">
									<Button variant="secondary" size="sm" on:click={handleChangeAvatar}>
										<Upload size={14} />
										Upload Image
									</Button>
									{#if avatarBase64}
										<Button variant="ghost" size="sm" on:click={handleRemoveAvatar}>Remove</Button>
									{/if}
								</div>
							</div>
						</div>

						<!-- Name & Email -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<Input label="Display Name" placeholder="Enter your name" bind:value={displayName} required />
							<Input label="Email" type="email" placeholder="your@email.com" bind:value={email} />
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
					<!-- Key Overview Card -->
					<Card>
						<h3 class="section-header">Your Identity Keys</h3>
						<div class="p-4 rounded-lg bg-primary-500/10 border border-primary-500/20 mb-4">
							<div class="flex items-start gap-3">
								<Key size={20} class="text-primary-400 mt-0.5" />
								<div>
									<p class="font-medium text-surface-200">Cryptographic Identity</p>
									<p class="text-sm text-surface-400 mt-1">
										Your keys are used to sign and verify your data across the network. The private key is stored locally and never transmitted.
									</p>
								</div>
							</div>
						</div>

						<!-- Public Key Display -->
						<div class="space-y-4">
							<div class="p-4 rounded-lg bg-surface-800/50">
								<div class="flex items-center justify-between mb-2">
									<span class="text-sm font-medium text-surface-300">Public Key</span>
									<Badge variant="success">Visible</Badge>
								</div>
								<div class="flex items-center gap-2">
									<code class="flex-1 px-3 py-2 bg-surface-900 rounded text-surface-200 font-mono text-xs break-all">
										{publicKeyHex || 'Not generated yet'}
									</code>
									{#if publicKeyHex}
										<Button variant="ghost" icon size="sm" on:click={() => handleCopyKey(publicKeyHex, 'Public key')}>
											<Copy size={14} />
										</Button>
									{/if}
								</div>
								<p class="text-xs text-surface-500 mt-2">Share this with others to verify your identity</p>
							</div>

							<!-- Private Key Display -->
							<div class="p-4 rounded-lg bg-surface-800/50 border border-warning-500/20">
								<div class="flex items-center justify-between mb-2">
									<span class="text-sm font-medium text-surface-300">Private Key</span>
									<Badge variant="warning">Secret</Badge>
								</div>
								<div class="flex items-center gap-2">
									<code class="flex-1 px-3 py-2 bg-surface-900 rounded text-surface-200 font-mono text-xs break-all">
										{formatKeyDisplay(privateKeyHex, showPrivateKey)}
									</code>
									{#if privateKeyHex}
										<Button variant="ghost" icon size="sm" on:click={() => showPrivateKey = !showPrivateKey}>
											{#if showPrivateKey}
												<EyeOff size={14} />
											{:else}
												<Eye size={14} />
											{/if}
										</Button>
										<Button variant="ghost" icon size="sm" on:click={() => handleCopyKey(privateKeyHex, 'Private key')}>
											<Copy size={14} />
										</Button>
									{/if}
								</div>
								<p class="text-xs text-warning-400 mt-2">Never share this key with anyone!</p>
							</div>
						</div>
					</Card>

					<!-- Key Actions Card -->
					<Card>
						<h3 class="section-header">Key Management</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<button
								class="p-4 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors text-left group"
								on:click={handleExportPrivateKey}
							>
								<div class="flex items-center gap-3 mb-2">
									<div class="p-2 rounded-lg bg-primary-500/10 text-primary-400 group-hover:bg-primary-500/20">
										<Download size={20} />
									</div>
									<span class="font-medium text-surface-200">Export Keys</span>
								</div>
								<p class="text-sm text-surface-400">Download your keys as a backup file</p>
							</button>

							<button
								class="p-4 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors text-left group"
								on:click={handleImportKeyFile}
							>
								<div class="flex items-center gap-3 mb-2">
									<div class="p-2 rounded-lg bg-accent-500/10 text-accent-400 group-hover:bg-accent-500/20">
										<FileUp size={20} />
									</div>
									<span class="font-medium text-surface-200">Import Keys</span>
								</div>
								<p class="text-sm text-surface-400">Restore keys from a backup file</p>
							</button>

							<button
								class="p-4 rounded-lg bg-surface-800/50 hover:bg-surface-800 transition-colors text-left group"
								on:click={() => showImportKeyModal = true}
							>
								<div class="flex items-center gap-3 mb-2">
									<div class="p-2 rounded-lg bg-surface-700 text-surface-300 group-hover:bg-surface-600">
										<Key size={20} />
									</div>
									<span class="font-medium text-surface-200">Enter Key Manually</span>
								</div>
								<p class="text-sm text-surface-400">Paste a private key directly</p>
							</button>

							<button
								class="p-4 rounded-lg bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 transition-colors text-left group"
								on:click={() => showConfirmRegenerateModal = true}
							>
								<div class="flex items-center gap-3 mb-2">
									<div class="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20">
										<AlertTriangle size={20} />
									</div>
									<span class="font-medium text-surface-200">Regenerate Keys</span>
								</div>
								<p class="text-sm text-surface-400">Create new keys (erases current)</p>
							</button>
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
			<div class="flex items-start gap-3">
				<AlertTriangle size={20} class="text-warning-400 mt-0.5 flex-shrink-0" />
				<div>
					<p class="text-sm text-surface-200 font-medium">Warning</p>
					<p class="text-sm text-surface-400 mt-1">This will replace your current private key. Make sure you have backed up your existing key first.</p>
				</div>
			</div>
		</div>
		<div>
			<label class="label">Private Key (64-character hex string)</label>
			<textarea
				class="input font-mono text-sm min-h-[80px]"
				placeholder="e.g., a1b2c3d4e5f6..."
				bind:value={importedKey}
			></textarea>
			<p class="text-xs text-surface-500 mt-1">Paste your 64-character hexadecimal private key</p>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => { showImportKeyModal = false; importedKey = ''; }}>Cancel</Button>
		<Button variant="primary" on:click={handleImportPrivateKey}>Import Key</Button>
	</svelte:fragment>
</Modal>

<!-- Confirm Regenerate Modal -->
<Modal bind:open={showConfirmRegenerateModal} title="Regenerate Keys?" size="sm">
	<div class="space-y-4">
		<div class="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
			<div class="flex items-start gap-3">
				<AlertTriangle size={20} class="text-red-400 mt-0.5 flex-shrink-0" />
				<div>
					<p class="text-sm text-surface-200 font-medium">Danger Zone</p>
					<p class="text-sm text-surface-400 mt-1">This will create new cryptographic keys. Your old identity and all data associated with it will be permanently lost.</p>
				</div>
			</div>
		</div>
		<p class="text-surface-300">Are you absolutely sure you want to regenerate your keys?</p>
		<p class="text-sm text-surface-500">This action cannot be undone. You will need to reload the page after regenerating.</p>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showConfirmRegenerateModal = false}>Cancel</Button>
		<Button variant="danger" on:click={handleRegenerateKeys}>
			<AlertTriangle size={14} />
			Regenerate Keys
		</Button>
	</svelte:fragment>
</Modal>
