/**
 * OAD — OPEN ACCESS DESIGN
 * Collective engineering & design intelligence with 10 modules
 *
 * Modules:
 * 1. Design Submission & Structured Specification
 * 2. Collaborative Design Workspace
 * 3. Material & Ecological Coefficient Engine
 * 4. Lifecycle & Maintainability Modeling
 * 5. Feasibility & Constraint Simulation
 * 6. Skill & Labor-Step Decomposition
 * 7. Systems Integration & Architectural Coordination
 * 8. Optimization & Efficiency Engine
 * 9. Validation, Certification & Release Manager
 * 10. Knowledge Commons & Reuse Repository
 */

import type {
  DesignSpec,
  DesignVersion,
  MaterialProfile,
  EcoAssessment,
  LifecycleModel,
  LaborProfile,
  SimulationResult,
  IntegrationCheck,
  CertificationRecord,
  OADValuationProfile,
  LedgerEntry,
  SkillTier,
} from '../../types/index.js';

import {
  generateId,
  createLedgerEntry,
  GENESIS_HASH,
  clamp,
  TypedEventEmitter,
  DEFAULT_SKILL_WEIGHTS,
} from '../../utils/index.js';

// ============================================================================
// OAD CONFIGURATION
// ============================================================================

export interface OADConfig {
  nodeId: string;
  ecoThreshold: number; // Default: 0.5 (max eco_score for certification)
  minFeasibility: number; // Default: 0.7
  minIntegrationScore: number; // Default: 0.6
  ecoWeights: {
    energy: number;
    carbon: number;
    toxicity: number;
    recyclability: number;
    water: number;
    land: number;
    repairability: number;
  };
}

export const DEFAULT_OAD_CONFIG: OADConfig = {
  nodeId: 'default',
  ecoThreshold: 0.5,
  minFeasibility: 0.7,
  minIntegrationScore: 0.6,
  ecoWeights: {
    energy: 0.20,
    carbon: 0.20,
    toxicity: 0.15,
    recyclability: 0.15,
    water: 0.10,
    land: 0.10,
    repairability: 0.10,
  },
};

// ============================================================================
// OAD EVENTS
// ============================================================================

interface OADEvents {
  'spec:created': [DesignSpec];
  'version:created': [DesignVersion];
  'version:updated': [DesignVersion];
  'eco:assessed': [EcoAssessment];
  'simulation:completed': [SimulationResult];
  'certification:issued': [CertificationRecord];
  'ledger:entry': [LedgerEntry];
}

// ============================================================================
// OAD STORAGE INTERFACE
// ============================================================================

export interface OADStorage {
  // Design Specs
  getSpec(id: string): Promise<DesignSpec | null>;
  saveSpec(spec: DesignSpec): Promise<void>;
  listSpecs(nodeId?: string): Promise<DesignSpec[]>;

  // Design Versions
  getVersion(id: string): Promise<DesignVersion | null>;
  saveVersion(version: DesignVersion): Promise<void>;
  listVersions(specId: string): Promise<DesignVersion[]>;

  // Material Profiles
  getMaterialProfile(versionId: string): Promise<MaterialProfile | null>;
  saveMaterialProfile(profile: MaterialProfile): Promise<void>;

  // Eco Assessments
  getEcoAssessment(versionId: string): Promise<EcoAssessment | null>;
  saveEcoAssessment(assessment: EcoAssessment): Promise<void>;

  // Lifecycle Models
  getLifecycleModel(versionId: string): Promise<LifecycleModel | null>;
  saveLifecycleModel(model: LifecycleModel): Promise<void>;

  // Labor Profiles
  getLaborProfile(versionId: string): Promise<LaborProfile | null>;
  saveLaborProfile(profile: LaborProfile): Promise<void>;

  // Simulation Results
  getSimulationResults(versionId: string): Promise<SimulationResult[]>;
  saveSimulationResult(result: SimulationResult): Promise<void>;

