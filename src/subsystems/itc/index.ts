/**
 * ITC — INTEGRAL TIME CREDITS
 * Contribution accounting & access valuation with 9 modules
 *
 * Modules:
 * 1. Labor Event Capture & Verification
 * 2. Skill & Context Weighting Engine
 * 3. Time-Decay Mechanism
 * 4. Labor-Budget Forecasting & Need Anticipation
 * 5. Access Allocation & Redemption
 * 6. Cross-Cooperative & Internodal Reciprocity
 * 7. Fairness, Anti-Coercion & Ethical Safeguards
 * 8. Ledger, Transparency & Auditability
 * 9. Integration & Coordination
 */

import type {
  LaborEvent,
  WeightedLaborRecord,
  DecayRule,
  ITCAccount,
  WeightingPolicy,
  AccessValuation,
  RedemptionRecord,
  EquivalenceBand,
  EthicsEvent,
  LedgerEntry,
  SkillTier,
  AccessMode,
  OADValuationProfile,
  COSWorkloadSignal,
  FRSValuationSignal,
} from '../../types/index.js';

import {
  generateId,
  createLedgerEntry,
  GENESIS_HASH,
  clamp,
  daysBetween,
  TypedEventEmitter,
  DEFAULT_SKILL_WEIGHTS,
  herfindahlIndex,
} from '../../utils/index.js';

// ============================================================================
// ITC CONFIGURATION
// ============================================================================

export interface ITCConfig {
  nodeId: string;
  defaultDecayRule: DecayRule;
  defaultWeightingPolicy: WeightingPolicy;
}

export const DEFAULT_DECAY_RULE: DecayRule = {
  id: 'default_decay',
  label: 'Standard Decay',
  inactivityGraceDays: 30,
  halfLifeDays: 180,
  minBalanceProtected: 10,
  maxAnnualDecayFraction: 0.25,
  effectiveFrom: new Date(),
};

export const DEFAULT_WEIGHTING_POLICY: WeightingPolicy = {
  id: 'default_weighting',
  nodeId: 'default',
  effectiveFrom: new Date(),
  baseWeightsBySkill: DEFAULT_SKILL_WEIGHTS,
  taskTypeModifiers: {
    generic: 1.0,
    hazardous: 1.3,
    care_work: 1.2,
    administrative: 0.9,
    creative: 1.1,
  },
  contextWeights: {
    urgency: 0.15,
    ecoSensitivity: 0.15,
    scarcity: 0.20,
  },
  contextFactorMin: 0.7,
  contextFactorMax: 1.5,
  minWeightMultiplier: 0.5,
  maxWeightMultiplier: 2.0,
};

export const DEFAULT_ITC_CONFIG: ITCConfig = {
  nodeId: 'default',
  defaultDecayRule: DEFAULT_DECAY_RULE,
  defaultWeightingPolicy: DEFAULT_WEIGHTING_POLICY,
};

// ============================================================================
// ITC EVENTS
// ============================================================================

interface ITCEvents {
  'labor:recorded': [LaborEvent];
  'labor:weighted': [WeightedLaborRecord];
  'account:credited': [{ accountId: string; amount: number }];
  'account:decayed': [{ accountId: string; amount: number }];
  'access:valued': [AccessValuation];
  'access:redeemed': [RedemptionRecord];
  'ethics:flagged': [EthicsEvent];
  'ledger:entry': [LedgerEntry];
}

// ============================================================================
// ITC STORAGE INTERFACE
// ============================================================================

export interface ITCStorage {
  // Labor Events
  getLaborEvent(id: string): Promise<LaborEvent | null>;
  saveLaborEvent(event: LaborEvent): Promise<void>;
  listLaborEvents(memberId: string, limit?: number): Promise<LaborEvent[]>;

  // Weighted Records
  getWeightedRecord(id: string): Promise<WeightedLaborRecord | null>;
  saveWeightedRecord(record: WeightedLaborRecord): Promise<void>;

  // Accounts
  getAccount(memberId: string): Promise<ITCAccount | null>;
  saveAccount(account: ITCAccount): Promise<void>;
  listAccounts(nodeId?: string): Promise<ITCAccount[]>;

