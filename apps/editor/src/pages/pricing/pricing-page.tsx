import { useEffect, useState } from 'react';
import { Check, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import InterestDialog from '../../components/commercial/interest-dialog';
import { Button } from '../../components/ui/button';
import { CLOUD_ENABLED } from '../../lib/auth';
import {
  track,
  type CommercialPlan,
} from '../../lib/analytics';
import { hasActivatedProject } from '../../lib/product-metrics';

type PricingContentProps = {
  initialEmail?: string;
};

type PaidOffer = {
  plan: CommercialPlan;
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
};

const OFFERS: PaidOffer[] = [
  {
    plan: 'pro',
    name: 'Pro',
    price: '$9/month or $79/year',
    description: 'Production tools for individual developers.',
    features: [
      'Version history',
      'Tree validation and simulation',
      'Advanced export formats',
      'Reusable node libraries',
    ],
    cta: 'Join Pro waitlist',
  },
  {
    plan: 'team',
    name: 'Team',
    price: '$49/month',
    description: 'A shared workflow for teams of up to five.',
    features: [
      'Shared private projects',
      'Comments and review',
      'Roles and activity history',
      'Team node libraries',
    ],
    cta: 'Request Team access',
  },
  {
    plan: 'integration',
    name: 'Custom integration',
    price: 'From $2,500',
    description: 'Connect Behavior Trees to your production stack.',
    features: [
      'Unity or proprietary runtimes',
      'BehaviorTree.CPP / ROS 2',
      'Custom import and export formats',
      'Migration and onboarding',
    ],
    cta: 'Discuss an integration',
  },
];

const PricingContent: React.FC<PricingContentProps> = ({ initialEmail }) => {
  const [selectedPlan, setSelectedPlan] = useState<CommercialPlan>('pro');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    track('pricing_viewed', { activated_before_view: hasActivatedProject() });
  }, []);

  const openInterest = (plan: CommercialPlan) => {
    track('pricing_cta_clicked', { plan, placement: 'pricing_card' });
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <InterestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
        initialEmail={initialEmail}
      />

      <div className="mx-auto mb-10 max-w-3xl text-center">
        <div className="kicker mb-3 text-accent-soft">Early access</div>
        <h1 className="text-4xl font-medium tracking-[-0.02em]">From sketch to production</h1>
        <p className="mt-4 text-lg text-muted">
          The editor stays free. We are validating paid production, collaboration, and
          integration tools before building them.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="card flex flex-col">
          <div>
            <h2 className="text-2xl font-medium">Free</h2>
            <p className="mt-2 text-lg">$0</p>
            <p className="mt-3 text-sm text-muted">
              Everything needed to design and export behavior trees.
            </p>
          </div>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-muted">
            {[
              'Local projects with no account',
              'Basic cloud sync',
              'Behavior3 JSON import and export',
              'Examples and learning guides',
            ].map((feature) => (
              <li key={feature} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-soft" />
                {feature}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="mt-8 w-full">
            <Link to="/editor">Open editor</Link>
          </Button>
        </div>

        {OFFERS.map((offer) => (
          <div
            key={offer.plan}
            className={`card flex flex-col ${
              offer.plan === 'team' ? 'border-accent/60' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-medium">{offer.name}</h2>
                {offer.plan === 'integration' && (
                  <Wrench className="h-5 w-5 text-accent-soft" />
                )}
              </div>
              <p className="mt-2 text-lg">{offer.price}</p>
              <p className="mt-3 text-sm text-muted">{offer.description}</p>
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-muted">
              {offer.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-soft" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button className="mt-8 w-full" onClick={() => openInterest(offer.plan)}>
              {offer.cta}
            </Button>
            <p className="mt-3 text-center text-xs text-faint">
              Planned offering · no payment today
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PricingWithAuth: React.FC = () => {
  const { user } = useUser();
  return (
    <PricingContent initialEmail={user?.primaryEmailAddress?.emailAddress ?? ''} />
  );
};

const PricingPage: React.FC = () =>
  CLOUD_ENABLED ? <PricingWithAuth /> : <PricingContent />;

export default PricingPage;
