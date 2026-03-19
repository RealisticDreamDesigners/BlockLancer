'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStacks } from '@/hooks/useStacks';
import { dateToBlockHeight, fetchCurrentBlockHeight } from '@/lib/blockTime';
import { AppLayout } from '@/components/layout/AppLayout';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, User, Calendar, DollarSign, FileText, Bitcoin, Coins } from 'lucide-react';

// Enhanced validation interface
interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

type TokenType = 'stx' | 'sbtc' | 'usdcx';

const TOKEN_CONFIG: Record<TokenType, { label: string; symbol: string; decimals: number; minAmount: number; maxAmount: number }> = {
  stx: { label: 'STX', symbol: 'STX', decimals: 6, minAmount: 0.000001, maxAmount: 1000000 },
  sbtc: { label: 'sBTC', symbol: 'sBTC', decimals: 8, minAmount: 0.00000001, maxAmount: 21 },
  usdcx: { label: 'USDCx', symbol: 'USDCx', decimals: 6, minAmount: 0.000001, maxAmount: 10000000 },
};

interface FormData {
  freelancer: string;
  description: string;
  totalAmount: string;
  endDate: string;
  tokenType: TokenType;
}

interface FormErrors {
  [key: string]: string;
}

export default function CreateContractPage() {
  const router = useRouter();
  
  // FIXED: Added userAddress to the destructuring
  const {
    userData,
    isSignedIn,
    createEscrow,
    createEscrowSbtc,
    createEscrowUsdcx,
    validateAddress,
    transactionInProgress,
    connectWallet,
    userAddress,
  } = useStacks();

  const [formData, setFormData] = useState<FormData>({
    freelancer: '',
    description: '',
    totalAmount: '',
    endDate: '',
    tokenType: 'stx',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [txResult, setTxResult] = useState<{ success: boolean; error?: string; txId?: string } | null>(null);

  // Prime block height cache for accurate date-to-block conversion
  useEffect(() => { fetchCurrentBlockHeight(); }, []);

  // REAL-TIME VALIDATION
  const validateField = (name: string, value: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    switch (name) {
      case 'freelancer':
        if (!value.trim()) {
          errors.push({ field: name, message: 'Worker address is required', type: 'error' });
        } else {
          const addressValidation = validateAddress(value.trim());
          if (!addressValidation) {
            errors.push({ field: name, message: 'Invalid Stacks address format', type: 'error' });
          } else {
            // Check if same as client
            const clientAddress = userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet;
            if (value.trim() === clientAddress) {
              errors.push({ field: name, message: 'Worker cannot be the same as client', type: 'error' });
            } else {
              errors.push({ field: name, message: 'Valid address', type: 'info' });
            }
          }
        }
        break;
        
      case 'description':
        if (!value.trim()) {
          errors.push({ field: name, message: 'Description is required', type: 'error' });
        } else if (value.trim().length < 10) {
          errors.push({ field: name, message: 'Description must be at least 10 characters', type: 'error' });
        } else if (value.trim().length > 500) {
          errors.push({ field: name, message: 'Description cannot exceed 500 characters', type: 'error' });
        } else {
          errors.push({ field: name, message: `${value.trim().length}/500 characters`, type: 'info' });
        }
        break;
        
      case 'totalAmount': {
        const token = TOKEN_CONFIG[formData.tokenType];
        if (!value.trim()) {
          errors.push({ field: name, message: 'Total amount is required', type: 'error' });
        } else {
          const amount = parseFloat(value);
          if (isNaN(amount) || amount <= 0) {
            errors.push({ field: name, message: 'Amount must be a positive number', type: 'error' });
          } else if (amount < token.minAmount) {
            errors.push({ field: name, message: `Minimum amount is ${token.minAmount} ${token.symbol}`, type: 'error' });
          } else if (amount > token.maxAmount) {
            errors.push({ field: name, message: `Maximum amount is ${token.maxAmount.toLocaleString()} ${token.symbol}`, type: 'warning' });
          } else {
            errors.push({ field: name, message: `${amount.toLocaleString()} ${token.symbol}`, type: 'info' });
          }
        }
        break;
      }
        
      case 'endDate':
        if (!value.trim()) {
          errors.push({ field: name, message: 'End date is required', type: 'error' });
        } else {
          const endDate = new Date(value);
          const now = new Date();
          const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
          const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
          
          if (endDate <= now) {
            errors.push({ field: name, message: 'End date must be in the future', type: 'error' });
          } else if (endDate < minDate) {
            errors.push({ field: name, message: 'End date must be at least 24 hours from now', type: 'warning' });
          } else if (endDate > maxDate) {
            errors.push({ field: name, message: 'End date cannot be more than 1 year from now', type: 'warning' });
          } else {
            const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            errors.push({ field: name, message: `${days} days from now`, type: 'info' });
          }
        }
        break;
    }
    
    return errors;
  };

  // HANDLE INPUT CHANGES WITH REAL-TIME VALIDATION
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Real-time validation
    const fieldErrors = validateField(name, value);
    setValidationErrors(prev => [
      ...prev.filter(error => error.field !== name),
      ...fieldErrors
    ]);
    
    // Clear form errors for this field
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  // COMPREHENSIVE FORM VALIDATION
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};


    // Validate freelancer address with detailed logging
    if (!formData.freelancer.trim()) {
      newErrors.freelancer = 'Worker address is required';
    } else {
      const address = formData.freelancer.trim();
      
      // FIXED: Use validateAddress correctly (returns boolean)
      const isValid = validateAddress(address);
      
      if (!isValid) {
        newErrors.freelancer = 'Invalid Stacks address format';
      } else {
      }
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Validate total amount
    if (!formData.totalAmount) {
      newErrors.totalAmount = 'Total amount is required';
    } else {
      const amount = parseFloat(formData.totalAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.totalAmount = 'Amount must be a positive number';
      }
    }

    // Validate end date
    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else {
      const endDate = new Date(formData.endDate);
      const now = new Date();
      if (endDate <= now) {
        newErrors.endDate = 'End date must be in the future';
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    
    return isValid;
  };

  // FIXED: Complete handleSubmit function with proper userAddress usage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!isSignedIn) {
      setTxResult({ success: false, error: 'Please connect your wallet first' });
      return;
    }

    // FIXED: Use the destructured userAddress
    // Employer is automatically the current user
    const clientAddress = userData?.profile?.stxAddress?.testnet || userData?.profile?.stxAddress?.mainnet;

    if (!clientAddress) {
      setTxResult({ success: false, error: 'Please connect your wallet properly' });
      return;
    }

    
    try {
      const token = TOKEN_CONFIG[formData.tokenType];
      const totalAmountSmallest = Math.floor(parseFloat(formData.totalAmount) * Math.pow(10, token.decimals));
      const endDate = new Date(formData.endDate);
      endDate.setHours(23, 59, 59);
      const endDateBlockHeight = dateToBlockHeight(endDate);

      const createFn = formData.tokenType === 'sbtc' ? createEscrowSbtc!
        : formData.tokenType === 'usdcx' ? createEscrowUsdcx!
        : createEscrow;

      const result = await createFn(
        clientAddress,
        formData.freelancer.trim(),
        formData.description.trim(),
        endDateBlockHeight,
        totalAmountSmallest
      );

      setTxResult(result);
      
      if (result.success) {
        // Reset form on success
        setFormData({
          freelancer: '',
          description: '',
          totalAmount: '',
          endDate: '',
          tokenType: 'stx',
        });
        setErrors({});
        setValidationErrors([]);
        
        // Navigate to dashboard after successful creation
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
      }
    } catch (error) {
      setTxResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  // VALIDATION DISPLAY COMPONENT
  const ValidationDisplay = ({ field }: { field: string }) => {
    const fieldErrors = validationErrors.filter(e => e.field === field);
    
    if (fieldErrors.length === 0) return null;
    
    return (
      <div className="mt-1.5 space-y-1">
        {fieldErrors.map((error, index) => (
          <div key={index} className={`flex items-center gap-1.5 text-xs ${
            error.type === 'error' ? 'text-red-600 dark:text-red-400' :
            error.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            {error.type === 'error' && <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
            {error.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
            {error.type === 'info' && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
            <span>{error.message}</span>
          </div>
        ))}
      </div>
    );
  };

  // Check if form is valid (no error-type validations)
  const hasErrors = validationErrors.some(e => e.type === 'error');
  const canSubmit = !hasErrors && formData.freelancer.trim() !== '' && formData.description.trim() !== '' && formData.totalAmount.trim() !== '' && formData.endDate.trim() !== '';

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-900/50 p-8 rounded-xl border border-gray-200 dark:border-gray-800 text-center max-w-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">You need to connect your wallet to create a contract</p>
          <button
            onClick={connectWallet}
            className="w-full px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Escrow Contract</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set up a milestone-based payment contract secured on-chain</p>
        </div>

        {/* Main Form */}
        <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Worker Address */}
              <div>
                <label htmlFor="freelancer" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  Worker Address
                </label>
                <input
                  type="text"
                  id="freelancer"
                  name="freelancer"
                  value={formData.freelancer}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 text-sm bg-white dark:bg-gray-900/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                    errors.freelancer ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  placeholder="ST2C36S11ETAE5TAE1Z1F1Q2SYTMF1FW7VQZEJNGZ"
                />
                <ValidationDisplay field="freelancer" />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Project Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-3 text-sm bg-white dark:bg-gray-900/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none ${
                    errors.description ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  placeholder="Describe the project, deliverables, and requirements..."
                />
                <ValidationDisplay field="description" />
              </div>

              {/* Total Amount */}
              <div>
                <label htmlFor="totalAmount" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  Total Amount ({TOKEN_CONFIG[formData.tokenType].symbol})
                </label>
                <input
                  type="number"
                  id="totalAmount"
                  name="totalAmount"
                  value={formData.totalAmount}
                  onChange={handleInputChange}
                  step={String(Math.pow(10, -TOKEN_CONFIG[formData.tokenType].decimals))}
                  min={String(TOKEN_CONFIG[formData.tokenType].minAmount)}
                  className={`w-full px-4 py-3 text-sm bg-white dark:bg-gray-900/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                    errors.totalAmount ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
                  }`}
                  placeholder="100.0"
                />
                <ValidationDisplay field="totalAmount" />
              </div>

              {/* Token Type Selector */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Coins className="w-4 h-4 text-gray-400" />
                  Payment Token
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { type: 'stx' as TokenType, icon: <DollarSign className="w-4 h-4" />, name: 'STX' },
                    { type: 'sbtc' as TokenType, icon: <Bitcoin className="w-4 h-4" />, name: 'sBTC' },
                    { type: 'usdcx' as TokenType, icon: <DollarSign className="w-4 h-4" />, name: 'USDCx' },
                  ]).map(({ type, icon, name }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tokenType: type }))}
                      className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                        formData.tokenType === type
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {icon}
                      {name}
                    </button>
                  ))}
                </div>
                {formData.tokenType === 'sbtc' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Amount in sBTC (8 decimal places). Requires sBTC in your wallet.
                  </p>
                )}
                {formData.tokenType === 'usdcx' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Amount in USDCx stablecoin (6 decimal places). Requires USDCx in your wallet.
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Project End Date
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 text-sm bg-white dark:bg-gray-900/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
                    errors.endDate ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
                <ValidationDisplay field="endDate" />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!canSubmit || transactionInProgress}
                  className={`w-full py-3 px-6 rounded-lg font-medium text-sm transition-all ${
                    canSubmit && !transactionInProgress
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {transactionInProgress ? 'Creating Contract...' : 'Create Escrow Contract'}
                </button>
              </div>
            </form>

            {/* Transaction Result */}
            {txResult && (
              <div className={`mt-5 p-4 rounded-lg border ${
                txResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {txResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    txResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    {txResult.success ? 'Contract Created Successfully!' : 'Contract Creation Failed'}
                  </span>
                </div>
                {txResult.error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1.5">{txResult.error}</p>
                )}
                {txResult.success && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1.5">
                    Redirecting to dashboard...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-4 flex items-start gap-3 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Secured by blockchain</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Your contract will be deployed on-chain with real-time address validation and milestone-based payments.
            </p>
          </div>
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
