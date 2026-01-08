/**
 * COS — COOPERATIVE ORGANIZATION SYSTEM
 * Production coordination & workflow management with 9 modules
 *
 * Modules:
 * 1. Production Planning & Work Breakdown
 * 2. Labor Organization & Skill-Matching
 * 3. Resource Procurement & Materials Management
 * 4. Cooperative Workflow Execution
 * 5. Capacity, Throughput & Constraint Balancing
 * 6. Distribution & Access Flow Coordination
 * 7. Quality Assurance & Safety Verification
 * 8. Cooperative Coordination & Inter-Coop Integration
 * 9. Transparency, Ledger & Audit
 */

import type {
  COSTaskDefinition,
  COSTaskInstance,
  COSProductionPlan,
  MaterialLedgerEntry,
  COSConstraint,
  QAResult,
  COSEventType,
  LedgerEntry,
  SkillTier,
  TaskStatus,
  MaterialFlowSource,
  LaborProfile,
  COSWorkloadSignal,
} from '../../types/index.js';

import {
  generateId,
  createLedgerEntry,
  GENESIS_HASH,
  clamp,
  TypedEventEmitter,
} from '../../utils/index.js';

// ============================================================================
// COS CONFIGURATION
// ============================================================================

export interface COSConfig {
  nodeId: string;
  bottleneckSeverityThreshold: number; // Default: 0.15
  deviationWeight: number; // Default: 0.6
  blockingWeight: number; // Default: 0.4
}

export const DEFAULT_COS_CONFIG: COSConfig = {
  nodeId: 'default',
  bottleneckSeverityThreshold: 0.15,
  deviationWeight: 0.6,
  blockingWeight: 0.4,
};

// ============================================================================
// COS EVENTS
// ============================================================================

interface COSEvents {
  'plan:created': [COSProductionPlan];
  'task:created': [COSTaskInstance];
  'task:updated': [COSTaskInstance];
  'task:completed': [COSTaskInstance];
  'material:flow': [MaterialLedgerEntry];
  'constraint:detected': [COSConstraint];
  'qa:completed': [QAResult];
  'ledger:entry': [LedgerEntry];
}

// ============================================================================
// COS STORAGE INTERFACE
// ============================================================================

export interface COSStorage {
  // Production Plans
  getPlan(planId: string): Promise<COSProductionPlan | null>;
  savePlan(plan: COSProductionPlan): Promise<void>;
  listPlans(nodeId?: string): Promise<COSProductionPlan[]>;

  // Task Definitions
  getTaskDefinition(id: string): Promise<COSTaskDefinition | null>;
  saveTaskDefinition(def: COSTaskDefinition): Promise<void>;

  // Task Instances
  getTaskInstance(id: string): Promise<COSTaskInstance | null>;
  saveTaskInstance(instance: COSTaskInstance): Promise<void>;
  listTaskInstances(planId: string): Promise<COSTaskInstance[]>;

  // Material Ledger
  saveMaterialEntry(entry: MaterialLedgerEntry): Promise<void>;
  listMaterialEntries(planId: string): Promise<MaterialLedgerEntry[]>;

  // Constraints
  saveConstraint(constraint: COSConstraint): Promise<void>;
  listConstraints(planId: string): Promise<COSConstraint[]>;

  // QA Results
  saveQAResult(result: QAResult): Promise<void>;
  listQAResults(planId: string): Promise<QAResult[]>;

  // Ledger
  getLastLedgerEntry(): Promise<LedgerEntry | null>;
  saveLedgerEntry(entry: LedgerEntry): Promise<void>;
  getLedgerEntries(limit?: number): Promise<LedgerEntry[]>;
}

// ============================================================================
// IN-MEMORY STORAGE IMPLEMENTATION
// ============================================================================

export class InMemoryCOSStorage implements COSStorage {
  private plans: Map<string, COSProductionPlan> = new Map();
  private taskDefinitions: Map<string, COSTaskDefinition> = new Map();
  private taskInstances: Map<string, COSTaskInstance> = new Map();
  private materialEntries: MaterialLedgerEntry[] = [];
  private constraints: COSConstraint[] = [];
  private qaResults: QAResult[] = [];
  private ledger: LedgerEntry[] = [];

  async getPlan(planId: string): Promise<COSProductionPlan | null> {
    return this.plans.get(planId) ?? null;
  }

  async savePlan(plan: COSProductionPlan): Promise<void> {
    this.plans.set(plan.planId, plan);
  }