  // Decay Rules
  getDecayRule(id: string): Promise<DecayRule | null>;
  saveDecayRule(rule: DecayRule): Promise<void>;

  // Weighting Policies
  getWeightingPolicy(nodeId: string): Promise<WeightingPolicy | null>;
  saveWeightingPolicy(policy: WeightingPolicy): Promise<void>;

  // Access Valuations
  getAccessValuation(itemId: string): Promise<AccessValuation | null>;
  saveAccessValuation(valuation: AccessValuation): Promise<void>;

  // Redemptions
  getRedemption(id: string): Promise<RedemptionRecord | null>;
  saveRedemption(record: RedemptionRecord): Promise<void>;
  listRedemptions(memberId: string): Promise<RedemptionRecord[]>;

  // Equivalence Bands
  getEquivalenceBand(homeNodeId: string, localNodeId: string): Promise<EquivalenceBand | null>;
  saveEquivalenceBand(band: EquivalenceBand): Promise<void>;

  // Ethics Events
  saveEthicsEvent(event: EthicsEvent): Promise<void>;
  listEthicsEvents(status?: string): Promise<EthicsEvent[]>;

  // Ledger
  getLastLedgerEntry(): Promise<LedgerEntry | null>;
  saveLedgerEntry(entry: LedgerEntry): Promise<void>;
  getLedgerEntries(limit?: number): Promise<LedgerEntry[]>;
}

// ============================================================================
// IN-MEMORY STORAGE IMPLEMENTATION
// ============================================================================

export class InMemoryITCStorage implements ITCStorage {
  private laborEvents: Map<string, LaborEvent> = new Map();
  private weightedRecords: Map<string, WeightedLaborRecord> = new Map();
  private accounts: Map<string, ITCAccount> = new Map();
  private decayRules: Map<string, DecayRule> = new Map();
  private weightingPolicies: Map<string, WeightingPolicy> = new Map();
  private accessValuations: Map<string, AccessValuation> = new Map();
  private redemptions: Map<string, RedemptionRecord> = new Map();
  private equivalenceBands: Map<string, EquivalenceBand> = new Map();
  private ethicsEvents: EthicsEvent[] = [];
  private ledger: LedgerEntry[] = [];

  async getLaborEvent(id: string): Promise<LaborEvent | null> {
    return this.laborEvents.get(id) ?? null;
  }

  async saveLaborEvent(event: LaborEvent): Promise<void> {
    this.laborEvents.set(event.id, event);
  }

  async listLaborEvents(memberId: string, limit?: number): Promise<LaborEvent[]> {
    const events = Array.from(this.laborEvents.values())
      .filter((e) => e.memberId === memberId)
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
    return limit ? events.slice(0, limit) : events;
  }

  async getWeightedRecord(id: string): Promise<WeightedLaborRecord | null> {
    return this.weightedRecords.get(id) ?? null;
  }

  async saveWeightedRecord(record: WeightedLaborRecord): Promise<void> {
    this.weightedRecords.set(record.id, record);
  }

  async getAccount(memberId: string): Promise<ITCAccount | null> {
    return this.accounts.get(memberId) ?? null;
  }

  async saveAccount(account: ITCAccount): Promise<void> {
    this.accounts.set(account.memberId, account);
  }

  async listAccounts(nodeId?: string): Promise<ITCAccount[]> {
    const accounts = Array.from(this.accounts.values());
    return nodeId ? accounts.filter((a) => a.nodeId === nodeId) : accounts;
  }

  async getDecayRule(id: string): Promise<DecayRule | null> {
    return this.decayRules.get(id) ?? null;
  }

  async saveDecayRule(rule: DecayRule): Promise<void> {
    this.decayRules.set(rule.id, rule);
  }

  async getWeightingPolicy(nodeId: string): Promise<WeightingPolicy | null> {
    return this.weightingPolicies.get(nodeId) ?? null;
  }

  async saveWeightingPolicy(policy: WeightingPolicy): Promise<void> {
    this.weightingPolicies.set(policy.nodeId, policy);
  }

  async getAccessValuation(itemId: string): Promise<AccessValuation | null> {
    return this.accessValuations.get(itemId) ?? null;
  }

