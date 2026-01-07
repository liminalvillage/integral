/**
 * FRS — FEEDBACK & REVIEW SYSTEM
 * Monitoring, diagnosis, and system learning with 7 modules
 *
 * Modules:
 * 1. Signal Intake & Semantic Integration
 * 2. Diagnostic Classification & Pathology Detection
 * 3. Predictive Modeling & Scenario Simulation
 * 4. Recommendation Routing & Non-Executive Dispatch
 * 5. Democratic Sensemaking Interface
 * 6. Longitudinal Memory & Institutional Recall
 * 7. Federated Intelligence Exchange
 */

import type {
  SignalEnvelope,
  SignalPacket,
  DiagnosticFinding,
  Recommendation,
  MemoryRecord,
  FederatedExchangeMessage,
  Metric,
  SemanticTag,
  FindingType,
  Severity,
  Confidence,
  Persistence,
  Scope,
  TargetSystem,
  LedgerEntry,
  FRSValuationSignal,
  FRSDesignFeedback,
} from '../../types/index.js';

import {
  generateId,
  createLedgerEntry,
  GENESIS_HASH,
  sha256,
  stableJson,
  clamp,
  TypedEventEmitter,
} from '../../utils/index.js';

// ============================================================================
// FRS CONFIGURATION
// ============================================================================

export interface FRSConfig {
  nodeId: string;
  federationId: string;
  signalWindowMinutes: number; // Default: 60
  thresholds: {
    ecologicalOvershoot: number;
    laborStress: number;
    materialDependency: number;
    coordinationFragility: number;
  };
}

export const DEFAULT_FRS_CONFIG: FRSConfig = {
  nodeId: 'default',
  federationId: 'default-federation',
  signalWindowMinutes: 60,
  thresholds: {
    ecologicalOvershoot: 0.7,
    laborStress: 0.6,
    materialDependency: 0.5,
    coordinationFragility: 0.4,
  },
};

// ============================================================================
// FRS EVENTS
// ============================================================================

interface FRSEvents {
  'signal:received': [SignalEnvelope];
  'packet:created': [SignalPacket];
  'finding:created': [DiagnosticFinding];
  'recommendation:created': [Recommendation];
  'memory:recorded': [MemoryRecord];
  'federation:message': [FederatedExchangeMessage];
  'ledger:entry': [LedgerEntry];
}

// ============================================================================
// FRS STORAGE INTERFACE
// ============================================================================

export interface FRSStorage {
  // Signals
  saveSignal(signal: SignalEnvelope): Promise<void>;
  listSignals(windowStart: Date, windowEnd: Date): Promise<SignalEnvelope[]>;

  // Packets
  savePacket(packet: SignalPacket): Promise<void>;
  getPacket(id: string): Promise<SignalPacket | null>;

  // Findings
  saveFinding(finding: DiagnosticFinding): Promise<void>;
  listFindings(filter?: Partial<DiagnosticFinding>): Promise<DiagnosticFinding[]>;

  // Recommendations
  saveRecommendation(rec: Recommendation): Promise<void>;
  listRecommendations(targetSystem?: TargetSystem): Promise<Recommendation[]>;

  // Memory
  saveMemoryRecord(record: MemoryRecord): Promise<void>;
  searchMemory(tags: SemanticTag[]): Promise<MemoryRecord[]>;

  // Federation
  saveFederatedMessage(msg: FederatedExchangeMessage): Promise<void>;
  listFederatedMessages(limit?: number): Promise<FederatedExchangeMessage[]>;

  // Ledger
  getLastLedgerEntry(): Promise<LedgerEntry | null>;
  saveLedgerEntry(entry: LedgerEntry): Promise<void>;
}

// ============================================================================
// IN-MEMORY STORAGE IMPLEMENTATION
// ============================================================================

export class InMemoryFRSStorage implements FRSStorage {
  private signals: SignalEnvelope[] = [];
  private packets: Map<string, SignalPacket> = new Map();
  private findings: DiagnosticFinding[] = [];
  private recommendations: Recommendation[] = [];
  private memoryRecords: MemoryRecord[] = [];
  private federatedMessages: FederatedExchangeMessage[] = [];
  private ledger: LedgerEntry[] = [];