  async listPlans(nodeId?: string): Promise<COSProductionPlan[]> {
    const plans = Array.from(this.plans.values());
    return nodeId ? plans.filter((p) => p.nodeId === nodeId) : plans;
  }

  async getTaskDefinition(id: string): Promise<COSTaskDefinition | null> {
    return this.taskDefinitions.get(id) ?? null;
  }

  async saveTaskDefinition(def: COSTaskDefinition): Promise<void> {
    this.taskDefinitions.set(def.id, def);
  }

  async getTaskInstance(id: string): Promise<COSTaskInstance | null> {
    return this.taskInstances.get(id) ?? null;
  }

  async saveTaskInstance(instance: COSTaskInstance): Promise<void> {
    this.taskInstances.set(instance.id, instance);
  }

  async listTaskInstances(planId: string): Promise<COSTaskInstance[]> {
    return Array.from(this.taskInstances.values()).filter(
      (t) => t.batchId === planId
    );
  }

  async saveMaterialEntry(entry: MaterialLedgerEntry): Promise<void> {
    this.materialEntries.push(entry);
  }

  async listMaterialEntries(planId: string): Promise<MaterialLedgerEntry[]> {
    return this.materialEntries.filter((e) => e.planId === planId);
  }

  async saveConstraint(constraint: COSConstraint): Promise<void> {
    this.constraints.push(constraint);
  }

  async listConstraints(planId: string): Promise<COSConstraint[]> {
    return this.constraints.filter((c) => c.planId === planId);
  }

  async saveQAResult(result: QAResult): Promise<void> {
    this.qaResults.push(result);
  }

