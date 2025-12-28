import { cn } from '@/lib/utils';
import { CheckCircle, Clock, AlertCircle, Shield, ExternalLink } from 'lucide-react';

type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'expired';
type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'default' | 'minimal' | 'detailed';

interface VerificationBadgeProps {
  status: VerificationStatus;
  tokenId?: number;
  transactionHash?: string;
  timestamp?: string;
  size?: BadgeSize;
  variant?: BadgeVariant;
  showLink?: boolean;
  className?: string;
}

/**
 * VerificationBadge - An embeddable badge showing video verification status
 * Can be used by news organizations to display video authenticity
 */
export function VerificationBadge({
  status,
  tokenId,
  transactionHash,
  timestamp,
  size = 'md',
  variant = 'default',
  showLink = true,
  className,
}: VerificationBadgeProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vidchain.io';

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          label: 'Verified',
          description: 'Authenticity confirmed on blockchain',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-700 dark:text-green-400',
          iconColor: 'text-green-600 dark:text-green-500',
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          description: 'Verification in progress',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-700 dark:text-yellow-400',
          iconColor: 'text-yellow-600 dark:text-yellow-500',
        };
      case 'expired':
        return {
          icon: AlertCircle,
          label: 'Expired',
          description: 'Verification has expired',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-700 dark:text-gray-400',
          iconColor: 'text-gray-600 dark:text-gray-500',
        };
      default:
        return {
          icon: AlertCircle,
          label: 'Unverified',
          description: 'Not verified on blockchain',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-700 dark:text-red-400',
          iconColor: 'text-red-600 dark:text-red-500',
        };
    }
  };

  const sizeConfig = {
    sm: {
      container: 'px-2 py-1',
      icon: 'h-3.5 w-3.5',
      text: 'text-xs',
      logo: 'h-3 w-3',
    },
    md: {
      container: 'px-3 py-2',
      icon: 'h-4 w-4',
      text: 'text-sm',
      logo: 'h-4 w-4',
    },
    lg: {
      container: 'px-4 py-3',
      icon: 'h-5 w-5',
      text: 'text-base',
      logo: 'h-5 w-5',
    },
  };

  const config = getStatusConfig();
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  const verifyUrl = tokenId ? `${baseUrl}/verify/${tokenId}` : `${baseUrl}/verify`;

  // Minimal variant - just icon and status
  if (variant === 'minimal') {
    return (
      <a
        href={verifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border transition-opacity hover:opacity-80',
          config.bgColor,
          config.borderColor,
          sizes.container,
          className
        )}
        title={`VidChain: ${config.label} - ${config.description}`}
      >
        <Icon className={cn(sizes.icon, config.iconColor)} />
        <span className={cn(sizes.text, 'font-medium', config.textColor)}>
          {config.label}
        </span>
      </a>
    );
  }

  // Detailed variant - full information card
  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'rounded-lg border p-4',
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn('rounded-full p-2', config.bgColor)}>
            <Icon className={cn('h-6 w-6', config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('font-semibold', config.textColor)}>
                {config.label}
              </span>
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">VidChain</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {config.description}
            </p>
            {(tokenId || timestamp) && (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {tokenId && <p>Token ID: #{tokenId}</p>}
                {timestamp && (
                  <p>Verified: {new Date(timestamp).toLocaleDateString()}</p>
                )}
              </div>
            )}
            {showLink && (
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View certificate
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <a
      href={verifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border transition-all hover:shadow-sm',
        config.bgColor,
        config.borderColor,
        sizes.container,
        className
      )}
    >
      <Icon className={cn(sizes.icon, config.iconColor)} />
      <div className="flex flex-col">
        <span className={cn(sizes.text, 'font-medium leading-tight', config.textColor)}>
          {config.label}
        </span>
        {size !== 'sm' && (
          <span className="text-xs text-muted-foreground leading-tight">
            VidChain Verified
          </span>
        )}
      </div>
      {showLink && size === 'lg' && (
        <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
      )}
    </a>
  );
}

/**
 * Inline verification badge for use within text content
 */
export function InlineVerificationBadge({
  status,
  tokenId,
}: {
  status: VerificationStatus;
  tokenId?: number;
}) {
  return (
    <VerificationBadge
      status={status}
      tokenId={tokenId}
      size="sm"
      variant="minimal"
      showLink={true}
    />
  );
}

/**
 * Floating verification badge that can be positioned over video players
 */
export function FloatingVerificationBadge({
  status,
  tokenId,
  position = 'top-right',
  className,
}: {
  status: VerificationStatus;
  tokenId?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}) {
  const positionClasses = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  };

  return (
    <div className={cn('absolute z-10', positionClasses[position], className)}>
      <VerificationBadge
        status={status}
        tokenId={tokenId}
        size="sm"
        variant="minimal"
        showLink={true}
      />
    </div>
  );
}