  async saveSignal(signal: SignalEnvelope): Promise<void> {
    this.signals.push(signal);
  }

  async listSignals(windowStart: Date, windowEnd: Date): Promise<SignalEnvelope[]> {
    return this.signals.filter(
      (s) => s.observedAt >= windowStart && s.observedAt <= windowEnd
    );
  }

  async savePacket(packet: SignalPacket): Promise<void> {
    this.packets.set(packet.id, packet);
  }

  async getPacket(id: string): Promise<SignalPacket | null> {
    return this.packets.get(id) ?? null;
  }

  async saveFinding(finding: DiagnosticFinding): Promise<void> {
    this.findings.push(finding);
  }

  async listFindings(filter?: Partial<DiagnosticFinding>): Promise<DiagnosticFinding[]> {
    if (!filter) return [...this.findings];
    return this.findings.filter((f) =>
      Object.entries(filter).every(([key, value]) =>
        f[key as keyof DiagnosticFinding] === value
      )
    );
  }

  async saveRecommendation(rec: Recommendation): Promise<void> {
    this.recommendations.push(rec);
  }

  async listRecommendations(targetSystem?: TargetSystem): Promise<Recommendation[]> {
    if (!targetSystem) return [...this.recommendations];
    return this.recommendations.filter((r) => r.targetSystem === targetSystem);
  }

  async saveMemoryRecord(record: MemoryRecord): Promise<void> {
    this.memoryRecords.push(record);
  }

  async searchMemory(tags: SemanticTag[]): Promise<MemoryRecord[]> {
    return this.memoryRecords.filter((record) =>
      tags.some((searchTag) =>
        record.tags.some(
          (recordTag) =>
            recordTag.key === searchTag.key && recordTag.value === searchTag.value
        )
      )
    );
  }

  async saveFederatedMessage(msg: FederatedExchangeMessage): Promise<void> {
    this.federatedMessages.push(msg);
  }

  async listFederatedMessages(limit?: number): Promise<FederatedExchangeMessage[]> {
    const messages = [...this.federatedMessages].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    return limit ? messages.slice(0, limit) : messages;
  }

  async getLastLedgerEntry(): Promise<LedgerEntry | null> {
    return this.ledger.length > 0 ? this.ledger[this.ledger.length - 1] : null;
  }

  async saveLedgerEntry(entry: LedgerEntry): Promise<void> {
    this.ledger.push(entry);
  }
}

// ============================================================================
// FRS MAIN CLASS
// ============================================================================

export class FeedbackReviewSystem extends TypedEventEmitter<FRSEvents> {
  private config: FRSConfig;
  private storage: FRSStorage;

  constructor(config: Partial<FRSConfig> = {}, storage?: FRSStorage) {
    super();
    this.config = { ...DEFAULT_FRS_CONFIG, ...config };
    this.storage = storage ?? new InMemoryFRSStorage();
  }

  // ==========================================================================
  // MODULE 1: Signal Intake & Semantic Integration
  // ==========================================================================

  /**
   * Receive and validate a signal from another subsystem
   */
  async receiveSignal(
    source: SignalEnvelope['source'],
    domain: string,
    tags: SemanticTag[],
    metrics: Metric[]
  ): Promise<SignalEnvelope> {
    const now = new Date();
    const signal: SignalEnvelope = {
      id: generateId('sig'),
      source,
      domain,
      nodeId: this.config.nodeId,
      federationId: this.config.federationId,
      createdAt: now,
      observedAt: now,
      tags,
      metrics,
    };

    // Compute hash chain
    const entries = await this.storage.listSignals(
      new Date(now.getTime() - this.config.signalWindowMinutes * 60000),
      now
    );
    const prevHash = entries.length > 0 ? entries[entries.length - 1].entryHash ?? '' : '';
    signal.prevHash = prevHash;
    signal.entryHash = sha256(stableJson(signal) + prevHash);

    await this.storage.saveSignal(signal);
    await this.appendToLedger('signal_received', { signalId: signal.id, source, domain });

    this.emit('signal:received', signal);
    return signal;
  }