  async saveAccessValuation(valuation: AccessValuation): Promise<void> {
    this.accessValuations.set(valuation.itemId, valuation);
  }

  async getRedemption(id: string): Promise<RedemptionRecord | null> {
    return this.redemptions.get(id) ?? null;
  }

  async saveRedemption(record: RedemptionRecord): Promise<void> {
    this.redemptions.set(record.id, record);
  }

  async listRedemptions(memberId: string): Promise<RedemptionRecord[]> {
    return Array.from(this.redemptions.values()).filter((r) => r.memberId === memberId);
  }

  async getEquivalenceBand(homeNodeId: string, localNodeId: string): Promise<EquivalenceBand | null> {
    return this.equivalenceBands.get(`${homeNodeId}:${localNodeId}`) ?? null;
  }

  async saveEquivalenceBand(band: EquivalenceBand): Promise<void> {
    this.equivalenceBands.set(`${band.homeNodeId}:${band.localNodeId}`, band);
  }

  async saveEthicsEvent(event: EthicsEvent): Promise<void> {
    this.ethicsEvents.push(event);
  }

  async listEthicsEvents(status?: string): Promise<EthicsEvent[]> {
    return status
      ? this.ethicsEvents.filter((e) => e.status === status)
      : this.ethicsEvents;
  }

  async getLastLedgerEntry(): Promise<LedgerEntry | null> {
    return this.ledger.length > 0 ? this.ledger[this.ledger.length - 1] : null;
  }

  async saveLedgerEntry(entry: LedgerEntry): Promise<void> {
    this.ledger.push(entry);
  }

  async getLedgerEntries(limit?: number): Promise<LedgerEntry[]> {
    return limit ? this.ledger.slice(-limit) : [...this.ledger];
  }
}

// ============================================================================
// ITC MAIN CLASS
// ============================================================================

export class IntegralTimeCredits extends TypedEventEmitter<ITCEvents> {
  private config: ITCConfig;
  private storage: ITCStorage;

  constructor(config: Partial<ITCConfig> = {}, storage?: ITCStorage) {
    super();
    this.config = { ...DEFAULT_ITC_CONFIG, ...config };
    this.storage = storage ?? new InMemoryITCStorage();

    // Save default policies
    this.storage.saveDecayRule(this.config.defaultDecayRule);
    this.storage.saveWeightingPolicy(this.config.defaultWeightingPolicy);
  }

  // ==========================================================================
  // MODULE 1: Labor Event Capture & Verification
  // ==========================================================================

  /**
   * Record a new labor event
   */
  async recordLaborEvent(
    memberId: string,
    coopId: string,
    taskId: string,
    taskLabel: string,
    startTime: Date,
    endTime: Date,
    skillTier: SkillTier,
    context: {
      urgencyScore?: number;
      ecoSensitivityScore?: number;
      scarcityScore?: number;
    } = {},
    verifiedBy: string[] = [],
    metadata: Record<string, unknown> = {}
  ): Promise<LaborEvent> {
    const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    const event: LaborEvent = {
      id: generateId('labor'),
      memberId,
      coopId,
      taskId,
      taskLabel,
      nodeId: this.config.nodeId,
      startTime,
      endTime,
      hours,
      skillTier,
      context,
      verifiedBy,
      verificationTimestamp: new Date(),
      metadata,
    };

    await this.storage.saveLaborEvent(event);
    await this.appendToLedger('labor_event_recorded', { event });

    this.emit('labor:recorded', event);
    return event;
  }

  /**
   * Verify a labor event
   */
  async verifyLaborEvent(
    eventId: string,
    verifierId: string
  ): Promise<LaborEvent> {
    const event = await this.storage.getLaborEvent(eventId);
    if (!event) {
      throw new Error(`Labor event ${eventId} not found`);
    }

    if (!event.verifiedBy.includes(verifierId)) {
      event.verifiedBy.push(verifierId);
      event.verificationTimestamp = new Date();
      await this.storage.saveLaborEvent(event);
      await this.appendToLedger('labor_event_verified', { eventId, verifierId });
    }

    return event;
  }

  // ==========================================================================
  // MODULE 2: Skill & Context Weighting Engine
  // ==========================================================================

