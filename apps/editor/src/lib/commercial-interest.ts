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
  { value: 'evaluating', label: '仍在評估中' },
  { value: 'other', label: 'Other' },
];

export const USAGE_OPTIONS: { value: UsageMode; label: string }[] = [
  { value: 'solo', label: '僅我一人' },
  { value: 'team_2_5', label: '2–5 人團隊' },
  { value: 'team_6_20', label: '6–20 人團隊' },
  { value: 'team_21_plus', label: '21+ 人團隊' },
];

export const OBSTACLE_OPTIONS: { value: ProductionObstacle; label: string }[] = [
  { value: 'runtime_integration', label: '執行環境整合' },
  { value: 'testing_debugging', label: '測試或除錯' },
  { value: 'collaboration_review', label: '協作與審查' },
  { value: 'version_control', label: '版本控制' },
  { value: 'tree_validation', label: '樹驗證' },
  { value: 'runtime_portability', label: '跨執行環境的可攜性' },
  { value: 'learning', label: '學習行為樹' },
  { value: 'other', label: '其他' },
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
