/**
 * INTEGRAL: Federated Post-Monetary Cooperative Economic System
 *
 * Main entry point that initializes and coordinates all subsystems
 * using Nostr for decentralized federation.
 */

import { CollaborativeDecisionSystem } from './subsystems/cds/index.js';
import { OpenAccessDesign } from './subsystems/oad/index.js';
import { IntegralTimeCredits } from './subsystems/itc/index.js';
import { CooperativeOrganizationSystem } from './subsystems/cos/index.js';
import { FeedbackReviewSystem } from './subsystems/frs/index.js';
import { NostrIntegration, INTEGRAL_EVENT_KINDS } from './nostr/index.js';
import { TypedEventEmitter, generateId } from './utils/index.js';
import type { Event } from 'nostr-tools';

// Re-export all types
export * from './types/index.js';
export * from './subsystems/index.js';
export { NostrIntegration, INTEGRAL_EVENT_KINDS } from './nostr/index.js';
export * from './utils/index.js';

// ============================================================================
// INTEGRAL NODE CONFIGURATION
// ============================================================================

export interface IntegralNodeConfig {
  nodeId: string;
  federationId: string;
  relays: string[];
  autoConnect: boolean;
}

export const DEFAULT_NODE_CONFIG: IntegralNodeConfig = {
  nodeId: `node_${generateId().slice(0, 8)}`,
  federationId: 'integral-main',
  relays: [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol',
  ],
  autoConnect: true,
};

// ============================================================================
// INTEGRAL NODE EVENTS
// ============================================================================

interface IntegralNodeEvents {
  'ready': [];
  'connected': [];
  'disconnected': [];
  'error': [Error];
  'federation:message': [Event];
}

// ============================================================================
// INTEGRAL NODE CLASS
// ============================================================================

/**
 * IntegralNode is the main entry point for running an INTEGRAL node.
 * It coordinates all 5 subsystems and handles Nostr federation.
 */
export class IntegralNode extends TypedEventEmitter<IntegralNodeEvents> {
  private config: IntegralNodeConfig;

  // Subsystems
  public readonly cds: CollaborativeDecisionSystem;
  public readonly oad: OpenAccessDesign;
  public readonly itc: IntegralTimeCredits;
  public readonly cos: CooperativeOrganizationSystem;
  public readonly frs: FeedbackReviewSystem;

  // Federation
  public readonly nostr: NostrIntegration;

  private isRunning: boolean = false;

  constructor(config: Partial<IntegralNodeConfig> = {}) {
    super();
    this.config = { ...DEFAULT_NODE_CONFIG, ...config };

    // Initialize subsystems with shared node ID
    this.cds = new CollaborativeDecisionSystem({ nodeId: this.config.nodeId });
    this.oad = new OpenAccessDesign({ nodeId: this.config.nodeId });
    this.itc = new IntegralTimeCredits({ nodeId: this.config.nodeId });
    this.cos = new CooperativeOrganizationSystem({ nodeId: this.config.nodeId });
    this.frs = new FeedbackReviewSystem({
      nodeId: this.config.nodeId,
      federationId: this.config.federationId,
    });

    // Initialize Nostr integration
    this.nostr = new NostrIntegration({
      nodeId: this.config.nodeId,
      relays: this.config.relays,
      autoConnect: this.config.autoConnect,
    });

    // Set up inter-subsystem event routing
    this.setupEventRouting();
  }

  // ==========================================================================
  // LIFECYCLE MANAGEMENT
  // ==========================================================================

