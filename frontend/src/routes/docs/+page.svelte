<script lang="ts">
  import { PageContainer, Header } from '$lib/components/layout';
  import { Card, Badge, Tabs } from '$lib/components/ui';
  import { HelpPanel } from '$lib/components/ui';
  import {
    Book,
    Code,
    Zap,
    Shield,
    Globe,
    Calculator,
    Vote,
    Lightbulb,
    Clock,
    Factory,
    BarChart3,
    Terminal,
    ExternalLink
  } from 'lucide-svelte';

  let activeTab = 'overview';

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'subsystems', label: 'Subsystems' },
    { id: 'formulas', label: 'Formulas' },
    { id: 'api', label: 'API Reference' },
    { id: 'federation', label: 'Federation' }
  ];

  const subsystems = [
    {
      id: 'cds',
      name: 'Collaborative Decision System',
      abbr: 'CDS',
      icon: Vote,
      color: 'emerald',
      description: 'Democratic governance through weighted consensus mechanisms',
      modules: [
        { name: 'Issue Manager', desc: 'Track community issues and discussions' },
        { name: 'Proposal Manager', desc: 'Create and manage proposals' },
        { name: 'Voting Manager', desc: 'Handle voting with configurable mechanisms' },
        { name: 'Consensus Evaluator', desc: 'Calculate weighted consensus scores' },
        { name: 'Decision Recorder', desc: 'Immutable audit trail for decisions' },
        { name: 'Conflict Resolver', desc: 'Mediation and resolution workflows' },
        { name: 'Delegation Manager', desc: 'Liquid democracy vote delegation' },
        { name: 'Stakeholder Analyzer', desc: 'Map affected parties and interests' }
      ]
    },
    {
      id: 'oad',
      name: 'Open Access Design',
      abbr: 'OAD',
      icon: Lightbulb,
      color: 'amber',
      description: 'Sustainable innovation with built-in ecological assessment',
      modules: [
        { name: 'Design Registry', desc: 'Central repository for all designs' },
        { name: 'Lifecycle Manager', desc: 'Track designs from draft to certified' },
        { name: 'Eco-Assessment', desc: 'Calculate environmental impact scores' },
        { name: 'Version Controller', desc: 'Manage design iterations' },
        { name: 'Certification Engine', desc: 'Community approval workflow' },
        { name: 'Material Mapper', desc: 'Track material requirements' }
      ]
    },
    {
      id: 'itc',
      name: 'Integral Time Credits',
      abbr: 'ITC',
      icon: Clock,
      color: 'blue',
      description: 'Fair labor accounting through transparent time-based valuation',
      modules: [
        { name: 'Labor Logger', desc: 'Record work contributions' },
        { name: 'Account Manager', desc: 'Track member credit balances' },
        { name: 'Valuation Engine', desc: 'Calculate weighted hours' },
        { name: 'Decay Calculator', desc: 'Apply time-based balance decay' },
        { name: 'Access Controller', desc: 'Resource access based on credits' },
        { name: 'Skill Registry', desc: 'Track member skills and expertise' }
      ]
    },
    {
      id: 'cos',
      name: 'Cooperative Organization System',
      abbr: 'COS',
      icon: Factory,
      color: 'purple',
      description: 'Efficient production planning and resource coordination',
      modules: [
        { name: 'Production Planner', desc: 'Create and manage production plans' },
        { name: 'Task Manager', desc: 'Coordinate work assignments' },
        { name: 'Material Tracker', desc: 'Inventory and supply management' },
        { name: 'Bottleneck Detector', desc: 'Identify production constraints' },
        { name: 'Constraint Solver', desc: 'Optimize resource allocation' },
        { name: 'Schedule Optimizer', desc: 'Coordinate timing and dependencies' }
      ]
    },
    {
      id: 'frs',
      name: 'Feedback & Review System',
      abbr: 'FRS',
      icon: BarChart3,
      color: 'rose',
      description: 'System intelligence through continuous monitoring',
      modules: [
        { name: 'Signal Collector', desc: 'Gather system metrics and feedback' },
        { name: 'Anomaly Detector', desc: 'Identify unusual patterns' },
        { name: 'Diagnostic Engine', desc: 'Generate system health reports' },
        { name: 'Recommendation Generator', desc: 'AI-powered suggestions' },
        { name: 'Trend Analyzer', desc: 'Track patterns over time' }
      ]
    }
  ];

  const formulas = [
    {
      name: 'Weighted Consensus',
      formula: 'C(s) = Σ wᵢ × supportᵢ / Σ wᵢ',
      description: 'Calculates consensus score by summing each voter\'s weight multiplied by their support level, divided by total weights.',
      variables: [
        { symbol: 'wᵢ', meaning: 'Weight of voter i (reputation, stake, or delegation)' },
        { symbol: 'supportᵢ', meaning: 'Support level from voter i (0-1)' },
        { symbol: 'C(s)', meaning: 'Consensus score for statement s (0-1)' }
      ]
    },
    {
      name: 'ITC Weighted Hours',
      formula: 'weighted_hours = base_hours × skill_weight × context_factor',
      description: 'Calculates the weighted value of labor contributions based on skill level and work context.',
      variables: [
        { symbol: 'base_hours', meaning: 'Raw hours worked' },
        { symbol: 'skill_weight', meaning: 'Multiplier based on skill rarity/difficulty (0.5-3.0)' },
        { symbol: 'context_factor', meaning: 'Adjustment for conditions (urgency, difficulty, etc.)' }
      ]
    },
    {
      name: 'Time Decay',
      formula: 'new_balance = balance × (1 - 2^(-Δt/half_life))',
      description: 'Applies exponential decay to credit balances over time, preventing hoarding.',
      variables: [
        { symbol: 'balance', meaning: 'Current credit balance' },
        { symbol: 'Δt', meaning: 'Time elapsed since last calculation' },
        { symbol: 'half_life', meaning: 'Configurable decay half-life (e.g., 365 days)' }
      ]
    },
    {
      name: 'Ecological Score',
      formula: 'E = w₁×material + w₂×energy + w₃×waste + w₄×longevity⁻¹',
      description: 'Composite environmental impact score. Lower is better, with threshold at 0.5.',
      variables: [
        { symbol: 'material', meaning: 'Raw material impact (0-1)' },
        { symbol: 'energy', meaning: 'Energy consumption score (0-1)' },
        { symbol: 'waste', meaning: 'Waste generation score (0-1)' },
        { symbol: 'longevity', meaning: 'Expected product lifespan (inverse)' },
        { symbol: 'wₙ', meaning: 'Configurable weights for each factor' }
      ]
    },
    {
      name: 'Bottleneck Score',
      formula: 'S = 0.6 × deviation + 0.4 × blocked_ratio',
      description: 'Identifies production bottlenecks by combining throughput deviation and blocked task ratio.',
      variables: [
        { symbol: 'deviation', meaning: 'How much throughput deviates from target (0-1)' },
        { symbol: 'blocked_ratio', meaning: 'Proportion of tasks blocked at this stage (0-1)' },
        { symbol: 'S', meaning: 'Bottleneck severity score (0-1)' }
      ]
    }
  ];
