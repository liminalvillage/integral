# INTEGRAL

A federated, post-monetary, cybernetic cooperative economic system built on Node.js with Nostr protocol for decentralized federation.

## Overview

INTEGRAL is a comprehensive platform for cooperative economics that replaces traditional monetary exchange with transparent, democratic resource allocation based on labor contributions, ecological sustainability, and collective decision-making.

### Core Principles

- **Post-Monetary**: Value is based on labor time and ecological impact, not currency speculation
- **Transparent**: All decisions and transactions are recorded in immutable audit logs
- **Democratic**: Weighted consensus ensures fair representation in all decisions
- **Federated**: Autonomous nodes connect via Nostr for global cooperation
- **Sustainable**: Ecological assessment is built into every design

## Architecture

INTEGRAL consists of 5 interconnected subsystems:

### CDS - Collaborative Decision System
Democratic governance through weighted consensus mechanisms.
- Issue tracking and proposal management
- Configurable voting mechanisms
- Liquid democracy with vote delegation
- Conflict resolution workflows

### OAD - Open Access Design
Sustainable innovation with built-in ecological assessment.
- Design registry and version control
- Lifecycle management (draft → review → certified)
- Ecological scoring (lower is better, threshold 0.5)
- Community certification process

### ITC - Integral Time Credits
Fair labor accounting through transparent time-based valuation.
- Labor event logging
- Weighted hours calculation: `weighted_hours = base_hours × skill_weight × context_factor`
- Time decay to prevent hoarding: `balance × (1 - 2^(-Δt/half_life))`
- Access control based on credit balance

### COS - Cooperative Organization System
Efficient production planning and resource coordination.
- Production plan management
- Task scheduling with dependencies
- Material requirements planning
- Bottleneck detection: `S = 0.6 × deviation + 0.4 × blocked_ratio`

### FRS - Feedback & Review System
System intelligence through continuous monitoring.
- Signal collection and anomaly detection
- Diagnostic reports and health monitoring
- AI-generated recommendations
- Trend analysis

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/integral.git
cd integral

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Running the Backend

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Running the Frontend

```bash
cd frontend

# Development mode
npm run dev

# Production build
npm run build
npm run preview
```

## Project Structure

```
integral/
├── src/
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Utility functions
│   ├── subsystems/
│   │   ├── cds/         # Decision System
│   │   ├── oad/         # Design System
│   │   ├── itc/         # Time Credits
│   │   ├── cos/         # Production System
│   │   └── frs/         # Feedback System
│   ├── nostr/           # Nostr integration
│   └── index.ts         # Main entry point
├── frontend/            # SvelteKit frontend
├── integral_implementation_spec.md
└── integral_formulas_quickref.md
```

## Core Formulas

### Weighted Consensus
```
C(s) = Σ wᵢ × supportᵢ / Σ wᵢ
```
Where `wᵢ` is voter weight and `supportᵢ` is support level (0-1).

### ITC Valuation
```
weighted_hours = base_hours × skill_weight × context_factor
```

### Time Decay
```
new_balance = balance × (1 - 2^(-Δt/half_life))
```

### Ecological Score
```
E = w₁×material + w₂×energy + w₃×waste + w₄×longevity⁻¹
```
Lower is better, with certification threshold at 0.5.

### Bottleneck Detection
```
S = 0.6 × deviation + 0.4 × blocked_ratio
```

## Federation via Nostr

INTEGRAL uses the Nostr protocol for decentralized federation:

- **Event Kinds**: Custom kinds in the 30000+ range
  - 30100-30199: CDS events
  - 30200-30299: OAD events
  - 30300-30399: ITC events
  - 30400-30499: COS events
  - 30500-30599: FRS events
  - 30600-30699: Federation events

- **Identity**: Nostr keypairs provide cryptographic identity
- **Relays**: Messages propagate through configurable relay servers

## API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/cds/issues` | List all issues |
| POST | `/api/v1/cds/issues` | Create new issue |
| POST | `/api/v1/cds/vote` | Cast a vote |
| GET | `/api/v1/oad/designs` | List all designs |
| POST | `/api/v1/oad/designs` | Submit new design |
| GET | `/api/v1/itc/accounts/:id` | Get account balance |
| POST | `/api/v1/itc/labor` | Log labor event |
| GET | `/api/v1/cos/plans` | List production plans |
| GET | `/api/v1/frs/health` | Get system health |

### WebSocket Events

Connect to `/ws` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data.payload);
};
```

## Configuration

Create a `config.json` file:

```json
{
  "node": {
    "id": "your-node-id",
    "name": "Your Cooperative"
  },
  "nostr": {
    "relays": [
      "wss://relay.example.com",
      "wss://relay2.example.com"
    ]
  },
  "itc": {
    "decayHalfLife": 365,
    "minSkillWeight": 0.5,
    "maxSkillWeight": 3.0
  },
  "oad": {
    "ecoThreshold": 0.5
  }
}
```

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please follow the existing code style and include tests for new functionality.

## Documentation

- [Implementation Specification](./integral_implementation_spec.md)
- [Formula Quick Reference](./integral_formulas_quickref.md)
- [Frontend Documentation](./frontend/README.md)

## License

MIT License - see LICENSE file for details.

## Support

- [GitHub Issues](https://github.com/your-org/integral/issues)
- [Documentation](./frontend/src/routes/docs)
- [Community Forum](https://forum.example.com)