  /**
   * Start the INTEGRAL node
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Node is already running');
    }

    console.log(`Starting INTEGRAL node: ${this.config.nodeId}`);

    // Initialize Nostr identity and connect
    await this.nostr.initializeIdentity();
    await this.nostr.connect();

    // Subscribe to federation events
    await this.subscribeToFederation();

    this.isRunning = true;
    this.emit('ready');
    this.emit('connected');

    console.log(`INTEGRAL node ${this.config.nodeId} is ready`);
    console.log(`Public key: ${this.nostr.getPublicKeyFormats()?.npub}`);
  }

  /**
   * Stop the INTEGRAL node
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log(`Stopping INTEGRAL node: ${this.config.nodeId}`);

    await this.nostr.disconnect();
    this.isRunning = false;
    this.emit('disconnected');
  }

  /**
   * Check if node is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  // ==========================================================================
  // INTER-SUBSYSTEM EVENT ROUTING
  // ==========================================================================

  private setupEventRouting(): void {
    // CDS -> Nostr: Publish decisions to federation
    this.cds.on('decision:made', async (decision) => {
      await this.nostr.publishDecision(decision);
    });

    // OAD -> Nostr: Publish certified designs
    this.oad.on('certification:issued', async (cert) => {
      if (cert.status === 'certified') {
        const version = await this.oad.getVersion(cert.versionId);
        if (version) {
          await this.nostr.publishDesignVersion(version);
        }
      }
    });

    // ITC -> Nostr: Publish significant labor events
    this.itc.on('labor:recorded', async (event) => {
      // Only publish verified events
      if (event.verifiedBy.length > 0) {
        await this.nostr.publishLaborEvent(event);
      }
    });

    // FRS -> Nostr: Publish federation messages
    this.frs.on('federation:message', async (message) => {
      await this.nostr.publishFederationMessage(message);
    });

    // FRS -> CDS: Route policy review requests
    this.frs.on('recommendation:created', (rec) => {
      if (rec.targetSystem === 'CDS') {
        // Create issue from recommendation
        this.cds.createIssue(
          `Policy Review: ${rec.summary}`,
          rec.rationale,
          'system',
          'signal',
          { recommendationId: rec.id, ...rec.payload }
        );
      }
    });

    // COS -> ITC: Route labor completion for crediting
    this.cos.on('task:completed', async (task) => {
      // Generate workload signal for ITC
      const plan = await this.cos.getPlan(task.batchId);
      if (plan) {
        const signal = await this.cos.generateWorkloadSignal(plan.planId);
        // Route to FRS for processing
        await this.frs.receiveSignal('COS', 'labor', [], [
          { name: 'workload_hours', value: task.actualHours, unit: 'hours', quality: 0.9 },
        ]);
      }
    });
  }

  // ==========================================================================
  // FEDERATION SUBSCRIPTIONS
  // ==========================================================================

  private async subscribeToFederation(): Promise<void> {
    // Subscribe to federation messages
    await this.nostr.subscribeToFederation((event) => {
      this.handleFederationEvent(event);
    });

    // Subscribe to CDS events from other nodes
    await this.nostr.subscribeToCDS((event) => {
      this.handleCDSEvent(event);
    });

    // Subscribe to OAD events (design sharing)
    await this.nostr.subscribeToOAD((event) => {
      this.handleOADEvent(event);
    });
  }

  private handleFederationEvent(event: Event): void {
    const system = this.nostr.getEventSystem(event);
    const type = this.nostr.getEventType(event);

    console.log(`Received federation event: ${system}/${type} from ${event.pubkey.slice(0, 8)}`);
    this.emit('federation:message', event);

    // Handle node announcements
    if (event.kind === INTEGRAL_EVENT_KINDS.NODE_ANNOUNCEMENT) {
      const content = this.nostr.parseEventContent<{
        nodeId: string;
        publicKey: string;
        capabilities: string[];
      }>(event);
      console.log(`Discovered node: ${content.nodeId} with capabilities: ${content.capabilities.join(', ')}`);
    }
  }

  private handleCDSEvent(event: Event): void {
    // Handle incoming CDS events from other nodes
    const type = this.nostr.getEventType(event);
    console.log(`Received CDS event: ${type} from ${event.pubkey.slice(0, 8)}`);
  }

  private handleOADEvent(event: Event): void {
    // Handle incoming OAD events (shared designs)
    const type = this.nostr.getEventType(event);
    console.log(`Received OAD event: ${type} from ${event.pubkey.slice(0, 8)}`);
  }

  // ==========================================================================
  // CONVENIENCE METHODS
  // ==========================================================================

  /**
   * Get node status summary
   */
  async getStatus(): Promise<{
    nodeId: string;
    isRunning: boolean;
    publicKey: string | null;
    connectedRelays: number;
    knownNodes: number;
    subsystems: {
      cds: boolean;
      oad: boolean;
      itc: boolean;
      cos: boolean;
      frs: boolean;
    };
  }> {
    return {
      nodeId: this.config.nodeId,
      isRunning: this.isRunning,
      publicKey: this.nostr.getPublicKeyFormats()?.npub ?? null,
      connectedRelays: this.nostr.getConnectedRelayCount(),
      knownNodes: this.nostr.getKnownNodes().length,
      subsystems: {
        cds: true,
        oad: true,
        itc: true,
        cos: true,
        frs: true,
      },
    };
  }

  /**
   * Get configuration
   */
  getConfig(): IntegralNodeConfig {
    return { ...this.config };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create and optionally start an INTEGRAL node
 */
export async function createIntegralNode(
  config: Partial<IntegralNodeConfig> = {},
  autoStart: boolean = false
): Promise<IntegralNode> {
  const node = new IntegralNode(config);

  if (autoStart) {
    await node.start();
  }

  return node;
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('INTEGRAL: Federated Post-Monetary Cooperative Economic System');
  console.log('='.repeat(60));
  console.log('');

  const node = await createIntegralNode({}, true);

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await node.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await node.stop();
    process.exit(0);
  });

  // Keep running
  console.log('');
  console.log('Node is running. Press Ctrl+C to stop.');
  console.log('');

  // Print status
  const status = await node.getStatus();
  console.log('Status:', JSON.stringify(status, null, 2));
}

// Run if executed directly
const isMainModule = process.argv[1]?.includes('index');
if (isMainModule) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default IntegralNode;