  /**
   * Create a time-aligned signal packet
   */
  async createSignalPacket(): Promise<SignalPacket> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.signalWindowMinutes * 60000);

    const signals = await this.storage.listSignals(windowStart, now);

    // Compute quality score based on metric qualities
    let totalQuality = 0;
    let metricCount = 0;
    for (const signal of signals) {
      for (const metric of signal.metrics) {
        totalQuality += metric.quality;
        metricCount++;
      }
    }
    const qualityScore = metricCount > 0 ? totalQuality / metricCount : 0;

    const packet: SignalPacket = {
      id: generateId('pkt'),
      nodeId: this.config.nodeId,
      timeWindowStart: windowStart,
      timeWindowEnd: now,
      envelopes: signals,
      qualityScore,
      packetVersion: '1.0',
      packetHash: sha256(stableJson(signals)),
    };

    await this.storage.savePacket(packet);
    await this.appendToLedger('packet_created', {
      packetId: packet.id,
      signalCount: signals.length,
    });

    this.emit('packet:created', packet);
    return packet;
  }

  // ==========================================================================
  // MODULE 2: Diagnostic Classification & Pathology Detection
  // ==========================================================================

  /**
   * Analyze signals and detect diagnostic findings
   */
  async analyzeForDiagnosis(packetId: string): Promise<DiagnosticFinding[]> {
    const packet = await this.storage.getPacket(packetId);
    if (!packet) {
      throw new Error(`Packet ${packetId} not found`);
    }

    const findings: DiagnosticFinding[] = [];

    // Aggregate metrics by domain
    const domainMetrics: Record<string, Record<string, number[]>> = {};
    for (const signal of packet.envelopes) {
      if (!domainMetrics[signal.domain]) {
        domainMetrics[signal.domain] = {};
      }
      for (const metric of signal.metrics) {
        if (!domainMetrics[signal.domain][metric.name]) {
          domainMetrics[signal.domain][metric.name] = [];
        }
        domainMetrics[signal.domain][metric.name].push(metric.value);
      }
    }

    // Check for ecological overshoot
    const ecoMetrics = domainMetrics['ecological'] ?? {};
    const ecoScore = this.averageMetric(ecoMetrics['eco_score'] ?? []);
    if (ecoScore > this.config.thresholds.ecologicalOvershoot) {
      findings.push(
        this.createFinding(
          'ecological_overshoot',
          'moderate',
          'confident',
          'persistent',
          'node',
          { eco_score: ecoScore },
          `Ecological score ${ecoScore.toFixed(2)} exceeds threshold`,
          'Multiple signals indicate unsustainable resource consumption'
        )
      );
    }

    // Check for labor stress
    const laborMetrics = domainMetrics['labor'] ?? {};
    const laborStress = this.averageMetric(laborMetrics['stress_index'] ?? []);
    if (laborStress > this.config.thresholds.laborStress) {
      findings.push(
        this.createFinding(
          'labor_stress',
          'moderate',
          'provisional',
          'emerging',
          'process',
          { stress_index: laborStress },
          `Labor stress index ${laborStress.toFixed(2)} indicates overwork`,
          'Worker capacity signals suggest unsustainable workload distribution'
        )
      );
    }

    // Check for material dependency
    const materialMetrics = domainMetrics['materials'] ?? {};
    const dependencyIndex = this.averageMetric(materialMetrics['external_dependency'] ?? []);
    if (dependencyIndex > this.config.thresholds.materialDependency) {
      findings.push(
        this.createFinding(
          'material_dependency',
          'low',
          'confident',
          'persistent',
          'node',
          { dependency_index: dependencyIndex },
          `External material dependency at ${(dependencyIndex * 100).toFixed(1)}%`,
          'High reliance on external material sources reduces autonomy'
        )
      );
    }

    // Check for coordination fragility
    const coordMetrics = domainMetrics['coordination'] ?? {};
    const fragility = this.averageMetric(coordMetrics['fragility_index'] ?? []);
    if (fragility > this.config.thresholds.coordinationFragility) {
      findings.push(
        this.createFinding(
          'coordination_fragility',
          'low',
          'speculative',
          'transient',
          'process',
          { fragility_index: fragility },
          `Coordination fragility at ${(fragility * 100).toFixed(1)}%`,
          'Inter-cooperative coordination showing signs of stress'
        )
      );
    }

    // Save findings
    for (const finding of findings) {
      await this.storage.saveFinding(finding);
      this.emit('finding:created', finding);
    }

    await this.appendToLedger('diagnosis_completed', {
      packetId,
      findingCount: findings.length,
    });

    return findings;
  }

  private averageMetric(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private createFinding(
    findingType: FindingType,
    severity: Severity,
    confidence: Confidence,
    persistence: Persistence,
    scope: Scope,
    indicators: Record<string, number>,
    summary: string,
    rationale: string
  ): DiagnosticFinding {
    return {
      id: generateId('find'),
      nodeId: this.config.nodeId,
      createdAt: new Date(),
      findingType,
      severity,
      confidence,
      persistence,
      scope,
      indicators,
      evidenceRefs: [],
      summary,
      rationale,
    };
  }

  // ==========================================================================
  // MODULE 3: Predictive Modeling & Scenario Simulation
  // ==========================================================================

  /**
   * Project trends based on historical signals
   */
  async projectTrends(
    domain: string,
    metricName: string,
    horizonDays: number = 30
  ): Promise<{
    currentValue: number;
    projectedValue: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    confidence: number;
  }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days

    const signals = await this.storage.listSignals(windowStart, now);
    const values: { timestamp: number; value: number }[] = [];

    for (const signal of signals) {
      if (signal.domain !== domain) continue;
      for (const metric of signal.metrics) {
        if (metric.name === metricName) {
          values.push({
            timestamp: signal.observedAt.getTime(),
            value: metric.value,
          });
        }
      }
    }

    if (values.length < 2) {
      return {
        currentValue: values[0]?.value ?? 0,
        projectedValue: values[0]?.value ?? 0,
        trend: 'stable',
        confidence: 0.1,
      };
    }

    // Simple linear regression
    const n = values.length;
    const sumX = values.reduce((s, v) => s + v.timestamp, 0);
    const sumY = values.reduce((s, v) => s + v.value, 0);
    const sumXY = values.reduce((s, v) => s + v.timestamp * v.value, 0);
    const sumX2 = values.reduce((s, v) => s + v.timestamp * v.timestamp, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const currentValue = values[values.length - 1].value;
    const futureTimestamp = now.getTime() + horizonDays * 24 * 60 * 60 * 1000;
    const projectedValue = slope * futureTimestamp + intercept;

    const trend: 'increasing' | 'stable' | 'decreasing' =
      slope > 0.001 ? 'increasing' : slope < -0.001 ? 'decreasing' : 'stable';

    // Confidence based on data points and variance
    const confidence = clamp(n / 20, 0.1, 0.9);

    return { currentValue, projectedValue, trend, confidence };
  }

  // ==========================================================================
  // MODULE 4: Recommendation Routing & Non-Executive Dispatch
  // ==========================================================================

  /**
   * Generate recommendations from findings
   */
  async generateRecommendations(
    findingIds: string[]
  ): Promise<Recommendation[]> {
    const allFindings = await this.storage.listFindings();
    const findings = allFindings.filter((f) => findingIds.includes(f.id));

    const recommendations: Recommendation[] = [];

    for (const finding of findings) {
      const rec = this.createRecommendationFromFinding(finding);
      if (rec) {
        await this.storage.saveRecommendation(rec);
        recommendations.push(rec);
        this.emit('recommendation:created', rec);
      }
    }

    await this.appendToLedger('recommendations_generated', {
      findingCount: findings.length,
      recommendationCount: recommendations.length,
    });

    return recommendations;
  }

  private createRecommendationFromFinding(
    finding: DiagnosticFinding
  ): Recommendation | null {
    const baseRec = {
      id: generateId('rec'),
      nodeId: this.config.nodeId,
      createdAt: new Date(),
      severity: finding.severity,
      confidence: finding.confidence,
      relatedFindings: [finding.id],
    };

    switch (finding.findingType) {
      case 'ecological_overshoot':
        return {
          ...baseRec,
          targetSystem: 'OAD',
          recommendationType: 'design_review',
          payload: {
            action: 'review_eco_impact',
            threshold: this.config.thresholds.ecologicalOvershoot,
          },
          summary: 'Review designs for ecological impact reduction',
          rationale: finding.rationale,
        };

      case 'labor_stress':
        return {
          ...baseRec,
          targetSystem: 'COS',
          recommendationType: 'workload_rebalancing',
          payload: {
            action: 'redistribute_tasks',
            stress_index: finding.indicators.stress_index,
          },
          summary: 'Rebalance workload across cooperatives',
          rationale: finding.rationale,
        };

      case 'material_dependency':
        return {
          ...baseRec,
          targetSystem: 'CDS',
          recommendationType: 'policy_review',
          payload: {
            action: 'review_procurement_policy',
            dependency_index: finding.indicators.dependency_index,
          },
          summary: 'Review material procurement policies to reduce external dependency',
          rationale: finding.rationale,
        };

      case 'valuation_drift':
        return {
          ...baseRec,
          targetSystem: 'ITC',
          recommendationType: 'valuation_recalibration',
          payload: {
            action: 'recalibrate_valuations',
          },
          summary: 'Recalibrate ITC valuations based on observed patterns',
          rationale: finding.rationale,
        };

      default:
        return null;
    }
  }

  /**
   * Generate valuation signal for ITC
   */
  async generateValuationSignal(
    versionId: string,
    observedData: {
      actualLifespan: number;
      projectedLifespan: number;
      materialScarcity: number;
      ecologicalStress: number;
    }
  ): Promise<FRSValuationSignal> {
    const longevityCorrection = observedData.actualLifespan / observedData.projectedLifespan;
    const scarcityAmplifier = 1 + observedData.materialScarcity * 0.5;

    const signal: FRSValuationSignal = {
      nodeId: this.config.nodeId,
      versionId,
      longevityCorrection: clamp(longevityCorrection, 0.5, 2.0),
      scarcityAmplifier: clamp(scarcityAmplifier, 0.8, 1.5),
      ecologicalStressIndex: clamp(observedData.ecologicalStress, 0, 1),
      fairnessFlags: [],
      timestamp: new Date(),
    };

    await this.appendToLedger('valuation_signal_generated', { signal });

    return signal;
  }

  /**
   * Generate design feedback for OAD
   */
  async generateDesignFeedback(
    versionId: string,
    observations: {
      actualLifespan: number;
      projectedLifespan: number;
      actualMaintenanceEvents: number;
      projectedMaintenanceEvents: number;
      failureModesObserved: string[];
      ecologicalImpactObserved: number;
    }
  ): Promise<FRSDesignFeedback> {
    const feedback: FRSDesignFeedback = {
      versionId,
      actualLifespanVsProjected:
        observations.actualLifespan / observations.projectedLifespan,
      actualMaintenanceVsProjected:
        observations.actualMaintenanceEvents / observations.projectedMaintenanceEvents,
      failureModesObserved: observations.failureModesObserved,
      ecologicalImpactObserved: observations.ecologicalImpactObserved,
    };

    await this.appendToLedger('design_feedback_generated', { feedback });

    return feedback;
  }

  // ==========================================================================
  // MODULE 5: Democratic Sensemaking Interface
  // ==========================================================================

  /**
   * Generate dashboard summary
   */
  async generateDashboardSummary(): Promise<{
    totalSignals: number;
    findingsByType: Record<FindingType, number>;
    activeRecommendations: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
    topIssues: string[];
  }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours

    const signals = await this.storage.listSignals(windowStart, now);
    const findings = await this.storage.listFindings();
    const recommendations = await this.storage.listRecommendations();

    const findingsByType: Record<FindingType, number> = {
      ecological_overshoot: 0,
      labor_stress: 0,
      material_dependency: 0,
      design_friction: 0,
      valuation_drift: 0,
      governance_load: 0,
      coordination_fragility: 0,
    };

    for (const finding of findings) {
      findingsByType[finding.findingType]++;
    }

    const criticalFindings = findings.filter((f) => f.severity === 'critical');
    const moderateFindings = findings.filter((f) => f.severity === 'moderate');

    const systemHealth: 'healthy' | 'warning' | 'critical' =
      criticalFindings.length > 0
        ? 'critical'
        : moderateFindings.length > 2
          ? 'warning'
          : 'healthy';

    const topIssues = findings
      .sort((a, b) => {
        const severityOrder = { critical: 0, moderate: 1, low: 2, info: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 5)
      .map((f) => f.summary);

    return {
      totalSignals: signals.length,
      findingsByType,
      activeRecommendations: recommendations.length,
      systemHealth,
      topIssues,
    };
  }

  // ==========================================================================
  // MODULE 6: Longitudinal Memory & Institutional Recall
  // ==========================================================================

  /**
   * Record an institutional memory
   */
  async recordMemory(
    recordType: MemoryRecord['recordType'],
    title: string,
    narrative: string,
    tags: SemanticTag[],
    quantifiedOutcomes: Record<string, number> = {},
    evidenceRefs: string[] = []
  ): Promise<MemoryRecord> {
    const record: MemoryRecord = {
      id: generateId('mem'),
      nodeId: this.config.nodeId,
      createdAt: new Date(),
      recordType,
      title,
      tags,
      evidenceRefs,
      narrative,
      quantifiedOutcomes,
    };

    await this.storage.saveMemoryRecord(record);
    await this.appendToLedger('memory_recorded', { recordId: record.id, recordType });

    this.emit('memory:recorded', record);
    return record;
  }

  /**
   * Recall relevant institutional memories
   */
  async recallMemories(tags: SemanticTag[]): Promise<MemoryRecord[]> {
    return this.storage.searchMemory(tags);
  }

  // ==========================================================================
  // MODULE 7: Federated Intelligence Exchange
  // ==========================================================================

  /**
   * Send a federated message
   */
  async sendFederatedMessage(
    messageType: FederatedExchangeMessage['messageType'],
    toScope: FederatedExchangeMessage['toScope'],
    payload: Record<string, unknown>,
    summary: string
  ): Promise<FederatedExchangeMessage> {
    const message: FederatedExchangeMessage = {
      id: generateId('fed'),
      messageType,
      createdAt: new Date(),
      fromNodeId: this.config.nodeId,
      toScope,
      payload,
      summary,
    };

    await this.storage.saveFederatedMessage(message);
    await this.appendToLedger('federated_message_sent', {
      messageId: message.id,
      messageType,
      toScope,
    });

    this.emit('federation:message', message);
    return message;
  }

  /**
   * Receive a federated message
   */
  async receiveFederatedMessage(
    message: FederatedExchangeMessage
  ): Promise<void> {
    await this.storage.saveFederatedMessage(message);
    await this.appendToLedger('federated_message_received', {
      messageId: message.id,
      messageType: message.messageType,
      fromNodeId: message.fromNodeId,
    });

    this.emit('federation:message', message);
  }

  /**
   * Share a best practice with the federation
   */
  async shareBestPractice(
    title: string,
    description: string,
    quantifiedBenefits: Record<string, number>
  ): Promise<FederatedExchangeMessage> {
    return this.sendFederatedMessage(
      'best_practice',
      'federation',
      {
        title,
        description,
        quantifiedBenefits,
        sourceNodeId: this.config.nodeId,
      },
      `Best practice: ${title}`
    );
  }

  /**
   * Issue an early warning to the federation
   */
  async issueEarlyWarning(
    findingId: string,
    severity: Severity,
    description: string
  ): Promise<FederatedExchangeMessage> {
    return this.sendFederatedMessage(
      'early_warning',
      'federation',
      {
        findingId,
        severity,
        description,
        sourceNodeId: this.config.nodeId,
      },
      `Early warning: ${description}`
    );
  }

  // ==========================================================================
  // LEDGER UTILITIES
  // ==========================================================================

  private async appendToLedger(
    entryType: string,
    details: Record<string, unknown>
  ): Promise<LedgerEntry> {
    const lastEntry = await this.storage.getLastLedgerEntry();
    const prevHash = lastEntry?.entryHash ?? GENESIS_HASH;

    const entry = createLedgerEntry(
      `frs.${entryType}`,
      this.config.nodeId,
      details,
      prevHash
    );

    await this.storage.saveLedgerEntry(entry);
    this.emit('ledger:entry', entry);

    return entry;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  async getFindings(filter?: Partial<DiagnosticFinding>): Promise<DiagnosticFinding[]> {
    return this.storage.listFindings(filter);
  }

  async getRecommendations(targetSystem?: TargetSystem): Promise<Recommendation[]> {
    return this.storage.listRecommendations(targetSystem);
  }

  getConfig(): FRSConfig {
    return { ...this.config };
  }
}

export default FeedbackReviewSystem;
