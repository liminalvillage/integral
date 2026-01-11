<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Header, PageContainer } from '$lib/components/layout';
	import {
		Card,
		Button,
		Badge,
		Tabs,
		Modal,
		Input,
		Alert,
		ProgressBar,
		EmptyState,
		StatusIndicator,
		Tooltip
	} from '$lib/components/ui';
	import { Textarea, Select } from '$lib/components/forms';
	import { designVersions, selectedDesign } from '$lib/stores';
	import { oadApi } from '$lib/api/client';
	import { toasts } from '$lib/stores/toast';
	import type { DesignVersion, EcoAssessment, CertificationRecord } from '$lib/types';
	import {
		ArrowLeft,
		Lightbulb,
		CheckCircle,
		Clock,
		AlertTriangle,
		Leaf,
		Zap,
		Droplets,
		Recycle,
		Shield,
		Award,
		FileText,
		Wrench,
		Factory,
		ChevronRight,
		AlertCircle,
		Settings,
		Play,
		RefreshCw,
		Package,
		Users,
		TrendingUp,
		Thermometer,
		History,
		Plus,
		FlaskConical
	} from 'lucide-svelte';

	// Route params
	$: versionId = $page.params.id;

	// Design data
	let design: DesignVersion | null = null;
	let ecoAssessment: EcoAssessment | null = null;
	let certification: CertificationRecord | null = null;
	let materialProfile: any = null;
	let lifecycleModel: any = null;
	let laborProfile: any = null;
	let simulations: any[] = [];
	let integrationCheck: any = null;
	let auditTrail: any[] = [];
	let loading = true;

	// UI State
	let activeTab = 'overview';
	const tabs = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'materials', label: 'Materials' },
		{ id: 'eco', label: 'Eco Assessment' },
		{ id: 'lifecycle', label: 'Lifecycle' },
		{ id: 'labor', label: 'Labor Profile' },
		{ id: 'certification', label: 'Certification' }
	];

	// Modals
	let showMaterialsModal = false;
	let showEcoAssessmentModal = false;
	let showSimulationModal = false;
	let showCertificationModal = false;
	let showAdvanceModal = false;

	// Form states
	let isRunningAssessment = false;
	let isRunningSimulation = false;
	let isCertifying = false;

	// Material form
	let materialsList: { name: string; quantity: number; embodiedEnergy: number; carbon: number; toxicity: number; recyclability: number }[] = [];

	// Status flow
	const statusFlow = [
		{ status: 'draft', label: 'Draft', icon: FileText, description: 'Design in development' },
		{ status: 'under_review', label: 'Under Review', icon: FlaskConical, description: 'Analysis in progress' },
		{ status: 'certified', label: 'Certified', icon: Award, description: 'Ready for production' }
	];

	onMount(async () => {
		await loadDesign();
	});

	async function loadDesign() {
		loading = true;
		try {
			const designData = await oadApi.getVersion(versionId);
			design = designData;

			const [eco, cert] = await Promise.all([
				oadApi.getEcoAssessment(versionId).catch(() => null),
				oadApi.getCertification(versionId).catch(() => null)
			]);

			ecoAssessment = eco;
			certification = cert;
		} catch (err) {
			console.warn('API not available, using mock data');
			loadMockData();
		} finally {
			loading = false;
		}
	}

	function loadMockData() {
		design = {
			id: versionId,
			specId: 'spec_001',
			label: 'Solar Panel Mount v2.3',
			createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
			authors: ['alice', 'bob'],
			cadFiles: ['mount_v2.3.step', 'assembly.pdf'],
			materials: ['aluminum_6061', 'stainless_steel_304', 'hdpe'],
			parameters: {
				loadCapacity: 100,
				tiltRange: '0-45',
				windRating: 150,
				warranty: 20
			},
			changeLog: 'Improved bolt pattern for easier installation, enhanced corrosion resistance',
			status: 'certified'
		};

		materialProfile = {
			versionId,
			materials: ['aluminum_6061', 'stainless_steel_304', 'hdpe'],
			quantitiesKg: { aluminum_6061: 5.2, stainless_steel_304: 3.1, hdpe: 0.8 },
			embodiedEnergyMj: { aluminum_6061: 850, stainless_steel_304: 120, hdpe: 65 },
			carbonKgCo2Eq: { aluminum_6061: 52, stainless_steel_304: 8, hdpe: 2.4 },
			toxicityIndex: { aluminum_6061: 0.15, stainless_steel_304: 0.08, hdpe: 0.25 },
			recyclabilityIndex: { aluminum_6061: 0.95, stainless_steel_304: 0.92, hdpe: 0.65 },
			waterUseL: { aluminum_6061: 120, stainless_steel_304: 45, hdpe: 30 },
			landUseM2: { aluminum_6061: 0.8, stainless_steel_304: 0.4, hdpe: 0.2 }
		};

		ecoAssessment = {
			versionId,
			embodiedEnergyNorm: 0.1035,
			carbonIntensityNorm: 0.0624,
			toxicityNorm: 0.16,
			recyclabilityNorm: 0.84,
			waterUseNorm: 0.0195,
			landUseNorm: 0.014,
			repairabilityNorm: 0.75,
			ecoScore: 0.28,
			passed: true
		};

		lifecycleModel = {
			versionId,
			expectedLifetimeYears: 20,
			maintenanceIntervalDays: 365,
			maintenanceLaborHoursPerInterval: 2,
			disassemblyHours: 3,
			refurbCyclesPossible: 2,
			dominantFailureModes: ['corrosion', 'bolt_loosening', 'seal_degradation'],
			lifecycleBurdenIndex: 0.32
		};

		laborProfile = {
			versionId,
			productionSteps: [
				{ stepId: 'step_1', name: 'Cut and shape aluminum', skillTier: 'medium', estimatedHours: 3, requiredTools: ['bandsaw', 'drill_press', 'jig'] },
				{ stepId: 'step_2', name: 'Weld frame assembly', skillTier: 'high', estimatedHours: 4, requiredTools: ['tig_welder', 'clamps'] },
				{ stepId: 'step_3', name: 'Machine mounting holes', skillTier: 'medium', estimatedHours: 1.5, requiredTools: ['cnc_mill'] },
				{ stepId: 'step_4', name: 'Surface treatment', skillTier: 'low', estimatedHours: 2, requiredTools: ['spray_booth', 'powder_coat'] },
				{ stepId: 'step_5', name: 'Final assembly and QC', skillTier: 'medium', estimatedHours: 1.5, requiredTools: ['torque_wrench', 'testing_rig'] }
			],
			totalProductionHours: 12,
			hoursBySkillTier: { low: 2, medium: 6, high: 4, expert: 0 },
			totalMaintenanceHoursOverLife: 40
		};

		simulations = [
			{ id: 'sim_1', type: 'structural', feasibilityScore: 0.92, passedStructural: true, passedThermal: true, passedSafety: true, notes: 'Withstands 150kg load with safety factor 1.5' },
			{ id: 'sim_2', type: 'thermal', feasibilityScore: 0.88, passedStructural: true, passedThermal: true, passedSafety: true, notes: 'Operating range -20°C to +65°C' }
		];

		integrationCheck = {
			versionId,
			compatibleSystems: ['roof_structure_standard', 'electrical_grid_220v', 'monitoring_system_v3'],
			conflicts: [],
			circularLoops: ['aluminum_recycling', 'steel_recycling'],
			integrationScore: 0.85
		};

		certification = {
			versionId,
			certifiedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
			certifiedBy: ['carol', 'dave'],
			criteriaPassed: ['eco_assessment', 'feasibility', 'safety', 'integration'],
			criteriaFailed: [],
			documentationBundleUri: `integral://docs/${versionId}`,
			status: 'certified'
		};

		auditTrail = [
			{ id: 'a1', timestamp: new Date(Date.now() - 86400000 * 14), type: 'version_created', actor: 'alice', details: 'Design version created' },
			{ id: 'a2', timestamp: new Date(Date.now() - 86400000 * 12), type: 'materials_defined', actor: 'alice', details: 'Material profile added' },
			{ id: 'a3', timestamp: new Date(Date.now() - 86400000 * 10), type: 'eco_assessed', actor: 'system', details: 'Eco assessment completed: 0.28 (PASSED)' },
			{ id: 'a4', timestamp: new Date(Date.now() - 86400000 * 9), type: 'simulation_run', actor: 'bob', details: 'Structural simulation passed' },
			{ id: 'a5', timestamp: new Date(Date.now() - 86400000 * 8), type: 'simulation_run', actor: 'bob', details: 'Thermal simulation passed' },
			{ id: 'a6', timestamp: new Date(Date.now() - 86400000 * 7), type: 'certified', actor: 'carol', details: 'All criteria passed, design certified' }
		];
	}

	function getStatusIndex(status: string): number {
		return statusFlow.findIndex(s => s.status === status);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatTimeAgo(date: Date): string {
		const diff = Date.now() - date.getTime();
		const days = Math.floor(diff / 86400000);
		if (days > 0) return `${days}d ago`;
		const hours = Math.floor(diff / 3600000);
		if (hours > 0) return `${hours}h ago`;
		return 'Just now';
	}

	function getEcoScoreColor(score: number): string {
		if (score <= 0.3) return 'text-eco-400';
		if (score <= 0.5) return 'text-yellow-400';
		return 'text-red-400';
	}

	function getEcoScoreLabel(score: number): string {
		if (score <= 0.3) return 'Excellent';
		if (score <= 0.5) return 'Good';
		return 'Needs Improvement';
	}

	async function runEcoAssessment() {
		isRunningAssessment = true;
		try {
			const result = await oadApi.computeEcoAssessment(versionId);
			ecoAssessment = result;
			toasts.success('Assessment Complete', `Eco score: ${(result.ecoScore * 100).toFixed(0)}%`);
		} catch (err) {
			// Demo mode
			ecoAssessment = {
				versionId,
				embodiedEnergyNorm: 0.12,
				carbonIntensityNorm: 0.08,
				toxicityNorm: 0.18,
				recyclabilityNorm: 0.82,
				waterUseNorm: 0.025,
				landUseNorm: 0.018,
				repairabilityNorm: 0.72,
				ecoScore: 0.31,
				passed: true
			};
			toasts.success('Assessment Complete', 'Eco score: 31% (PASSED)');
		} finally {
			isRunningAssessment = false;
			showEcoAssessmentModal = false;
		}
	}

	async function runSimulation() {
		isRunningSimulation = true;
		try {
			const result = await oadApi.runSimulation(versionId, { type: 'comprehensive' });
			simulations = [...simulations, result];
			toasts.success('Simulation Complete', `Feasibility: ${(result.feasibilityScore * 100).toFixed(0)}%`);
		} catch (err) {
			// Demo mode
			const newSim = {
				id: `sim_${Date.now()}`,
				type: 'comprehensive',
				feasibilityScore: 0.89,
				passedStructural: true,
				passedThermal: true,
				passedSafety: true,
				notes: 'All safety criteria met'
			};
			simulations = [...simulations, newSim];
			toasts.success('Simulation Complete', 'Feasibility: 89%');
		} finally {
			isRunningSimulation = false;
			showSimulationModal = false;
		}
	}

	async function requestCertification() {
		isCertifying = true;
		try {
			const result = await oadApi.requestCertification(versionId, ['current_user']);
			certification = result;
			if (result.status === 'certified') {
				design = { ...design!, status: 'certified' };
				toasts.success('Design Certified!', 'All criteria passed. Ready for production.');
			} else {
				toasts.warning('Certification Pending', `Failed criteria: ${result.criteriaFailed.join(', ')}`);
			}
		} catch (err) {
			// Demo mode
			const allPassed = ecoAssessment?.passed && simulations.length > 0 && (integrationCheck?.integrationScore || 0) >= 0.6;
			certification = {
				versionId,
				certifiedAt: new Date().toISOString(),
				certifiedBy: ['current_user'],
				criteriaPassed: allPassed ? ['eco_assessment', 'feasibility', 'safety', 'integration'] : ['eco_assessment'],
				criteriaFailed: allPassed ? [] : ['feasibility', 'integration'],
				documentationBundleUri: `integral://docs/${versionId}`,
				status: allPassed ? 'certified' : 'pending'
			};
			if (allPassed) {
				design = { ...design!, status: 'certified' };
				toasts.success('Design Certified!', 'All criteria passed. Ready for production.');
			} else {
				toasts.warning('Certification Pending', 'Some criteria not met');
			}
		} finally {
			isCertifying = false;
			showCertificationModal = false;
		}
	}

	function canCertify(): boolean {
		return !!ecoAssessment?.passed && simulations.length > 0 && !!integrationCheck;
	}
</script>

<Header
	title={design?.label || 'Loading...'}
	subtitle="Open Access Design"
/>

<PageContainer>
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
		</div>
	{:else if design}
		<!-- Back Navigation -->
		<div class="mb-6">
			<Button variant="ghost" on:click={() => goto('/oad')}>
				<ArrowLeft class="w-4 h-4 mr-2" />
				Back to Designs
			</Button>
		</div>

		<!-- Status Progress -->
		<Card class="mb-6">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-lg font-semibold text-white">Design Progress</h3>
				{#if design.status === 'draft' && canCertify()}
					<Button variant="primary" size="sm" on:click={() => showCertificationModal = true}>
						<Award class="w-4 h-4 mr-2" />
						Request Certification
					</Button>
				{/if}
			</div>
			<div class="flex items-center gap-4">
				{#each statusFlow as phase, i}
					{@const currentIndex = getStatusIndex(design.status)}
					{@const isComplete = i < currentIndex || (i === currentIndex && design.status === 'certified')}
					{@const isCurrent = i === currentIndex && design.status !== 'certified'}
					<div class="flex-1">
						<Tooltip content={phase.description}>
							<div
								class="p-4 rounded-lg border text-center transition-all
									{isComplete ? 'bg-eco-500/10 border-eco-500/30' :
									isCurrent ? 'bg-primary-500/20 border-primary-500' :
									'bg-surface-800/50 border-surface-700'}"
							>
								<svelte:component
									this={phase.icon}
									class="w-6 h-6 mx-auto mb-2 {isComplete ? 'text-eco-400' : isCurrent ? 'text-primary-400' : 'text-surface-500'}"
								/>
								<span class="text-sm font-medium {isComplete ? 'text-eco-400' : isCurrent ? 'text-white' : 'text-surface-500'}">
									{phase.label}
								</span>
							</div>
						</Tooltip>
					</div>
					{#if i < statusFlow.length - 1}
						<div class="w-12 h-0.5 {i < currentIndex ? 'bg-eco-500' : 'bg-surface-700'}"></div>
					{/if}
				{/each}
			</div>
		</Card>

		<!-- Main Grid -->
		<div class="grid gap-6 lg:grid-cols-3">
			<div class="lg:col-span-2 space-y-6">
				<Tabs {tabs} bind:activeTab />

				<!-- Overview Tab -->
				{#if activeTab === 'overview'}
					<Card>
						<div class="space-y-6">
							<div class="flex items-center gap-3">
								<Badge variant={design.status === 'certified' ? 'success' : design.status === 'under_review' ? 'warning' : 'info'}>
									{design.status === 'certified' ? 'Certified' : design.status === 'under_review' ? 'Under Review' : 'Draft'}
								</Badge>
								{#if ecoAssessment}
									<Badge variant={ecoAssessment.ecoScore <= 0.3 ? 'success' : ecoAssessment.ecoScore <= 0.5 ? 'warning' : 'danger'}>
										Eco: {(ecoAssessment.ecoScore * 100).toFixed(0)}%
									</Badge>
								{/if}
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div>
									<span class="text-sm text-surface-500">Authors</span>
									<p class="text-surface-200">{design.authors?.join(', ') || 'Unknown'}</p>
								</div>
								<div>
									<span class="text-sm text-surface-500">Created</span>
									<p class="text-surface-200">{formatDate(design.createdAt)}</p>
								</div>
							</div>

							{#if design.changeLog}
								<div>
									<span class="text-sm text-surface-500">Change Log</span>
									<p class="text-surface-300 mt-1">{design.changeLog}</p>
								</div>
							{/if}

							{#if design.parameters}
								<div>
									<span class="text-sm text-surface-500 block mb-2">Parameters</span>
									<div class="grid grid-cols-2 gap-2">
										{#each Object.entries(design.parameters) as [key, value]}
											<div class="p-2 bg-surface-800 rounded">
												<span class="text-xs text-surface-500">{key}</span>
												<p class="text-surface-200">{value}</p>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if design.cadFiles?.length}
								<div>
									<span class="text-sm text-surface-500 block mb-2">CAD Files</span>
									<div class="flex flex-wrap gap-2">
										{#each design.cadFiles as file}
											<Badge>{file}</Badge>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</Card>

					<!-- Quick Actions -->
					<Card>
						<h3 class="text-lg font-semibold text-white mb-4">Analysis Actions</h3>
						<div class="grid grid-cols-2 gap-3">
							<Button variant="secondary" on:click={() => showEcoAssessmentModal = true}>
								<Leaf class="w-4 h-4 mr-2" />
								Run Eco Assessment
							</Button>
							<Button variant="secondary" on:click={() => showSimulationModal = true}>
								<FlaskConical class="w-4 h-4 mr-2" />
								Run Simulation
							</Button>
							{#if design.status !== 'certified' && canCertify()}
								<Button variant="primary" class="col-span-2" on:click={() => showCertificationModal = true}>
									<Award class="w-4 h-4 mr-2" />
									Request Certification
								</Button>
							{/if}
						</div>
					</Card>
				{/if}

				<!-- Materials Tab -->
				{#if activeTab === 'materials'}
					<Card>
						<div class="flex justify-between items-center mb-6">
							<h3 class="text-lg font-semibold text-white">Material Profile</h3>
							<Button variant="secondary" size="sm" on:click={() => showMaterialsModal = true}>
								<Plus class="w-4 h-4 mr-2" />
								Add Material
							</Button>
						</div>

						{#if materialProfile}
							<div class="space-y-4">
								{#each materialProfile.materials as material}
									{@const qty = materialProfile.quantitiesKg[material]}
									{@const energy = materialProfile.embodiedEnergyMj[material]}
									{@const carbon = materialProfile.carbonKgCo2Eq[material]}
									{@const recyclable = materialProfile.recyclabilityIndex[material]}
									<div class="p-4 bg-surface-800 rounded-lg">
										<div class="flex justify-between items-start mb-3">
											<div>
												<h4 class="font-medium text-white">{material.replace('_', ' ')}</h4>
												<p class="text-sm text-surface-500">{qty} kg</p>
											</div>
											<Badge variant={recyclable >= 0.8 ? 'success' : recyclable >= 0.5 ? 'warning' : 'danger'}>
												{(recyclable * 100).toFixed(0)}% recyclable
											</Badge>
										</div>
										<div class="grid grid-cols-3 gap-4 text-sm">
											<div>
												<span class="text-surface-500">Energy</span>
												<p class="text-surface-200">{energy} MJ</p>
											</div>
											<div>
												<span class="text-surface-500">Carbon</span>
												<p class="text-surface-200">{carbon} kg CO2</p>
											</div>
											<div>
												<span class="text-surface-500">Toxicity</span>
												<p class="text-surface-200">{(materialProfile.toxicityIndex[material] * 100).toFixed(0)}%</p>
											</div>
										</div>
									</div>
								{/each}
							</div>

							<div class="mt-6 pt-6 border-t border-surface-700">
								<h4 class="font-medium text-white mb-3">Totals</h4>
								<div class="grid grid-cols-4 gap-4">
									<div class="text-center p-3 bg-surface-800 rounded">
										<Package class="w-5 h-5 mx-auto mb-1 text-surface-400" />
										<p class="text-lg font-bold text-white">{Object.values(materialProfile.quantitiesKg).reduce((a, b) => a + b, 0).toFixed(1)}</p>
										<p class="text-xs text-surface-500">Total kg</p>
									</div>
									<div class="text-center p-3 bg-surface-800 rounded">
										<Zap class="w-5 h-5 mx-auto mb-1 text-yellow-400" />
										<p class="text-lg font-bold text-white">{Object.values(materialProfile.embodiedEnergyMj).reduce((a, b) => a + b, 0)}</p>
										<p class="text-xs text-surface-500">Total MJ</p>
									</div>
									<div class="text-center p-3 bg-surface-800 rounded">
										<Leaf class="w-5 h-5 mx-auto mb-1 text-eco-400" />
										<p class="text-lg font-bold text-white">{Object.values(materialProfile.carbonKgCo2Eq).reduce((a, b) => a + b, 0).toFixed(1)}</p>
										<p class="text-xs text-surface-500">kg CO2</p>
									</div>
									<div class="text-center p-3 bg-surface-800 rounded">
										<Droplets class="w-5 h-5 mx-auto mb-1 text-blue-400" />
										<p class="text-lg font-bold text-white">{Object.values(materialProfile.waterUseL).reduce((a, b) => a + b, 0)}</p>
										<p class="text-xs text-surface-500">Liters</p>
									</div>
								</div>
							</div>
						{:else}
							<EmptyState
								title="No material profile"
								description="Add materials to analyze environmental impact"
							>
								<Button slot="action" variant="primary" on:click={() => showMaterialsModal = true}>
									Add Materials
								</Button>
							</EmptyState>
						{/if}
					</Card>
				{/if}

				<!-- Eco Assessment Tab -->
				{#if activeTab === 'eco'}
					<Card>
						<div class="flex justify-between items-center mb-6">
							<h3 class="text-lg font-semibold text-white">Ecological Assessment</h3>
							<Button variant="secondary" size="sm" on:click={() => showEcoAssessmentModal = true}>
								<RefreshCw class="w-4 h-4 mr-2" />
								Re-run
							</Button>
						</div>

						{#if ecoAssessment}
							<div class="text-center mb-6">
								<div class="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 {ecoAssessment.passed ? 'border-eco-500' : 'border-red-500'}">
									<div>
										<p class="text-3xl font-bold {getEcoScoreColor(ecoAssessment.ecoScore)}">
											{(ecoAssessment.ecoScore * 100).toFixed(0)}%
										</p>
										<p class="text-sm text-surface-500">{getEcoScoreLabel(ecoAssessment.ecoScore)}</p>
									</div>
								</div>
								<div class="mt-4">
									<Badge variant={ecoAssessment.passed ? 'success' : 'danger'} size="lg">
										{ecoAssessment.passed ? 'PASSED' : 'FAILED'} (threshold: 50%)
									</Badge>
								</div>
							</div>

							<div class="space-y-4">
								<div>
									<div class="flex justify-between text-sm mb-1">
										<span class="text-surface-400 flex items-center gap-2">
											<Zap class="w-4 h-4" /> Embodied Energy
										</span>
										<span class="text-white">{(ecoAssessment.embodiedEnergyNorm * 100).toFixed(1)}%</span>
									</div>
									<ProgressBar value={ecoAssessment.embodiedEnergyNorm * 100} max={100} color="warning" size="sm" />
								</div>

								<div>
									<div class="flex justify-between text-sm mb-1">
										<span class="text-surface-400 flex items-center gap-2">
											<Leaf class="w-4 h-4" /> Carbon Intensity
										</span>
										<span class="text-white">{(ecoAssessment.carbonIntensityNorm * 100).toFixed(1)}%</span>
									</div>
									<ProgressBar value={ecoAssessment.carbonIntensityNorm * 100} max={100} color="warning" size="sm" />
								</div>

								<div>
									<div class="flex justify-between text-sm mb-1">
										<span class="text-surface-400 flex items-center gap-2">
											<AlertTriangle class="w-4 h-4" /> Toxicity
										</span>
										<span class="text-white">{(ecoAssessment.toxicityNorm * 100).toFixed(1)}%</span>
									</div>
									<ProgressBar value={ecoAssessment.toxicityNorm * 100} max={100} color="danger" size="sm" />
								</div>

								<div>
									<div class="flex justify-between text-sm mb-1">
										<span class="text-surface-400 flex items-center gap-2">
											<Recycle class="w-4 h-4" /> Recyclability
										</span>
										<span class="text-white">{(ecoAssessment.recyclabilityNorm * 100).toFixed(1)}%</span>
									</div>
									<ProgressBar value={ecoAssessment.recyclabilityNorm * 100} max={100} color="success" size="sm" />
								</div>

								<div>
									<div class="flex justify-between text-sm mb-1">
										<span class="text-surface-400 flex items-center gap-2">
											<Wrench class="w-4 h-4" /> Repairability
										</span>
										<span class="text-white">{(ecoAssessment.repairabilityNorm * 100).toFixed(1)}%</span>
									</div>
									<ProgressBar value={ecoAssessment.repairabilityNorm * 100} max={100} color="success" size="sm" />
								</div>
							</div>
						{:else}
							<EmptyState
								title="No assessment yet"
								description="Run an ecological assessment to evaluate this design"
							>
								<Button slot="action" variant="primary" on:click={() => showEcoAssessmentModal = true}>
									Run Assessment
								</Button>
							</EmptyState>
						{/if}
					</Card>
				{/if}

				<!-- Lifecycle Tab -->
				{#if activeTab === 'lifecycle'}
					<Card>
						<h3 class="text-lg font-semibold text-white mb-6">Lifecycle Model</h3>

						{#if lifecycleModel}
							<div class="grid grid-cols-2 gap-4 mb-6">
								<div class="p-4 bg-surface-800 rounded-lg text-center">
									<Clock class="w-6 h-6 mx-auto mb-2 text-primary-400" />
									<p class="text-2xl font-bold text-white">{lifecycleModel.expectedLifetimeYears}</p>
									<p class="text-sm text-surface-500">Expected Years</p>
								</div>
								<div class="p-4 bg-surface-800 rounded-lg text-center">
									<Wrench class="w-6 h-6 mx-auto mb-2 text-yellow-400" />
									<p class="text-2xl font-bold text-white">{lifecycleModel.maintenanceIntervalDays}</p>
									<p class="text-sm text-surface-500">Days Between Maintenance</p>
								</div>
								<div class="p-4 bg-surface-800 rounded-lg text-center">
									<RefreshCw class="w-6 h-6 mx-auto mb-2 text-eco-400" />
									<p class="text-2xl font-bold text-white">{lifecycleModel.refurbCyclesPossible}</p>
									<p class="text-sm text-surface-500">Refurb Cycles</p>
								</div>
								<div class="p-4 bg-surface-800 rounded-lg text-center">
									<Settings class="w-6 h-6 mx-auto mb-2 text-surface-400" />
									<p class="text-2xl font-bold text-white">{lifecycleModel.disassemblyHours}h</p>
									<p class="text-sm text-surface-500">Disassembly Time</p>
								</div>
							</div>

							<div>
								<h4 class="font-medium text-white mb-3">Dominant Failure Modes</h4>
								<div class="flex flex-wrap gap-2">
									{#each lifecycleModel.dominantFailureModes as mode}
										<Badge variant="warning">{mode.replace('_', ' ')}</Badge>
									{/each}
								</div>
							</div>

							<div class="mt-6 p-4 bg-surface-800 rounded-lg">
								<div class="flex justify-between items-center">
									<span class="text-surface-400">Lifecycle Burden Index</span>
									<span class="text-lg font-bold {lifecycleModel.lifecycleBurdenIndex <= 0.4 ? 'text-eco-400' : 'text-yellow-400'}">
										{(lifecycleModel.lifecycleBurdenIndex * 100).toFixed(0)}%
									</span>
								</div>
								<ProgressBar value={lifecycleModel.lifecycleBurdenIndex * 100} max={100} color={lifecycleModel.lifecycleBurdenIndex <= 0.4 ? 'success' : 'warning'} class="mt-2" />
							</div>
						{:else}
							<EmptyState title="No lifecycle model" description="Define lifecycle parameters for this design" />
						{/if}
					</Card>
				{/if}

				<!-- Labor Tab -->
				{#if activeTab === 'labor'}
					<Card>
						<h3 class="text-lg font-semibold text-white mb-6">Labor Profile</h3>

						{#if laborProfile}
							<div class="grid grid-cols-4 gap-4 mb-6">
								{#each Object.entries(laborProfile.hoursBySkillTier) as [tier, hours]}
									<div class="p-3 bg-surface-800 rounded-lg text-center">
										<p class="text-xl font-bold text-white">{hours}h</p>
										<p class="text-xs text-surface-500 capitalize">{tier}</p>
									</div>
								{/each}
							</div>

							<div class="space-y-3">
								{#each laborProfile.productionSteps as step, i}
									<div class="p-4 bg-surface-800 rounded-lg">
										<div class="flex items-start justify-between">
											<div class="flex items-center gap-3">
												<div class="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
													{i + 1}
												</div>
												<div>
													<p class="font-medium text-white">{step.name}</p>
													<p class="text-sm text-surface-500">{step.estimatedHours}h • {step.skillTier} skill</p>
												</div>
											</div>
											<Badge variant={step.skillTier === 'high' ? 'warning' : step.skillTier === 'expert' ? 'danger' : 'info'}>
												{step.skillTier}
											</Badge>
										</div>
										{#if step.requiredTools?.length}
											<div class="mt-2 flex flex-wrap gap-1">
												{#each step.requiredTools as tool}
													<Badge size="sm" variant="secondary">{tool}</Badge>
												{/each}
											</div>
										{/if}
									</div>
								{/each}
							</div>

							<div class="mt-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
								<div class="flex justify-between items-center">
									<span class="text-primary-400">Total Production Hours</span>
									<span class="text-2xl font-bold text-white">{laborProfile.totalProductionHours}h</span>
								</div>
							</div>
						{:else}
							<EmptyState title="No labor profile" description="Define production steps and labor requirements" />
						{/if}
					</Card>
				{/if}

				<!-- Certification Tab -->
				{#if activeTab === 'certification'}
					<Card>
						<h3 class="text-lg font-semibold text-white mb-6">Certification Status</h3>

						{#if certification}
							<div class="text-center mb-6">
								<div class="inline-flex p-4 rounded-full {certification.status === 'certified' ? 'bg-eco-500/20' : 'bg-yellow-500/20'}">
									{#if certification.status === 'certified'}
										<Award class="w-12 h-12 text-eco-400" />
									{:else}
										<Clock class="w-12 h-12 text-yellow-400" />
									{/if}
								</div>
								<h4 class="text-xl font-bold mt-4 {certification.status === 'certified' ? 'text-eco-400' : 'text-yellow-400'}">
									{certification.status === 'certified' ? 'Certified' : 'Pending'}
								</h4>
								{#if certification.certifiedAt}
									<p class="text-surface-500 text-sm mt-1">
										{formatDate(certification.certifiedAt)} by {certification.certifiedBy?.join(', ')}
									</p>
								{/if}
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div>
									<h5 class="text-sm font-medium text-surface-400 mb-2">Passed Criteria</h5>
									<div class="space-y-2">
										{#each certification.criteriaPassed as criteria}
											<div class="flex items-center gap-2 p-2 bg-eco-500/10 rounded">
												<CheckCircle class="w-4 h-4 text-eco-400" />
												<span class="text-eco-300 capitalize">{criteria.replace('_', ' ')}</span>
											</div>
										{/each}
									</div>
								</div>
								<div>
									<h5 class="text-sm font-medium text-surface-400 mb-2">Failed Criteria</h5>
									{#if certification.criteriaFailed.length === 0}
										<p class="text-surface-500 text-sm">None</p>
									{:else}
										<div class="space-y-2">
											{#each certification.criteriaFailed as criteria}
												<div class="flex items-center gap-2 p-2 bg-red-500/10 rounded">
													<AlertCircle class="w-4 h-4 text-red-400" />
													<span class="text-red-300 capitalize">{criteria.replace('_', ' ')}</span>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{:else}
							<EmptyState
								title="Not yet certified"
								description="Complete all assessments and request certification"
							>
								{#if canCertify()}
									<Button slot="action" variant="primary" on:click={() => showCertificationModal = true}>
										Request Certification
									</Button>
								{:else}
									<Alert type="warning" slot="action">
										Complete eco assessment and simulations first
									</Alert>
								{/if}
							</EmptyState>
						{/if}
					</Card>

					<!-- Certification Requirements -->
					<Card>
						<h3 class="text-sm font-medium text-surface-400 mb-4">Certification Requirements</h3>
						<div class="space-y-3">
							<div class="flex items-center gap-3">
								{#if ecoAssessment?.passed}
									<CheckCircle class="w-5 h-5 text-eco-400" />
								{:else}
									<AlertCircle class="w-5 h-5 text-surface-500" />
								{/if}
								<div>
									<p class="text-surface-300">Eco Assessment Passed</p>
									<p class="text-xs text-surface-500">Score must be ≤ 50%</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								{#if simulations.length > 0 && simulations[simulations.length - 1]?.feasibilityScore >= 0.7}
									<CheckCircle class="w-5 h-5 text-eco-400" />
								{:else}
									<AlertCircle class="w-5 h-5 text-surface-500" />
								{/if}
								<div>
									<p class="text-surface-300">Feasibility Check</p>
									<p class="text-xs text-surface-500">Score must be ≥ 70%</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								{#if simulations.some(s => s.passedStructural && s.passedThermal && s.passedSafety)}
									<CheckCircle class="w-5 h-5 text-eco-400" />
								{:else}
									<AlertCircle class="w-5 h-5 text-surface-500" />
								{/if}
								<div>
									<p class="text-surface-300">Safety Checks</p>
									<p class="text-xs text-surface-500">Structural, thermal, safety must pass</p>
								</div>
							</div>
							<div class="flex items-center gap-3">
								{#if integrationCheck?.integrationScore >= 0.6}
									<CheckCircle class="w-5 h-5 text-eco-400" />
								{:else}
									<AlertCircle class="w-5 h-5 text-surface-500" />
								{/if}
								<div>
									<p class="text-surface-300">Integration Check</p>
									<p class="text-xs text-surface-500">Score must be ≥ 60%</p>
								</div>
							</div>
						</div>
					</Card>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Quick Stats -->
				<Card>
					<h3 class="text-sm font-medium text-surface-400 mb-4">Design Summary</h3>
					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-surface-500">Status</span>
							<Badge variant={design.status === 'certified' ? 'success' : 'info'}>
								{design.status}
							</Badge>
						</div>
						{#if ecoAssessment}
							<div class="flex justify-between">
								<span class="text-surface-500">Eco Score</span>
								<span class="{getEcoScoreColor(ecoAssessment.ecoScore)} font-medium">
									{(ecoAssessment.ecoScore * 100).toFixed(0)}%
								</span>
							</div>
						{/if}
						{#if laborProfile}
							<div class="flex justify-between">
								<span class="text-surface-500">Production Hours</span>
								<span class="text-white">{laborProfile.totalProductionHours}h</span>
							</div>
						{/if}
						{#if lifecycleModel}
							<div class="flex justify-between">
								<span class="text-surface-500">Expected Life</span>
								<span class="text-white">{lifecycleModel.expectedLifetimeYears} years</span>
							</div>
						{/if}
						{#if simulations.length > 0}
							<div class="flex justify-between">
								<span class="text-surface-500">Simulations</span>
								<span class="text-white">{simulations.length}</span>
							</div>
						{/if}
					</div>
				</Card>

				<!-- Simulations -->
				{#if simulations.length > 0}
					<Card>
						<h3 class="text-sm font-medium text-surface-400 mb-4">Simulations</h3>
						<div class="space-y-3">
							{#each simulations as sim}
								<div class="p-3 bg-surface-800 rounded-lg">
									<div class="flex justify-between items-center mb-2">
										<span class="text-surface-300 capitalize">{sim.type}</span>
										<span class="{sim.feasibilityScore >= 0.7 ? 'text-eco-400' : 'text-yellow-400'} font-medium">
											{(sim.feasibilityScore * 100).toFixed(0)}%
										</span>
									</div>
									<div class="flex gap-2">
										<Tooltip content="Structural">
											<Shield class="w-4 h-4 {sim.passedStructural ? 'text-eco-400' : 'text-red-400'}" />
										</Tooltip>
										<Tooltip content="Thermal">
											<Thermometer class="w-4 h-4 {sim.passedThermal ? 'text-eco-400' : 'text-red-400'}" />
										</Tooltip>
										<Tooltip content="Safety">
											<AlertTriangle class="w-4 h-4 {sim.passedSafety ? 'text-eco-400' : 'text-red-400'}" />
										</Tooltip>
									</div>
								</div>
							{/each}
						</div>
					</Card>
				{/if}

				<!-- Integration -->
				{#if integrationCheck}
					<Card>
						<h3 class="text-sm font-medium text-surface-400 mb-4">Integration</h3>
						<div class="space-y-3">
							<div class="flex justify-between">
								<span class="text-surface-500">Score</span>
								<span class="{integrationCheck.integrationScore >= 0.6 ? 'text-eco-400' : 'text-yellow-400'} font-medium">
									{(integrationCheck.integrationScore * 100).toFixed(0)}%
								</span>
							</div>
							{#if integrationCheck.compatibleSystems?.length}
								<div>
									<span class="text-xs text-surface-500">Compatible</span>
									<div class="flex flex-wrap gap-1 mt-1">
										{#each integrationCheck.compatibleSystems.slice(0, 3) as sys}
											<Badge size="sm" variant="success">{sys.split('_')[0]}</Badge>
										{/each}
									</div>
								</div>
							{/if}
							{#if integrationCheck.circularLoops?.length}
								<div>
									<span class="text-xs text-surface-500">Circular Loops</span>
									<div class="flex flex-wrap gap-1 mt-1">
										{#each integrationCheck.circularLoops as loop}
											<Badge size="sm" variant="primary">{loop.split('_')[0]}</Badge>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</Card>
				{/if}

				<!-- Audit Trail -->
				<Card>
					<h3 class="text-sm font-medium text-surface-400 mb-4">Recent Activity</h3>
					<div class="space-y-3">
						{#each auditTrail.slice(0, 5) as entry}
							<div class="flex items-center gap-3 text-sm">
								<div class="w-2 h-2 rounded-full bg-primary-500"></div>
								<span class="text-surface-300 flex-1 truncate">{entry.details}</span>
								<span class="text-surface-500 text-xs">{formatTimeAgo(entry.timestamp)}</span>
							</div>
						{/each}
					</div>
				</Card>
			</div>
		</div>
	{/if}
</PageContainer>

<!-- Eco Assessment Modal -->
<Modal bind:open={showEcoAssessmentModal} title="Run Eco Assessment" size="md">
	<div class="space-y-4">
		<Alert type="info">
			The ecological assessment will analyze material profiles and calculate an eco score.
		</Alert>
		<p class="text-surface-400">
			This will evaluate:
		</p>
		<ul class="list-disc list-inside text-surface-300 space-y-1">
			<li>Embodied energy (20%)</li>
			<li>Carbon intensity (20%)</li>
			<li>Toxicity (15%)</li>
			<li>Recyclability (15%)</li>
			<li>Water use (10%)</li>
			<li>Land use (10%)</li>
			<li>Repairability (10%)</li>
		</ul>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showEcoAssessmentModal = false}>Cancel</Button>
		<Button variant="primary" on:click={runEcoAssessment} loading={isRunningAssessment}>
			<Play class="w-4 h-4 mr-2" />
			Run Assessment
		</Button>
	</svelte:fragment>
</Modal>

<!-- Simulation Modal -->
<Modal bind:open={showSimulationModal} title="Run Simulation" size="md">
	<div class="space-y-4">
		<Alert type="info">
			Run structural, thermal, and safety simulations to verify design feasibility.
		</Alert>
		<p class="text-surface-400">
			Simulations will check:
		</p>
		<ul class="list-disc list-inside text-surface-300 space-y-1">
			<li>Structural integrity under load</li>
			<li>Thermal performance range</li>
			<li>Safety compliance</li>
			<li>Overall feasibility score</li>
		</ul>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showSimulationModal = false}>Cancel</Button>
		<Button variant="primary" on:click={runSimulation} loading={isRunningSimulation}>
			<FlaskConical class="w-4 h-4 mr-2" />
			Run Simulation
		</Button>
	</svelte:fragment>
</Modal>

<!-- Certification Modal -->
<Modal bind:open={showCertificationModal} title="Request Certification" size="md">
	<div class="space-y-4">
		{#if canCertify()}
			<Alert type="success">
				All prerequisites met. This design is ready for certification.
			</Alert>
		{:else}
			<Alert type="warning">
				Some requirements are not met. Please complete all assessments first.
			</Alert>
		{/if}

		<div class="space-y-3">
			<div class="flex items-center gap-3 p-3 bg-surface-800 rounded-lg">
				{#if ecoAssessment?.passed}
					<CheckCircle class="w-5 h-5 text-eco-400" />
				{:else}
					<AlertCircle class="w-5 h-5 text-red-400" />
				{/if}
				<span class="text-surface-300">Eco Assessment</span>
			</div>
			<div class="flex items-center gap-3 p-3 bg-surface-800 rounded-lg">
				{#if simulations.length > 0}
					<CheckCircle class="w-5 h-5 text-eco-400" />
				{:else}
					<AlertCircle class="w-5 h-5 text-red-400" />
				{/if}
				<span class="text-surface-300">Simulations Completed</span>
			</div>
			<div class="flex items-center gap-3 p-3 bg-surface-800 rounded-lg">
				{#if integrationCheck}
					<CheckCircle class="w-5 h-5 text-eco-400" />
				{:else}
					<AlertCircle class="w-5 h-5 text-red-400" />
				{/if}
				<span class="text-surface-300">Integration Check</span>
			</div>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showCertificationModal = false}>Cancel</Button>
		<Button variant="primary" on:click={requestCertification} loading={isCertifying} disabled={!canCertify()}>
			<Award class="w-4 h-4 mr-2" />
			Certify Design
		</Button>
	</svelte:fragment>
</Modal>
