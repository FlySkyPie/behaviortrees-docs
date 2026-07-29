import { describe, expect, it } from 'vitest';
import { validateCommercialInterest } from './interest-validate.js';

const valid = {
  email: 'Developer@example.com',
  plan: 'team',
  runtime: 'unity',
  usageMode: 'team_2_5',
  obstacle: 'collaboration_review',
  obstacleDetail: 'We review exported trees in pull requests.',
  sourcePath: '/pricing',
  contactConsent: true,
  website: '',
};

describe('commercial interest validation', () => {
  it('accepts a complete request', () => {
    const result = validateCommercialInterest(valid);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.interest.plan).toBe('team');
  });

  it('rejects invalid emails and missing consent', () => {
    expect(validateCommercialInterest({ ...valid, email: 'not-email' }).ok).toBe(false);
    const noConsent = validateCommercialInterest({ ...valid, contactConsent: false });
    expect(noConsent).toEqual({
      ok: false,
      error: 'Confirm that we may contact you about this request',
    });
  });

  it('limits free-form details', () => {
    expect(
      validateCommercialInterest({
        ...valid,
        obstacleDetail: 'x'.repeat(1001),
      }).ok
    ).toBe(false);
  });
});
