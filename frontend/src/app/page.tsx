'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useStacks } from '@/hooks/useStacks';
import {
  Shield,
  CheckCircle,
  Clock,
  Users,
  Zap,
  Bitcoin,
  ArrowRight,
  FileText,
  Scale,
  Lock,
  Award,
  ChevronRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout';
import { HeroIllustration } from '@/components/illustrations/HeroIllustration';
import { HowItWorksIllustration } from '@/components/illustrations/HowItWorksIllustration';
import { FeaturesIllustration } from '@/components/illustrations/FeaturesIllustration';
import { GovernanceIllustration } from '@/components/illustrations/GovernanceIllustration';
import { ComparisonIllustration } from '@/components/illustrations/ComparisonIllustration';
import { CTAIllustration } from '@/components/illustrations/CTAIllustration';

export default function HomePage() {
  const { isSignedIn, connectWallet } = useStacks();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateContract = () => {
    if (isSignedIn) {
      router.push('/dashboard/create');
    } else {
      connectWallet();
    }
  };

  const handleGoToDashboard = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      connectWallet();
    }
  };

  if (!mounted) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-white dark:bg-[#0a0e1a]">

        {/* ======== HERO SECTION ======== */}
        <section className="relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 dot-pattern dark:dot-pattern-dark" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-blue-950/10 dark:via-[#0a0e1a] dark:to-[#0a0e1a]" />

          {/* Hero depth glow orbs */}
          <div className="absolute top-20 right-[20%] w-72 h-72 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-[35%] w-56 h-56 bg-blue-300/8 dark:bg-blue-600/4 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              {/* Left - Copy */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                    Trustless Escrow for{' '}
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                      Workers
                    </span>
                  </h1>

                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg leading-relaxed">
                    Milestone-based payments secured by smart contracts on the Stacks blockchain.
                    No middlemen. No disputes. Just code that protects both parties.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="flex flex-col sm:flex-row gap-4 mb-8"
                >
                  <button
                    onClick={handleCreateContract}
                    className="group flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-7 py-3.5 rounded-xl font-semibold text-base transition-all shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Create Contract
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={handleGoToDashboard}
                    className="flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-7 py-3.5 rounded-xl font-semibold text-base transition-all"
                  >
                    View Dashboard
                  </button>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-500"
                >
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Open Source</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Bitcoin Settlement</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>DAO Governed</span>
                  </div>
                </motion.div>
              </div>

              {/* Right - Illustration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:flex items-center justify-center"
              >
                <HeroIllustration className="w-full" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ======== STATS BAR ======== */}
        <section className="relative border-y border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Smart Contract Security', value: 'Bitcoin-Level' },
                { label: 'Platform Fee', value: '1.5%' },
                { label: 'Dispute Resolution', value: 'DAO Voted' },
                { label: 'Payment Release', value: 'Milestone-Based' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ======== HOW IT WORKS ======== */}
        <section className="py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-12"
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    How It Works
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg">
                    Three simple steps to secure your payments
                  </p>
                </motion.div>

                <div className="space-y-8">
                  {[
                    {
                      step: '01',
                      icon: FileText,
                      title: 'Create Contract',
                      description: 'Define milestones, deadlines, and payment amounts. Funds are locked in a smart contract escrow.',
                    },
                    {
                      step: '02',
                      icon: CheckCircle,
                      title: 'Complete Work',
                      description: 'Worker submits milestones for review. Employer approves each milestone to release payment.',
                    },
                    {
                      step: '03',
                      icon: Zap,
                      title: 'Get Paid',
                      description: 'Approved payments are released instantly. No waiting, no invoicing, no chargebacks.',
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      className="flex items-start gap-4"
                    >
                      <div className="relative z-10 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-700/50 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-500 tracking-widest uppercase mb-1">
                          Step {item.step}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Illustration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex items-center justify-center"
              >
                <HowItWorksIllustration className="w-full max-w-md" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ======== FEATURES GRID ======== */}
        <section className="py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
              {/* Left - Illustration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex items-center justify-center"
              >
                <FeaturesIllustration className="w-full max-w-sm" />
              </motion.div>

              {/* Right - Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Why Choose BlockLancer?
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg">
                  Built for employers and workers who value security and transparency.
                  Every feature is designed to protect both parties.
                </p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Bitcoin,
                  title: 'Bitcoin Security',
                  description: 'Every contract is anchored to Bitcoin through Stacks, inheriting the most battle-tested security in crypto.',
                },
                {
                  icon: CheckCircle,
                  title: 'Milestone Payments',
                  description: 'Break projects into clear milestones with individual payment releases. Pay for what gets delivered.',
                },
                {
                  icon: Zap,
                  title: 'Instant Releases',
                  description: 'Approved milestones trigger immediate fund transfers. No 14-day holds like traditional platforms.',
                },
                {
                  icon: Scale,
                  title: 'DAO Dispute Resolution',
                  description: 'Disagreements are resolved by a decentralized committee vote. Fair, transparent, and community-driven.',
                },
                {
                  icon: Users,
                  title: 'Zero Middlemen',
                  description: 'Direct peer-to-peer contracts enforced by code. No account managers, no hidden fees, no gatekeepers.',
                },
                {
                  icon: Clock,
                  title: 'Deadline Protection',
                  description: 'Built-in deadline enforcement with automatic refund claims. Your funds are never stuck indefinitely.',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="group bg-white dark:bg-gray-800/40 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700/50 hover:shadow-lg dark:hover:shadow-blue-900/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-xl mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ======== BLOCKLANCER vs TRADITIONAL ======== */}
        <section className="py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Traditional Platforms vs BlockLancer
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                See what changes when you remove the middleman
              </p>
            </motion.div>

            {/* Illustration above the table */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="flex justify-center mb-12"
            >
              <ComparisonIllustration className="w-full max-w-lg" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700/50 max-w-5xl mx-auto shadow-sm"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-white">Feature</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-500 dark:text-gray-400">Upwork / Fiverr</th>
                    <th className="text-center py-4 px-6 font-semibold text-blue-600 dark:text-blue-400">BlockLancer</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Platform Fee', traditional: '5-20%', blocklancer: '1.5%' },
                    { feature: 'Payment Hold', traditional: '14 days', blocklancer: 'Instant on approval' },
                    { feature: 'Dispute Resolution', traditional: 'Platform decides', blocklancer: 'Community DAO vote' },
                    { feature: 'Fund Security', traditional: 'Trust the company', blocklancer: 'Smart contract escrow' },
                    { feature: 'Data Ownership', traditional: 'Platform owns it', blocklancer: 'On-chain, transparent' },
                    { feature: 'Censorship', traditional: 'Account bans possible', blocklancer: 'Permissionless' },
                  ].map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-t border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                        i % 2 === 0 ? 'bg-white dark:bg-gray-900/20' : 'bg-gray-50/50 dark:bg-gray-800/20'
                      }`}
                    >
                      <td className="py-3.5 px-6 font-medium text-gray-900 dark:text-white">{row.feature}</td>
                      <td className="py-3.5 px-6 text-center text-gray-500 dark:text-gray-500">{row.traditional}</td>
                      <td className="py-3.5 px-6 text-center font-medium text-blue-600 dark:text-blue-400">{row.blocklancer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>

        {/* ======== DAO GOVERNANCE ======== */}
        <section className="py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 mb-6">
                  <Scale className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Community Governed
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Disputes Resolved by the Community
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  When disagreements happen, they are not decided by a single company.
                  BlockLancer uses a DAO (Decentralized Autonomous Organization) where verified
                  committee members vote on dispute outcomes.
                </p>
                <ul className="space-y-4">
                  {[
                    'Transparent on-chain voting - every decision is verifiable',
                    'Committee members stake reputation on fair decisions',
                    'Multiple resolution options: full refund, full payment, or split',
                    '5-day voting period with early execution on consensus',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                {/* Governance Illustration */}
                <div className="hidden lg:flex justify-center">
                  <GovernanceIllustration className="w-full max-w-sm" />
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Shield, label: 'Protected Escrow', value: 'Smart Contract' },
                    { icon: Users, label: 'DAO Members', value: 'Committee' },
                    { icon: Award, label: 'Reputation Score', value: '0-1000 Points' },
                    { icon: Lock, label: 'Immutable Records', value: 'On-Chain' },
                  ].map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white dark:bg-gray-800/40 rounded-xl p-5 border border-gray-200 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <card.icon className="h-8 w-8 text-blue-500 dark:text-blue-400 mb-3" />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{card.value}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-500">{card.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ======== CTA SECTION ======== */}
        <section className="relative py-20 lg:py-24 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700" />
          <div className="absolute inset-0 dot-pattern opacity-10" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Illustration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="hidden lg:flex items-center justify-center"
              >
                <CTAIllustration className="w-full max-w-xs" />
              </motion.div>

              {/* Right - CTA content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center lg:text-left"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-lg text-blue-100 mb-8 max-w-lg">
                  Join the future of trustless payments. Create your first escrow
                  contract in minutes, secured by Bitcoin.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={handleCreateContract}
                    className="group flex items-center justify-center gap-2 bg-white text-blue-600 hover:text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Create Your First Contract
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => router.push('/jobs')}
                    className="flex items-center justify-center gap-2 border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-all"
                  >
                    Browse Jobs
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}
