# INTEGRAL: Technical Implementation Specification
## Extracted from White Paper v0.1 (December 2025)

---

# 1. SYSTEM OVERVIEW

**Integral** is a federated, post-monetary, cybernetic cooperative economic system designed to replace market-based coordination with direct biophysical and social calculation.

## Core Design Principles
- **Non-monetary valuation**: Replace price signals with multi-dimensional biophysical signals
- **Cybernetic feedback**: Continuous sensing, adjustment, and learning
- **Federated architecture**: Autonomous nodes with shared protocols
- **Democratic governance**: All policy decisions through CDS consensus
- **Ecological embedding**: Environmental constraints are first-class citizens

---

# 2. FIVE CORE SUBSYSTEMS (MEZZO LEVEL)

| System | Full Name | Primary Function |
|--------|-----------|------------------|
| **CDS** | Collaborative Decision System | Participatory governance engine |
| **OAD** | Open Access Design | Collective engineering & design intelligence |
| **ITC** | Integral Time Credits | Contribution accounting & access valuation |
| **COS** | Cooperative Organization System | Production coordination & workflow management |
| **FRS** | Feedback & Review System | Monitoring, diagnosis, and system learning |

## System Interaction Flow
```
CDS ←→ OAD ←→ COS ←→ ITC ←→ FRS
 ↑_________________________________↓
         (Continuous Feedback Loop)
```

---

# 3. CDS — COLLABORATIVE DECISION SYSTEM

## 10 Modules

| Module | Purpose |
|--------|---------|
| 1. Issue Capture & Signal Intake | Collect proposals, objections, system signals |
| 2. Issue Structuring & Framing | Semantic clustering and problem framing |
| 3. Knowledge Integration & Context Engine | Aggregate evidence, constraints, precedents |
| 4. Norms & Constraint Checking | Test scenarios against boundaries |
| 5. Participatory Deliberation Workspace | Transparent discussion and refinement |
| 6. Weighted Consensus Engine | Non-coercive preference synthesis |
| 7. Transparency, Versioning & Accountability | Append-only audit trail |
| 8. Implementation Dispatch Interface | Route decisions to OAD/COS/ITC/FRS |
| 9. Human Deliberation & High-Bandwidth Resolution | Syntegrity for value conflicts |
| 10. Review, Revision & Override | Post-decision adaptive correction |

## Core Data Types

```python
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class IssueStatus(str, Enum):
    INTAKE = "intake"
    STRUCTURED = "structured"
    CONTEXT_READY = "context_ready"
    DELIBERATION = "deliberation"
    DECIDED = "decided"
    DISPATCHED = "dispatched"
    UNDER_REVIEW = "under_review"
    REOPENED = "reopened"

class SubmissionType(str, Enum):
    PROPOSAL = "proposal"
    OBJECTION = "objection"
    EVIDENCE = "evidence"
    COMMENT = "comment"
    SIGNAL = "signal"  # from FRS, ITC, COS

class SupportLevel(str, Enum):
    STRONG_SUPPORT = "strong_support"
    SUPPORT = "support"
    NEUTRAL = "neutral"
    CONCERN = "concern"
    BLOCK = "block"

class ConsensusDirective(str, Enum):
    APPROVE = "approve"
    REVISE = "revise"
    ESCALATE_TO_MODULE9 = "escalate_to_module9"

@dataclass
class Participant:
    id: str
    node_id: str
    roles: List[str] = field(default_factory=list)
    authenticated_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Submission:
    id: str
    author_id: str
    issue_id: str
    type: SubmissionType
    content: str
    created_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Issue:
    id: str
    title: str
    node_id: str
    status: IssueStatus
    created_at: datetime
    last_updated_at: datetime
    submissions: List[Submission] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Scenario:
    id: str
    issue_id: str
    label: str
    parameters: Dict[str, Any]
    indicators: Dict[str, Any]

@dataclass
class Objection:
    participant_id: str
    issue_id: str
    scenario_id: str
    severity: float  # 0–1
    scope: float     # 0–1
    description: str
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class ConstraintReport:
    issue_id: str
    scenario_id: str
    passed: bool
    violations: List[Dict[str, Any]] = field(default_factory=list)
    required_modifications: List[str] = field(default_factory=list)

@dataclass
class ConsensusResult:
    issue_id: str
    scenario_id: str
    consensus_score: float
    objection_index: float
    directive: ConsensusDirective
    required_conditions: List[str] = field(default_factory=list)

@dataclass
class Decision:
    id: str
    issue_id: str
    scenario_id: str
    status: str  # "approved", "amended", "revoked"
    consensus_score: float
    objection_index: float
    decided_at: datetime
    rationale_hash: str
    supersedes_decision_id: Optional[str] = None

@dataclass
class DispatchPacket:
    id: str
    issue_id: str
    scenario_id: str
    created_at: datetime
    tasks: List[Dict[str, Any]] = field(default_factory=list)
    materials: Dict[str, Any] = field(default_factory=dict)
    oad_flags: Dict[str, Any] = field(default_factory=dict)
    itc_adjustments: Dict[str, Any] = field(default_factory=dict)
    frs_monitors: List[str] = field(default_factory=list)

@dataclass
class LogEntry:
    id: str
    issue_id: str
    stage: str
    timestamp: datetime
    payload: Dict[str, Any]
    prev_hash: str
    entry_hash: str
```