  /**
   * Compute weighted hours from a labor event
   * weighted_hours = base_hours × base_weight × context_factor
   */
  async computeWeightedHours(eventId: string): Promise<WeightedLaborRecord> {
    const event = await this.storage.getLaborEvent(eventId);
    if (!event) {
      throw new Error(`Labor event ${eventId} not found`);
    }

    const policy = await this.storage.getWeightingPolicy(event.nodeId) ??
      this.config.defaultWeightingPolicy;

    // Base weight from skill tier
    const baseWeight = policy.baseWeightsBySkill[event.skillTier] ?? 1.0;

    // Task type modifier
    const taskType = (event.metadata.taskType as string) ?? 'generic';
    const taskMod = policy.taskTypeModifiers[taskType] ?? 1.0;

    // Context factor
    const ctx = event.context;
    const urgency = ctx.urgencyScore ?? 0;
    const eco = ctx.ecoSensitivityScore ?? 0;
    const scarcity = ctx.scarcityScore ?? 0;

    let contextFactor =
      1.0 +
      policy.contextWeights.urgency * urgency +
      policy.contextWeights.ecoSensitivity * eco +
      policy.contextWeights.scarcity * scarcity;

    // Clamp context factor
    contextFactor = clamp(
      contextFactor,
      policy.contextFactorMin,
      policy.contextFactorMax
    );

    // Final multiplier
    const rawMultiplier = baseWeight * taskMod * contextFactor;
    const finalMultiplier = clamp(
      rawMultiplier,
      policy.minWeightMultiplier,
      policy.maxWeightMultiplier
    );

    const weightedHours = event.hours * finalMultiplier;

    const record: WeightedLaborRecord = {
      id: generateId('wlr'),
      eventId: event.id,
      memberId: event.memberId,
      nodeId: event.nodeId,
      baseHours: event.hours,
      weightMultiplier: finalMultiplier,
      weightedHours,
      breakdown: {
        skillFactor: baseWeight,
        taskFactor: taskMod,
        contextFactor,
      },
      createdAt: new Date(),
    };

    await this.storage.saveWeightedRecord(record);
    await this.appendToLedger('labor_weight_applied', { record });

    this.emit('labor:weighted', record);
    return record;
  }

  /**
   * Credit weighted hours to member account
   */
  async creditAccount(
    memberId: string,
    weightedRecordId: string
  ): Promise<ITCAccount> {
    const record = await this.storage.getWeightedRecord(weightedRecordId);
    if (!record) {
      throw new Error(`Weighted record ${weightedRecordId} not found`);
    }

    let account = await this.storage.getAccount(memberId);
    if (!account) {
      account = {
        id: generateId('acc'),
        memberId,
        nodeId: this.config.nodeId,
        balance: 0,
        lastDecayAppliedAt: new Date(),
        activeDecayRuleId: this.config.defaultDecayRule.id,
        totalEarned: 0,
        totalRedeemed: 0,
        totalDecayed: 0,
      };
    }

    account.balance += record.weightedHours;
    account.totalEarned += record.weightedHours;

    await this.storage.saveAccount(account);
    await this.appendToLedger('itc_credited', {
      accountId: account.id,
      memberId,
      amount: record.weightedHours,
      weightedRecordId,
    });

    this.emit('account:credited', { accountId: account.id, amount: record.weightedHours });
    return account;
  }

  // ==========================================================================
  // MODULE 3: Time-Decay Mechanism
  // ==========================================================================

