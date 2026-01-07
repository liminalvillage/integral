/**
 * INTEGRAL: Nostr Integration Layer
 * Federation protocol using Nostr for decentralized communication
 */

import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  verifyEvent,
  nip19,
  type Event,
  type EventTemplate,
  type Filter,
} from 'nostr-tools';
import { SimplePool } from 'nostr-tools/pool';
import { TypedEventEmitter } from '../utils/index.js';
import type {
  NostrIdentity,
  Issue,
  Decision,
  DesignVersion,
  LaborEvent,
  SignalEnvelope,
  FederatedExchangeMessage,
  NOSTR_EVENT_KINDS,
} from '../types/index.js';

// ============================================================================
// NOSTR EVENT KINDS FOR INTEGRAL
// ============================================================================

export const INTEGRAL_EVENT_KINDS = {
  // CDS Events (30100-30199)
  ISSUE: 30100,
  SUBMISSION: 30101,
  VOTE: 30102,
  DECISION: 30103,
  DISPATCH: 30104,

  // OAD Events (30200-30299)
  DESIGN_SPEC: 30200,
  DESIGN_VERSION: 30201,
  ECO_ASSESSMENT: 30202,
  CERTIFICATION: 30203,

  // ITC Events (30300-30399)
  LABOR_EVENT: 30300,
  ITC_CREDIT: 30301,
  ITC_REDEMPTION: 30302,
  EQUIVALENCE_BAND: 30303,

  // COS Events (30400-30499)
  PRODUCTION_PLAN: 30400,
  TASK_UPDATE: 30401,
  MATERIAL_FLOW: 30402,
  QA_RESULT: 30403,

  // FRS Events (30500-30599)
  SIGNAL: 30500,
  FINDING: 30501,
  RECOMMENDATION: 30502,
  MEMORY_RECORD: 30503,

  // Federation Events (30600-30699)
  FEDERATION_MESSAGE: 30600,
  NODE_ANNOUNCEMENT: 30601,
  EQUIVALENCE_UPDATE: 30602,
} as const;

// ============================================================================
// NOSTR CONFIGURATION
// ============================================================================

export interface NostrConfig {
  nodeId: string;
  relays: string[];
  privateKey?: Uint8Array;
  autoConnect: boolean;
  reconnectInterval: number;
}

export const DEFAULT_NOSTR_CONFIG: NostrConfig = {
  nodeId: 'default',
  relays: [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol',
  ],
  autoConnect: true,
  reconnectInterval: 5000,
};

// ============================================================================
// NOSTR EVENTS
// ============================================================================

interface NostrLayerEvents {
  'connected': [string]; // relay URL
  'disconnected': [string];
  'error': [Error];
  'event:received': [Event];
  'event:published': [Event];
  'node:discovered': [{ nodeId: string; publicKey: string }];
}

// ============================================================================
// INTEGRAL NOSTR TAGS
// ============================================================================

const TAG_TYPES = {
  NODE_ID: 'integral-node',
  SYSTEM: 'integral-system', // CDS, OAD, ITC, COS, FRS
  EVENT_TYPE: 'integral-type',
  REFERENCE: 'integral-ref',
  VERSION: 'integral-version',
} as const;

// ============================================================================
// NOSTR INTEGRATION CLASS
// ============================================================================

export class NostrIntegration extends TypedEventEmitter<NostrLayerEvents> {
  private config: NostrConfig;
  private identity: NostrIdentity | null = null;
  private pool: SimplePool;
  private subscriptions: Map<string, { close: () => void }> = new Map();
  private connectedRelays: Set<string> = new Set();
  private knownNodes: Map<string, { publicKey: string; lastSeen: Date }> = new Map();

  constructor(config: Partial<NostrConfig> = {}) {
    super();
    this.config = { ...DEFAULT_NOSTR_CONFIG, ...config };
    this.pool = new SimplePool();
  }

  // ==========================================================================
  // IDENTITY MANAGEMENT
  // ==========================================================================