## Consensus Mathematics

### Weighted Consensus Score
For scenario s with N participants:
```
C(s) = Σᵢ wᵢ × supportᵢ(s) / Σᵢ wᵢ
```
Where:
- wᵢ = participant weight (bounded by CDS policy)
- supportᵢ(s) ∈ [-1, +1] (block to strong support)

### Objection Index
```
O(s) = Σⱼ severityⱼ × scopeⱼ × (1/N)
```

### Decision Rule
```
APPROVE if: C(s) ≥ θ_consensus AND O(s) ≤ θ_objection
REVISE if: C(s) ≥ θ_min AND O(s) > θ_objection  
ESCALATE if: irreducible value conflict detected
```

---

# 4. OAD — OPEN ACCESS DESIGN

## 10 Modules

| Module | Purpose |
|--------|---------|
| 1. Design Submission & Structured Specification | Intake new designs with metadata |
| 2. Collaborative Design Workspace | Multi-user refinement, version control |
| 3. Material & Ecological Coefficient Engine | Compute ecological footprint |
| 4. Lifecycle & Maintainability Modeling | Long-term labor burden estimation |
| 5. Feasibility & Constraint Simulation | Physics-based testing |
| 6. Skill & Labor-Step Decomposition | Convert design to task breakdown |
| 7. Systems Integration & Architectural Coordination | Node compatibility checking |
| 8. Optimization & Efficiency Engine | Multi-objective improvement |
| 9. Validation, Certification & Release Manager | Quality gate |
| 10. Knowledge Commons & Reuse Repository | Global design archive |

## Core Data Types

```python
@dataclass
class DesignSpec:
    id: str
    node_id: str
    purpose: str
    functional_requirements: List[str]
    constraints: Dict[str, Any]
    created_at: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class DesignVersion:
    id: str
    spec_id: str
    parent_version_id: Optional[str]
    label: str
    created_at: datetime
    authors: List[str]
    cad_files: List[str]  # URIs/hashes
    materials: List[str]
    parameters: Dict[str, Any]
    change_log: str
    status: str  # "draft", "under_review", "certified"
    superseded_by_version_id: Optional[str] = None

@dataclass
class MaterialProfile:
    version_id: str
    materials: List[str]
    quantities_kg: Dict[str, float]
    embodied_energy_mj: Dict[str, float]
    carbon_kg_co2_eq: Dict[str, float]
    toxicity_index: Dict[str, float]
    recyclability_index: Dict[str, float]
    water_use_l: Dict[str, float]
    land_use_m2: Dict[str, float]

@dataclass
class EcoAssessment:
    version_id: str
    embodied_energy_norm: float  # 0-1
    carbon_intensity_norm: float
    toxicity_norm: float
    recyclability_norm: float
    water_use_norm: float
    land_use_norm: float
    repairability_norm: float
    eco_score: float  # 0-1 (lower = better)
    passed: bool
    notes: str = ""

@dataclass
class LifecycleModel:
    version_id: str
    expected_lifetime_years: float
    maintenance_events_expected: float
    maintenance_interval_days: float
    maintenance_labor_hours_per_interval: float
    disassembly_hours: float
    refurb_cycles_possible: int
    dominant_failure_modes: List[str]
    lifecycle_burden_index: float  # 0-1

@dataclass
class LaborProfile:
    version_id: str
    production_steps: List[Dict[str, Any]]
    total_production_hours: float
    hours_by_skill_tier: Dict[str, float]
    total_maintenance_hours_over_life: float
    ergonomics_flags: List[str]
    required_certifications: List[str]

@dataclass
class SimulationResult:
    version_id: str
    feasibility_score: float  # 0-1
    yield_factor: float
    failure_modes: List[str]
    simulation_type: str
    passed_structural: bool
    passed_thermal: bool
    passed_safety: bool
    notes: str = ""

@dataclass
class IntegrationCheck:
    version_id: str
    compatible_systems: List[str]
    conflicts: List[str]
    circular_loops: List[str]  # resource reuse opportunities
    integration_score: float  # 0-1

@dataclass
class CertificationRecord:
    version_id: str
    certified_at: datetime
    certified_by: List[str]
    criteria_passed: List[str]
    criteria_failed: List[str]
    documentation_bundle_uri: str
    status: str  # "certified", "pending", "revoked"

@dataclass
class OADValuationProfile:
    """Summary emitted by OAD for ITC/COS consumption"""
    version_id: str
    material_intensity: float
    repairability: float
    bill_of_materials: Dict[str, float]
    embodied_energy: float
    expected_lifespan_hours: float
    estimated_labor_hours: float
    labor_by_skill_tier: Dict[str, float]
    eco_score: float
    lifecycle_burden_index: float
```

