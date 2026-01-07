/**
 * CDS — COLLABORATIVE DECISION SYSTEM
 * Participatory governance engine with 10 modules
 *
 * Modules:
 * 1. Issue Capture & Signal Intake
 * 2. Issue Structuring & Framing
 * 3. Knowledge Integration & Context Engine
 * 4. Norms & Constraint Checking
 * 5. Participatory Deliberation Workspace
 * 6. Weighted Consensus Engine
 * 7. Transparency, Versioning & Accountability
 * 8. Implementation Dispatch Interface
 * 9. Human Deliberation & High-Bandwidth Resolution
 * 10. Review, Revision & Override
 */

import type {
  Issue,
  IssueStatus,
  Submission,
  SubmissionType,
  Scenario,
  Objection,
  Vote,
  ConstraintReport,
  ConsensusResult,
  ConsensusDirective,
  Decision,
  DispatchPacket,
  LedgerEntry,
  SupportLevel,
  Participant,
} from '../../types/index.js';

import {
  generateId,
  createLedgerEntry,
  GENESIS_HASH,
  verifyHashChain,
  supportLevelToNumber,
  clamp,
  TypedEventEmitter,
} from '../../utils/index.js';

// ============================================================================
// CDS CONFIGURATION
// ============================================================================

export interface CDSConfig {
  nodeId: string;
  consensusThreshold: number; // Default: 0.6
  objectionThreshold: number; // Default: 0.3
  minConsensusThreshold: number; // Default: 0.4
  maxParticipantWeight: number; // Default: 2.0
  escalationEnabled: boolean;
}

export const DEFAULT_CDS_CONFIG: CDSConfig = {
  nodeId: 'default',
  consensusThreshold: 0.6,
  objectionThreshold: 0.3,
  minConsensusThreshold: 0.4,
  maxParticipantWeight: 2.0,
  escalationEnabled: true,
};

// ============================================================================
// CDS EVENTS
// ============================================================================

interface CDSEvents {
  'issue:created': [Issue];
  'issue:updated': [Issue];
  'submission:added': [Submission];
  'scenario:created': [Scenario];
  'vote:cast': [Vote];
  'consensus:reached': [ConsensusResult];
  'decision:made': [Decision];
  'dispatch:sent': [DispatchPacket];
  'ledger:entry': [LedgerEntry];
}

// ============================================================================
// CDS STORAGE INTERFACE
// ============================================================================

export interface CDSStorage {
  // Issues
  getIssue(id: string): Promise<Issue | null>;
  saveIssue(issue: Issue): Promise<void>;
  listIssues(filter?: Partial<Issue>): Promise<Issue[]>;

  // Scenarios
  getScenario(id: string): Promise<Scenario | null>;
  saveScenario(scenario: Scenario): Promise<void>;
  listScenarios(issueId: string): Promise<Scenario[]>;

  // Votes
  getVotes(scenarioId: string): Promise<Vote[]>;
  saveVote(vote: Vote): Promise<void>;

  // Objections
  getObjections(scenarioId: string): Promise<Objection[]>;
  saveObjection(objection: Objection): Promise<void>;

  // Decisions
  getDecision(id: string): Promise<Decision | null>;
  saveDecision(decision: Decision): Promise<void>;

  // Ledger
  getLastLedgerEntry(): Promise<LedgerEntry | null>;
  saveLedgerEntry(entry: LedgerEntry): Promise<void>;
  getLedgerEntries(limit?: number): Promise<LedgerEntry[]>;

  // Participants
  getParticipant(id: string): Promise<Participant | null>;
  getParticipantWeight(participantId: string): Promise<number>;
}

// ============================================================================
// IN-MEMORY STORAGE IMPLEMENTATION
// ============================================================================

export class InMemoryCDSStorage implements CDSStorage {
  private issues: Map<string, Issue> = new Map();
  private scenarios: Map<string, Scenario> = new Map();
  private votes: Map<string, Vote[]> = new Map();
  private objections: Map<string, Objection[]> = new Map();
  private decisions: Map<string, Decision> = new Map();
  private ledger: LedgerEntry[] = [];
  private participants: Map<string, Participant> = new Map();
  private participantWeights: Map<string, number> = new Map();