  /**
   * Apply decay to an account
   * decay_amount = balance × (1 - 2^(-Δt/half_life))
   */
  async applyDecay(memberId: string): Promise<number> {
    const account = await this.storage.getAccount(memberId);
    if (!account) {
      throw new Error(`Account for ${memberId} not found`);
    }

    const rule = await this.storage.getDecayRule(account.activeDecayRuleId) ??
      this.config.defaultDecayRule;

    const now = new Date();
    const daysSinceDecay = daysBetween(account.lastDecayAppliedAt, now);

    // Check grace period
    if (daysSinceDecay <= rule.inactivityGraceDays) {
      return 0;
    }

    // Effective days subject to decay
    const decayDays = daysSinceDecay - rule.inactivityGraceDays;

    // Exponential decay factor
    const decayFactor = 1.0 - Math.pow(2, -decayDays / rule.halfLifeDays);

    // Calculate raw decay
    const decayableBalance = Math.max(0, account.balance - rule.minBalanceProtected);
    const rawDecay = decayableBalance * decayFactor;

    // Clamp to annual maximum
    const annualCap = account.balance * rule.maxAnnualDecayFraction * (decayDays / 365);
    const decayAmount = Math.min(rawDecay, annualCap);

    // Apply decay
    account.balance -= decayAmount;
    account.totalDecayed += decayAmount;
    account.lastDecayAppliedAt = now;

    await this.storage.saveAccount(account);
    await this.appendToLedger('itc_decayed', {
      accountId: account.id,
      memberId,
      decayAmount,
      decayDays,
    });

    this.emit('account:decayed', { accountId: account.id, amount: decayAmount });
    return decayAmount;
  }

  // ==========================================================================
  // MODULE 4: Labor-Budget Forecasting & Need Anticipation
  // ==========================================================================

  /**
   * Forecast labor availability
   */
  async forecastLaborAvailability(
    nodeId: string,
    horizonDays: number = 30
  ): Promise<{
    availableBySkill: Record<SkillTier, number>;
    projectedShortages: string[];
    recommendations: string[];
  }> {
    const accounts = await this.storage.listAccounts(nodeId);

    // Aggregate available ITCs by assumed skill distribution
    let totalBalance = 0;
    for (const account of accounts) {
      totalBalance += account.balance;
    }

    // Rough distribution (would need actual member skill data)
    const availableBySkill: Record<SkillTier, number> = {
      low: totalBalance * 0.4,
      medium: totalBalance * 0.3,
      high: totalBalance * 0.2,
      expert: totalBalance * 0.1,
    };

    const projectedShortages: string[] = [];
    const recommendations: string[] = [];

    // Simple shortage detection
    if (availableBySkill.expert < 10) {
      projectedShortages.push('Expert-level labor may be scarce');
      recommendations.push('Consider upskilling programs');
    }

    return { availableBySkill, projectedShortages, recommendations };
  }

  // ==========================================================================
  // MODULE 5: Access Allocation & Redemption
  // ==========================================================================

  /**
   * Compute access valuation for an item
   * final_itc = weighted_labor + eco_adjustment + scarcity_adjustment
   *           - repairability_credit - longevity_credit
   */
  async computeAccessValue(
    itemId: string,
    oadProfile: OADValuationProfile,
    cosSignals: COSWorkloadSignal | null = null,
    frsSignals: FRSValuationSignal | null = null
  ): Promise<AccessValuation> {
    const policy = await this.storage.getWeightingPolicy(this.config.nodeId) ??
      this.config.defaultWeightingPolicy;

    // Apply skill-tier weighting to labor
    let weightedLabor = 0;
    for (const tier of Object.keys(oadProfile.laborBySkillTier) as SkillTier[]) {
      const hours = oadProfile.laborBySkillTier[tier];
      const weight = policy.baseWeightsBySkill[tier] ?? 1.0;
      weightedLabor += hours * weight;
    }

    // Ecological burden adjustment
    const ecoWeight = 0.5;
    const ecoAdjustment = weightedLabor * oadProfile.ecoScore * ecoWeight;

    // Material scarcity adjustment
    const scarcityIndex = cosSignals?.materialScarcityIndex ?? 0;
    const scarcityAmplifier = frsSignals?.scarcityAmplifier ?? 1.0;
    const scarcityAdjustment = weightedLabor * scarcityIndex * scarcityAmplifier * 0.3;

    // Repairability credit (rewards easy maintenance)
    const repairabilityCredit = weightedLabor * oadProfile.repairability * 0.15;

    // Longevity credit (rewards durability)
    const lifespanFactor = Math.min(1.0, oadProfile.expectedLifespanHours / 20000);
    const longevityCredit = weightedLabor * lifespanFactor * 0.10;

    // Final calculation
    const finalCost = Math.max(
      0,
      weightedLabor + ecoAdjustment + scarcityAdjustment - repairabilityCredit - longevityCredit
    );

    const valuation: AccessValuation = {
      itemId,
      designVersionId: oadProfile.versionId,
      nodeId: this.config.nodeId,
      baseWeightedLaborHours: weightedLabor,
      ecoBurdenAdjustment: ecoAdjustment,
      materialScarcityAdjustment: scarcityAdjustment,
      repairabilityCredit,
      longevityCredit,
      finalItcCost: finalCost,
      computedAt: new Date(),
      policySnapshotId: policy.id,
      rationale: {
        baseLabor: oadProfile.estimatedLaborHours,
        weightedLabor,
        ecoScore: oadProfile.ecoScore,
        scarcityIndex,
      },
    };

    await this.storage.saveAccessValuation(valuation);
    await this.appendToLedger('access_value_quoted', { valuation });

    this.emit('access:valued', valuation);
    return valuation;
  }