  async listQAResults(planId: string): Promise<QAResult[]> {
    return this.qaResults.filter((r) => {
      const instance = this.taskInstances.get(r.itemId);
      return instance?.batchId === planId;
    });
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
// COS MAIN CLASS
// ============================================================================

export class CooperativeOrganizationSystem extends TypedEventEmitter<COSEvents> {
  private config: COSConfig;
  private storage: COSStorage;

  constructor(config: Partial<COSConfig> = {}, storage?: COSStorage) {
    super();
    this.config = { ...DEFAULT_COS_CONFIG, ...config };
    this.storage = storage ?? new InMemoryCOSStorage();
  }

  // ==========================================================================
  // MODULE 1: Production Planning & Work Breakdown
  // ==========================================================================

  /**
   * Create a production plan from OAD labor profile
   */
  async createProductionPlan(
    versionId: string,
    laborProfile: LaborProfile,
    batchSize: number,
    expectedMaterialsKg: Record<string, number> = {}
  ): Promise<COSProductionPlan> {
    const planId = generateId('plan');
    const batchId = generateId('batch');

    // Create task definitions from labor profile
    const tasks: Record<string, COSTaskDefinition> = {};
    const taskInstances: Record<string, COSTaskInstance> = {};

    for (const step of laborProfile.productionSteps) {
      const taskDef: COSTaskDefinition = {
        id: step.stepId,
        versionId,
        name: step.name,
        description: `Production step: ${step.name}`,
        skillTier: step.skillTier,
        estimatedHoursPerUnit: step.estimatedHours,
        requiredTools: step.requiredTools,
        requiredWorkspaces: [],
        requiredMaterialsKg: {},
        processEii: 0,
        predecessors: step.predecessors,
      };
      tasks[taskDef.id] = taskDef;
      await this.storage.saveTaskDefinition(taskDef);

      // Create instances for batch
      for (let i = 0; i < batchSize; i++) {
        const instance: COSTaskInstance = {
          id: generateId('task'),
          definitionId: taskDef.id,
          batchId,
          nodeId: this.config.nodeId,
          assignedCoopId: '',
          status: 'pending',
          actualHours: 0,
          participants: [],
          blockReasons: [],
        };
        taskInstances[instance.id] = instance;
        await this.storage.saveTaskInstance(instance);
      }
    }

    // Calculate expected labor hours by skill
    const expectedLaborHoursBySkill: Record<SkillTier, number> = {
      low: 0,
      medium: 0,
      high: 0,
      expert: 0,
    };
    for (const step of laborProfile.productionSteps) {
      expectedLaborHoursBySkill[step.skillTier] += step.estimatedHours * batchSize;
    }

    // Estimate cycle time (critical path)
    const expectedCycleTimeHours = this.estimateCycleTime(laborProfile.productionSteps);

    const plan: COSProductionPlan = {
      planId,
      nodeId: this.config.nodeId,
      versionId,
      batchId,
      batchSize,
      createdAt: new Date(),
      tasks,
      taskInstances,
      expectedLaborHoursBySkill,
      expectedMaterialsKg,
      expectedCycleTimeHours,
      predictedBottlenecks: [],
    };

    await this.storage.savePlan(plan);
    await this.appendToLedger('plan_created', { planId, versionId, batchSize });

    this.emit('plan:created', plan);
    return plan;
  }

  private estimateCycleTime(steps: LaborProfile['productionSteps']): number {
    // Simple critical path estimation
    const stepMap = new Map(steps.map((s) => [s.stepId, s]));
    const memo = new Map<string, number>();

    const getCriticalPath = (stepId: string): number => {
      if (memo.has(stepId)) return memo.get(stepId)!;

      const step = stepMap.get(stepId);
      if (!step) return 0;

      let maxPredecessorTime = 0;
      for (const predId of step.predecessors) {
        maxPredecessorTime = Math.max(maxPredecessorTime, getCriticalPath(predId));
      }

      const totalTime = maxPredecessorTime + step.estimatedHours;
      memo.set(stepId, totalTime);
      return totalTime;
    };

    let maxTime = 0;
    for (const step of steps) {
      maxTime = Math.max(maxTime, getCriticalPath(step.stepId));
    }

    return maxTime;
  }

  // ==========================================================================
  // MODULE 2: Labor Organization & Skill-Matching
  // ==========================================================================

  /**
   * Assign a task instance to a cooperative/member
   */
  async assignTask(
    instanceId: string,
    coopId: string,
    participantIds: string[],
    scheduledStart?: Date,
    scheduledEnd?: Date
  ): Promise<COSTaskInstance> {
    const instance = await this.storage.getTaskInstance(instanceId);
    if (!instance) {
      throw new Error(`Task instance ${instanceId} not found`);
    }

    instance.assignedCoopId = coopId;
    instance.participants = participantIds;
    instance.scheduledStart = scheduledStart;
    instance.scheduledEnd = scheduledEnd;

    await this.storage.saveTaskInstance(instance);
    await this.appendToLedger('task_assigned', {
      instanceId,
      coopId,
      participantIds,
    });

    this.emit('task:updated', instance);
    return instance;
  }

  /**
   * Get skill-matched task recommendations
   */
  async getSkillMatchedTasks(
    memberId: string,
    skillTier: SkillTier,
    planId: string
  ): Promise<COSTaskInstance[]> {
    const plan = await this.storage.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const matchedTasks: COSTaskInstance[] = [];

    for (const instance of Object.values(plan.taskInstances)) {
      if (instance.status !== 'pending') continue;
      if (instance.assignedCoopId) continue;

      const def = plan.tasks[instance.definitionId];
      if (def && def.skillTier === skillTier) {
        matchedTasks.push(instance);
      }
    }

    return matchedTasks;
  }

  // ==========================================================================
  // MODULE 3: Resource Procurement & Materials Management
  // ==========================================================================

  /**
   * Record material flow
   */
  async recordMaterialFlow(
    planId: string,
    materialId: string,
    quantityKg: number,
    direction: MaterialFlowSource,
    ecologicalImpactIndex: number = 0,
    taskInstanceId?: string
  ): Promise<MaterialLedgerEntry> {
    const entry: MaterialLedgerEntry = {
      id: generateId('mat'),
      materialId,
      quantityKg,
      direction,
      ecologicalImpactIndex,
      timestamp: new Date(),
      planId,
      taskInstanceId,
    };

    await this.storage.saveMaterialEntry(entry);
    await this.appendToLedger('material_flow', { entry });

    this.emit('material:flow', entry);
    return entry;
  }

  /**
   * Get material inventory for a plan
   */
  async getMaterialInventory(
    planId: string
  ): Promise<Record<string, number>> {
    const entries = await this.storage.listMaterialEntries(planId);
    const inventory: Record<string, number> = {};

    for (const entry of entries) {
      if (!inventory[entry.materialId]) {
        inventory[entry.materialId] = 0;
      }

      switch (entry.direction) {
        case 'internal_recycle':
        case 'external_procurement':
          inventory[entry.materialId] += entry.quantityKg;
          break;
        case 'production_use':
        case 'loss_scrap':
          inventory[entry.materialId] -= entry.quantityKg;
          break;
      }
    }

    return inventory;
  }

  // ==========================================================================
  // MODULE 4: Cooperative Workflow Execution
  // ==========================================================================

  /**
   * Start a task
   */
  async startTask(instanceId: string): Promise<COSTaskInstance> {
    const instance = await this.storage.getTaskInstance(instanceId);
    if (!instance) {
      throw new Error(`Task instance ${instanceId} not found`);
    }

    instance.status = 'in_progress';
    instance.actualStart = new Date();

    await this.storage.saveTaskInstance(instance);
    await this.appendToLedger('task_started', { instanceId });

    this.emit('task:updated', instance);
    return instance;
  }

  /**
   * Block a task
   */
  async blockTask(instanceId: string, reason: string): Promise<COSTaskInstance> {
    const instance = await this.storage.getTaskInstance(instanceId);
    if (!instance) {
      throw new Error(`Task instance ${instanceId} not found`);
    }

    instance.status = 'blocked';
    instance.blockReasons.push(reason);

    await this.storage.saveTaskInstance(instance);
    await this.appendToLedger('task_blocked', { instanceId, reason });

    this.emit('task:updated', instance);
    return instance;
  }

  /**
   * Complete a task
   */
  async completeTask(
    instanceId: string,
    actualHours: number
  ): Promise<COSTaskInstance> {
    const instance = await this.storage.getTaskInstance(instanceId);
    if (!instance) {
      throw new Error(`Task instance ${instanceId} not found`);
    }

    instance.status = 'done';
    instance.actualEnd = new Date();
    instance.actualHours = actualHours;

    await this.storage.saveTaskInstance(instance);
    await this.appendToLedger('task_completed', { instanceId, actualHours });

    this.emit('task:completed', instance);
    return instance;
  }

  // ==========================================================================
  // MODULE 5: Capacity, Throughput & Constraint Balancing
  // ==========================================================================

  /**
   * Detect bottlenecks in a production plan
   * Deviation ratio: D_k = (actual_hours - estimated_hours) / estimated_hours
   * Blocked ratio: B_k = blocked_instances / total_instances
   * Severity: S_k = α × max(0, D_k) + β × B_k
   */
  async detectBottlenecks(planId: string): Promise<COSConstraint[]> {
    const plan = await this.storage.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const constraints: COSConstraint[] = [];
    const alpha = this.config.deviationWeight;
    const beta = this.config.blockingWeight;

    for (const [defId, definition] of Object.entries(plan.tasks)) {
      const instances = Object.values(plan.taskInstances).filter(
        (inst) => inst.definitionId === defId
      );

      if (instances.length === 0) continue;

      // Calculate metrics
      const totalEstimated = instances.length * definition.estimatedHoursPerUnit;
      const totalActual = instances.reduce((sum, inst) => sum + inst.actualHours, 0);
      const blockedCount = instances.filter((inst) => inst.status === 'blocked').length;

      const deviationRatio = totalEstimated > 0
        ? (totalActual - totalEstimated) / totalEstimated
        : 0;
      const blockedRatio = blockedCount / instances.length;

      // Severity calculation
      const severity = alpha * Math.max(0, deviationRatio) + beta * blockedRatio;

      if (severity > this.config.bottleneckSeverityThreshold) {
        const constraint: COSConstraint = {
          planId,
          nodeId: this.config.nodeId,
          taskDefinitionId: defId,
          constraintType: 'time',
          severity: Math.min(1.0, severity),
          description: `Task ${defId}: deviation=${(deviationRatio * 100).toFixed(1)}%, blocked=${(blockedRatio * 100).toFixed(1)}%`,
          suggestedActions: ['investigate cause', 'consider redesign or training'],
        };

        constraints.push(constraint);
        await this.storage.saveConstraint(constraint);

        this.emit('constraint:detected', constraint);
      }
    }

    await this.appendToLedger('bottlenecks_detected', {
      planId,
      constraintCount: constraints.length,
    });

    return constraints;
  }

  /**
   * Generate workload signal for ITC
   */
  async generateWorkloadSignal(planId: string): Promise<COSWorkloadSignal> {
    const plan = await this.storage.getPlan(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }

    const constraints = await this.storage.listConstraints(planId);

    // Calculate actual labor by skill
    const laborBySkill: Record<SkillTier, number> = {
      low: 0,
      medium: 0,
      high: 0,
      expert: 0,
    };

    for (const instance of Object.values(plan.taskInstances)) {
      const def = plan.tasks[instance.definitionId];
      if (def) {
        laborBySkill[def.skillTier] += instance.actualHours || def.estimatedHoursPerUnit;
      }
    }

    // Calculate material scarcity index
    const inventory = await this.getMaterialInventory(planId);
    let scarcityIndex = 0;
    for (const [material, qty] of Object.entries(plan.expectedMaterialsKg)) {
      const available = inventory[material] ?? 0;
      if (qty > 0 && available < qty) {
        scarcityIndex += (qty - available) / qty;
      }
    }
    scarcityIndex = Math.min(1, scarcityIndex / Object.keys(plan.expectedMaterialsKg).length || 0);

    return {
      nodeId: this.config.nodeId,
      planId,
      laborBySkill,
      materialScarcityIndex: scarcityIndex,
      throughputConstraints: constraints.map((c) => c.description),
      timestamp: new Date(),
    };
  }

  // ==========================================================================
  // MODULE 6: Distribution & Access Flow Coordination
  // ==========================================================================

  /**
   * Mark items ready for distribution
   */
  async markReadyForDistribution(
    planId: string,
    itemIds: string[]
  ): Promise<void> {
    await this.appendToLedger('items_ready_for_distribution', {
      planId,
      itemIds,
      timestamp: new Date(),
    });
  }

  // ==========================================================================
  // MODULE 7: Quality Assurance & Safety Verification
  // ==========================================================================

  /**
   * Record QA result
   */
  async recordQAResult(
    itemId: string,
    versionId: string,
    passed: boolean,
    inspectorIds: string[],
    defects: string[] = [],
    severityIndex: number = 0
  ): Promise<QAResult> {
    const result: QAResult = {
      id: generateId('qa'),
      itemId,
      versionId,
      passed,
      defects,
      severityIndex,
      inspectorIds,
      timestamp: new Date(),
    };

    await this.storage.saveQAResult(result);
    await this.appendToLedger('qa_completed', { result });

    this.emit('qa:completed', result);
    return result;
  }

  /**
   * Get QA statistics for a plan
   */
  async getQAStats(planId: string): Promise<{
    totalInspected: number;
    passRate: number;
    commonDefects: string[];
  }> {
    const results = await this.storage.listQAResults(planId);
    const totalInspected = results.length;
    const passed = results.filter((r) => r.passed).length;
    const passRate = totalInspected > 0 ? passed / totalInspected : 0;

    const defectCounts: Record<string, number> = {};
    for (const result of results) {
      for (const defect of result.defects) {
        defectCounts[defect] = (defectCounts[defect] ?? 0) + 1;
      }
    }

    const commonDefects = Object.entries(defectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([defect]) => defect);

    return { totalInspected, passRate, commonDefects };
  }

  // ==========================================================================
  // MODULE 8: Cooperative Coordination & Inter-Coop Integration
  // ==========================================================================

  /**
   * Request assistance from another cooperative
   */
  async requestCoopAssistance(
    planId: string,
    requestingCoopId: string,
    targetCoopId: string,
    skillTier: SkillTier,
    hoursNeeded: number
  ): Promise<void> {
    await this.appendToLedger('coop_assistance_requested', {
      planId,
      requestingCoopId,
      targetCoopId,
      skillTier,
      hoursNeeded,
      timestamp: new Date(),
    });
  }

  // ==========================================================================
  // MODULE 9: Transparency, Ledger & Audit
  // ==========================================================================

  private async appendToLedger(
    entryType: string,
    details: Record<string, unknown>
  ): Promise<LedgerEntry> {
    const lastEntry = await this.storage.getLastLedgerEntry();
    const prevHash = lastEntry?.entryHash ?? GENESIS_HASH;

    const entry = createLedgerEntry(
      `cos.${entryType}`,
      this.config.nodeId,
      details,
      prevHash
    );

    await this.storage.saveLedgerEntry(entry);
    this.emit('ledger:entry', entry);

    return entry;
  }

  /**
   * Get plan execution history
   */
  async getPlanHistory(planId: string): Promise<LedgerEntry[]> {
    const entries = await this.storage.getLedgerEntries();
    return entries.filter((e) => {
      const details = e.details as Record<string, unknown>;
      return details.planId === planId;
    });
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  async getPlan(planId: string): Promise<COSProductionPlan | null> {
    return this.storage.getPlan(planId);
  }

  async getTaskInstance(instanceId: string): Promise<COSTaskInstance | null> {
    return this.storage.getTaskInstance(instanceId);
  }

  getConfig(): COSConfig {
    return { ...this.config };
  }
}

export default CooperativeOrganizationSystem;