## Ecological Score Calculation

```python
def compute_eco_score(
    embodied_energy_norm: float,
    carbon_norm: float,
    toxicity_norm: float,
    recyclability_norm: float,
    water_norm: float,
    land_norm: float,
    repairability_norm: float,
    weights: Dict[str, float] = None
) -> float:
    """
    eco_score = weighted combination where high energy/carbon/toxicity/water/land 
    are worse, while higher recyclability and repairability are better.
    Lower eco_score = better design.
    """
    w = weights or {
        "energy": 0.20,
        "carbon": 0.20,
        "toxicity": 0.15,
        "recyclability": 0.15,
        "water": 0.10,
        "land": 0.10,
        "repairability": 0.10
    }
    
    # Convert "good" metrics to "badness" scale
    eco_score = (
        w["energy"] * embodied_energy_norm +
        w["carbon"] * carbon_norm +
        w["toxicity"] * toxicity_norm +
        w["recyclability"] * (1.0 - recyclability_norm) +
        w["water"] * water_norm +
        w["land"] * land_norm +
        w["repairability"] * (1.0 - repairability_norm)
    )
    return max(0.0, min(1.0, eco_score))
```

---

# 5. ITC — INTEGRAL TIME CREDITS

## 9 Modules

| Module | Purpose |
|--------|---------|
| 1. Labor Event Capture & Verification | Record authenticated work |
| 2. Skill & Context Weighting Engine | Apply bounded multipliers |
| 3. Time-Decay Mechanism | Prevent accumulation |
| 4. Labor-Budget Forecasting & Need Anticipation | Predict shortages |
| 5. Access Allocation & Redemption | Compute access values |
| 6. Cross-Cooperative & Internodal Reciprocity | Federation equivalence |
| 7. Fairness, Anti-Coercion & Ethical Safeguards | Detect manipulation |
| 8. Ledger, Transparency & Auditability | Append-only record |
| 9. Integration & Coordination | CDS policy synchronization |

## Core Data Types

```python
SkillTier = Literal["low", "medium", "high", "expert"]

@dataclass
class LaborEvent:
    """Raw operational labor - no value assigned yet"""
    id: str
    member_id: str
    coop_id: str
    task_id: str
    task_label: str
    node_id: str
    start_time: datetime
    end_time: datetime
    hours: float
    skill_tier: SkillTier
    context: Dict[str, Any]  # urgency, eco_sensitivity, scarcity scores
    verified_by: List[str]
    verification_timestamp: datetime
    metadata: Dict[str, Any]

@dataclass
class WeightedLaborRecord:
    """LaborEvent after weighting"""
    id: str
    event_id: str
    member_id: str
    node_id: str
    base_hours: float
    weight_multiplier: float
    weighted_hours: float
    breakdown: Dict[str, float]  # skill_factor, scarcity_factor, etc.
    created_at: datetime

@dataclass
class DecayRule:
    """Democratically defined decay pattern"""
    id: str
    label: str
    inactivity_grace_days: float
    half_life_days: float
    min_balance_protected: float
    max_annual_decay_fraction: float
    effective_from: datetime

@dataclass
class ITCAccount:
    id: str
    member_id: str
    node_id: str
    balance: float
    last_decay_applied_at: datetime
    active_decay_rule_id: str
    total_earned: float = 0.0
    total_redeemed: float = 0.0
    total_decayed: float = 0.0

@dataclass
class WeightingPolicy:
    """CDS-approved weighting rules"""
    id: str
    node_id: str
    effective_from: datetime
    base_weights_by_skill: Dict[SkillTier, float]  # {"low": 1.0, "medium": 1.2, ...}
    task_type_modifiers: Dict[str, float]
    context_weights: Dict[str, float]  # urgency, eco_sensitivity, scarcity
    context_factor_min: float = 0.70
    context_factor_max: float = 1.50
    min_weight_multiplier: float = 0.50
    max_weight_multiplier: float = 2.00

AccessMode = Literal["permanent_acquisition", "shared_use_lock", "service_use"]

@dataclass
class AccessValuation:
    """Computed ITC access obligation (NOT a price)"""
    item_id: str
    design_version_id: str
    node_id: str
    base_weighted_labor_hours: float
    eco_burden_adjustment: float      # + hours-equiv
    material_scarcity_adjustment: float
    repairability_credit: float       # - hours-equiv
    longevity_credit: float           # - hours-equiv
    final_itc_cost: float
    computed_at: datetime
    valid_until: Optional[datetime]
    policy_snapshot_id: str
    rationale: Dict[str, Any] = field(default_factory=dict)

@dataclass
class RedemptionRecord:
    id: str
    member_id: str
    node_id: str
    item_id: str
    itc_spent: float
    redemption_time: datetime
    redemption_type: AccessMode
    expires_at: Optional[datetime]
    access_valuation_snapshot: AccessValuation

@dataclass
class EquivalenceBand:
    """Federated interpretation for cross-node access"""
    home_node_id: str
    local_node_id: str
    labor_context_factor: float  # bounded 0.9-1.1
    eco_context_factor: float
    updated_at: datetime

@dataclass
class EthicsEvent:
    """Anti-coercion detection"""
    id: str
    node_id: str
    timestamp: datetime
    severity: Literal["info", "warning", "critical"]
    description: str
    involved_member_ids: List[str]
    rule_violations: List[str]
    status: Literal["open", "under_review", "resolved"]

LedgerEntryType = Literal[
    "labor_event_recorded",
    "labor_weight_applied", 
    "itc_credited",
    "itc_decayed",
    "access_value_quoted",
    "access_redeemed",
    "equivalence_band_applied",
    "ethics_flag_created",
    "policy_updated"
]

@dataclass
class LedgerEntry:
    id: str
    timestamp: datetime
    entry_type: LedgerEntryType
    node_id: str
    member_id: Optional[str]
    related_ids: Dict[str, str]
    details: Dict[str, Any]
```