  async getIssue(id: string): Promise<Issue | null> {
    return this.issues.get(id) ?? null;
  }

  async saveIssue(issue: Issue): Promise<void> {
    this.issues.set(issue.id, issue);
  }

  async listIssues(filter?: Partial<Issue>): Promise<Issue[]> {
    let issues = Array.from(this.issues.values());
    if (filter) {
      issues = issues.filter((issue) =>
        Object.entries(filter).every(([key, value]) =>
          issue[key as keyof Issue] === value
        )
      );
    }
    return issues;
  }

  async getScenario(id: string): Promise<Scenario | null> {
    return this.scenarios.get(id) ?? null;
  }

  async saveScenario(scenario: Scenario): Promise<void> {
    this.scenarios.set(scenario.id, scenario);
  }

  async listScenarios(issueId: string): Promise<Scenario[]> {
    return Array.from(this.scenarios.values()).filter(
      (s) => s.issueId === issueId
    );
  }

  async getVotes(scenarioId: string): Promise<Vote[]> {
    return this.votes.get(scenarioId) ?? [];
  }

  async saveVote(vote: Vote): Promise<void> {
    const scenarioVotes = this.votes.get(vote.scenarioId) ?? [];
    // Replace existing vote from same participant
    const existingIndex = scenarioVotes.findIndex(
      (v) => v.participantId === vote.participantId
    );
    if (existingIndex >= 0) {
      scenarioVotes[existingIndex] = vote;
    } else {
      scenarioVotes.push(vote);
    }
    this.votes.set(vote.scenarioId, scenarioVotes);
  }

  async getObjections(scenarioId: string): Promise<Objection[]> {
    return this.objections.get(scenarioId) ?? [];
  }

  async saveObjection(objection: Objection): Promise<void> {
    const scenarioObjections = this.objections.get(objection.scenarioId) ?? [];
    scenarioObjections.push(objection);
    this.objections.set(objection.scenarioId, scenarioObjections);
  }

  async getDecision(id: string): Promise<Decision | null> {
    return this.decisions.get(id) ?? null;
  }

  async saveDecision(decision: Decision): Promise<void> {
    this.decisions.set(decision.id, decision);
  }

  async getLastLedgerEntry(): Promise<LedgerEntry | null> {
    return this.ledger.length > 0 ? this.ledger[this.ledger.length - 1] : null;
  }

  async saveLedgerEntry(entry: LedgerEntry): Promise<void> {
    this.ledger.push(entry);
  }

  async getLedgerEntries(limit?: number): Promise<LedgerEntry[]> {
    if (limit) {
      return this.ledger.slice(-limit);
    }
    return [...this.ledger];
  }

  async getParticipant(id: string): Promise<Participant | null> {
    return this.participants.get(id) ?? null;
  }

  async getParticipantWeight(participantId: string): Promise<number> {
    return this.participantWeights.get(participantId) ?? 1.0;
  }

  // Helper methods for testing
  addParticipant(participant: Participant, weight: number = 1.0): void {
    this.participants.set(participant.id, participant);
    this.participantWeights.set(participant.id, weight);
  }
}

// ============================================================================
// CDS MAIN CLASS
// ============================================================================

export class CollaborativeDecisionSystem extends TypedEventEmitter<CDSEvents> {
  private config: CDSConfig;
  private storage: CDSStorage;

  constructor(config: Partial<CDSConfig> = {}, storage?: CDSStorage) {
    super();
    this.config = { ...DEFAULT_CDS_CONFIG, ...config };
    this.storage = storage ?? new InMemoryCDSStorage();
  }

  // ==========================================================================
  // MODULE 1: Issue Capture & Signal Intake
  // ==========================================================================

  /**
   * Create a new issue from proposal, objection, or system signal
   */
  async createIssue(
    title: string,
    description: string,
    authorId: string,
    type: SubmissionType = 'proposal',
    metadata: Record<string, unknown> = {}
  ): Promise<Issue> {
    const now = new Date();
    const issueId = generateId('issue');

    const initialSubmission: Submission = {
      id: generateId('sub'),
      authorId,
      issueId,
      type,
      content: description,
      createdAt: now,
      metadata,
    };

    const issue: Issue = {
      id: issueId,
      title,
      description,
      nodeId: this.config.nodeId,
      status: 'intake',
      createdAt: now,
      lastUpdatedAt: now,
      submissions: [initialSubmission],
      metadata,
    };

    await this.storage.saveIssue(issue);
    await this.appendToLedger('issue_created', { issue });

    this.emit('issue:created', issue);
    this.emit('submission:added', initialSubmission);

    return issue;
  }