  // Integration Checks
  getIntegrationCheck(versionId: string): Promise<IntegrationCheck | null>;
  saveIntegrationCheck(check: IntegrationCheck): Promise<void>;

  // Certifications
  getCertification(versionId: string): Promise<CertificationRecord | null>;
  saveCertification(cert: CertificationRecord): Promise<void>;

  // Ledger
  getLastLedgerEntry(): Promise<LedgerEntry | null>;
  saveLedgerEntry(entry: LedgerEntry): Promise<void>;
}

// ============================================================================
// IN-MEMORY STORAGE IMPLEMENTATION
// ============================================================================

export class InMemoryOADStorage implements OADStorage {
  private specs: Map<string, DesignSpec> = new Map();
  private versions: Map<string, DesignVersion> = new Map();
  private materialProfiles: Map<string, MaterialProfile> = new Map();
  private ecoAssessments: Map<string, EcoAssessment> = new Map();
  private lifecycleModels: Map<string, LifecycleModel> = new Map();
  private laborProfiles: Map<string, LaborProfile> = new Map();
  private simulationResults: Map<string, SimulationResult[]> = new Map();
  private integrationChecks: Map<string, IntegrationCheck> = new Map();
  private certifications: Map<string, CertificationRecord> = new Map();
  private ledger: LedgerEntry[] = [];

  async getSpec(id: string): Promise<DesignSpec | null> {
    return this.specs.get(id) ?? null;
  }

  async saveSpec(spec: DesignSpec): Promise<void> {
    this.specs.set(spec.id, spec);
  }

  async listSpecs(nodeId?: string): Promise<DesignSpec[]> {
    const specs = Array.from(this.specs.values());
    return nodeId ? specs.filter((s) => s.nodeId === nodeId) : specs;
  }

  async getVersion(id: string): Promise<DesignVersion | null> {
    return this.versions.get(id) ?? null;
  }

  async saveVersion(version: DesignVersion): Promise<void> {
    this.versions.set(version.id, version);
  }

  async listVersions(specId: string): Promise<DesignVersion[]> {
    return Array.from(this.versions.values()).filter((v) => v.specId === specId);
  }

  async getMaterialProfile(versionId: string): Promise<MaterialProfile | null> {
    return this.materialProfiles.get(versionId) ?? null;
  }

  async saveMaterialProfile(profile: MaterialProfile): Promise<void> {
    this.materialProfiles.set(profile.versionId, profile);
  }

  async getEcoAssessment(versionId: string): Promise<EcoAssessment | null> {
    return this.ecoAssessments.get(versionId) ?? null;
  }

  async saveEcoAssessment(assessment: EcoAssessment): Promise<void> {
    this.ecoAssessments.set(assessment.versionId, assessment);
  }

  async getLifecycleModel(versionId: string): Promise<LifecycleModel | null> {
    return this.lifecycleModels.get(versionId) ?? null;
  }

  async saveLifecycleModel(model: LifecycleModel): Promise<void> {
    this.lifecycleModels.set(model.versionId, model);
  }

  async getLaborProfile(versionId: string): Promise<LaborProfile | null> {
    return this.laborProfiles.get(versionId) ?? null;
  }

  async saveLaborProfile(profile: LaborProfile): Promise<void> {
    this.laborProfiles.set(profile.versionId, profile);
  }

  async getSimulationResults(versionId: string): Promise<SimulationResult[]> {
    return this.simulationResults.get(versionId) ?? [];
  }

  async saveSimulationResult(result: SimulationResult): Promise<void> {
    const results = this.simulationResults.get(result.versionId) ?? [];
    results.push(result);
    this.simulationResults.set(result.versionId, results);
  }

  async getIntegrationCheck(versionId: string): Promise<IntegrationCheck | null> {
    return this.integrationChecks.get(versionId) ?? null;
  }

  async saveIntegrationCheck(check: IntegrationCheck): Promise<void> {
    this.integrationChecks.set(check.versionId, check);
  }

