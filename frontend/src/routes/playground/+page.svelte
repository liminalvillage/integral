<script lang="ts">
	import { Header } from '$lib/components/layout';
	import {
		Button,
		Card,
		Input,
		Modal,
		Badge,
		Alert,
		ProgressBar,
		StatCard,
		Tabs,
		EmptyState,
		StatusIndicator,
		Tooltip,
		Spinner,
		Skeleton,
		HelpPanel,
		InfoCard
	} from '$lib/components/ui';
	import {
		FormField,
		Select,
		Textarea,
		Checkbox,
		RadioGroup
	} from '$lib/components/forms';
	import { LineChart, DonutChart, BarChart } from '$lib/components/charts';
	import { FeatureTour } from '$lib/components/onboarding';
	import { toasts } from '$lib/stores/toast';
	import {
		Zap,
		Heart,
		Star,
		AlertTriangle,
		CheckCircle,
		TrendingUp,
		Users,
		Clock,
		Shield,
		Rocket,
		Target,
		Award
	} from 'lucide-svelte';

	// Tab state
	let activeTab = 'buttons';
	const tabs = [
		{ id: 'buttons', label: 'Buttons & Cards' },
		{ id: 'forms', label: 'Forms' },
		{ id: 'feedback', label: 'Feedback' },
		{ id: 'data', label: 'Data Display' },
		{ id: 'charts', label: 'Charts' },
		{ id: 'journey', label: 'User Journey' }
	];

	// Modal states
	let showModal = false;
	let showConfirmModal = false;
	let showFormModal = false;

	// Form states
	let textValue = '';
	let emailValue = '';
	let passwordValue = '';
	let searchValue = '';
	let selectValue = '';
	let textareaValue = '';
	let checkboxValue = false;
	let radioValue = 'option1';
	let formErrors: string[] = [];
	let formTouched = false;

	// User journey states
	let journeyStep = 0;
	let journeyCompleted = false;
	let taskName = '';
	let taskPriority = '';
	let taskDescription = '';
	let taskNotify = false;
	let createdTasks: Array<{ name: string; priority: string; description: string }> = [];

	// Loading states
	let isButtonLoading = false;

	// Feature tour
	let showFeatureTour = false;
	const tourSteps = [
		{
			target: '#button-section',
			title: 'Interactive Buttons',
			content: 'These buttons support various variants, sizes, and loading states.',
			position: 'bottom' as const
		},
		{
			target: '#form-section',
			title: 'Form Components',
			content: 'Complete form handling with validation and error states.',
			position: 'bottom' as const
		},
		{
			target: '#chart-section',
			title: 'Data Visualization',
			content: 'Visualize data with interactive charts.',
			position: 'top' as const
		}
	];

	// Chart data
	const lineChartData = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
		values: [65, 78, 90, 81, 95, 110],
		label: 'Monthly Progress'
	};

	const donutChartData = {
		labels: ['Design', 'Development', 'Testing', 'Review'],
		values: [25, 45, 20, 10]
	};

	const barChartData = {
		labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
		values: [12, 19, 8, 15, 22],
		label: 'Daily Tasks'
	};

	const selectOptions = [
		{ value: 'high', label: 'High Priority' },
		{ value: 'medium', label: 'Medium Priority' },
		{ value: 'low', label: 'Low Priority' }
	];

	const radioOptions = [
		{ value: 'option1', label: 'Standard Task', description: 'Regular priority task' },
		{ value: 'option2', label: 'Urgent Task', description: 'Requires immediate attention' },
		{ value: 'option3', label: 'Scheduled Task', description: 'Can be completed later' }
	];

	// Button actions
	function handlePrimaryClick() {
		toasts.success('Primary Action', 'Primary button clicked successfully!');
	}

	function handleSecondaryClick() {
		toasts.info('Secondary Action', 'Secondary button clicked.');
	}

	function handleDangerClick() {
		toasts.error('Danger Action', 'This action was intentionally dangerous!');
	}

	function handleSuccessClick() {
		toasts.success('Success!', 'Operation completed successfully.');
	}

	async function handleLoadingClick() {
		isButtonLoading = true;
		await new Promise(resolve => setTimeout(resolve, 2000));
		isButtonLoading = false;
		toasts.success('Loaded!', 'Async operation completed.');
	}

	// Form validation
	function validateForm() {
		formErrors = [];
		formTouched = true;

		if (!textValue.trim()) {
			formErrors.push('Name is required');
		}
		if (textValue.length < 3) {
			formErrors.push('Name must be at least 3 characters');
		}

		return formErrors.length === 0;
	}

	function handleFormSubmit() {
		if (validateForm()) {
			toasts.success('Form Submitted', `Hello, ${textValue}!`);
			textValue = '';
			formTouched = false;
		} else {
			toasts.error('Validation Error', 'Please fix the errors in the form.');
		}
	}

	// Modal actions
	function handleModalConfirm() {
		toasts.success('Confirmed', 'Modal action confirmed!');
		showConfirmModal = false;
	}

	// User Journey Functions
	function startJourney() {
		journeyStep = 1;
		journeyCompleted = false;
		taskName = '';
		taskPriority = '';
		taskDescription = '';
		taskNotify = false;
	}

	function nextJourneyStep() {
		if (journeyStep === 1 && !taskName.trim()) {
			toasts.error('Required', 'Please enter a task name');
			return;
		}
		if (journeyStep === 2 && !taskPriority) {
			toasts.error('Required', 'Please select a priority');
			return;
		}

		if (journeyStep < 4) {
			journeyStep++;
		} else {
			completeJourney();
		}
	}

	function prevJourneyStep() {
		if (journeyStep > 1) {
			journeyStep--;
		}
	}

	function completeJourney() {
		createdTasks = [...createdTasks, {
			name: taskName,
			priority: taskPriority,
			description: taskDescription
		}];
		journeyCompleted = true;
		journeyStep = 0;
		toasts.success('Task Created!', `"${taskName}" has been added to your tasks.`);

		// Reset form
		taskName = '';
		taskPriority = '';
		taskDescription = '';
		taskNotify = false;
	}

	function deleteTask(index: number) {
		const task = createdTasks[index];
		createdTasks = createdTasks.filter((_, i) => i !== index);
		toasts.info('Task Deleted', `"${task.name}" has been removed.`);
	}