</script>

<PageContainer>
  <Header
    title="Documentation"
    description="Learn how INTEGRAL works and how to use it effectively"
  />

  <Tabs {tabs} bind:active={activeTab} />

  <div class="mt-6">
    {#if activeTab === 'overview'}
      <div class="grid gap-6">
        <!-- Introduction -->
        <Card>
          <div class="flex items-start gap-4 mb-6">
            <div class="p-3 rounded-xl bg-primary-500/10">
              <Book class="w-8 h-8 text-primary-400" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white mb-2">What is INTEGRAL?</h2>
              <p class="text-gray-400">
                INTEGRAL is a federated, post-monetary, cybernetic cooperative economic system.
                It replaces traditional monetary exchange with transparent, democratic resource
                allocation based on labor contributions, ecological sustainability, and collective decision-making.
              </p>
            </div>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
              <Zap class="w-6 h-6 text-amber-400 mb-3" />
              <h4 class="font-semibold text-white mb-1">Post-Monetary</h4>
              <p class="text-sm text-gray-400">No currency speculation. Value is based on labor and ecological impact.</p>
            </div>
            <div class="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
              <Shield class="w-6 h-6 text-emerald-400 mb-3" />
              <h4 class="font-semibold text-white mb-1">Transparent</h4>
              <p class="text-sm text-gray-400">All decisions and transactions are recorded in immutable audit logs.</p>
            </div>
            <div class="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
              <Vote class="w-6 h-6 text-blue-400 mb-3" />
              <h4 class="font-semibold text-white mb-1">Democratic</h4>
              <p class="text-sm text-gray-400">Weighted consensus ensures fair representation in all decisions.</p>
            </div>
            <div class="p-4 rounded-xl bg-surface-800/50 border border-surface-700">
              <Globe class="w-6 h-6 text-purple-400 mb-3" />
              <h4 class="font-semibold text-white mb-1">Federated</h4>
              <p class="text-sm text-gray-400">Autonomous nodes connect via Nostr for global cooperation.</p>
            </div>
          </div>
        </Card>

        <!-- Quick Start -->
        <Card title="Quick Start Guide">
          <div class="space-y-4">
            <div class="flex gap-4 p-4 rounded-xl bg-surface-800/50 border border-surface-700">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white">1</div>
              <div>
                <h4 class="font-semibold text-white">Create Your Identity</h4>
                <p class="text-sm text-gray-400">Generate a Nostr keypair in Settings. This is your cryptographic identity for signing all actions.</p>
              </div>
            </div>
            <div class="flex gap-4 p-4 rounded-xl bg-surface-800/50 border border-surface-700">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white">2</div>
              <div>
                <h4 class="font-semibold text-white">Register Your Skills</h4>
                <p class="text-sm text-gray-400">Add your skills in the ITC section. Skills affect your labor weighting and resource access.</p>
              </div>
            </div>
            <div class="flex gap-4 p-4 rounded-xl bg-surface-800/50 border border-surface-700">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white">3</div>
              <div>
                <h4 class="font-semibold text-white">Start Contributing</h4>
                <p class="text-sm text-gray-400">Log labor events, participate in decisions, submit designs, or help with production tasks.</p>
              </div>
            </div>
            <div class="flex gap-4 p-4 rounded-xl bg-surface-800/50 border border-surface-700">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white">4</div>
              <div>
                <h4 class="font-semibold text-white">Connect to Federation</h4>
                <p class="text-sm text-gray-400">Add relay URLs to connect with other INTEGRAL nodes and participate in cross-community activities.</p>
              </div>
            </div>
          </div>
        </Card>

        <!-- Architecture -->
        <Card title="System Architecture">
          <div class="prose prose-invert prose-sm max-w-none">
            <p>INTEGRAL consists of 5 interconnected subsystems, each handling a specific aspect of cooperative economics:</p>
            <ul class="space-y-2 mt-4">
              <li><strong class="text-emerald-400">CDS</strong> - Governance and collective decision-making</li>
              <li><strong class="text-amber-400">OAD</strong> - Design repository and certification</li>
              <li><strong class="text-blue-400">ITC</strong> - Labor accounting and credit system</li>
              <li><strong class="text-purple-400">COS</strong> - Production planning and coordination</li>
              <li><strong class="text-rose-400">FRS</strong> - Monitoring and system optimization</li>
            </ul>
            <p class="mt-4">All subsystems communicate through events and share data via hash-chained audit ledgers, ensuring transparency and integrity.</p>
          </div>
        </Card>
      </div>

    {:else if activeTab === 'subsystems'}
      <div class="space-y-6">
        {#each subsystems as system}
          <Card>
            <div class="flex items-start gap-4 mb-4">
              <div class="p-3 rounded-xl bg-{system.color}-500/10">
                <svelte:component this={system.icon} class="w-8 h-8 text-{system.color}-400" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-lg font-bold text-white">{system.name}</h3>
                  <Badge variant="primary">{system.abbr}</Badge>
                </div>
                <p class="text-gray-400">{system.description}</p>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {#each system.modules as module}
                <div class="p-3 rounded-lg bg-surface-800/50 border border-surface-700">
                  <h4 class="font-medium text-white text-sm">{module.name}</h4>
                  <p class="text-xs text-gray-400 mt-1">{module.desc}</p>
                </div>
              {/each}
            </div>
          </Card>
        {/each}
      </div>

    {:else if activeTab === 'formulas'}
      <div class="space-y-6">
        <Card>
          <div class="flex items-start gap-4 mb-6">
            <div class="p-3 rounded-xl bg-blue-500/10">
              <Calculator class="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white mb-2">Core Formulas</h2>
              <p class="text-gray-400">
                INTEGRAL uses mathematical formulas to ensure fair, transparent, and predictable
                behavior across all subsystems. Understanding these formulas helps you make the
                most of the system.
              </p>
            </div>
          </div>
        </Card>

        {#each formulas as formula}
          <Card>
            <h3 class="text-lg font-bold text-white mb-2">{formula.name}</h3>
            <div class="p-4 rounded-xl bg-surface-800 border border-surface-700 font-mono text-primary-400 text-lg mb-4">
              {formula.formula}
            </div>
            <p class="text-gray-400 mb-4">{formula.description}</p>

            <div class="space-y-2">
              <h4 class="text-sm font-semibold text-gray-300">Variables:</h4>
              {#each formula.variables as variable}
                <div class="flex gap-3 text-sm">
                  <code class="px-2 py-1 rounded bg-surface-800 text-primary-400 font-mono">{variable.symbol}</code>
                  <span class="text-gray-400">{variable.meaning}</span>
                </div>
              {/each}
            </div>
          </Card>
        {/each}
      </div>

    {:else if activeTab === 'api'}
      <div class="space-y-6">
        <Card>
          <div class="flex items-start gap-4 mb-6">
            <div class="p-3 rounded-xl bg-emerald-500/10">
              <Code class="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white mb-2">API Reference</h2>
              <p class="text-gray-400">
                INTEGRAL provides a RESTful API for programmatic access to all subsystems.
                The API uses JSON for request/response bodies and includes comprehensive
                error handling.
              </p>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-surface-800 border border-surface-700 mb-4">
            <p class="text-sm text-gray-400 mb-2">Base URL:</p>
            <code class="text-emerald-400 font-mono">http://localhost:3000/api/v1</code>
          </div>
        </Card>

        <!-- API Endpoints -->
        <Card title="Endpoints Overview">
          <div class="space-y-4">
            {#each [
              { method: 'GET', path: '/cds/issues', desc: 'List all issues' },
              { method: 'POST', path: '/cds/issues', desc: 'Create a new issue' },
              { method: 'GET', path: '/cds/decisions', desc: 'List all decisions' },
              { method: 'POST', path: '/cds/vote', desc: 'Cast a vote' },
              { method: 'GET', path: '/oad/designs', desc: 'List all designs' },
              { method: 'POST', path: '/oad/designs', desc: 'Submit a new design' },
              { method: 'GET', path: '/itc/accounts/:id', desc: 'Get account balance' },
              { method: 'POST', path: '/itc/labor', desc: 'Log a labor event' },
              { method: 'GET', path: '/cos/plans', desc: 'List production plans' },
              { method: 'GET', path: '/frs/health', desc: 'Get system health' }
            ] as endpoint}
              <div class="flex items-center gap-4 p-3 rounded-lg bg-surface-800/50 border border-surface-700">
                <Badge variant={endpoint.method === 'GET' ? 'success' : 'primary'}>
                  {endpoint.method}
                </Badge>
                <code class="text-sm text-gray-300 font-mono flex-1">{endpoint.path}</code>
                <span class="text-sm text-gray-500">{endpoint.desc}</span>
              </div>
            {/each}
          </div>
        </Card>

        <!-- Authentication -->
        <Card title="Authentication">
          <p class="text-gray-400 mb-4">
            API requests are authenticated using Nostr event signatures. Include your signed
            event in the request body or use the <code class="text-primary-400">X-Nostr-Event</code> header.
          </p>
          <div class="p-4 rounded-xl bg-surface-800 border border-surface-700 font-mono text-sm">
            <pre class="text-gray-300">{`{
  "pubkey": "your-public-key",
  "created_at": 1234567890,
  "kind": 30100,
  "content": "...",
  "sig": "signature"
}`}</pre>
          </div>
        </Card>
      </div>

    {:else if activeTab === 'federation'}
      <div class="space-y-6">
        <Card>
          <div class="flex items-start gap-4 mb-6">
            <div class="p-3 rounded-xl bg-purple-500/10">
              <Globe class="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white mb-2">Federation Protocol</h2>
              <p class="text-gray-400">
                INTEGRAL nodes communicate via the Nostr protocol, enabling decentralized
                cooperation without central servers. Each node maintains sovereignty while
                participating in the global network.
              </p>
            </div>
          </div>
        </Card>

        <!-- Nostr Events -->
        <Card title="Custom Nostr Event Kinds">
          <p class="text-gray-400 mb-4">
            INTEGRAL uses custom Nostr event kinds in the 30000+ range for different message types:
          </p>
          <div class="grid sm:grid-cols-2 gap-3">
            {#each [
              { kind: '30100-30199', desc: 'CDS Events (decisions, votes)' },
              { kind: '30200-30299', desc: 'OAD Events (designs, certifications)' },
              { kind: '30300-30399', desc: 'ITC Events (labor, transfers)' },
              { kind: '30400-30499', desc: 'COS Events (plans, tasks)' },
              { kind: '30500-30599', desc: 'FRS Events (signals, diagnostics)' },
              { kind: '30600-30699', desc: 'Federation Events (sync, discovery)' }
            ] as event}
              <div class="p-3 rounded-lg bg-surface-800/50 border border-surface-700">
                <code class="text-primary-400 font-mono">{event.kind}</code>
                <p class="text-sm text-gray-400 mt-1">{event.desc}</p>
              </div>
            {/each}
          </div>
        </Card>

        <!-- Relays -->
        <Card title="Relay Configuration">
          <p class="text-gray-400 mb-4">
            Connect to relays to discover other INTEGRAL nodes and propagate messages.
            You can run your own relay or use public ones.
          </p>

          <HelpPanel title="How to Add a Relay" expanded={false}>
            <ol class="list-decimal list-inside space-y-2 text-gray-300">
              <li>Go to Settings → Federation</li>
              <li>Enter the relay WebSocket URL (e.g., wss://relay.example.com)</li>
              <li>Click "Add Relay" to connect</li>
              <li>The node will automatically sync with discovered peers</li>
            </ol>
          </HelpPanel>
        </Card>
      </div>
    {/if}
  </div>
</PageContainer>
