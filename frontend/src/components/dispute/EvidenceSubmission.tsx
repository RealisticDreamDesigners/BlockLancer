'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSubmitEvidence } from '@/hooks/useDisputeActions';
import { validateEvidence } from '@/lib/disputeUtils';
import { Dispute } from '@/types/dispute';
import { cn } from '@/lib/utils';
import {
  FileText,
  AlertTriangle,
  Info,
  Loader2,
  CheckCircle,
  Send,
  Eye,
  Edit,
} from 'lucide-react';

// ===============================================
// TYPES
// ===============================================

export interface EvidenceSubmissionProps {
  /**
   * The dispute to submit evidence for
   */
  dispute: Dispute;

  /**
   * Current user's address
   */
  currentUserAddress?: string;

  /**
   * Callback after successful submission
   */
  onSuccess?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to show as inline form (vs card)
   * @default false
   */
  inline?: boolean;
}

// ===============================================
// CONSTANTS
// ===============================================

const MIN_EVIDENCE_LENGTH = 10;
const MAX_EVIDENCE_LENGTH = 1000;

// ===============================================
// COMPONENT
// ===============================================

/**
 * EvidenceSubmission Component
 *
 * Form for submitting evidence to a dispute.
 * Includes validation, character counting, and preview mode.
 *
 * @example
 * ```tsx
 * <EvidenceSubmission
 *   dispute={dispute}
 *   currentUserAddress={userAddress}
 *   onSuccess={() => {
 *     toast.success('Evidence submitted!');
 *   }}
 * />
 * ```
 */