## ITC Weighting Formula

```python
def compute_weighted_hours(
    event: LaborEvent,
    policy: WeightingPolicy
) -> WeightedLaborRecord:
    """
    Final weighted hours = base_hours × base_weight × context_factor
    All factors bounded by CDS-approved limits.
    """
    # Base weight from skill tier
    base_weight = policy.base_weights_by_skill.get(event.skill_tier, 1.0)
    
    # Task type modifier
    task_type = event.metadata.get("task_type", "generic")
    task_mod = policy.task_type_modifiers.get(task_type, 1.0)
    
    # Context factor from COS/FRS signals
    ctx = event.context or {}
    urgency = ctx.get("urgency_score", 0.0)      # [-1, +1]
    eco = ctx.get("eco_sensitivity_score", 0.0)  # [-1, +1]
    scarcity = ctx.get("scarcity_score", 0.0)    # [-1, +1]
    
    w = policy.context_weights
    context_factor = 1.0 + (
        w.get("urgency", 0.15) * urgency +
        w.get("eco_sensitivity", 0.15) * eco +
        w.get("scarcity", 0.20) * scarcity
    )
    
    # Clamp context factor
    context_factor = max(
        policy.context_factor_min,
        min(policy.context_factor_max, context_factor)
    )
    
    # Final multiplier
    raw_multiplier = base_weight * task_mod * context_factor
    final_multiplier = max(
        policy.min_weight_multiplier,
        min(policy.max_weight_multiplier, raw_multiplier)
    )
    
    weighted_hours = event.hours * final_multiplier
    
    return WeightedLaborRecord(
        id=generate_id("wlr"),
        event_id=event.id,
        member_id=event.member_id,
        node_id=event.node_id,
        base_hours=event.hours,
        weight_multiplier=final_multiplier,
        weighted_hours=weighted_hours,
        breakdown={
            "skill_factor": base_weight,
            "task_factor": task_mod,
            "context_factor": context_factor
        },
        created_at=datetime.utcnow()
    )
```

## Time Decay Formula

```python
def apply_decay(
    account: ITCAccount,
    decay_rule: DecayRule,
    now: datetime
) -> float:
    """
    Exponential decay after grace period.
    decay_amount = balance × (1 - 2^(-Δt/half_life))
    Clamped by max_annual_decay_fraction.
    """
    days_since_decay = (now - account.last_decay_applied_at).days
    
    # Check grace period
    if days_since_decay <= decay_rule.inactivity_grace_days:
        return 0.0
    
    # Effective days subject to decay
    decay_days = days_since_decay - decay_rule.inactivity_grace_days
    
    # Exponential decay factor
    decay_factor = 1.0 - (2 ** (-decay_days / decay_rule.half_life_days))
    
    # Calculate raw decay
    decayable_balance = max(0, account.balance - decay_rule.min_balance_protected)
    raw_decay = decayable_balance * decay_factor
    
    # Clamp to annual maximum
    annual_cap = account.balance * decay_rule.max_annual_decay_fraction * (decay_days / 365.0)
    decay_amount = min(raw_decay, annual_cap)
    
    # Apply
    account.balance -= decay_amount
    account.total_decayed += decay_amount
    account.last_decay_applied_at = now
    
    return decay_amount
```