  /**
   * Add a submission to an existing issue
   */
  async addSubmission(
    issueId: string,
    authorId: string,
    type: SubmissionType,
    content: string,
    metadata: Record<string, unknown> = {}
  ): Promise<Submission> {
    const issue = await this.storage.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    const submission: Submission = {
      id: generateId('sub'),
      authorId,
      issueId,
      type,
      content,
      createdAt: new Date(),
      metadata,
    };

    issue.submissions.push(submission);
    issue.lastUpdatedAt = new Date();
    await this.storage.saveIssue(issue);
    await this.appendToLedger('submission_added', { submission });

    this.emit('submission:added', submission);
    return submission;
  }

  // ==========================================================================
  // MODULE 2: Issue Structuring & Framing
  // ==========================================================================

  /**
   * Structure an issue by transitioning it to structured status
   */
  async structureIssue(
    issueId: string,
    structuredData: {
      categories?: string[];
      relatedIssues?: string[];
      stakeholders?: string[];
      constraints?: string[];
    }
  ): Promise<Issue> {
    const issue = await this.storage.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    issue.status = 'structured';
    issue.metadata = { ...issue.metadata, ...structuredData };
    issue.lastUpdatedAt = new Date();

    await this.storage.saveIssue(issue);
    await this.appendToLedger('issue_structured', { issueId, structuredData });

    this.emit('issue:updated', issue);
    return issue;
  }

  // ==========================================================================
  // MODULE 3: Knowledge Integration & Context Engine
  // ==========================================================================

  /**
   * Mark issue as context-ready after knowledge integration
   */
  async prepareContext(
    issueId: string,
    contextData: {
      evidence: string[];
      precedents: string[];
      constraints: Record<string, unknown>;
    }
  ): Promise<Issue> {
    const issue = await this.storage.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    issue.status = 'context_ready';
    issue.metadata = {
      ...issue.metadata,
      context: contextData,
    };
    issue.lastUpdatedAt = new Date();

    await this.storage.saveIssue(issue);
    this.emit('issue:updated', issue);
    return issue;
  }

  // ==========================================================================
  // MODULE 4: Norms & Constraint Checking
  // ==========================================================================

  /**
   * Check if a scenario passes constraint validation
   */
  async checkConstraints(
    issueId: string,
    scenarioId: string,
    norms: Array<{ rule: string; check: (scenario: Scenario) => boolean }>
  ): Promise<ConstraintReport> {
    const scenario = await this.storage.getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const violations: Array<{ rule: string; details: string }> = [];
    const requiredModifications: string[] = [];

    for (const norm of norms) {
      if (!norm.check(scenario)) {
        violations.push({
          rule: norm.rule,
          details: `Scenario ${scenarioId} violates norm: ${norm.rule}`,
        });
        requiredModifications.push(`Address ${norm.rule} violation`);
      }
    }

    const report: ConstraintReport = {
      issueId,
      scenarioId,
      passed: violations.length === 0,
      violations,
      requiredModifications,
    };

    await this.appendToLedger('constraint_check', { report });
    return report;
  }

  // ==========================================================================
  // MODULE 5: Participatory Deliberation Workspace
  // ==========================================================================

  /**
   * Move issue to deliberation phase
   */
  async openDeliberation(issueId: string): Promise<Issue> {
    const issue = await this.storage.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    issue.status = 'deliberation';
    issue.lastUpdatedAt = new Date();

    await this.storage.saveIssue(issue);
    await this.appendToLedger('deliberation_opened', { issueId });

    this.emit('issue:updated', issue);
    return issue;
  }

