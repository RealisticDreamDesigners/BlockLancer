'use client';

import React, { useState } from 'react';
import { Dispute, ResolutionType } from '@/types/dispute';
import { proposeDisputeResolution } from '@/lib/daoContract';
import { cn } from '@/lib/utils';
import { X, AlertCircle, CheckCircle2, Loader2, Scale, DollarSign, Split } from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface CreateProposalModalProps {
  /**
   * The dispute to create a proposal for
   */
  dispute: Dispute;

  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;

  /**
   * Callback when proposal is created successfully
   */
  onSuccess?: (txId: string) => void;
}

// ===============================================
// COMPONENT
// ===============================================

/**
 * CreateProposalModal Component
 *
 * Modal for DAO members to create dispute resolution proposals.
 * Allows selecting resolution type and providing justification.
 */
export function CreateProposalModal({
  dispute,
  isOpen,
  onClose,
  onSuccess,
}: CreateProposalModalProps) {
  const [selectedResolution, setSelectedResolution] = useState<ResolutionType>(ResolutionType.PENDING);
  const [description, setDescription] = useState('-');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Resolution options
  const resolutionOptions = [
    {
      type: ResolutionType.CLIENT_WINS,
      label: 'Refund Client',
      description: 'Return payment to client',
      icon: DollarSign,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      type: ResolutionType.FREELANCER_WINS,
      label: 'Pay Worker',
      description: 'Release payment to freelancer',
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-50 border-green-200',
    },
    {
      type: ResolutionType.SPLIT,
      label: 'Split Funds',
      description: 'Split payment 50/50',
      icon: Split,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (selectedResolution === ResolutionType.PENDING) {
      setError('Please select a resolution type');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description for your proposal');
      return;
    }

    if (description.length > 500) {
      setError('Description must be 500 characters or less');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create proposal description with resolution type
      const proposalDescription = `Resolution: ${
        selectedResolution === ResolutionType.CLIENT_WINS
          ? 'Refund Client'
          : selectedResolution === ResolutionType.FREELANCER_WINS
          ? 'Pay Worker'
          : 'Split Funds 50/50'
      }. Justification: ${description}`;

      const result = await proposeDisputeResolution(dispute.id, proposalDescription);

      if (result.success) {
        setSuccess(true);
        if (onSuccess && result.txId) {
          onSuccess(result.txId);
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          // Reset form
          setSelectedResolution(ResolutionType.PENDING);
          setDescription('-');
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to create proposal');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center gap-3">
            <Scale className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Dispute Resolution Proposal
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Dispute #{dispute.id} - Contract #{dispute.contractId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Dispute Info */}
          <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Dispute Details</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-600 dark:text-gray-400">Reason:</span> {dispute.reason}</p>
              <p><span className="text-gray-600 dark:text-gray-400">Employer:</span> {dispute.client}</p>
              <p><span className="text-gray-600 dark:text-gray-400">Worker:</span> {dispute.freelancer}</p>
            </div>
          </div>

          {/* Resolution Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Proposed Resolution *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {resolutionOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setSelectedResolution(option.type)}
                    className={cn(
                      'p-4 border-2 rounded-lg transition-all text-left',
                      selectedResolution === option.type
                        ? option.color + ' border-current'
                        : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 mb-2',
                      selectedResolution === option.type ? 'opacity-100' : 'opacity-50'
                    )} />
                    <div className="font-semibold text-gray-900 dark:text-white">{option.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description/Justification */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Justification *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain why you believe this resolution is fair..."
              rows={6}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Provide detailed reasoning for your proposed resolution
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {description.length}/500
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                Proposal created successfully! Other DAO members can now vote.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Proposal...
                </>
              ) : (
                'Create Proposal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProposalModal;
