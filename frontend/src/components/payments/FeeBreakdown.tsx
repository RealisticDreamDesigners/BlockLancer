'use client';

interface FeeBreakdownProps {
  grossAmount: number;
  feeRate: number; // basis points, e.g. 150 = 1.5%
  isPro: boolean;
}

export function FeeBreakdown({ grossAmount, feeRate, isPro }: FeeBreakdownProps) {
  const feeAmount = isPro ? Math.floor((grossAmount * feeRate) / 10000) : 0;
  const netAmount = grossAmount - feeAmount;

  const formatSTX = (amount: number) => {
    return (amount / 1_000_000).toFixed(6);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Breakdown</h4>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Gross Amount</span>
        <span className="text-gray-900 dark:text-white">{formatSTX(grossAmount)} STX</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          Platform Fee {isPro ? `(${(feeRate / 100).toFixed(1)}%)` : '(Free tier - no fee)'}
        </span>
        <span className={feeAmount > 0 ? 'text-red-500' : 'text-green-500'}>
          {feeAmount > 0 ? '-' : ''}{formatSTX(feeAmount)} STX
        </span>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-sm font-medium">
        <span className="text-gray-700 dark:text-gray-300">Net to Freelancer</span>
        <span className="text-green-600 dark:text-green-400">{formatSTX(netAmount)} STX</span>
      </div>
    </div>
  );
}