  /**
   * Initialize or restore node identity
   */
  async initializeIdentity(privateKey?: Uint8Array): Promise<NostrIdentity> {
    const secretKey = privateKey ?? this.config.privateKey ?? generateSecretKey();
    const publicKey = getPublicKey(secretKey);

    this.identity = {
      publicKey,
      privateKey: secretKey,
      nodeId: this.config.nodeId,
      createdAt: new Date(),
    };

    return this.identity;
  }

  /**
   * Get current identity
   */
  getIdentity(): NostrIdentity | null {
    return this.identity;
  }

  /**
   * Get public key in various formats
   */
  getPublicKeyFormats(): { hex: string; npub: string } | null {
    if (!this.identity) return null;
    return {
      hex: this.identity.publicKey,
      npub: nip19.npubEncode(this.identity.publicKey),
    };
  }

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================

  /**
   * Connect to configured relays
   */
  async connect(): Promise<void> {
    if (!this.identity) {
      await this.initializeIdentity();
    }

    // Announce node presence
    await this.announceNode();
  }

  /**
   * Disconnect from all relays
   */
  async disconnect(): Promise<void> {
    // Close all subscriptions
    for (const [id, sub] of this.subscriptions) {
      sub.close();
      this.subscriptions.delete(id);
    }

    this.pool.close(this.config.relays);
    this.connectedRelays.clear();
  }

  /**
   * Announce node presence on the network
   */
  private async announceNode(): Promise<void> {
    if (!this.identity) return;

    await this.publishEvent(INTEGRAL_EVENT_KINDS.NODE_ANNOUNCEMENT, {
      nodeId: this.config.nodeId,
      publicKey: this.identity.publicKey,
      capabilities: ['CDS', 'OAD', 'ITC', 'COS', 'FRS'],
      version: '0.1.0',
    });
  }

  // ==========================================================================
  // EVENT PUBLISHING
  // ==========================================================================

  /**
   * Publish a signed Nostr event
   */
  async publishEvent(
    kind: number,
    content: Record<string, unknown>,
    tags: string[][] = []
  ): Promise<Event | null> {
    if (!this.identity?.privateKey) {
      throw new Error('Identity not initialized');
    }

    const eventTemplate: EventTemplate = {
      kind,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        [TAG_TYPES.NODE_ID, this.config.nodeId],
        [TAG_TYPES.VERSION, '0.1.0'],
        ...tags,
      ],
      content: JSON.stringify(content),
    };

    const signedEvent = finalizeEvent(eventTemplate, this.identity.privateKey);