</script>

<Header
	title="Component Playground"
	subtitle="Test all components independently and together"
/>

<div class="p-6 space-y-8">
	<!-- Introduction -->
	<Card variant="gradient" padding="lg">
		<div class="flex items-center gap-4">
			<div class="p-3 rounded-xl bg-primary-500/20">
				<Rocket class="w-8 h-8 text-primary-400" />
			</div>
			<div>
				<h2 class="text-xl font-bold text-white">Component User Journey Testing</h2>
				<p class="text-surface-400">
					Explore and test all UI components. Each component can be tested independently,
					and the User Journey tab demonstrates components working together.
				</p>
			</div>
			<Button variant="secondary" on:click={() => showFeatureTour = true}>
				Take Tour
			</Button>
		</div>
	</Card>

	<!-- Tabs Navigation -->
	<Tabs {tabs} {activeTab} on:change={(e) => activeTab = e.detail} />

	<!-- Buttons & Cards Tab -->
	{#if activeTab === 'buttons'}
		<div class="grid gap-6 lg:grid-cols-2" id="button-section">
			<!-- Buttons -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Button Variants</h3>
				<div class="space-y-4">
					<div class="flex flex-wrap gap-3">
						<Button variant="primary" on:click={handlePrimaryClick}>Primary</Button>
						<Button variant="secondary" on:click={handleSecondaryClick}>Secondary</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="danger" on:click={handleDangerClick}>Danger</Button>
						<Button variant="success" on:click={handleSuccessClick}>Success</Button>
					</div>

					<h4 class="text-sm font-medium text-surface-400 mt-6">Button Sizes</h4>
					<div class="flex flex-wrap items-center gap-3">
						<Button size="sm">Small</Button>
						<Button size="md">Medium</Button>
						<Button size="lg">Large</Button>
					</div>

					<h4 class="text-sm font-medium text-surface-400 mt-6">Button States</h4>
					<div class="flex flex-wrap gap-3">
						<Button loading={isButtonLoading} on:click={handleLoadingClick}>
							{isButtonLoading ? 'Loading...' : 'Click to Load'}
						</Button>
						<Button disabled>Disabled</Button>
						<Tooltip content="This button has a tooltip!">
							<Button variant="secondary">With Tooltip</Button>
						</Tooltip>
					</div>

					<h4 class="text-sm font-medium text-surface-400 mt-6">Icon Buttons</h4>
					<div class="flex flex-wrap gap-3">
						<Button icon variant="primary">
							<Zap class="w-5 h-5" />
						</Button>
						<Button icon variant="secondary">
							<Heart class="w-5 h-5" />
						</Button>
						<Button icon variant="ghost">
							<Star class="w-5 h-5" />
						</Button>
					</div>
				</div>
			</Card>

			<!-- Cards -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Card Variants</h3>
				<div class="space-y-4">
					<Card variant="default" padding="sm">
						<p class="text-surface-300">Default Card - Basic container</p>
					</Card>
					<Card variant="hover" padding="sm">
						<p class="text-surface-300">Hover Card - Click or hover me!</p>
					</Card>
					<Card variant="gradient" padding="sm">
						<p class="text-surface-300">Gradient Card - Special highlight</p>
					</Card>
				</div>
			</Card>

			<!-- Badges -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Badges</h3>
				<div class="flex flex-wrap gap-3">
					<Badge variant="primary">Primary</Badge>
					<Badge variant="success">Success</Badge>
					<Badge variant="warning">Warning</Badge>
					<Badge variant="danger">Danger</Badge>
					<Badge variant="info">Info</Badge>
					<Badge variant="success" dot>With Dot</Badge>
					<Badge variant="warning" size="sm">Small</Badge>
				</div>
			</Card>

			<!-- Modals -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Modals</h3>
				<div class="flex flex-wrap gap-3">
					<Button on:click={() => showModal = true}>Open Modal</Button>
					<Button variant="secondary" on:click={() => showConfirmModal = true}>
						Confirm Dialog
					</Button>
					<Button variant="ghost" on:click={() => showFormModal = true}>
						Form Modal
					</Button>
				</div>
			</Card>
		</div>
	{/if}

	<!-- Forms Tab -->
	{#if activeTab === 'forms'}
		<div class="grid gap-6 lg:grid-cols-2" id="form-section">
			<!-- Text Inputs -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Text Inputs</h3>
				<div class="space-y-4">
					<Input
						label="Name"
						placeholder="Enter your name"
						bind:value={textValue}
						error={formTouched && formErrors.length > 0 ? formErrors[0] : ''}
					/>
					<Input
						type="email"
						label="Email"
						placeholder="Enter your email"
						bind:value={emailValue}
					/>
					<Input
						type="password"
						label="Password"
						placeholder="Enter password"
						bind:value={passwordValue}
					/>
					<Input
						type="search"
						label="Search"
						placeholder="Search..."
						bind:value={searchValue}
					/>
					<Input
						label="Disabled Input"
						placeholder="Cannot edit"
						disabled
						value="Disabled value"
					/>
				</div>
			</Card>

			<!-- Form Field with Validation -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Form Field with Validation</h3>
				<div class="space-y-4">
					<FormField
						label="Validated Field"
						name="validated"
						errors={formErrors}
						touched={formTouched}
						hint="Enter at least 3 characters"
						required
					>
						<input
							type="text"
							class="input w-full"
							placeholder="Type something..."
							bind:value={textValue}
							on:blur={() => formTouched = true}
						/>
					</FormField>
					<Button on:click={handleFormSubmit}>Submit Form</Button>
				</div>
			</Card>

			<!-- Select -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Select Dropdown</h3>
				<div class="space-y-4">
					<Select
						bind:value={selectValue}
						options={selectOptions}
						placeholder="Choose priority"
					/>
					<p class="text-sm text-surface-400">
						Selected: {selectValue || 'None'}
					</p>
				</div>
			</Card>

			<!-- Textarea -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Textarea</h3>
				<div class="space-y-4">
					<Textarea
						bind:value={textareaValue}
						placeholder="Enter your message..."
						rows={4}
						maxlength={200}
					/>
				</div>
			</Card>

			<!-- Checkbox -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Checkbox</h3>
				<div class="space-y-4">
					<Checkbox
						bind:checked={checkboxValue}
						label="Accept terms and conditions"
						description="By checking this, you agree to our terms"
					/>
					<p class="text-sm text-surface-400">
						Checked: {checkboxValue ? 'Yes' : 'No'}
					</p>
				</div>
			</Card>

			<!-- Radio Group -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Radio Group</h3>
				<div class="space-y-4">
					<RadioGroup
						bind:value={radioValue}
						options={radioOptions}
						name="task-type"
					/>
					<p class="text-sm text-surface-400">
						Selected: {radioValue}
					</p>
				</div>
			</Card>
		</div>
	{/if}

	<!-- Feedback Tab -->
	{#if activeTab === 'feedback'}
		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Alerts -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Alerts</h3>
				<div class="space-y-4">
					<Alert type="info" title="Information">
						This is an informational alert message.
					</Alert>
					<Alert type="success" title="Success">
						Operation completed successfully!
					</Alert>
					<Alert type="warning" title="Warning">
						Please review before proceeding.
					</Alert>
					<Alert type="error" title="Error" dismissible>
						Something went wrong. This alert can be dismissed.
					</Alert>
				</div>
			</Card>

			<!-- Toast Triggers -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Toast Notifications</h3>
				<p class="text-surface-400 mb-4">Click buttons to trigger toast notifications:</p>
				<div class="flex flex-wrap gap-3">
					<Button variant="primary" on:click={() => toasts.success('Success', 'This is a success toast!')}>
						Success Toast
					</Button>
					<Button variant="danger" on:click={() => toasts.error('Error', 'This is an error toast!')}>
						Error Toast
					</Button>
					<Button variant="secondary" on:click={() => toasts.warning('Warning', 'This is a warning toast!')}>
						Warning Toast
					</Button>
					<Button variant="ghost" on:click={() => toasts.info('Info', 'This is an info toast!')}>
						Info Toast
					</Button>
				</div>
			</Card>

			<!-- Progress Bars -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Progress Bars</h3>
				<div class="space-y-6">
					<ProgressBar value={25} max={100} color="primary" showLabel>
						Primary Progress
					</ProgressBar>
					<ProgressBar value={50} max={100} color="success" showLabel>
						Success Progress
					</ProgressBar>
					<ProgressBar value={75} max={100} color="warning" showLabel>
						Warning Progress
					</ProgressBar>
					<ProgressBar value={90} max={100} color="danger" showLabel>
						Danger Progress
					</ProgressBar>
					<div class="flex gap-4 items-center">
						<span class="text-sm text-surface-400">Sizes:</span>
						<ProgressBar value={60} max={100} size="sm" class="flex-1" />
						<ProgressBar value={60} max={100} size="md" class="flex-1" />
						<ProgressBar value={60} max={100} size="lg" class="flex-1" />
					</div>
				</div>
			</Card>

			<!-- Status Indicators -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Status Indicators</h3>
				<div class="space-y-4">
					<div class="flex flex-wrap gap-6">
						<StatusIndicator status="online" label="Online" />
						<StatusIndicator status="offline" label="Offline" />
						<StatusIndicator status="warning" label="Warning" />
						<StatusIndicator status="error" label="Error" />
						<StatusIndicator status="pending" label="Pending" />
					</div>
					<div class="flex flex-wrap gap-6">
						<StatusIndicator status="online" label="With Pulse" pulse />
						<StatusIndicator status="online" size="sm" label="Small" />
						<StatusIndicator status="online" size="lg" label="Large" />
					</div>
				</div>
			</Card>

			<!-- Loading States -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Loading States</h3>
				<div class="space-y-6">
					<div class="flex items-center gap-6">
						<Spinner size="sm" />
						<Spinner size="md" />
						<Spinner size="lg" />
					</div>
					<div class="space-y-2">
						<Skeleton width="100%" height="1rem" />
						<Skeleton width="80%" height="1rem" />
						<Skeleton width="60%" height="1rem" />
					</div>
					<div class="flex gap-4">
						<Skeleton width="4rem" height="4rem" rounded="xl" />
						<div class="flex-1 space-y-2">
							<Skeleton width="60%" height="1rem" />
							<Skeleton width="40%" height="0.75rem" />
						</div>
					</div>
				</div>
			</Card>

			<!-- Empty State -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Empty State</h3>
				<EmptyState
					title="No items found"
					description="Get started by creating your first item."
				>
					<Button slot="action" variant="primary">Create Item</Button>
				</EmptyState>
			</Card>
		</div>
	{/if}

	<!-- Data Display Tab -->
	{#if activeTab === 'data'}
		<div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
			<!-- Stat Cards -->
			<StatCard
				title="Total Users"
				value="12,345"
				subtitle="Active accounts"
				trend="up"
				trendValue="+12.5%"
				icon={Users}
				color="primary"
			/>
			<StatCard
				title="Time Logged"
				value="847h"
				subtitle="This month"
				trend="up"
				trendValue="+8.2%"
				icon={Clock}
				color="success"
			/>
			<StatCard
				title="Tasks Completed"
				value="234"
				subtitle="Last 7 days"
				trend="down"
				trendValue="-3.1%"
				icon={Target}
				color="warning"
			/>
			<StatCard
				title="System Health"
				value="98%"
				subtitle="Uptime"
				trend="neutral"
				trendValue="0%"
				icon={Shield}
				color="success"
			/>
		</div>

		<div class="grid gap-6 lg:grid-cols-2 mt-6">
			<!-- Help Panel -->
			<HelpPanel title="How does this work?">
				<p>This help panel provides contextual information to users. It can be expanded
				to show detailed explanations, tips, and guidance.</p>
				<ul class="list-disc list-inside mt-2 space-y-1 text-surface-400">
					<li>Click to expand or collapse</li>
					<li>Supports rich content</li>
					<li>Optional "Learn more" link</li>
				</ul>
			</HelpPanel>

			<!-- Info Cards -->
			<div class="space-y-4">
				<InfoCard
					title="Quick Tip"
					description="Use keyboard shortcuts to navigate faster. Press ? to see all shortcuts."
					icon={Zap}
					color="primary"
				/>
				<InfoCard
					title="Achievement Unlocked"
					description="You've completed your first 10 tasks. Keep up the great work!"
					icon={Award}
					color="emerald"
				/>
			</div>
		</div>

		<div class="grid gap-6 lg:grid-cols-2 mt-6">
			<!-- Tooltips Demo -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Tooltips</h3>
				<div class="flex flex-wrap gap-4">
					<Tooltip content="Tooltip on top" position="top">
						<Button variant="secondary">Top</Button>
					</Tooltip>
					<Tooltip content="Tooltip on bottom" position="bottom">
						<Button variant="secondary">Bottom</Button>
					</Tooltip>
					<Tooltip content="Tooltip on left" position="left">
						<Button variant="secondary">Left</Button>
					</Tooltip>
					<Tooltip content="Tooltip on right" position="right">
						<Button variant="secondary">Right</Button>
					</Tooltip>
				</div>
			</Card>

			<!-- Tabs Demo -->
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Tabs with Counts</h3>
				<Tabs
					tabs={[
						{ id: 'all', label: 'All', count: 42 },
						{ id: 'active', label: 'Active', count: 12 },
						{ id: 'completed', label: 'Completed', count: 30 }
					]}
					activeTab="all"
				/>
			</Card>
		</div>
	{/if}

	<!-- Charts Tab -->
	{#if activeTab === 'charts'}
		<div class="grid gap-6 lg:grid-cols-2" id="chart-section">
			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Line Chart</h3>
				<LineChart data={lineChartData} height={250} gradient color="#8b5cf6" />
			</Card>

			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Bar Chart</h3>
				<BarChart data={barChartData} height={250} color="#10b981" />
			</Card>

			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Donut Chart</h3>
				<DonutChart data={donutChartData} size={250} />
			</Card>

			<Card>
				<h3 class="text-lg font-semibold text-white mb-4">Horizontal Bar Chart</h3>
				<BarChart data={barChartData} height={250} horizontal color="#f59e0b" />
			</Card>
		</div>
	{/if}

	<!-- User Journey Tab -->
	{#if activeTab === 'journey'}
		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Journey Steps -->
			<div class="lg:col-span-2 space-y-6">
				<Card variant="gradient">
					<div class="flex items-center justify-between mb-4">
						<div>
							<h3 class="text-lg font-semibold text-white">Complete User Journey Demo</h3>
							<p class="text-surface-400">Experience a full task creation workflow</p>
						</div>
						{#if journeyStep === 0}
							<Button variant="primary" on:click={startJourney}>
								<Rocket class="w-4 h-4 mr-2" />
								Start Journey
							</Button>
						{/if}
					</div>

					{#if journeyStep > 0}
						<!-- Progress -->
						<div class="mb-6">
							<div class="flex justify-between text-sm text-surface-400 mb-2">
								<span>Step {journeyStep} of 4</span>
								<span>{Math.round((journeyStep / 4) * 100)}% Complete</span>
							</div>
							<ProgressBar value={journeyStep} max={4} color="primary" />
						</div>

						<!-- Step 1: Task Name -->
						{#if journeyStep === 1}
							<div class="space-y-4">
								<h4 class="font-medium text-white">Step 1: Name Your Task</h4>
								<Input
									label="Task Name"
									placeholder="Enter a descriptive task name"
									bind:value={taskName}
								/>
								<Alert type="info">
									Choose a clear, action-oriented name for your task.
								</Alert>
							</div>
						{/if}

						<!-- Step 2: Priority -->
						{#if journeyStep === 2}
							<div class="space-y-4">
								<h4 class="font-medium text-white">Step 2: Set Priority</h4>
								<Select
									bind:value={taskPriority}
									options={selectOptions}
									placeholder="Select task priority"
								/>
								{#if taskPriority}
									<Badge variant={taskPriority === 'high' ? 'danger' : taskPriority === 'medium' ? 'warning' : 'success'}>
										{taskPriority.charAt(0).toUpperCase() + taskPriority.slice(1)} Priority Selected
									</Badge>
								{/if}
							</div>
						{/if}

						<!-- Step 3: Description -->
						{#if journeyStep === 3}
							<div class="space-y-4">
								<h4 class="font-medium text-white">Step 3: Add Description</h4>
								<Textarea
									bind:value={taskDescription}
									placeholder="Describe what needs to be done..."
									rows={4}
									maxlength={500}
								/>
							</div>
						{/if}

						<!-- Step 4: Review & Confirm -->
						{#if journeyStep === 4}
							<div class="space-y-4">
								<h4 class="font-medium text-white">Step 4: Review & Confirm</h4>
								<Card variant="default" padding="md">
									<div class="space-y-3">
										<div>
											<span class="text-sm text-surface-400">Task Name:</span>
											<p class="text-white font-medium">{taskName}</p>
										</div>
										<div>
											<span class="text-sm text-surface-400">Priority:</span>
											<div class="mt-1">
												<Badge variant={taskPriority === 'high' ? 'danger' : taskPriority === 'medium' ? 'warning' : 'success'}>
													{taskPriority}
												</Badge>
											</div>
										</div>
										{#if taskDescription}
											<div>
												<span class="text-sm text-surface-400">Description:</span>
												<p class="text-surface-300 text-sm">{taskDescription}</p>
											</div>
										{/if}
									</div>
								</Card>
								<Checkbox
									bind:checked={taskNotify}
									label="Send notification when task is created"
									description="You'll receive an email confirmation"
								/>
							</div>
						{/if}

						<!-- Navigation -->
						<div class="flex justify-between mt-6 pt-4 border-t border-surface-700">
							<Button variant="ghost" on:click={prevJourneyStep} disabled={journeyStep === 1}>
								Back
							</Button>
							<Button variant="primary" on:click={nextJourneyStep}>
								{journeyStep === 4 ? 'Create Task' : 'Continue'}
							</Button>
						</div>
					{/if}
				</Card>

				{#if journeyCompleted}
					<Alert type="success" title="Journey Complete!">
						You've successfully created a task using all the form components working together.
						The task has been added to your list on the right.
					</Alert>
				{/if}
			</div>

			<!-- Created Tasks -->
			<div>
				<Card>
					<h3 class="text-lg font-semibold text-white mb-4">Created Tasks</h3>
					{#if createdTasks.length === 0}
						<EmptyState
							title="No tasks yet"
							description="Complete the user journey to create your first task."
						/>
					{:else}
						<div class="space-y-3">
							{#each createdTasks as task, index}
								<div class="p-3 bg-surface-800 rounded-lg border border-surface-700">
									<div class="flex items-start justify-between">
										<div>
											<p class="font-medium text-white">{task.name}</p>
											<Badge
												variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}
												size="sm"
											>
												{task.priority}
											</Badge>
											{#if task.description}
												<p class="text-xs text-surface-400 mt-2">{task.description}</p>
											{/if}
										</div>
										<Button icon variant="ghost" size="sm" on:click={() => deleteTask(index)}>
											<span class="text-red-400">×</span>
										</Button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card>

				<Card class="mt-4">
					<h4 class="font-medium text-white mb-3">Journey Stats</h4>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-surface-400">Tasks Created:</span>
							<span class="text-white font-medium">{createdTasks.length}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-surface-400">High Priority:</span>
							<span class="text-red-400">{createdTasks.filter(t => t.priority === 'high').length}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-surface-400">Medium Priority:</span>
							<span class="text-yellow-400">{createdTasks.filter(t => t.priority === 'medium').length}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-surface-400">Low Priority:</span>
							<span class="text-green-400">{createdTasks.filter(t => t.priority === 'low').length}</span>
						</div>
					</div>
				</Card>
			</div>
		</div>
	{/if}
</div>

<!-- Modals -->
<Modal bind:open={showModal} title="Example Modal" size="md">
	<p class="text-surface-300">
		This is a modal dialog. It can contain any content including forms, images, or other components.
	</p>
	<Alert type="info" class="mt-4">
		Modals support a header, body, and footer section.
	</Alert>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showModal = false}>Close</Button>
		<Button variant="primary" on:click={() => { showModal = false; toasts.success('Saved!', 'Changes saved.'); }}>
			Save Changes
		</Button>
	</svelte:fragment>
</Modal>

<Modal bind:open={showConfirmModal} title="Confirm Action" size="sm">
	<div class="flex items-center gap-4">
		<div class="p-3 bg-yellow-500/20 rounded-full">
			<AlertTriangle class="w-6 h-6 text-yellow-400" />
		</div>
		<div>
			<p class="text-white font-medium">Are you sure?</p>
			<p class="text-surface-400 text-sm">This action cannot be undone.</p>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button variant="ghost" on:click={() => showConfirmModal = false}>Cancel</Button>
		<Button variant="danger" on:click={handleModalConfirm}>Confirm</Button>
	</svelte:fragment>
</Modal>

<Modal bind:open={showFormModal} title="Create New Item" size="lg">
	<div class="space-y-4">
		<Input label="Item Name" placeholder="Enter item name" />
		<Select
			options={selectOptions}
			placeholder="Select priority"
		/>
		<Textarea placeholder="Description (optional)" rows={3} />
		<Checkbox label="Mark as important" />
	</div>
	<svelte:fragment slot="footer">
		<Button variant="secondary" on:click={() => showFormModal = false}>Cancel</Button>
		<Button variant="primary" on:click={() => { showFormModal = false; toasts.success('Created!', 'Item created successfully.'); }}>
			Create Item
		</Button>
	</svelte:fragment>
</Modal>

<!-- Feature Tour -->
<FeatureTour steps={tourSteps} bind:active={showFeatureTour} />