  /**
   * Redeem access to an item
   */
  async redeemAccess(
    memberId: string,
    itemId: string,
    redemptionType: AccessMode,
    expiresAt?: Date
  ): Promise<RedemptionRecord> {
    const account = await this.storage.getAccount(memberId);
    if (!account) {
      throw new Error(`Account for ${memberId} not found`);
    }

    const valuation = await this.storage.getAccessValuation(itemId);
    if (!valuation) {
      throw new Error(`Valuation for item ${itemId} not found`);
    }

    if (account.balance < valuation.finalItcCost) {
      throw new Error(`Insufficient balance: ${account.balance} < ${valuation.finalItcCost}`);
    }

    // Deduct from account
    account.balance -= valuation.finalItcCost;
    account.totalRedeemed += valuation.finalItcCost;
    await this.storage.saveAccount(account);

    const record: RedemptionRecord = {
      id: generateId('red'),
      memberId,
      nodeId: this.config.nodeId,
      itemId,
      itcSpent: valuation.finalItcCost,
      redemptionTime: new Date(),
      redemptionType,
      expiresAt,
      accessValuationSnapshot: valuation,
    };

    await this.storage.saveRedemption(record);
    await this.appendToLedger('access_redeemed', { record });

    this.emit('access:redeemed', record);
    return record;
  }

  // ==========================================================================
  // MODULE 6: Cross-Cooperative & Internodal Reciprocity
  // ==========================================================================

  /**
   * Compute equivalence band for cross-node access
   * Bounded to 0.9-1.1 to prevent arbitrage
   */
  async computeEquivalenceBand(
    homeNodeId: string,
    localNodeId: string,
    laborConditions: Record<string, number>,
    ecologicalConditions: Record<string, number>
  ): Promise<EquivalenceBand> {
    // Labor context: scarcity differences
    const homeScarcity = laborConditions[`${homeNodeId}_scarcity`] ?? 1.0;
    const localScarcity = laborConditions[`${localNodeId}_scarcity`] ?? 1.0;
    let laborFactor = localScarcity / Math.max(homeScarcity, 0.1);
    laborFactor = clamp(laborFactor, 0.9, 1.1);

    // Ecological context
    const homeEco = ecologicalConditions[`${homeNodeId}_eco_stress`] ?? 0.5;
    const localEco = ecologicalConditions[`${localNodeId}_eco_stress`] ?? 0.5;
    let ecoFactor = 1.0 + 0.1 * (localEco - homeEco);
    ecoFactor = clamp(ecoFactor, 0.9, 1.1);

    const band: EquivalenceBand = {
      homeNodeId,
      localNodeId,
      laborContextFactor: laborFactor,
      ecoContextFactor: ecoFactor,
      updatedAt: new Date(),
    };

    await this.storage.saveEquivalenceBand(band);
    await this.appendToLedger('equivalence_band_applied', { band });

    return band;
  }