  async getCertification(versionId: string): Promise<CertificationRecord | null> {
    return this.certifications.get(versionId) ?? null;
  }

  async saveCertification(cert: CertificationRecord): Promise<void> {
    this.certifications.set(cert.versionId, cert);
  }

  async getLastLedgerEntry(): Promise<LedgerEntry | null> {
    return this.ledger.length > 0 ? this.ledger[this.ledger.length - 1] : null;
  }

  async saveLedgerEntry(entry: LedgerEntry): Promise<void> {
    this.ledger.push(entry);
  }
}

// ============================================================================
// OAD MAIN CLASS
// ============================================================================

export class OpenAccessDesign extends TypedEventEmitter<OADEvents> {
  private config: OADConfig;
  private storage: OADStorage;

  constructor(config: Partial<OADConfig> = {}, storage?: OADStorage) {
    super();
    this.config = { ...DEFAULT_OAD_CONFIG, ...config };
    this.storage = storage ?? new InMemoryOADStorage();
  }

  // ==========================================================================
  // MODULE 1: Design Submission & Structured Specification
  // ==========================================================================

  /**
   * Create a new design specification
   */
  async createSpec(
    purpose: string,
    functionalRequirements: string[],
    constraints: Record<string, unknown> = {},
    metadata: Record<string, unknown> = {}
  ): Promise<DesignSpec> {
    const spec: DesignSpec = {
      id: generateId('spec'),
      nodeId: this.config.nodeId,
      purpose,
      functionalRequirements,
      constraints,
      createdAt: new Date(),
      metadata,
    };

    await this.storage.saveSpec(spec);
    await this.appendToLedger('spec_created', { spec });

    this.emit('spec:created', spec);
    return spec;
  }

  // ==========================================================================
  // MODULE 2: Collaborative Design Workspace
  // ==========================================================================

  /**
   * Create a new design version
   */
  async createVersion(
    specId: string,
    label: string,
    authors: string[],
    parameters: Record<string, unknown>,
    parentVersionId?: string
  ): Promise<DesignVersion> {
    const spec = await this.storage.getSpec(specId);
    if (!spec) {
      throw new Error(`Spec ${specId} not found`);
    }

    const version: DesignVersion = {
      id: generateId('ver'),
      specId,
      parentVersionId,
      label,
      createdAt: new Date(),
      authors,
      cadFiles: [],
      materials: [],
      parameters,
      changeLog: parentVersionId ? `Updated from ${parentVersionId}` : 'Initial version',
      status: 'draft',
    };

    // Mark parent as superseded if exists
    if (parentVersionId) {
      const parent = await this.storage.getVersion(parentVersionId);
      if (parent) {
        parent.supersededByVersionId = version.id;
        await this.storage.saveVersion(parent);
      }
    }

    await this.storage.saveVersion(version);
    await this.appendToLedger('version_created', { version });

    this.emit('version:created', version);
    return version;
  }

  /**
   * Update a draft version
   */
  async updateVersion(
    versionId: string,
    updates: Partial<Pick<DesignVersion, 'label' | 'parameters' | 'cadFiles' | 'materials' | 'changeLog'>>
  ): Promise<DesignVersion> {
    const version = await this.storage.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }
    if (version.status !== 'draft') {
      throw new Error(`Cannot update non-draft version`);
    }

    Object.assign(version, updates);
    await this.storage.saveVersion(version);
    await this.appendToLedger('version_updated', { versionId, updates });

