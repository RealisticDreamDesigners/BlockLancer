# BlockLancer - Secure Milestone Payments on Bitcoin

BlockLancer is a decentralized escrow and milestone payment platform built on the Stacks blockchain, providing Bitcoin-level security for freelance payments.

## Features

- **Bitcoin Security**: All contracts secured by Bitcoin through Stacks blockchain
- **Milestone Payments**: Break projects into manageable milestones with individual payments
- **Automatic Payments**: Instant fund release when milestones are approved
- **sBTC Escrow**: Create and fund escrows with sBTC (1:1 Bitcoin-pegged SIP-010 token) alongside native STX
- **Dispute Resolution**: Fair conflict resolution system
- **Freemium Model**: Free tier for small contracts, Pro tier for advanced features
- **Grant Support**: Perfect for funding organizations and grant programs

## Project Structure

```
blocklancer-stacks/
├── contracts/                     # Clarity smart contracts
│   ├── blocklancer-escrow.clar        # Core escrow logic
│   ├── blocklancer-payments.clar      # Payment processing & fees
│   └── blocklancer-dispute.clar       # Dispute resolution
├── tests/                         # Contract tests
├── frontend/                      # Next.js application
│   ├── src/
│   │   ├── app/                     # Next.js 14 app router
│   │   ├── components/              # React components
│   │   ├── hooks/                   # Custom hooks
│   │   ├── lib/                     # Utilities
│   │   └── types/                   # TypeScript types
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- [Clarinet](https://github.com/hirosystems/clarinet) for smart contract development
- A Stacks wallet (Hiro Wallet recommended)

### Setup Instructions

1. **Clone and Setup**
   ```bash
   mkdir blocklancer-stacks
   cd blocklancer-stacks
   
   # Initialize Clarinet project
   clarinet new . --name blocklancer
   
   # Create frontend
   mkdir frontend
   cd frontend
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm
   ```

2. **Install Dependencies**
   ```bash
   # In frontend directory
   npm install @stacks/connect @stacks/network @stacks/transactions @stacks/auth
   npm install @tanstack/react-query framer-motion zustand lucide-react
   ```

3. **Deploy Contracts (Testnet)**
   ```bash
   # From root directory
   clarinet check
   clarinet deployments apply testnet
   ```

4. **Configure Frontend**
   ```bash
   # Create .env.local in frontend directory
   echo "NEXT_PUBLIC_ESCROW_CONTRACT=YOUR_DEPLOYED_CONTRACT_ADDRESS" > .env.local
   echo "NEXT_PUBLIC_NETWORK=testnet" >> .env.local
   ```

5. **Start Development Server**
   ```bash
   cd frontend
   npm run dev
   ```

## Smart Contracts

### Core Contracts

- **blocklancer-escrow-v3.clar**: Main escrow functionality with milestone management, supporting both STX and sBTC as escrow currencies
- **blocklancer-payments-v2.clar**: Fee processing, user tier management, and sBTC fee accounting
- **blocklancer-dispute-v4.clar**: Dispute creation and DAO-driven resolution
- **blocklancer-reputation.clar**: On-chain reputation tracking
- **blocklancer-marketplace.clar**: Job listing and application management
- **blocklancer-membership.clar**: DAO committee membership with stake-based governance

### Key Functions

#### Escrow Contract
- `create-escrow`: Create a new escrow funded with STX
- `create-escrow-sbtc`: Create a new escrow funded with sBTC
- `add-milestone`: Add milestone to existing contract
- `submit-milestone`: Submit completed work (freelancer)
- `approve-milestone`: Approve work and release payment in the original token (client)
- `reject-milestone`: Reject work with feedback (client)
- `claim-deadline-refund`: Reclaim funds for overdue milestones

#### Payments Contract
- `validate-contract-creation`: Check user tier limits
- `calculate-platform-fee`: Calculate fees for pro users (STX)
- `calculate-platform-fee-sbtc`: Calculate fees for pro users (sBTC, 8 decimal places)
- `record-sbtc-fee`: Record sBTC fee for platform accounting
- `upgrade-to-pro`: Upgrade user to pro tier

#### Dispute Contract
- `open-dispute`: Create dispute for contract
- `submit-evidence`: Submit evidence for dispute
- `resolve-dispute`: Admin resolution (MVP version)

## Development

### Testing Contracts
```bash
clarinet test
clarinet check
```

### Local Development
```bash
# Start local devnet
clarinet devnet start

# In another terminal, start frontend
cd frontend
npm run dev
```

### Contract Deployment
```bash
# Deploy to testnet
clarinet deployment apply testnet

# Deploy to mainnet
clarinet deployment apply mainnet
```

## Security Features

- **Bitcoin Security**: All contracts inherit Bitcoin's security through Stacks
- **Multi-signature Support**: Team approval workflows
- **Time-locked Contracts**: Automatic milestone deadlines
- **Dispute Protection**: Fair resolution mechanisms
- **Access Controls**: Role-based permissions

## Tech Stack

### Smart Contracts
- **Clarity 3**: Smart contract language for Stacks
- **Clarinet**: Development toolchain
- **sBTC (SIP-010)**: Bitcoin-pegged token for escrow payments

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Stacks Connect**: Wallet integration

### Infrastructure
- **Stacks Blockchain**: Layer 2 for Bitcoin
- **Hiro APIs**: Blockchain data and indexing
- **Vercel**: Frontend deployment

### Market Opportunity
- Growing freelance market ($400B+ globally)
- Bitcoin ecosystem expansion
- Grant/funding organization needs

## Roadmap

### Phase 1: MVP (Current)
- Core escrow contracts (STX)
- Basic frontend with wallet integration
- Milestone management
- Simple dispute resolution

### Phase 2: Multi-Token and sBTC (Current)
- sBTC escrow support via `create-escrow-sbtc`
- Token-aware payment release and refund logic
- sBTC fee accounting in the payments contract
- Frontend `createEscrowSbtc` hook and `formatSbtc` utilities
- Backend chainhook indexing for sBTC escrow events

### Phase 3: Enhanced Features
- Advanced dispute voting system
- Grant-specific workflows
- User profiles and ratings
- Mobile-responsive design

### Phase 4: Ecosystem Integration
- Additional SIP-010 token support
- Integration with Stacks DeFi protocols
- API for third-party integrations
- Advanced analytics dashboard

### Phase 5: Scale and Partnership
- Stacks Foundation partnership
- Enterprise grant management
- Cross-chain integrations
- Community governance

## Contributing

BlockLancer was built for the [Stacks BUIDL Battle #2](https://dorahacks.io/hackathon/buidlbattle2/detail) hackathon. We welcome contributions from the community!

### Development Process
1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Submit a pull request

### Areas for Contribution
- Smart contract optimizations
- Frontend UI/UX improvements
- Documentation enhancements
- Testing and bug fixes

## License

This project was built for the Stacks BUIDL Battle #2 hackathon. Licensed under MIT.

## Support

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive guides and API docs (coming soon)
- **Discord**: Join the Stacks Discord community (coming soon)

## Acknowledgments

- **Stacks Foundation**: For the BUIDL Battle #2 hackathon
- **Hiro Systems**: For excellent developer tools
- **Bitcoin Community**: For the foundational security layer
- **Open Source Contributors**: Building the future of decentralized finance

---

Built for the [Stacks BUIDL Battle #2](https://dorahacks.io/hackathon/buidlbattle2/detail) hackathon