## Access Value Computation

```python
def compute_access_value(
    oad_profile: OADValuationProfile,
    cos_signals: Dict[str, float],
    frs_signals: Dict[str, float],
    policy_snapshot: Dict[str, Any]
) -> AccessValuation:
    """
    Final ITC cost = weighted_labor + eco_adjustment + scarcity_adjustment 
                   - repairability_credit - longevity_credit
    """
    # Base weighted labor (from OAD labor decomposition)
    base_labor = oad_profile.estimated_labor_hours
    
    # Apply skill-tier weighting
    weighted_labor = sum(
        hours * policy_snapshot["skill_weights"].get(tier, 1.0)
        for tier, hours in oad_profile.labor_by_skill_tier.items()
    )
    
    # Ecological burden adjustment (from OAD eco_score)
    eco_weight = policy_snapshot.get("eco_weight", 0.5)
    eco_adjustment = weighted_labor * oad_profile.eco_score * eco_weight
    
    # Material scarcity adjustment (from COS/FRS)
    scarcity_index = cos_signals.get("material_scarcity_index", 0.0)
    frs_amplifier = frs_signals.get("scarcity_amplifier", 1.0)
    scarcity_adjustment = weighted_labor * scarcity_index * frs_amplifier * 0.3
    
    # Repairability credit (rewards easy maintenance)
    repairability_credit = weighted_labor * oad_profile.repairability * 0.15
    
    # Longevity credit (rewards durability)
    lifespan_factor = min(1.0, oad_profile.expected_lifespan_hours / 20000)
    longevity_credit = weighted_labor * lifespan_factor * 0.10
    
    # Final calculation
    final_cost = (
        weighted_labor +
        eco_adjustment +
        scarcity_adjustment -
        repairability_credit -
        longevity_credit
    )
    
    return AccessValuation(
        item_id=generate_id("item"),
        design_version_id=oad_profile.version_id,
        node_id=policy_snapshot["node_id"],
        base_weighted_labor_hours=weighted_labor,
        eco_burden_adjustment=eco_adjustment,
        material_scarcity_adjustment=scarcity_adjustment,
        repairability_credit=repairability_credit,
        longevity_credit=longevity_credit,
        final_itc_cost=max(0, final_cost),
        computed_at=datetime.utcnow(),
        valid_until=None,
        policy_snapshot_id=policy_snapshot["id"],
        rationale={
            "base_labor": base_labor,
            "weighted_labor": weighted_labor,
            "eco_score": oad_profile.eco_score,
            "scarcity_index": scarcity_index
        }
    )
```

---

# 6. COS — COOPERATIVE ORGANIZATION SYSTEM

## 9 Modules

| Module | Purpose |
|--------|---------|
| 1. Production Planning & Work Breakdown | Generate WBS from OAD |
| 2. Labor Organization & Skill-Matching | Advisory task assignment |
| 3. Resource Procurement & Materials Management | Track inventory, EII |
| 4. Cooperative Workflow Execution | Task lifecycle management |
| 5. Capacity, Throughput & Constraint Balancing | Bottleneck detection |
| 6. Distribution & Access Flow Coordination | Route finished goods |
| 7. Quality Assurance & Safety Verification | Defect tracking |
| 8. Cooperative Coordination & Inter-Coop Integration | Cross-coop routing |
| 9. Transparency, Ledger & Audit | Hash-chained event stream |

## Core Data Types

