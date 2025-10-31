# Exploration Games

## 🤖 AI Agent Context

**Service Purpose:** Manages exploration games and related functionality within Decentraland. Provides services for game discovery, participation tracking, and reward distribution for exploration-based gameplay experiences.

**Key Capabilities:**

- Game discovery and cataloging
- Player participation tracking
- Exploration progress monitoring
- Integration with reward systems

**Communication Pattern:** Synchronous HTTP REST API

**Technology Stack:**

- Runtime: Node.js
- Language: TypeScript
- Component Architecture: @well-known-components (logger, metrics, http-server)

**External Dependencies:**

- Database: PostgreSQL (game data, player progress)
- Content Server: Catalyst (entity fetching if needed)
