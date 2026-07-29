import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useProjectStore } from '../../stores/useProjectStore';
import { track } from '../../lib/analytics';
import {
  getProjectOrigin,
  recordSubstantialProject,
} from '../../lib/product-metrics';

const ProductAnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const project = useProjectStore((state) => state.project);

  // One event per navigation to /editor: reading the project imperatively
  // keeps async project hydration and project switches from re-firing it.
  useEffect(() => {
    if (location.pathname !== '/editor') return;
    const current = useProjectStore.getState().project;
    track('editor_session_started', {
      has_project: current !== null,
      project_origin: current ? getProjectOrigin(current.id) : 'unknown',
    });
  }, [location.pathname]);

  useEffect(() => {
    if (project) recordSubstantialProject(project);
  }, [project]);

  return null;
};

export default ProductAnalyticsTracker;