```python
TaskStatus = Literal["pending", "in_progress", "blocked", "done", "cancelled"]
MaterialFlowSource = Literal["internal_recycle", "external_procurement", "production_use", "loss_scrap"]

@dataclass
class COSTaskDefinition:
    """Task template from OAD labor decomposition"""
    id: str
    version_id: str  # OAD DesignVersion
    name: str
    description: str
    skill_tier: SkillTier
    estimated_hours_per_unit: float
    required_tools: List[str]
    required_workspaces: List[str]
    required_materials_kg: Dict[str, float]
    process_eii: float  # ecological impact index
    predecessors: List[str]  # task_definition_ids

@dataclass
class COSTaskInstance:
    """Concrete scheduled task"""
    id: str
    definition_id: str
    batch_id: str
    node_id: str
    assigned_coop_id: str
    status: TaskStatus = "pending"
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    actual_hours: float = 0.0
    participants: List[str] = field(default_factory=list)
    block_reasons: List[str] = field(default_factory=list)

@dataclass
class COSProductionPlan:
    """Work Breakdown Structure for a batch"""
    plan_id: str
    node_id: str
    version_id: str  # OAD DesignVersion
    batch_id: str
    batch_size: int
    created_at: datetime
    tasks: Dict[str, COSTaskDefinition]
    task_instances: Dict[str, COSTaskInstance]
    expected_labor_hours_by_skill: Dict[SkillTier, float]
    expected_materials_kg: Dict[str, float]
    expected_cycle_time_hours: float
    predicted_bottlenecks: List[str]

@dataclass
class MaterialLedgerEntry:
    id: str
    material_id: str
    quantity_kg: float
    direction: MaterialFlowSource
    ecological_impact_index: float
    timestamp: datetime
    plan_id: str
    task_instance_id: Optional[str]

@dataclass
class COSConstraint:
    """Detected bottleneck or constraint"""
    plan_id: str
    node_id: str
    task_definition_id: Optional[str]
    constraint_type: Literal["time", "skill", "material", "tool", "space"]
    severity: float  # 0-1
    description: str
    suggested_actions: List[str]

@dataclass
class QAResult:
    id: str
    item_id: str
    version_id: str
    passed: bool
    defects: List[str]
    severity_index: float
    inspector_ids: List[str]
    timestamp: datetime

class COSEventType(str, Enum):
    LABOR = "labor"
    MATERIAL = "material"
    QA = "qa"
    DISTRIBUTION = "distribution"
    COORDINATION = "coordination"
    CONSTRAINT = "constraint"

@dataclass
class COSLedgerEvent:
    """Append-only operational event"""
    id: str
    event_type: COSEventType
    node_id: str
    plan_id: str
    timestamp: datetime
    payload: Dict[str, Any]
    prev_hash: str
    entry_hash: str
```

## Bottleneck Detection

```python
def detect_bottlenecks(
    plan: COSProductionPlan,
    execution_metrics: Dict[str, Dict[str, float]]
) -> List[COSConstraint]:
    """
    Identify task types with high deviation or blocking ratio.
    
    Deviation ratio: D_k = (actual_hours - estimated_hours) / estimated_hours
    Blocked ratio: B_k = blocked_instances / total_instances
    Severity: S_k = α × max(0, D_k) + β × B_k
    """
    constraints = []
    
    for def_id, definition in plan.tasks.items():
        instances = [
            inst for inst in plan.task_instances.values()
            if inst.definition_id == def_id
        ]
        
        if not instances:
            continue
        
        # Calculate metrics
        total_estimated = len(instances) * definition.estimated_hours_per_unit
        total_actual = sum(inst.actual_hours for inst in instances)
        blocked_count = sum(1 for inst in instances if inst.status == "blocked")
        
        deviation_ratio = (total_actual - total_estimated) / max(total_estimated, 0.1)
        blocked_ratio = blocked_count / len(instances)
        
        # Severity calculation
        alpha, beta = 0.6, 0.4
        severity = alpha * max(0, deviation_ratio) + beta * blocked_ratio
        
        if severity > 0.15:  # threshold
            constraints.append(COSConstraint(
                plan_id=plan.plan_id,
                node_id=plan.node_id,
                task_definition_id=def_id,
                constraint_type="time",  # refined later
                severity=min(1.0, severity),
                description=f"Task {def_id}: deviation={deviation_ratio:.2%}, blocked={blocked_ratio:.2%}",
                suggested_actions=["investigate cause", "consider redesign or training"]
            ))
    
    return constraints
```

---

# 7. FRS — FEEDBACK & REVIEW SYSTEM

## 7 Modules

| Module | Purpose |
|--------|---------|
| 1. Signal Intake & Semantic Integration | Normalize incoming signals |
| 2. Diagnostic Classification & Pathology Detection | Classify stresses |
| 3. Predictive Modeling & Scenario Simulation | Forward projections |
| 4. Recommendation Routing & Non-Executive Dispatch | Advisory signals |
| 5. Democratic Sensemaking Interface | Human-readable dashboards |
| 6. Longitudinal Memory & Institutional Recall | System learning |
| 7. Federated Intelligence Exchange | Cross-node knowledge sharing |

## Core Data Types