  /**
   * Create a scenario for deliberation
   */
  async createScenario(
    issueId: string,
    label: string,
    parameters: Record<string, unknown>,
    indicators: Record<string, unknown> = {}
  ): Promise<Scenario> {
    const issue = await this.storage.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    const scenario: Scenario = {
      id: generateId('scenario'),
      issueId,
      label,
      parameters,
      indicators,
    };

    await this.storage.saveScenario(scenario);
    await this.appendToLedger('scenario_created', { scenario });

    this.emit('scenario:created', scenario);
    return scenario;
  }

  /**
   * Cast a vote on a scenario
   */
  async castVote(
    participantId: string,
    scenarioId: string,
    supportLevel: SupportLevel
  ): Promise<Vote> {
    const scenario = await this.storage.getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const weight = await this.storage.getParticipantWeight(participantId);
    const boundedWeight = Math.min(weight, this.config.maxParticipantWeight);

    const vote: Vote = {
      participantId,
      scenarioId,
      supportLevel,
      weight: boundedWeight,
      createdAt: new Date(),
    };

    await this.storage.saveVote(vote);
    await this.appendToLedger('vote_cast', { vote });

    this.emit('vote:cast', vote);
    return vote;
  }

  /**
   * Register an objection to a scenario
   */
  async registerObjection(
    participantId: string,
    issueId: string,
    scenarioId: string,
    severity: number,
    scope: number,
    description: string
  ): Promise<Objection> {
    const objection: Objection = {
      id: generateId('obj'),
      participantId,
      issueId,
      scenarioId,
      severity: clamp(severity, 0, 1),
      scope: clamp(scope, 0, 1),
      description,
      createdAt: new Date(),
    };

    await this.storage.saveObjection(objection);
    await this.appendToLedger('objection_registered', { objection });

    return objection;
  }

  // ==========================================================================
  // MODULE 6: Weighted Consensus Engine
  // ==========================================================================

