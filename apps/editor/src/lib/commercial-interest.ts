import type {
  CommercialPlan,
  ProductionObstacle,
  RuntimeSegment,
  UsageMode,
} from './analytics';

export type CommercialInterestInput = {
  email: string;
  plan: CommercialPlan;
  runtime: RuntimeSegment;
  usageMode: UsageMode;
  obstacle: ProductionObstacle;
  obstacleDetail?: string;
  sourcePath: string;
  contactConsent: boolean;
  website?: string;
};

export const RUNTIME_OPTIONS: { value: RuntimeSegment; label: string }[] = [
  { value: 'unity', label: 'Unity' },
  { value: 'unreal', label: 'Unreal Engine' },
  { value: 'godot', label: 'Godot' },
  { value: 'behaviortree_cpp_ros2', label: 'BehaviorTree.CPP / ROS 2' },
  { value: 'custom_engine', label: 'Custom game engine' },
  { value: 'javascript_web', label: 'JavaScript / web' },
  { value: 'evaluating', label: 'Still evaluating' },
  { value: 'other', label: 'Other' },
];

export const USAGE_OPTIONS: { value: UsageMode; label: string }[] = [
  { value: 'solo', label: 'Just me' },
  { value: 'team_2_5', label: 'Team of 2–5' },
  { value: 'team_6_20', label: 'Team of 6–20' },
  { value: 'team_21_plus', label: 'Team of 21+' },
];

export const OBSTACLE_OPTIONS: { value: ProductionObstacle; label: string }[] = [
  { value: 'runtime_integration', label: 'Runtime integration' },
  { value: 'testing_debugging', label: 'Testing or debugging' },
  { value: 'collaboration_review', label: 'Collaboration and review' },
  { value: 'version_control', label: 'Version control' },
  { value: 'tree_validation', label: 'Tree validation' },
  { value: 'runtime_portability', label: 'Portability between runtimes' },
  { value: 'learning', label: 'Learning behavior trees' },
  { value: 'other', label: 'Other' },
];

export async function submitCommercialInterest(
  input: CommercialInterestInput
): Promise<void> {
  const response = await fetch('/api/interest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (response.ok) return;

  let message = response.statusText || 'Request failed';
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) message = body.error;
  } catch {
    // Keep the HTTP status text for non-JSON responses.
  }
  throw new Error(message);
}