```python
Severity = Literal["info", "low", "moderate", "critical"]
Confidence = Literal["speculative", "provisional", "confident", "validated"]
Persistence = Literal["transient", "emerging", "persistent"]
Scope = Literal["task", "process", "node", "regional", "federation"]

@dataclass
class Metric:
    name: str
    value: float
    unit: str
    quality: float = 1.0  # 0-1 confidence

@dataclass
class SemanticTag:
    key: str
    value: str

@dataclass
class SignalEnvelope:
    """Validated incoming signal"""
    id: str
    source: Literal["COS", "OAD", "ITC", "CDS", "ECO", "FED"]
    domain: str
    node_id: str
    federation_id: str
    created_at: datetime
    observed_at: datetime
    tags: List[SemanticTag]
    metrics: List[Metric]
    prev_hash: Optional[str] = None
    entry_hash: Optional[str] = None

@dataclass
class SignalPacket:
    """Time-aligned bundle of signals"""
    id: str
    node_id: str
    time_window_start: datetime
    time_window_end: datetime
    envelopes: List[SignalEnvelope]
    quality_score: float
    packet_version: str
    packet_hash: str

FindingType = Literal[
    "ecological_overshoot",
    "labor_stress",
    "material_dependency",
    "design_friction",
    "valuation_drift",
    "governance_load",
    "coordination_fragility"
]

@dataclass
class DiagnosticFinding:
    id: str
    node_id: str
    created_at: datetime
    finding_type: FindingType
    severity: Severity
    confidence: Confidence
    persistence: Persistence
    scope: Scope
    indicators: Dict[str, float]
    evidence_refs: List[str]
    summary: str
    rationale: str

TargetSystem = Literal["OAD", "COS", "ITC", "CDS", "FED"]

@dataclass
class Recommendation:
    """Non-executive advisory signal"""
    id: str
    node_id: str
    created_at: datetime
    target_system: TargetSystem
    recommendation_type: str
    severity: Severity
    confidence: Confidence
    related_findings: List[str]
    payload: Dict[str, Any]
    summary: str
    rationale: str

@dataclass
class MemoryRecord:
    """Institutional learning record"""
    id: str
    node_id: str
    created_at: datetime
    record_type: Literal["baseline", "incident", "intervention", "outcome", "lesson"]
    title: str
    tags: List[SemanticTag]
    evidence_refs: List[str]
    narrative: str
    quantified_outcomes: Dict[str, float]

@dataclass
class FederatedExchangeMessage:
    """Cross-node knowledge sharing"""
    id: str
    message_type: Literal["stress_signature", "best_practice", "design_success", "early_warning", "model_template"]
    created_at: datetime
    from_node_id: str
    to_scope: Literal["regional", "federation", "targeted_nodes"]
    payload: Dict[str, Any]
    summary: str
```

---

# 8. INTER-SYSTEM INTEGRATION

## Signal Flow Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTEGRAL NODE                             │
│                                                                  │
│  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐      │
│  │ CDS  │◄──►│ OAD  │◄──►│ COS  │◄──►│ ITC  │◄──►│ FRS  │      │
│  └──┬───┘    └──┬───┘    └──┬───┘    └──┬───┘    └──┬───┘      │
│     │           │           │           │           │           │
│     ▼           ▼           ▼           ▼           ▼           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              FEDERATED SYNCHRONIZATION                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────┐
              │    OTHER INTEGRAL NODES    │
              └───────────────────────────┘
```

## Cross-System Signal Types

```python
# COS → ITC
@dataclass
class COSWorkloadSignal:
    node_id: str
    plan_id: str
    labor_by_skill: Dict[SkillTier, float]
    material_scarcity_index: float
    throughput_constraints: List[str]
    timestamp: datetime

# OAD → ITC
# Uses OADValuationProfile (defined above)

# FRS → ITC
@dataclass
class FRSValuationSignal:
    node_id: str
    version_id: str
    longevity_correction: float
    scarcity_amplifier: float
    ecological_stress_index: float
    fairness_flags: List[str]
    timestamp: datetime

# COS → OAD
@dataclass
class OADConstraintSignal:
    plan_id: str
    node_id: str
    task_definition_id: str
    deviation_ratio: float
    description: str

# FRS → OAD
@dataclass
class FRSDesignFeedback:
    version_id: str
    actual_lifespan_vs_projected: float
    actual_maintenance_vs_projected: float
    failure_modes_observed: List[str]
    ecological_impact_observed: float

# COS/FRS → CDS
@dataclass
class PolicyReviewRequest:
    source: Literal["COS", "FRS", "ITC"]
    node_id: str
    policy_area: str
    rationale: str
    proposed_adjustments: Dict[str, Any]
    urgency: Literal["routine", "elevated", "urgent"]