  /**
   * Compute consensus score for a scenario
   * C(s) = Σᵢ wᵢ × supportᵢ(s) / Σᵢ wᵢ
   */
  async computeConsensusScore(scenarioId: string): Promise<number> {
    const votes = await this.storage.getVotes(scenarioId);

    if (votes.length === 0) {
      return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const vote of votes) {
      const support = supportLevelToNumber(vote.supportLevel);
      weightedSum += vote.weight * support;
      totalWeight += vote.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Compute objection index for a scenario
   * O(s) = Σⱼ severityⱼ × scopeⱼ × (1/N)
   */
  async computeObjectionIndex(scenarioId: string): Promise<number> {
    const votes = await this.storage.getVotes(scenarioId);
    const objections = await this.storage.getObjections(scenarioId);

    const n = votes.length || 1;

    let objectionSum = 0;
    for (const obj of objections) {
      objectionSum += obj.severity * obj.scope;
    }

    return objectionSum / n;
  }

  /**
   * Evaluate consensus and determine directive
   */
  async evaluateConsensus(
    issueId: string,
    scenarioId: string
  ): Promise<ConsensusResult> {
    const consensusScore = await this.computeConsensusScore(scenarioId);
    const objectionIndex = await this.computeObjectionIndex(scenarioId);

    let directive: ConsensusDirective;
    const requiredConditions: string[] = [];

    // Decision rules from spec
    if (
      consensusScore >= this.config.consensusThreshold &&
      objectionIndex <= this.config.objectionThreshold
    ) {
      directive = 'approve';
    } else if (
      consensusScore >= this.config.minConsensusThreshold &&
      objectionIndex > this.config.objectionThreshold
    ) {
      directive = 'revise';
      requiredConditions.push('Address objections before re-evaluation');
    } else {
      directive = this.config.escalationEnabled
        ? 'escalate_to_module9'
        : 'revise';
      requiredConditions.push('Requires human deliberation');
    }

    const result: ConsensusResult = {
      issueId,
      scenarioId,
      consensusScore,
      objectionIndex,
      directive,
      requiredConditions,
    };

    await this.appendToLedger('consensus_evaluated', { result });
    this.emit('consensus:reached', result);

    return result;
  }

  // ==========================================================================
  // MODULE 7: Transparency, Versioning & Accountability
  // ==========================================================================

  /**
   * Append entry to audit ledger
   */
  private async appendToLedger(
    entryType: string,
    details: Record<string, unknown>
  ): Promise<LedgerEntry> {
    const lastEntry = await this.storage.getLastLedgerEntry();
    const prevHash = lastEntry?.entryHash ?? GENESIS_HASH;

    const entry = createLedgerEntry(
      `cds.${entryType}`,
      this.config.nodeId,
      details,
      prevHash
    );

    await this.storage.saveLedgerEntry(entry);
    this.emit('ledger:entry', entry);

    return entry;
  }

  /**
   * Verify ledger integrity
   */
  async verifyLedger(): Promise<boolean> {
    const entries = await this.storage.getLedgerEntries();
    return verifyHashChain(entries);
  }

  /**
   * Get audit trail for an issue
   */
  async getAuditTrail(issueId: string): Promise<LedgerEntry[]> {
    const entries = await this.storage.getLedgerEntries();
    return entries.filter((e) => {
      const details = e.details as Record<string, unknown>;
      return (
        details.issueId === issueId ||
        (details.issue as Issue)?.id === issueId ||
        (details.scenario as Scenario)?.issueId === issueId ||
        (details.submission as Submission)?.issueId === issueId
      );
    });
  }

  // ==========================================================================
  // MODULE 8: Implementation Dispatch Interface
  // ==========================================================================

  /**
   * Create a decision and dispatch to other systems
   */
  async makeDecision(
    issueId: string,
    scenarioId: string,
    consensusResult: ConsensusResult
  ): Promise<Decision> {
    if (consensusResult.directive !== 'approve') {
      throw new Error(
        `Cannot make decision: directive is ${consensusResult.directive}`
      );
    }

    const issue = await this.storage.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    const scenario = await this.storage.getScenario(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const decision: Decision = {
      id: generateId('dec'),
      issueId,
      scenarioId,
      status: 'approved',
      consensusScore: consensusResult.consensusScore,
      objectionIndex: consensusResult.objectionIndex,
      decidedAt: new Date(),
      rationaleHash: '',
    };

    // Compute rationale hash
    const rationaleData = {
      issue,
      scenario,
      consensusResult,
    };
    decision.rationaleHash = generateId('rationale');

    await this.storage.saveDecision(decision);

    // Update issue status
    issue.status = 'decided';
    issue.lastUpdatedAt = new Date();
    await this.storage.saveIssue(issue);

    await this.appendToLedger('decision_made', { decision });
    this.emit('decision:made', decision);

    return decision;
  }

  /**
   * Dispatch decision to implementation systems
   */
  async dispatchDecision(decisionId: string): Promise<DispatchPacket> {
    const allDecisions = await this.storage.getLedgerEntries();
    const decisionEntry = allDecisions.find(
      (e) => (e.details as Record<string, unknown>).decision &&
        ((e.details as Record<string, unknown>).decision as Decision).id === decisionId
    );

    if (!decisionEntry) {
      throw new Error(`Decision ${decisionId} not found in ledger`);
    }

    const decision = (decisionEntry.details as Record<string, unknown>).decision as Decision;
    const scenario = await this.storage.getScenario(decision.scenarioId);
    const issue = await this.storage.getIssue(decision.issueId);

    if (!scenario || !issue) {
      throw new Error('Missing scenario or issue');
    }

    const packet: DispatchPacket = {
      id: generateId('dispatch'),
      issueId: decision.issueId,
      scenarioId: decision.scenarioId,
      createdAt: new Date(),
      tasks: [],
      materials: scenario.parameters.materials ?? {},
      oadFlags: scenario.parameters.oadFlags ?? {},
      itcAdjustments: scenario.parameters.itcAdjustments ?? {},
      frsMonitors: (scenario.parameters.monitors as string[]) ?? [],
    };

    // Route to appropriate systems based on scenario parameters
    if (scenario.parameters.oadDesignRequired) {
      packet.tasks.push({
        system: 'OAD',
        payload: { action: 'create_design', spec: scenario.parameters },
      });
    }
    if (scenario.parameters.cosTaskRequired) {
      packet.tasks.push({
        system: 'COS',
        payload: { action: 'schedule_production', spec: scenario.parameters },
      });
    }
    if (scenario.parameters.itcPolicyChange) {
      packet.tasks.push({
        system: 'ITC',
        payload: { action: 'update_policy', changes: scenario.parameters.itcPolicyChange },
      });
    }

    // Update issue status
    issue.status = 'dispatched';
    issue.lastUpdatedAt = new Date();
    await this.storage.saveIssue(issue);

    await this.appendToLedger('decision_dispatched', { packet });
    this.emit('dispatch:sent', packet);

    return packet;
  }

  // ==========================================================================
  // MODULE 9: Human Deliberation & High-Bandwidth Resolution
  // ==========================================================================

  /**
   * Escalate issue for human deliberation (Syntegrity process)
   */
  async escalateToDeliberation(
    issueId: string,
    reason: string
  ): Promise<Issue> {
    const issue = await this.storage.getIssue(issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    issue.metadata = {
      ...issue.metadata,
      escalation: {
        reason,
        escalatedAt: new Date(),
        status: 'pending_deliberation',
      },
    };
    issue.lastUpdatedAt = new Date();

    await this.storage.saveIssue(issue);
    await this.appendToLedger('issue_escalated', { issueId, reason });

    this.emit('issue:updated', issue);
    return issue;
  }

  // ==========================================================================
  // MODULE 10: Review, Revision & Override
  // ==========================================================================

  /**
   * Request review of an existing decision
   */
  async requestReview(
    decisionId: string,
    reviewerId: string,
    reason: string
  ): Promise<Issue> {
    const entries = await this.storage.getLedgerEntries();
    const decisionEntry = entries.find(
      (e) => {
        const details = e.details as Record<string, unknown>;
        return details.decision && (details.decision as Decision).id === decisionId;
      }
    );

    if (!decisionEntry) {
      throw new Error(`Decision ${decisionId} not found`);
    }

    const decision = (decisionEntry.details as Record<string, unknown>).decision as Decision;
    const originalIssue = await this.storage.getIssue(decision.issueId);

    if (!originalIssue) {
      throw new Error(`Original issue not found`);
    }

    // Create review issue
    const reviewIssue = await this.createIssue(
      `Review: ${originalIssue.title}`,
      `Review requested for decision ${decisionId}: ${reason}`,
      reviewerId,
      'proposal',
      {
        reviewOf: decisionId,
        originalIssueId: originalIssue.id,
      }
    );

    // Mark original issue as under review
    originalIssue.status = 'under_review';
    originalIssue.lastUpdatedAt = new Date();
    await this.storage.saveIssue(originalIssue);

    return reviewIssue;
  }

  /**
   * Amend an existing decision
   */
  async amendDecision(
    originalDecisionId: string,
    newScenarioId: string,
    consensusResult: ConsensusResult
  ): Promise<Decision> {
    const entries = await this.storage.getLedgerEntries();
    const originalEntry = entries.find(
      (e) => {
        const details = e.details as Record<string, unknown>;
        return details.decision && (details.decision as Decision).id === originalDecisionId;
      }
    );

    if (!originalEntry) {
      throw new Error(`Original decision ${originalDecisionId} not found`);
    }

    const originalDecision = (originalEntry.details as Record<string, unknown>).decision as Decision;

    // Create amended decision
    const amendedDecision = await this.makeDecision(
      originalDecision.issueId,
      newScenarioId,
      consensusResult
    );

    amendedDecision.supersedesDecisionId = originalDecisionId;
    amendedDecision.status = 'amended';

    await this.storage.saveDecision(amendedDecision);
    await this.appendToLedger('decision_amended', {
      originalDecisionId,
      amendedDecision,
    });

    return amendedDecision;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get issue by ID
   */
  async getIssue(id: string): Promise<Issue | null> {
    return this.storage.getIssue(id);
  }

  /**
   * List all issues with optional filter
   */
  async listIssues(filter?: Partial<Issue>): Promise<Issue[]> {
    return this.storage.listIssues(filter);
  }

  /**
   * Get scenarios for an issue
   */
  async getScenarios(issueId: string): Promise<Scenario[]> {
    return this.storage.listScenarios(issueId);
  }

  /**
   * Get current configuration
   */
  getConfig(): CDSConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (requires CDS decision in production)
   */
  updateConfig(updates: Partial<CDSConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export default CollaborativeDecisionSystem;