    this.emit('version:updated', version);
    return version;
  }

  // ==========================================================================
  // MODULE 3: Material & Ecological Coefficient Engine
  // ==========================================================================

  /**
   * Create material profile for a version
   */
  async createMaterialProfile(
    versionId: string,
    materials: string[],
    data: {
      quantitiesKg: Record<string, number>;
      embodiedEnergyMj: Record<string, number>;
      carbonKgCo2Eq: Record<string, number>;
      toxicityIndex: Record<string, number>;
      recyclabilityIndex: Record<string, number>;
      waterUseL: Record<string, number>;
      landUseM2: Record<string, number>;
    }
  ): Promise<MaterialProfile> {
    const profile: MaterialProfile = {
      versionId,
      materials,
      ...data,
    };

    await this.storage.saveMaterialProfile(profile);
    await this.appendToLedger('material_profile_created', { versionId });

    return profile;
  }

  /**
   * Compute ecological assessment score
   * eco_score = weighted combination where higher energy/carbon/toxicity/water/land
   * are worse, while higher recyclability and repairability are better.
   */
  async computeEcoAssessment(
    versionId: string,
    repairabilityNorm: number = 0.5
  ): Promise<EcoAssessment> {
    const profile = await this.storage.getMaterialProfile(versionId);
    if (!profile) {
      throw new Error(`Material profile for ${versionId} not found`);
    }

    // Compute normalized values (assumes reference values for normalization)
    const totalEnergy = Object.values(profile.embodiedEnergyMj).reduce((a, b) => a + b, 0);
    const totalCarbon = Object.values(profile.carbonKgCo2Eq).reduce((a, b) => a + b, 0);
    const avgToxicity = this.computeWeightedAverage(profile.toxicityIndex, profile.quantitiesKg);
    const avgRecyclability = this.computeWeightedAverage(profile.recyclabilityIndex, profile.quantitiesKg);
    const totalWater = Object.values(profile.waterUseL).reduce((a, b) => a + b, 0);
    const totalLand = Object.values(profile.landUseM2).reduce((a, b) => a + b, 0);

    // Normalize to 0-1 (using reasonable reference values)
    const embodiedEnergyNorm = clamp(totalEnergy / 10000, 0, 1);
    const carbonIntensityNorm = clamp(totalCarbon / 1000, 0, 1);
    const toxicityNorm = clamp(avgToxicity, 0, 1);
    const recyclabilityNorm = clamp(avgRecyclability, 0, 1);
    const waterUseNorm = clamp(totalWater / 10000, 0, 1);
    const landUseNorm = clamp(totalLand / 100, 0, 1);

    const w = this.config.ecoWeights;

    // Compute eco_score (lower = better)
    // Recyclability and repairability are inverted (higher is better)
    const ecoScore =
      w.energy * embodiedEnergyNorm +
      w.carbon * carbonIntensityNorm +
      w.toxicity * toxicityNorm +
      w.recyclability * (1.0 - recyclabilityNorm) +
      w.water * waterUseNorm +
      w.land * landUseNorm +
      w.repairability * (1.0 - repairabilityNorm);

    const assessment: EcoAssessment = {
      versionId,
      embodiedEnergyNorm,
      carbonIntensityNorm,
      toxicityNorm,
      recyclabilityNorm,
      waterUseNorm,
      landUseNorm,
      repairabilityNorm,
      ecoScore: clamp(ecoScore, 0, 1),
      passed: ecoScore <= this.config.ecoThreshold,
      notes: ecoScore <= this.config.ecoThreshold
        ? 'Design meets ecological requirements'
        : 'Design exceeds ecological threshold',
    };

    await this.storage.saveEcoAssessment(assessment);
    await this.appendToLedger('eco_assessed', { assessment });

    this.emit('eco:assessed', assessment);
    return assessment;
  }

  private computeWeightedAverage(
    values: Record<string, number>,
    weights: Record<string, number>
  ): number {
    let sum = 0;
    let totalWeight = 0;
    for (const key of Object.keys(values)) {
      const weight = weights[key] ?? 1;
      sum += values[key] * weight;
      totalWeight += weight;
    }
    return totalWeight > 0 ? sum / totalWeight : 0;
  }

  // ==========================================================================
  // MODULE 4: Lifecycle & Maintainability Modeling
  // ==========================================================================

  /**
   * Create lifecycle model for a version
   */
  async createLifecycleModel(
    versionId: string,
    data: {
      expectedLifetimeYears: number;
      maintenanceIntervalDays: number;
      maintenanceLaborHoursPerInterval: number;
      disassemblyHours: number;
      refurbCyclesPossible: number;
      dominantFailureModes: string[];
    }
  ): Promise<LifecycleModel> {
    const maintenanceEventsExpected =
      (data.expectedLifetimeYears * 365) / data.maintenanceIntervalDays;

    const totalMaintenanceHours =
      maintenanceEventsExpected * data.maintenanceLaborHoursPerInterval;

    // Lifecycle burden index (0-1, lower = better)
    const laborNorm = clamp(totalMaintenanceHours / 100, 0, 1);
    const lifetimeNorm = clamp(1 - data.expectedLifetimeYears / 20, 0, 1);
    const lifecycleBurdenIndex = 0.6 * laborNorm + 0.4 * lifetimeNorm;

    const model: LifecycleModel = {
      versionId,
      expectedLifetimeYears: data.expectedLifetimeYears,
      maintenanceEventsExpected,
      maintenanceIntervalDays: data.maintenanceIntervalDays,
      maintenanceLaborHoursPerInterval: data.maintenanceLaborHoursPerInterval,
      disassemblyHours: data.disassemblyHours,
      refurbCyclesPossible: data.refurbCyclesPossible,
      dominantFailureModes: data.dominantFailureModes,
      lifecycleBurdenIndex,
    };

    await this.storage.saveLifecycleModel(model);
    await this.appendToLedger('lifecycle_model_created', { versionId });

    return model;
  }

  // ==========================================================================
  // MODULE 5: Feasibility & Constraint Simulation
  // ==========================================================================

  /**
   * Run feasibility simulation
   */
  async runSimulation(
    versionId: string,
    simulationType: string,
    results: {
      feasibilityScore: number;
      yieldFactor: number;
      failureModes: string[];
      passedStructural: boolean;
      passedThermal: boolean;
      passedSafety: boolean;
    }
  ): Promise<SimulationResult> {
    const simulation: SimulationResult = {
      versionId,
      simulationType,
      feasibilityScore: clamp(results.feasibilityScore, 0, 1),
      yieldFactor: results.yieldFactor,
      failureModes: results.failureModes,
      passedStructural: results.passedStructural,
      passedThermal: results.passedThermal,
      passedSafety: results.passedSafety,
      notes: results.feasibilityScore >= this.config.minFeasibility
        ? 'Design is feasible'
        : 'Design requires modifications',
    };

    await this.storage.saveSimulationResult(simulation);
    await this.appendToLedger('simulation_completed', { simulation });

    this.emit('simulation:completed', simulation);
    return simulation;
  }

  // ==========================================================================
  // MODULE 6: Skill & Labor-Step Decomposition
  // ==========================================================================

  /**
   * Create labor profile with production steps
   */
  async createLaborProfile(
    versionId: string,
    productionSteps: Array<{
      stepId: string;
      name: string;
      skillTier: SkillTier;
      estimatedHours: number;
      requiredTools: string[];
      predecessors: string[];
    }>,
    totalMaintenanceHoursOverLife: number = 0,
    ergonomicsFlags: string[] = [],
    requiredCertifications: string[] = []
  ): Promise<LaborProfile> {
    // Calculate totals
    const totalProductionHours = productionSteps.reduce(
      (sum, step) => sum + step.estimatedHours,
      0
    );

    const hoursBySkillTier: Record<SkillTier, number> = {
      low: 0,
      medium: 0,
      high: 0,
      expert: 0,
    };

    for (const step of productionSteps) {
      hoursBySkillTier[step.skillTier] += step.estimatedHours;
    }

    const profile: LaborProfile = {
      versionId,
      productionSteps,
      totalProductionHours,
      hoursBySkillTier,
      totalMaintenanceHoursOverLife,
      ergonomicsFlags,
      requiredCertifications,
    };

    await this.storage.saveLaborProfile(profile);
    await this.appendToLedger('labor_profile_created', { versionId });

    return profile;
  }

  // ==========================================================================
  // MODULE 7: Systems Integration & Architectural Coordination
  // ==========================================================================

  /**
   * Check system integration compatibility
   */
  async checkIntegration(
    versionId: string,
    compatibleSystems: string[],
    conflicts: string[] = [],
    circularLoops: string[] = []
  ): Promise<IntegrationCheck> {
    // Calculate integration score
    const compatScore = compatibleSystems.length / Math.max(1, compatibleSystems.length + conflicts.length);
    const circularBonus = circularLoops.length > 0 ? 0.1 : 0;
    const integrationScore = clamp(compatScore + circularBonus, 0, 1);

    const check: IntegrationCheck = {
      versionId,
      compatibleSystems,
      conflicts,
      circularLoops,
      integrationScore,
    };

    await this.storage.saveIntegrationCheck(check);
    await this.appendToLedger('integration_checked', { check });

    return check;
  }

  // ==========================================================================
  // MODULE 8: Optimization & Efficiency Engine
  // ==========================================================================

  /**
   * Suggest optimizations for a design
   */
  async suggestOptimizations(versionId: string): Promise<{
    suggestions: Array<{
      area: string;
      suggestion: string;
      potentialImprovement: number;
    }>;
  }> {
    const eco = await this.storage.getEcoAssessment(versionId);
    const lifecycle = await this.storage.getLifecycleModel(versionId);
    const labor = await this.storage.getLaborProfile(versionId);

    const suggestions: Array<{
      area: string;
      suggestion: string;
      potentialImprovement: number;
    }> = [];

    if (eco && eco.ecoScore > 0.3) {
      if (eco.carbonIntensityNorm > 0.5) {
        suggestions.push({
          area: 'carbon',
          suggestion: 'Consider alternative materials with lower carbon footprint',
          potentialImprovement: 0.2,
        });
      }
      if (eco.recyclabilityNorm < 0.5) {
        suggestions.push({
          area: 'recyclability',
          suggestion: 'Design for disassembly to improve recyclability',
          potentialImprovement: 0.15,
        });
      }
    }

    if (lifecycle && lifecycle.lifecycleBurdenIndex > 0.5) {
      suggestions.push({
        area: 'maintenance',
        suggestion: 'Reduce maintenance frequency through improved materials',
        potentialImprovement: 0.1,
      });
    }

    if (labor && labor.totalProductionHours > 100) {
      suggestions.push({
        area: 'labor',
        suggestion: 'Consider modular design to reduce production complexity',
        potentialImprovement: 0.15,
      });
    }

    return { suggestions };
  }

  // ==========================================================================
  // MODULE 9: Validation, Certification & Release Manager
  // ==========================================================================

  /**
   * Certify a design version
   */
  async certifyVersion(
    versionId: string,
    certifiedBy: string[]
  ): Promise<CertificationRecord> {
    const version = await this.storage.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    const eco = await this.storage.getEcoAssessment(versionId);
    const simulations = await this.storage.getSimulationResults(versionId);
    const integration = await this.storage.getIntegrationCheck(versionId);

    const criteriaPassed: string[] = [];
    const criteriaFailed: string[] = [];

    // Check eco assessment
    if (eco?.passed) {
      criteriaPassed.push('eco_assessment');
    } else {
      criteriaFailed.push('eco_assessment');
    }

    // Check simulations
    const latestSim = simulations[simulations.length - 1];
    if (latestSim?.feasibilityScore >= this.config.minFeasibility) {
      criteriaPassed.push('feasibility');
    } else {
      criteriaFailed.push('feasibility');
    }

    if (latestSim?.passedStructural && latestSim?.passedThermal && latestSim?.passedSafety) {
      criteriaPassed.push('safety');
    } else {
      criteriaFailed.push('safety');
    }

    // Check integration
    if (integration && integration.integrationScore >= this.config.minIntegrationScore) {
      criteriaPassed.push('integration');
    } else {
      criteriaFailed.push('integration');
    }

    const status = criteriaFailed.length === 0 ? 'certified' : 'pending';

    const certification: CertificationRecord = {
      versionId,
      certifiedAt: new Date(),
      certifiedBy,
      criteriaPassed,
      criteriaFailed,
      documentationBundleUri: `integral://docs/${versionId}`,
      status,
    };

    await this.storage.saveCertification(certification);

    // Update version status
    version.status = status === 'certified' ? 'certified' : 'under_review';
    await this.storage.saveVersion(version);

    await this.appendToLedger('certification_issued', { certification });
    this.emit('certification:issued', certification);

    return certification;
  }

  // ==========================================================================
  // MODULE 10: Knowledge Commons & Reuse Repository
  // ==========================================================================

  /**
   * Search design repository
   */
  async searchDesigns(query: {
    purpose?: string;
    materials?: string[];
    maxEcoScore?: number;
    certified?: boolean;
  }): Promise<DesignVersion[]> {
    const allSpecs = await this.storage.listSpecs();
    const results: DesignVersion[] = [];

    for (const spec of allSpecs) {
      if (query.purpose && !spec.purpose.toLowerCase().includes(query.purpose.toLowerCase())) {
        continue;
      }

      const versions = await this.storage.listVersions(spec.id);
      for (const version of versions) {
        if (query.certified && version.status !== 'certified') {
          continue;
        }

        if (query.maxEcoScore) {
          const eco = await this.storage.getEcoAssessment(version.id);
          if (!eco || eco.ecoScore > query.maxEcoScore) {
            continue;
          }
        }

        if (query.materials) {
          const profile = await this.storage.getMaterialProfile(version.id);
          if (!profile || !query.materials.some((m) => profile.materials.includes(m))) {
            continue;
          }
        }

        results.push(version);
      }
    }

    return results;
  }

  /**
   * Generate OAD valuation profile for ITC/COS consumption
   */
  async generateValuationProfile(versionId: string): Promise<OADValuationProfile> {
    const eco = await this.storage.getEcoAssessment(versionId);
    const lifecycle = await this.storage.getLifecycleModel(versionId);
    const labor = await this.storage.getLaborProfile(versionId);
    const material = await this.storage.getMaterialProfile(versionId);

    if (!eco || !lifecycle || !labor || !material) {
      throw new Error(`Incomplete data for version ${versionId}`);
    }

    const totalMaterialKg = Object.values(material.quantitiesKg).reduce((a, b) => a + b, 0);
    const totalEnergy = Object.values(material.embodiedEnergyMj).reduce((a, b) => a + b, 0);

    const profile: OADValuationProfile = {
      versionId,
      materialIntensity: totalMaterialKg,
      repairability: eco.repairabilityNorm,
      billOfMaterials: material.quantitiesKg,
      embodiedEnergy: totalEnergy,
      expectedLifespanHours: lifecycle.expectedLifetimeYears * 365 * 24,
      estimatedLaborHours: labor.totalProductionHours,
      laborBySkillTier: labor.hoursBySkillTier,
      ecoScore: eco.ecoScore,
      lifecycleBurdenIndex: lifecycle.lifecycleBurdenIndex,
    };

    await this.appendToLedger('valuation_profile_generated', { profile });

    return profile;
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
      `oad.${entryType}`,
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

  async getSpec(id: string): Promise<DesignSpec | null> {
    return this.storage.getSpec(id);
  }

  async getVersion(id: string): Promise<DesignVersion | null> {
    return this.storage.getVersion(id);
  }

  async getEcoAssessment(versionId: string): Promise<EcoAssessment | null> {
    return this.storage.getEcoAssessment(versionId);
  }

  getConfig(): OADConfig {
    return { ...this.config };
  }
}

export default OpenAccessDesign;