```

---

# 9. INTERNODAL RECIPROCITY

## Equivalence Band Calculation

```python
def compute_equivalence_band(
    home_node_id: str,
    local_node_id: str,
    labor_conditions: Dict[str, float],
    ecological_conditions: Dict[str, float]
) -> EquivalenceBand:
    """
    Equivalence bands adjust local interpretation, not exchange rates.
    Bounded to prevent arbitrage: typically 0.9-1.1
    """
    # Labor context: scarcity differences
    home_scarcity = labor_conditions.get(f"{home_node_id}_scarcity", 1.0)
    local_scarcity = labor_conditions.get(f"{local_node_id}_scarcity", 1.0)
    labor_factor = local_scarcity / max(home_scarcity, 0.1)
    labor_factor = max(0.9, min(1.1, labor_factor))
    
    # Ecological context
    home_eco = ecological_conditions.get(f"{home_node_id}_eco_stress", 0.5)
    local_eco = ecological_conditions.get(f"{local_node_id}_eco_stress", 0.5)
    eco_factor = 1.0 + 0.1 * (local_eco - home_eco)
    eco_factor = max(0.9, min(1.1, eco_factor))
    
    return EquivalenceBand(
        home_node_id=home_node_id,
        local_node_id=local_node_id,
        labor_context_factor=labor_factor,
        eco_context_factor=eco_factor,
        updated_at=datetime.utcnow()
    )
```

## Autonomy and Fragility Indices

```python
def compute_autonomy_and_fragility(
    internal_share: float,      # production routed internally
    federated_share: float,     # routed to other Integral nodes
    external_share: float,      # transitional external sourcing
    critical_external: float,   # critical dependencies on external
    unit_shares: Dict[str, float]  # share by cooperative unit
) -> Tuple[float, float]:
    """
    Autonomy: A = α×s_int + β×s_fed - γ×s_ext
    Fragility: F = H + penalty×critical_ext
    Where H = Herfindahl concentration index
    """
    alpha, beta, gamma = 1.0, 0.7, 1.0
    
    # Autonomy (clipped 0-1)
    A_raw = alpha * internal_share + beta * federated_share - gamma * external_share
    A = max(0.0, min(1.0, A_raw))
    
    # Concentration (Herfindahl)
    H = sum(s**2 for s in unit_shares.values())
    
    # Fragility
    penalty = 0.3
    F_raw = H + penalty * critical_external
    F = max(0.0, min(1.0, F_raw))
    
    return A, F
```

---

# 10. IMPLEMENTATION PRIORITIES

## Phase 1: Core Infrastructure
1. **Node identity and federation protocol**
2. **Append-only ledger infrastructure** (hash-chained events)
3. **CDS Module 1-2**: Issue intake and structuring
4. **ITC Module 1-2**: Labor capture and weighting
5. **Basic UI for participation**

## Phase 2: Production Coordination
1. **OAD Modules 1-6**: Design submission through labor decomposition
2. **COS Modules 1-4**: Planning through execution
3. **ITC Module 5**: Access valuation
4. **CDS Module 5-6**: Deliberation and consensus

## Phase 3: Feedback Loops
1. **FRS Modules 1-4**: Signal intake through recommendations
2. **OAD Modules 7-10**: Optimization and certification
3. **COS Modules 5-9**: Constraint balancing through audit
4. **ITC Modules 3-4, 6-8**: Decay, forecasting, reciprocity, ethics

## Phase 4: Federation
1. **Internodal protocols**
2. **Equivalence band computation**
3. **FRS Modules 5-7**: Democratic sensemaking and federation exchange
4. **CDS Modules 9-10**: High-bandwidth resolution and review

---

# 11. KNOWN GAPS & OPEN PROBLEMS

From the whitepaper postscript:

1. **Technical implementation details underspecified** - data structures, protocols, security, performance, failure handling require concrete decisions
2. **Behavioral/cultural dynamics** - human adaptation to non-market coordination unpredictable
3. **Scalability beyond early nodes** - practical limits unknown
4. **Legal/regulatory interfaces** - licensing, tax, property law complications
5. **Resistance and sabotage** - defensive strategies provisional
6. **Ecological modeling data** - Material & Ecological Coefficient Engine requires extensive collaboration

---

# 12. TECHNOLOGY STACK RECOMMENDATIONS

Based on requirements:

| Layer | Technology Options |
|-------|-------------------|
| **Identity** | DIDs, WebAuthn, federated identity |
| **Ledger** | PostgreSQL + hash chains, or IPFS/OrbitDB |
| **API** | GraphQL or gRPC for inter-system |
| **Frontend** | React/Vue with real-time subscriptions |
| **Simulation** | Python + NumPy/SciPy for modeling |
| **ML/Embedding** | sentence-transformers for semantic clustering |
| **Federation** | ActivityPub-style protocols or custom |

---

*Document generated from INTEGRAL White Paper v0.1 (December 2025)*
*For updates: integralcollective.io*