    try {
      await Promise.any(
        this.pool.publish(this.config.relays, signedEvent)
      );
      this.emit('event:published', signedEvent);
      return signedEvent;
    } catch (error) {
      this.emit('error', error as Error);
      return null;
    }
  }

  // ==========================================================================
  // CDS EVENT PUBLISHING
  // ==========================================================================

  /**
   * Publish an issue to the network
   */
  async publishIssue(issue: Issue): Promise<Event | null> {
    return this.publishEvent(
      INTEGRAL_EVENT_KINDS.ISSUE,
      {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        createdAt: issue.createdAt.toISOString(),
        metadata: issue.metadata,
      },
      [
        [TAG_TYPES.SYSTEM, 'CDS'],
        [TAG_TYPES.EVENT_TYPE, 'issue'],
        ['d', issue.id], // NIP-33 replaceable event identifier
      ]
    );
  }

  /**
   * Publish a decision to the network
   */
  async publishDecision(decision: Decision): Promise<Event | null> {
    return this.publishEvent(
      INTEGRAL_EVENT_KINDS.DECISION,
      {
        id: decision.id,
        issueId: decision.issueId,
        scenarioId: decision.scenarioId,
        status: decision.status,
        consensusScore: decision.consensusScore,
        objectionIndex: decision.objectionIndex,
        decidedAt: decision.decidedAt.toISOString(),
        rationaleHash: decision.rationaleHash,
      },
      [
        [TAG_TYPES.SYSTEM, 'CDS'],
        [TAG_TYPES.EVENT_TYPE, 'decision'],
        [TAG_TYPES.REFERENCE, decision.issueId],
        ['d', decision.id],
      ]
    );
  }

  // ==========================================================================
  // OAD EVENT PUBLISHING
  // ==========================================================================

  /**
   * Publish a design version to the network
   */
  async publishDesignVersion(version: DesignVersion): Promise<Event | null> {
    return this.publishEvent(
      INTEGRAL_EVENT_KINDS.DESIGN_VERSION,
      {
        id: version.id,
        specId: version.specId,
        label: version.label,
        status: version.status,
        authors: version.authors,
        createdAt: version.createdAt.toISOString(),
        parameters: version.parameters,
      },
      [
        [TAG_TYPES.SYSTEM, 'OAD'],
        [TAG_TYPES.EVENT_TYPE, 'design_version'],
        [TAG_TYPES.REFERENCE, version.specId],
        ['d', version.id],
      ]
    );
  }

  // ==========================================================================
  // ITC EVENT PUBLISHING
  // ==========================================================================

  /**
   * Publish a labor event to the network
   */
  async publishLaborEvent(labor: LaborEvent): Promise<Event | null> {
    return this.publishEvent(
      INTEGRAL_EVENT_KINDS.LABOR_EVENT,
      {
        id: labor.id,
        memberId: labor.memberId,
        taskId: labor.taskId,
        hours: labor.hours,
        skillTier: labor.skillTier,
        startTime: labor.startTime.toISOString(),
        endTime: labor.endTime.toISOString(),
        verifiedBy: labor.verifiedBy,
      },
      [
        [TAG_TYPES.SYSTEM, 'ITC'],
        [TAG_TYPES.EVENT_TYPE, 'labor_event'],
        ['d', labor.id],
      ]
    );
  }

  // ==========================================================================
  // FRS EVENT PUBLISHING
  // ==========================================================================

  /**
   * Publish a signal to the network
   */
  async publishSignal(signal: SignalEnvelope): Promise<Event | null> {
    return this.publishEvent(
      INTEGRAL_EVENT_KINDS.SIGNAL,
      {
        id: signal.id,
        source: signal.source,
        domain: signal.domain,
        metrics: signal.metrics,
        tags: signal.tags,
        observedAt: signal.observedAt.toISOString(),
      },
      [
        [TAG_TYPES.SYSTEM, 'FRS'],
        [TAG_TYPES.EVENT_TYPE, 'signal'],
        ['d', signal.id],
      ]
    );
  }

  /**
   * Publish a federation message
   */
  async publishFederationMessage(
    message: FederatedExchangeMessage
  ): Promise<Event | null> {
    return this.publishEvent(
      INTEGRAL_EVENT_KINDS.FEDERATION_MESSAGE,
      {
        id: message.id,
        messageType: message.messageType,
        fromNodeId: message.fromNodeId,
        toScope: message.toScope,
        payload: message.payload,
        summary: message.summary,
        createdAt: message.createdAt.toISOString(),
      },
      [
        [TAG_TYPES.SYSTEM, 'FRS'],
        [TAG_TYPES.EVENT_TYPE, 'federation_message'],
        ['d', message.id],
      ]
    );
  }

  // ==========================================================================
  // EVENT SUBSCRIPTION
  // ==========================================================================

  /**
   * Subscribe to events from other nodes
   */
  async subscribeToEvents(
    kinds: number[],
    callback: (event: Event) => void,
    filter?: Partial<Filter>
  ): Promise<string> {
    const subscriptionId = `sub_${Date.now()}`;

    const fullFilter: Filter = {
      kinds,
      ...filter,
    };

    const sub = this.pool.subscribeMany(
      this.config.relays,
      [fullFilter],
      {
        onevent: (event) => {
          if (verifyEvent(event)) {
            this.emit('event:received', event);
            callback(event);

            // Track discovered nodes
            const nodeIdTag = event.tags.find((t) => t[0] === TAG_TYPES.NODE_ID);
            if (nodeIdTag) {
              this.knownNodes.set(nodeIdTag[1], {
                publicKey: event.pubkey,
                lastSeen: new Date(),
              });
              this.emit('node:discovered', {
                nodeId: nodeIdTag[1],
                publicKey: event.pubkey,
              });
            }
          }
        },
        oneose: () => {
          // End of stored events
        },
      }
    );

    this.subscriptions.set(subscriptionId, sub);
    return subscriptionId;
  }

  /**
   * Subscribe to CDS events
   */
  async subscribeToCDS(callback: (event: Event) => void): Promise<string> {
    return this.subscribeToEvents(
      [
        INTEGRAL_EVENT_KINDS.ISSUE,
        INTEGRAL_EVENT_KINDS.SUBMISSION,
        INTEGRAL_EVENT_KINDS.VOTE,
        INTEGRAL_EVENT_KINDS.DECISION,
      ],
      callback,
      { '#integral-system': ['CDS'] }
    );
  }

  /**
   * Subscribe to OAD events
   */
  async subscribeToOAD(callback: (event: Event) => void): Promise<string> {
    return this.subscribeToEvents(
      [
        INTEGRAL_EVENT_KINDS.DESIGN_SPEC,
        INTEGRAL_EVENT_KINDS.DESIGN_VERSION,
        INTEGRAL_EVENT_KINDS.ECO_ASSESSMENT,
        INTEGRAL_EVENT_KINDS.CERTIFICATION,
      ],
      callback,
      { '#integral-system': ['OAD'] }
    );
  }

  /**
   * Subscribe to ITC events
   */
  async subscribeToITC(callback: (event: Event) => void): Promise<string> {
    return this.subscribeToEvents(
      [
        INTEGRAL_EVENT_KINDS.LABOR_EVENT,
        INTEGRAL_EVENT_KINDS.ITC_CREDIT,
        INTEGRAL_EVENT_KINDS.ITC_REDEMPTION,
      ],
      callback,
      { '#integral-system': ['ITC'] }
    );
  }

  /**
   * Subscribe to federation messages
   */
  async subscribeToFederation(callback: (event: Event) => void): Promise<string> {
    return this.subscribeToEvents(
      [INTEGRAL_EVENT_KINDS.FEDERATION_MESSAGE, INTEGRAL_EVENT_KINDS.NODE_ANNOUNCEMENT],
      callback
    );
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    const sub = this.subscriptions.get(subscriptionId);
    if (sub) {
      sub.close();
      this.subscriptions.delete(subscriptionId);
    }
  }

  // ==========================================================================
  // NODE DISCOVERY
  // ==========================================================================

  /**
   * Get list of known nodes
   */
  getKnownNodes(): Array<{ nodeId: string; publicKey: string; lastSeen: Date }> {
    return Array.from(this.knownNodes.entries()).map(([nodeId, data]) => ({
      nodeId,
      ...data,
    }));
  }

  /**
   * Query for specific node
   */
  async queryNode(nodeId: string): Promise<Event | null> {
    const filter: Filter = {
      kinds: [INTEGRAL_EVENT_KINDS.NODE_ANNOUNCEMENT],
      '#integral-node': [nodeId],
      limit: 1,
    };

    const events = await this.pool.querySync(this.config.relays, filter);
    return events[0] ?? null;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Parse event content
   */
  parseEventContent<T>(event: Event): T {
    return JSON.parse(event.content) as T;
  }

  /**
   * Get event system from tags
   */
  getEventSystem(event: Event): string | null {
    const tag = event.tags.find((t) => t[0] === TAG_TYPES.SYSTEM);
    return tag ? tag[1] : null;
  }

  /**
   * Get event type from tags
   */
  getEventType(event: Event): string | null {
    const tag = event.tags.find((t) => t[0] === TAG_TYPES.EVENT_TYPE);
    return tag ? tag[1] : null;
  }

  /**
   * Get connected relay count
   */
  getConnectedRelayCount(): number {
    return this.connectedRelays.size;
  }

  /**
   * Get configuration
   */
  getConfig(): NostrConfig {
    return { ...this.config };
  }
}

export default NostrIntegration;
