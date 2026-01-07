# INTEGRAL: Key Formulas & Quick Reference

## ITC WEIGHTING

### Final Weighted Hours
```
weighted_hours = base_hours × base_weight × context_factor

base_weight = skill_tier_weight × task_type_modifier

context_factor = 1.0 + (w_u × urgency + w_e × eco + w_s × scarcity)
                 [clamped to 0.7 - 1.5]

final_multiplier ∈ [0.5, 2.0]  (CDS-bounded)
```

### Default Skill Weights
| Tier | Weight |
|------|--------|
| low | 1.0 |
| medium | 1.2 |
| high | 1.5 |
| expert | 1.8 |

### Context Weight Defaults
- urgency: 0.15
- eco_sensitivity: 0.15  
- scarcity: 0.20

---

## TIME DECAY

### Exponential Decay Formula
```
decay_amount = decayable_balance × (1 - 2^(-Δt / half_life))

decayable_balance = balance - min_protected

Capped at: max_annual_decay_fraction × balance × (days/365)
```

### Typical Parameters
- grace_period: 30-60 days
- half_life: 180-365 days
- min_protected: 0-10 ITCs
- max_annual_decay: 20-30%

---

## ACCESS VALUATION

### ITC Access Cost Formula
```
final_itc = base_weighted_labor 
          + eco_burden_adjustment
          + material_scarcity_adjustment
          - repairability_credit
          - longevity_credit

eco_adjustment = weighted_labor × eco_score × eco_weight(0.5)
scarcity_adj = weighted_labor × scarcity_index × amplifier × 0.3
repair_credit = weighted_labor × repairability × 0.15
longevity_credit = weighted_labor × lifespan_factor × 0.10
```

---

## ECOLOGICAL SCORE

### Eco Score Formula (lower = better)
```
eco_score = Σ wᵢ × normalized_metricᵢ

Components (0-1 normalized):
- embodied_energy (higher = worse)
- carbon_intensity (higher = worse)
- toxicity (higher = worse)
- recyclability (higher = BETTER, invert)
- water_use (higher = worse)
- land_use (higher = worse)
- repairability (higher = BETTER, invert)
```

### Certification Threshold
```
eco_passed = (eco_score ≤ threshold)  [typically 0.5]
```

---

## CONSENSUS MECHANISM

### Consensus Score
```
C(s) = Σᵢ wᵢ × supportᵢ(s) / Σᵢ wᵢ

support ∈ {-1 (block), -0.5, 0, +0.5, +1 (strong)}
```

### Objection Index
```
O(s) = Σⱼ (severityⱼ × scopeⱼ) / N

severity, scope ∈ [0, 1]
```

### Decision Rules
```
APPROVE: C ≥ θ_c AND O ≤ θ_o
REVISE:  C ≥ θ_min AND O > θ_o
ESCALATE: value_conflict_detected
```

---

## BOTTLENECK DETECTION

### Deviation Ratio
```
D_k = (actual_hours - estimated_hours) / estimated_hours
```

### Blocked Ratio
```
B_k = blocked_instances / total_instances
```

### Severity Score
```
S_k = α × max(0, D_k) + β × B_k

α = 0.6 (time weight)
β = 0.4 (blocking weight)
```

---

## AUTONOMY & FRAGILITY

### Autonomy Index
```
A = α×s_int + β×s_fed - γ×s_ext

α = 1.0 (internal weight)
β = 0.7 (federated weight)
γ = 1.0 (external penalty)

Clamp to [0, 1]
```

### Fragility Index
```
F = H + δ × critical_external_share

H = Σᵢ sᵢ² (Herfindahl concentration)
δ = 0.3 (critical dependency penalty)

Clamp to [0, 1]
```

---

## LIFECYCLE MODELING

### Mean Time To Failure
```
MTTF = base_mttf × material_factor / stress_factor
```

### Expected Maintenance Labor
```
total_maintenance = (lifespan / interval) × labor_per_event
```

### Lifecycle Burden Index
```
burden = 0.6 × labor_norm + 0.4 × downtime_norm
```

---

## HASH CHAIN INTEGRITY

### Entry Hash
```
entry_hash = SHA256(stable_json(payload) + prev_hash)
```

### Verification
```
valid = all(
    entry[i].prev_hash == entry[i-1].entry_hash
    for i in range(1, len(entries))
)
```

---

## SIGNAL QUALITY

### Packet Quality Score
```
Q_packet = (1/N) × Σᵢ Q_envelope_i

Q_envelope = mean(metric_qualities) - penalty
```

---

## KEY THRESHOLDS (CDS-Configurable)

| Parameter | Default | Description |
|-----------|---------|-------------|
| consensus_threshold | 0.6 | Min consensus for approval |
| objection_threshold | 0.3 | Max objection index |
| eco_threshold | 0.5 | Max eco_score for certification |
| min_feasibility | 0.7 | Min simulation feasibility |
| min_integration_score | 0.6 | Min systems compatibility |
| bottleneck_severity | 0.15 | Trigger for constraint flag |
| decay_half_life_days | 180 | ITC balance half-life |

---

## DATA FLOW SUMMARY

```
OAD (design) ──► COS (production) ──► ITC (valuation)
     │               │                    │
     └───────────────┴────────────────────┘
                     │
                     ▼
                   FRS (feedback)
                     │
                     ▼
                   CDS (policy)
```

---

## IMPLEMENTATION CHECKLIST

### MVP Requirements
- [ ] Node identity (DID or equivalent)
- [ ] Hash-chained ledger (any backend)
- [ ] Labor event capture
- [ ] Basic weighting engine
- [ ] Simple consensus mechanism
- [ ] Access value computation
- [ ] Member account management

### Production Requirements  
- [ ] Full CDS pipeline (10 modules)
- [ ] OAD design versioning
- [ ] COS workflow execution
- [ ] FRS diagnostic classification
- [ ] Inter-node federation
- [ ] Decay mechanism
- [ ] Ethics monitoring
