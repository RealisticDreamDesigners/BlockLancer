# BlockLancer - Secure Milestone Payments on Bitcoin

BlockLancer is a decentralized escrow and milestone payment platform built on the Stacks blockchain, providing Bitcoin-level security for freelance payments.

## 🌟 Features

- **Bitcoin Security**: All contracts secured by Bitcoin through Stacks blockchain
- **Milestone Payments**: Break projects into manageable milestones with individual payments
- **Automatic Payments**: Instant fund release when milestones are approved
- **Dispute Resolution**: Fair conflict resolution system
- **Freemium Model**: Free tier for small contracts, Pro tier for advanced features
- **Grant Support**: Perfect for funding organizations and grant programs

## 🏗️ Project Structure

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

## 🚀 Quick Start

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

## 📝 Smart Contracts

### Core Contracts

- **blocklancer-escrow.clar**: Main escrow functionality with milestone management
- **blocklancer-payments.clar**: Fee processing and user tier management
- **blocklancer-dispute.clar**: Basic dispute creation and resolution

### Key Functions

#### Escrow Contract
- `create-escrow`: Create new escrow contract
- `add-milestone`: Add milestone to existing contract
- `submit-milestone`: Submit completed work (freelancer)
- `approve-milestone`: Approve work and release payment (client)
- `reject-milestone`: Reject work with feedback (client)

#### Payments Contract
- `validate-contract-creation`: Check user tier limits
- `calculate-platform-fee`: Calculate fees for pro users
- `upgrade-to-pro`: Upgrade user to pro tier

#### Dispute Contract
- `open-dispute`: Create dispute for contract
- `submit-evidence`: Submit evidence for dispute
- `resolve-dispute`: Admin resolution (MVP version)

## 🔧 Development

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

## 🔐 Security Features

- **Bitcoin Security**: All contracts inherit Bitcoin's security through Stacks
- **Multi-signature Support**: Team approval workflows
- **Time-locked Contracts**: Automatic milestone deadlines
- **Dispute Protection**: Fair resolution mechanisms
- **Access Controls**: Role-based permissions

## 🌐 Tech Stack

### Smart Contracts
- **Clarity**: Smart contract language for Stacks
- **Clarinet**: Development toolchain

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

## 🗺️ Roadmap

### Phase 1: MVP (Current)
- ✅ Core escrow contracts
- ✅ Basic frontend with wallet integration
- ✅ Milestone management
- ✅ Simple dispute resolution

### Phase 2: Enhanced Features
- Advanced dispute voting system
- Grant-specific workflows
- User profiles and ratings
- Mobile-responsive design

### Phase 3: Ecosystem Integration
- Multi-token support (sBTC, other SRC-20s)
- Integration with Stacks DeFi protocols
- API for third-party integrations
- Advanced analytics dashboard

### Phase 4: Scale & Partnership
- Stacks Foundation partnership
- Enterprise grant management
- Cross-chain integrations
- Community governance

## 🤝 Contributing

BlockLancer is being developed as part of the Stacks Ascent Program. We welcome contributions from the community!

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

## 📄 License

This project is part of the Stacks Ascent Program. License details will be updated upon program completion.

## 🆘 Support

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive guides and API docs (coming soon)
- **Discord**: Join the Stacks Discord community (coming soon)
- **Email**: support@blocklancer.app (coming soon)

## 🏆 Acknowledgments

- **Stacks Foundation**: For the Stacks Ascent Program
- **Hiro Systems**: For excellent developer tools
- **Bitcoin Community**: For the foundational security layer
- **Open Source Contributors**: Building the future of decentralized finance

---

Built with ❤️ for the Stacks Ascent Program 2025