export function EvidenceSubmission({
  dispute,
  currentUserAddress,
  onSuccess,
  className,
  inline = false,
}: EvidenceSubmissionProps) {
  // State
  const [evidence, setEvidence] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hooks
  const { mutate: submitEvidence, isPending, isSuccess } = useSubmitEvidence();

  // User role
  const isClient = currentUserAddress === dispute.client;
  const isFreelancer = currentUserAddress === dispute.freelancer;
  const userRole = isClient ? 'client' : isFreelancer ? 'freelancer' : null;

  // Check if user already submitted
  const hasSubmitted = isClient
    ? !!dispute.clientEvidence
    : isFreelancer
    ? !!dispute.freelancerEvidence
    : false;

  // Validation
  const validation = validateEvidence(evidence);
  const charCount = evidence.length;
  const isValid = validation.isValid;
  const showError = showValidation && !isValid;

  // Character count color
  const charCountColor =
    charCount < MIN_EVIDENCE_LENGTH
      ? 'text-gray-500'
      : charCount > MAX_EVIDENCE_LENGTH * 0.9
      ? 'text-red-600 font-semibold'
      : charCount > MAX_EVIDENCE_LENGTH * 0.7
      ? 'text-orange-600'
      : 'text-green-600';

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);

    if (!isValid) return;

    submitEvidence(
      {
        disputeId: dispute.id,
        evidence,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          // Reset form
          setTimeout(() => {
            setEvidence('');
            setShowValidation(false);
            setIsPreviewMode(false);
          }, 2000);
        },
      }
    );
  };

  // Handle cancel
  const handleCancel = () => {
    if (!isPending) {
      setEvidence('');
      setShowValidation(false);
      setIsPreviewMode(false);
    }
  };

  // Auto-focus textarea
  useEffect(() => {
    if (!isPreviewMode && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isPreviewMode]);

  // If user already submitted, show message
  if (hasSubmitted) {
    return (
      <div className={cn(
        'rounded-lg border border-green-200 bg-green-50 p-4',
        className
      )}>
        <div className="flex items-center gap-3 text-green-800">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Evidence Already Submitted</p>
            <p className="text-sm mt-1">
              You have already submitted your evidence for this dispute.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not a participant
  if (!userRole) {
    return (
      <div className={cn(
        'rounded-lg border border-gray-200 bg-gray-50 p-4',
        className
      )}>
        <div className="flex items-center gap-3 text-gray-700">
          <Info className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">
            Only the client and freelancer can submit evidence for this dispute.
          </p>
        </div>
      </div>
    );
  }

  const roleColor = userRole === 'client' ? 'blue' : 'purple';

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        !inline && 'bg-white rounded-lg border border-gray-200 p-6',
        'space-y-4',
        className
      )}
    >
      {/* Header */}
      {!inline && (
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <div className={cn(
            'p-2 rounded-lg',
            userRole === 'client' ? 'bg-blue-100' : 'bg-purple-100'
          )}>
            <FileText className={cn(
              'h-5 w-5',
              userRole === 'client' ? 'text-blue-600' : 'text-purple-600'
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Submit Your Evidence</h3>
            <p className="text-sm text-gray-600">
              As the {userRole}, provide evidence to support your case
            </p>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Tips for strong evidence:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800 text-xs">
              <li>Be factual and specific</li>
              <li>Include relevant dates and details</li>
              <li>Reference contract terms if applicable</li>
              <li>Keep it professional and objective</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setIsPreviewMode(false)}
          className={cn(
            'px-4 py-2 font-medium text-sm transition-colors',
            'flex items-center gap-2',
            !isPreviewMode
              ? `border-b-2 border-${roleColor}-600 text-${roleColor}-600`
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <Edit className="h-4 w-4" />
          Write
        </button>
        <button
          type="button"
          onClick={() => setIsPreviewMode(true)}
          disabled={!evidence}
          className={cn(
            'px-4 py-2 font-medium text-sm transition-colors',
            'flex items-center gap-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isPreviewMode
              ? `border-b-2 border-${roleColor}-600 text-${roleColor}-600`
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>

      {/* Write Mode */}
      {!isPreviewMode ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Describe your evidence clearly and thoroughly. Include all relevant details that support your position..."
            rows={8}
            disabled={isPending || isSuccess}
            className={cn(
              'w-full px-4 py-3 border rounded-lg resize-none',
              'focus:ring-2 focus:border-transparent',
              'transition-all duration-200',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              userRole === 'client'
                ? 'focus:ring-blue-500'
                : 'focus:ring-purple-500',
              showError && 'border-red-500 focus:ring-red-500'
            )}
            aria-invalid={showError}
            aria-describedby={showError ? 'evidence-error' : 'evidence-hint'}
          />

          {/* Character Count */}
          <div className="flex items-center justify-between text-xs">
            <span className={charCountColor}>
              {charCount} / {MAX_EVIDENCE_LENGTH} characters
              {charCount < MIN_EVIDENCE_LENGTH &&
                ` (${MIN_EVIDENCE_LENGTH - charCount} more required)`}
            </span>
          </div>

          {/* Validation Error */}
          {showError && (
            <p id="evidence-error" className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {validation.error}
            </p>
          )}

          {/* Hint */}
          {!showError && (
            <p id="evidence-hint" className="text-xs text-gray-500">
              Provide detailed evidence ({MIN_EVIDENCE_LENGTH}-{MAX_EVIDENCE_LENGTH} characters)
            </p>
          )}
        </div>
      ) : (
        /* Preview Mode */
        <div className="space-y-2">
          <div className={cn(
            'min-h-[200px] p-4 rounded-lg border-2',
            userRole === 'client'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-purple-50 border-purple-200'
          )}>
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
              {evidence || 'Your evidence will appear here...'}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            This is how your evidence will appear to DAO members
          </p>
        </div>
      )}

      {/* Warning */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <div className="flex gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-900">
            <p className="font-medium">Important:</p>
            <p className="text-orange-800 text-xs mt-1">
              Once submitted, evidence cannot be edited or deleted. DAO members will
              review all evidence when voting on the resolution.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        {evidence && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending || isSuccess}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || isSuccess || (showValidation && !isValid)}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg font-medium transition-all',
            'flex items-center justify-center gap-2',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            isSuccess
              ? 'bg-green-600 text-white'
              : userRole === 'client'
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting Evidence...
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Evidence Submitted!
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit Evidence
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ===============================================
// INLINE VARIANT
// ===============================================

/**
 * Inline evidence submission without card wrapper
 */
export function EvidenceSubmissionInline(
  props: Omit<EvidenceSubmissionProps, 'inline'>
) {
  return <EvidenceSubmission {...props} inline />;
}

// ===============================================
// EXPORT
// ===============================================

export default EvidenceSubmission;
