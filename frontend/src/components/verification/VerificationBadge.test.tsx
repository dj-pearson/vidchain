import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VerificationBadge, InlineVerificationBadge, FloatingVerificationBadge } from './VerificationBadge';

describe('VerificationBadge', () => {
  describe('default variant', () => {
    it('renders verified status correctly', () => {
      render(<VerificationBadge status="verified" tokenId={123} />);
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('/verify/123'));
    });

    it('renders pending status correctly', () => {
      render(<VerificationBadge status="pending" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders unverified status correctly', () => {
      render(<VerificationBadge status="unverified" />);
      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });

    it('renders expired status correctly', () => {
      render(<VerificationBadge status="expired" />);
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });
  });

  describe('minimal variant', () => {
    it('renders minimal badge correctly', () => {
      render(<VerificationBadge status="verified" variant="minimal" />);
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });
  });

  describe('detailed variant', () => {
    it('renders detailed badge with additional info', () => {
      render(
        <VerificationBadge
          status="verified"
          variant="detailed"
          tokenId={123}
          timestamp="2024-01-15T12:00:00Z"
        />
      );
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText(/Token ID: #123/)).toBeInTheDocument();
    });

    it('shows view certificate link when showLink is true', () => {
      render(
        <VerificationBadge
          status="verified"
          variant="detailed"
          tokenId={123}
          showLink={true}
        />
      );
      expect(screen.getByText('View certificate')).toBeInTheDocument();
    });
  });

  describe('size variations', () => {
    it('applies correct size classes', () => {
      const { rerender } = render(<VerificationBadge status="verified" size="sm" />);
      expect(screen.getByRole('link')).toHaveClass('px-2');

      rerender(<VerificationBadge status="verified" size="md" />);
      expect(screen.getByRole('link')).toHaveClass('px-3');

      rerender(<VerificationBadge status="verified" size="lg" />);
      expect(screen.getByRole('link')).toHaveClass('px-4');
    });
  });
});

describe('InlineVerificationBadge', () => {
  it('renders as minimal variant', () => {
    render(<InlineVerificationBadge status="verified" tokenId={456} />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });
});

describe('FloatingVerificationBadge', () => {
  it('applies position classes correctly', () => {
    const { rerender, container } = render(
      <FloatingVerificationBadge status="verified" position="top-right" />
    );
    expect(container.firstChild).toHaveClass('top-3', 'right-3');

    rerender(<FloatingVerificationBadge status="verified" position="bottom-left" />);
    expect(container.firstChild).toHaveClass('bottom-3', 'left-3');
  });
});
