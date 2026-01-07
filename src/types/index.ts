/**
 * INTEGRAL: Core Types and Interfaces
 * Federated post-monetary cooperative economic system
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type SkillTier = 'low' | 'medium' | 'high' | 'expert';
export type Severity = 'info' | 'low' | 'moderate' | 'critical';
export type Confidence = 'speculative' | 'provisional' | 'confident' | 'validated';
export type Persistence = 'transient' | 'emerging' | 'persistent';
export type Scope = 'task' | 'process' | 'node' | 'regional' | 'federation';
export type TargetSystem = 'OAD' | 'COS' | 'ITC' | 'CDS' | 'FED';

export interface Participant {
  id: string;
  nodeId: string;
  publicKey: string;
  roles: string[];
  authenticatedAt: Date;
}

// ============================================================================
// CDS — COLLABORATIVE DECISION SYSTEM
// ============================================================================

export type IssueStatus =
  | 'intake'
  | 'structured'
  | 'context_ready'
  | 'deliberation'
  | 'decided'
  | 'dispatched'
  | 'under_review'
  | 'reopened';

export type SubmissionType = 'proposal' | 'objection' | 'evidence' | 'comment' | 'signal';

export type SupportLevel = 'strong_support' | 'support' | 'neutral' | 'concern' | 'block';

export type ConsensusDirective = 'approve' | 'revise' | 'escalate_to_module9';

export interface Submission {
  id: string;
  authorId: string;
  issueId: string;
  type: SubmissionType;
  content: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  nodeId: string;
  status: IssueStatus;
  createdAt: Date;
  lastUpdatedAt: Date;
  submissions: Submission[];
  metadata: Record<string, unknown>;
}

export interface Scenario {
  id: string;
  issueId: string;
  label: string;
  parameters: Record<string, unknown>;
  indicators: Record<string, unknown>;
}

export interface Objection {
  id: string;
  participantId: string;
  issueId: string;
  scenarioId: string;
  severity: number; // 0-1
  scope: number; // 0-1
  description: string;
  createdAt: Date;
}

export interface Vote {
  participantId: string;
  scenarioId: string;
  supportLevel: SupportLevel;
  weight: number;
  createdAt: Date;
}

export interface ConstraintReport {
  issueId: string;
  scenarioId: string;
  passed: boolean;
  violations: Array<{ rule: string; details: string }>;
  requiredModifications: string[];
}

export interface ConsensusResult {
  issueId: string;
  scenarioId: string;
  consensusScore: number;
  objectionIndex: number;
  directive: ConsensusDirective;
  requiredConditions: string[];
}

export interface Decision {
  id: string;
  issueId: string;
  scenarioId: string;
  status: 'approved' | 'amended' | 'revoked';
  consensusScore: number;
  objectionIndex: number;
  decidedAt: Date;
  rationaleHash: string;
  supersedesDecisionId?: string;
}

export interface DispatchPacket {
  id: string;
  issueId: string;
  scenarioId: string;
  createdAt: Date;
  tasks: Array<{ system: TargetSystem; payload: Record<string, unknown> }>;
  materials: Record<string, unknown>;
  oadFlags: Record<string, unknown>;
  itcAdjustments: Record<string, unknown>;
  frsMonitors: string[];
}

// ============================================================================
// OAD — OPEN ACCESS DESIGN
// ============================================================================

export interface DesignSpec {
  id: string;
  nodeId: string;
  purpose: string;
  functionalRequirements: string[];
  constraints: Record<string, unknown>;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export interface DesignVersion {
  id: string;
  specId: string;
  parentVersionId?: string;
  label: string;
  createdAt: Date;
  authors: string[];
  cadFiles: string[]; // URIs/hashes
  materials: string[];
  parameters: Record<string, unknown>;
  changeLog: string;
  status: 'draft' | 'under_review' | 'certified';
  supersededByVersionId?: string;
}

export interface MaterialProfile {
  versionId: string;
  materials: string[];
  quantitiesKg: Record<string, number>;
  embodiedEnergyMj: Record<string, number>;
  carbonKgCo2Eq: Record<string, number>;
  toxicityIndex: Record<string, number>;
  recyclabilityIndex: Record<string, number>;
  waterUseL: Record<string, number>;
  landUseM2: Record<string, number>;
}

export interface EcoAssessment {
  versionId: string;
  embodiedEnergyNorm: number; // 0-1
  carbonIntensityNorm: number;
  toxicityNorm: number;
  recyclabilityNorm: number;
  waterUseNorm: number;
  landUseNorm: number;
  repairabilityNorm: number;
  ecoScore: number; // 0-1 (lower = better)
  passed: boolean;
  notes: string;
}

export interface LifecycleModel {
  versionId: string;
  expectedLifetimeYears: number;
  maintenanceEventsExpected: number;
  maintenanceIntervalDays: number;
  maintenanceLaborHoursPerInterval: number;
  disassemblyHours: number;
  refurbCyclesPossible: number;
  dominantFailureModes: string[];
  lifecycleBurdenIndex: number; // 0-1
}

export interface LaborProfile {
  versionId: string;
  productionSteps: Array<{
    stepId: string;
    name: string;
    skillTier: SkillTier;
    estimatedHours: number;
    requiredTools: string[];
    predecessors: string[];
  }>;
  totalProductionHours: number;
  hoursBySkillTier: Record<SkillTier, number>;
  totalMaintenanceHoursOverLife: number;
  ergonomicsFlags: string[];
  requiredCertifications: string[];
}

export interface SimulationResult {
  versionId: string;
  feasibilityScore: number; // 0-1
  yieldFactor: number;
  failureModes: string[];
  simulationType: string;
  passedStructural: boolean;
  passedThermal: boolean;
  passedSafety: boolean;
  notes: string;
}

export interface IntegrationCheck {
  versionId: string;
  compatibleSystems: string[];
  conflicts: string[];
  circularLoops: string[]; // resource reuse opportunities
  integrationScore: number; // 0-1
}

export interface CertificationRecord {
  versionId: string;
  certifiedAt: Date;
  certifiedBy: string[];
  criteriaPassed: string[];
  criteriaFailed: string[];
  documentationBundleUri: string;
  status: 'certified' | 'pending' | 'revoked';
}

export interface OADValuationProfile {
  versionId: string;
  materialIntensity: number;
  repairability: number;
  billOfMaterials: Record<string, number>;
  embodiedEnergy: number;
  expectedLifespanHours: number;
  estimatedLaborHours: number;
  laborBySkillTier: Record<SkillTier, number>;
  ecoScore: number;
  lifecycleBurdenIndex: number;
}

// ============================================================================
// ITC — INTEGRAL TIME CREDITS
// ============================================================================

export interface LaborEvent {
  id: string;
  memberId: string;
  coopId: string;
  taskId: string;
  taskLabel: string;
  nodeId: string;
  startTime: Date;
  endTime: Date;
  hours: number;
  skillTier: SkillTier;
  context: {
    urgencyScore?: number; // -1 to +1
    ecoSensitivityScore?: number;
    scarcityScore?: number;
  };
  verifiedBy: string[];
  verificationTimestamp: Date;
  metadata: Record<string, unknown>;
}

export interface WeightedLaborRecord {
  id: string;
  eventId: string;
  memberId: string;
  nodeId: string;
  baseHours: number;
  weightMultiplier: number;
  weightedHours: number;
  breakdown: {
    skillFactor: number;
    taskFactor: number;
    contextFactor: number;
  };
  createdAt: Date;
}

export interface DecayRule {
  id: string;
  label: string;
  inactivityGraceDays: number;
  halfLifeDays: number;
  minBalanceProtected: number;
  maxAnnualDecayFraction: number;
  effectiveFrom: Date;
}

export interface ITCAccount {
  id: string;
  memberId: string;
  nodeId: string;
  balance: number;
  lastDecayAppliedAt: Date;
  activeDecayRuleId: string;
  totalEarned: number;
  totalRedeemed: number;
  totalDecayed: number;
}

export interface WeightingPolicy {
  id: string;
  nodeId: string;
  effectiveFrom: Date;
  baseWeightsBySkill: Record<SkillTier, number>;
  taskTypeModifiers: Record<string, number>;
  contextWeights: {
    urgency: number;
    ecoSensitivity: number;
    scarcity: number;
  };
  contextFactorMin: number;
  contextFactorMax: number;
  minWeightMultiplier: number;
  maxWeightMultiplier: number;
}

export type AccessMode = 'permanent_acquisition' | 'shared_use_lock' | 'service_use';

export interface AccessValuation {
  itemId: string;
  designVersionId: string;
  nodeId: string;
  baseWeightedLaborHours: number;
  ecoBurdenAdjustment: number;
  materialScarcityAdjustment: number;
  repairabilityCredit: number;
  longevityCredit: number;
  finalItcCost: number;
  computedAt: Date;
  validUntil?: Date;
  policySnapshotId: string;
  rationale: Record<string, unknown>;
}

export interface RedemptionRecord {
  id: string;
  memberId: string;
  nodeId: string;
  itemId: string;
  itcSpent: number;
  redemptionTime: Date;
  redemptionType: AccessMode;
  expiresAt?: Date;
  accessValuationSnapshot: AccessValuation;
}

export interface EquivalenceBand {
  homeNodeId: string;
  localNodeId: string;
  laborContextFactor: number; // bounded 0.9-1.1
  ecoContextFactor: number;
  updatedAt: Date;
}

export interface EthicsEvent {
  id: string;
  nodeId: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  involvedMemberIds: string[];
  ruleViolations: string[];
  status: 'open' | 'under_review' | 'resolved';
}

export type LedgerEntryType =
  | 'labor_event_recorded'
  | 'labor_weight_applied'
  | 'itc_credited'
  | 'itc_decayed'
  | 'access_value_quoted'
  | 'access_redeemed'
  | 'equivalence_band_applied'
  | 'ethics_flag_created'
  | 'policy_updated';

// ============================================================================
// COS — COOPERATIVE ORGANIZATION SYSTEM
// ============================================================================

export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type MaterialFlowSource = 'internal_recycle' | 'external_procurement' | 'production_use' | 'loss_scrap';

export interface COSTaskDefinition {
  id: string;
  versionId: string; // OAD DesignVersion
  name: string;
  description: string;
  skillTier: SkillTier;
  estimatedHoursPerUnit: number;
  requiredTools: string[];
  requiredWorkspaces: string[];
  requiredMaterialsKg: Record<string, number>;
  processEii: number; // ecological impact index
  predecessors: string[]; // task_definition_ids
}

export interface COSTaskInstance {
  id: string;
  definitionId: string;
  batchId: string;
  nodeId: string;
  assignedCoopId: string;
  status: TaskStatus;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  actualHours: number;
  participants: string[];
  blockReasons: string[];
}

export interface COSProductionPlan {
  planId: string;
  nodeId: string;
  versionId: string; // OAD DesignVersion
  batchId: string;
  batchSize: number;
  createdAt: Date;
  tasks: Record<string, COSTaskDefinition>;
  taskInstances: Record<string, COSTaskInstance>;
  expectedLaborHoursBySkill: Record<SkillTier, number>;
  expectedMaterialsKg: Record<string, number>;
  expectedCycleTimeHours: number;
  predictedBottlenecks: string[];
}

export interface MaterialLedgerEntry {
  id: string;
  materialId: string;
  quantityKg: number;
  direction: MaterialFlowSource;
  ecologicalImpactIndex: number;
  timestamp: Date;
  planId: string;
  taskInstanceId?: string;
}

export interface COSConstraint {
  planId: string;
  nodeId: string;
  taskDefinitionId?: string;
  constraintType: 'time' | 'skill' | 'material' | 'tool' | 'space';
  severity: number; // 0-1
  description: string;
  suggestedActions: string[];
}

export interface QAResult {
  id: string;
  itemId: string;
  versionId: string;
  passed: boolean;
  defects: string[];
  severityIndex: number;
  inspectorIds: string[];
  timestamp: Date;
}

export type COSEventType = 'labor' | 'material' | 'qa' | 'distribution' | 'coordination' | 'constraint';

// ============================================================================
// FRS — FEEDBACK & REVIEW SYSTEM
// ============================================================================

export interface Metric {
  name: string;
  value: number;
  unit: string;
  quality: number; // 0-1 confidence
}

export interface SemanticTag {
  key: string;
  value: string;
}

export interface SignalEnvelope {
  id: string;
  source: 'COS' | 'OAD' | 'ITC' | 'CDS' | 'ECO' | 'FED';
  domain: string;
  nodeId: string;
  federationId: string;
  createdAt: Date;
  observedAt: Date;
  tags: SemanticTag[];
  metrics: Metric[];
  prevHash?: string;
  entryHash?: string;
}

export interface SignalPacket {
  id: string;
  nodeId: string;
  timeWindowStart: Date;
  timeWindowEnd: Date;
  envelopes: SignalEnvelope[];
  qualityScore: number;
  packetVersion: string;
  packetHash: string;
}

export type FindingType =
  | 'ecological_overshoot'
  | 'labor_stress'
  | 'material_dependency'
  | 'design_friction'
  | 'valuation_drift'
  | 'governance_load'
  | 'coordination_fragility';

export interface DiagnosticFinding {
  id: string;
  nodeId: string;
  createdAt: Date;
  findingType: FindingType;
  severity: Severity;
  confidence: Confidence;
  persistence: Persistence;
  scope: Scope;
  indicators: Record<string, number>;
  evidenceRefs: string[];
  summary: string;
  rationale: string;
}

export interface Recommendation {
  id: string;
  nodeId: string;
  createdAt: Date;
  targetSystem: TargetSystem;
  recommendationType: string;
  severity: Severity;
  confidence: Confidence;
  relatedFindings: string[];
  payload: Record<string, unknown>;
  summary: string;
  rationale: string;
}

export interface MemoryRecord {
  id: string;
  nodeId: string;
  createdAt: Date;
  recordType: 'baseline' | 'incident' | 'intervention' | 'outcome' | 'lesson';
  title: string;
  tags: SemanticTag[];
  evidenceRefs: string[];
  narrative: string;
  quantifiedOutcomes: Record<string, number>;
}

export interface FederatedExchangeMessage {
  id: string;
  messageType: 'stress_signature' | 'best_practice' | 'design_success' | 'early_warning' | 'model_template';
  createdAt: Date;
  fromNodeId: string;
  toScope: 'regional' | 'federation' | 'targeted_nodes';
  payload: Record<string, unknown>;
  summary: string;
}

// ============================================================================
// CROSS-SYSTEM SIGNAL TYPES
// ============================================================================

export interface COSWorkloadSignal {
  nodeId: string;
  planId: string;
  laborBySkill: Record<SkillTier, number>;
  materialScarcityIndex: number;
  throughputConstraints: string[];
  timestamp: Date;
}

export interface FRSValuationSignal {
  nodeId: string;
  versionId: string;
  longevityCorrection: number;
  scarcityAmplifier: number;
  ecologicalStressIndex: number;
  fairnessFlags: string[];
  timestamp: Date;
}

export interface OADConstraintSignal {
  planId: string;
  nodeId: string;
  taskDefinitionId: string;
  deviationRatio: number;
  description: string;
}

export interface FRSDesignFeedback {
  versionId: string;
  actualLifespanVsProjected: number;
  actualMaintenanceVsProjected: number;
  failureModesObserved: string[];
  ecologicalImpactObserved: number;
}

export interface PolicyReviewRequest {
  source: 'COS' | 'FRS' | 'ITC';
  nodeId: string;
  policyArea: string;
  rationale: string;
  proposedAdjustments: Record<string, unknown>;
  urgency: 'routine' | 'elevated' | 'urgent';
}

// ============================================================================
// LEDGER TYPES (HASH-CHAINED)
// ============================================================================

export interface LedgerEntry {
  id: string;
  timestamp: Date;
  entryType: string;
  nodeId: string;
  memberId?: string;
  relatedIds: Record<string, string>;
  details: Record<string, unknown>;
  prevHash: string;
  entryHash: string;
}

// ============================================================================
// NOSTR INTEGRATION TYPES
// ============================================================================

export interface NostrIdentity {
  publicKey: string;
  privateKey?: string;
  nodeId: string;
  createdAt: Date;
}

export interface NostrEventKinds {
  ISSUE: 30100;
  SUBMISSION: 30101;
  VOTE: 30102;
  DECISION: 30103;
  DESIGN_SPEC: 30200;
  DESIGN_VERSION: 30201;
  LABOR_EVENT: 30300;
  ITC_TRANSFER: 30301;
  TASK_INSTANCE: 30400;
  PRODUCTION_PLAN: 30401;
  SIGNAL: 30500;
  FINDING: 30501;
  RECOMMENDATION: 30502;
  FEDERATION_MESSAGE: 30600;
}

export const NOSTR_EVENT_KINDS: NostrEventKinds = {
  ISSUE: 30100,
  SUBMISSION: 30101,
  VOTE: 30102,
  DECISION: 30103,
  DESIGN_SPEC: 30200,
  DESIGN_VERSION: 30201,
  LABOR_EVENT: 30300,
  ITC_TRANSFER: 30301,
  TASK_INSTANCE: 30400,
  PRODUCTION_PLAN: 30401,
  SIGNAL: 30500,
  FINDING: 30501,
  RECOMMENDATION: 30502,
  FEDERATION_MESSAGE: 30600,
};