  /**
   * Compute autonomy and fragility indices
   * Autonomy: A = α×s_int + β×s_fed - γ×s_ext
   * Fragility: F = H + penalty×critical_ext
   */
  computeAutonomyAndFragility(
    internalShare: number,
    federatedShare: number,
    externalShare: number,
    criticalExternal: number,
    unitShares: Record<string, number>
  ): { autonomy: number; fragility: number } {
    const alpha = 1.0;
    const beta = 0.7;
    const gamma = 1.0;

    // Autonomy (clipped 0-1)
    const rawAutonomy = alpha * internalShare + beta * federatedShare - gamma * externalShare;
    const autonomy = clamp(rawAutonomy, 0, 1);

    // Concentration (Herfindahl)
    const shares = Object.values(unitShares);
    const H = herfindahlIndex(shares);

    // Fragility
    const penalty = 0.3;
    const rawFragility = H + penalty * criticalExternal;
    const fragility = clamp(rawFragility, 0, 1);

    return { autonomy, fragility };
  }

  // ==========================================================================
  // MODULE 7: Fairness, Anti-Coercion & Ethical Safeguards
  // ==========================================================================

  /**
   * Flag a potential ethics violation
   */
  async flagEthicsViolation(
    description: string,
    involvedMemberIds: string[],
    ruleViolations: string[],
    severity: 'info' | 'warning' | 'critical' = 'warning'
  ): Promise<EthicsEvent> {
    const event: EthicsEvent = {
      id: generateId('ethics'),
      nodeId: this.config.nodeId,
      timestamp: new Date(),
      severity,
      description,
      involvedMemberIds,
      ruleViolations,
      status: 'open',
    };

    await this.storage.saveEthicsEvent(event);
    await this.appendToLedger('ethics_flag_created', { event });

    this.emit('ethics:flagged', event);
    return event;
  }

  /**
   * Detect potential coercion patterns
   */
  async detectCoercionPatterns(memberId: string): Promise<{
    flags: string[];
    severity: 'info' | 'warning' | 'critical';
  }> {
    const recentEvents = await this.storage.listLaborEvents(memberId, 100);
    const flags: string[] = [];

    // Check for excessive hours
    const totalRecentHours = recentEvents.reduce((sum, e) => sum + e.hours, 0);
    if (totalRecentHours > 60 * 4) {
      // More than 60 hours/week average
      flags.push('Excessive labor hours detected');
    }

    // Check for consistently low skill tier assignments
    const lowTierRatio = recentEvents.filter((e) => e.skillTier === 'low').length / recentEvents.length;
    if (lowTierRatio > 0.8) {
      flags.push('Consistently assigned low-skill tasks');
    }

    const severity: 'info' | 'warning' | 'critical' =
      flags.length > 1 ? 'warning' : flags.length > 0 ? 'info' : 'info';

    return { flags, severity };
  }

  // ==========================================================================
  // MODULE 8: Ledger, Transparency & Auditability
  // ==========================================================================

  private async appendToLedger(
    entryType: string,
    details: Record<string, unknown>
  ): Promise<LedgerEntry> {
    const lastEntry = await this.storage.getLastLedgerEntry();
    const prevHash = lastEntry?.entryHash ?? GENESIS_HASH;

    const entry = createLedgerEntry(
      `itc.${entryType}`,
      this.config.nodeId,
      details,
      prevHash
    );

    await this.storage.saveLedgerEntry(entry);
    this.emit('ledger:entry', entry);

    return entry;
  }

  /**
   * Get account transaction history
   */
  async getTransactionHistory(memberId: string): Promise<LedgerEntry[]> {
    const entries = await this.storage.getLedgerEntries();
    return entries.filter((e) => e.memberId === memberId);
  }

  // ==========================================================================
  // MODULE 9: Integration & Coordination
  // ==========================================================================

  /**
   * Update weighting policy (from CDS decision)
   */
  async updateWeightingPolicy(policy: WeightingPolicy): Promise<void> {
    await this.storage.saveWeightingPolicy(policy);
    await this.appendToLedger('policy_updated', { policy });
  }

  /**
   * Update decay rule (from CDS decision)
   */
  async updateDecayRule(rule: DecayRule): Promise<void> {
    await this.storage.saveDecayRule(rule);
    await this.appendToLedger('policy_updated', { rule });
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  async getAccount(memberId: string): Promise<ITCAccount | null> {
    return this.storage.getAccount(memberId);
  }

  async getBalance(memberId: string): Promise<number> {
    const account = await this.storage.getAccount(memberId);
    return account?.balance ?? 0;
  }

  getConfig(): ITCConfig {
    return { ...this.config };
  }
}

export default IntegralTimeCredits;
