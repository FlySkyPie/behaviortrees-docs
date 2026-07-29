import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { identifyUser, resetUser, track } from '../../lib/analytics';
import { startCloudSync, stopCloudSync } from '../../lib/storage/cloud-sync';
import { listLocalProjects } from '../../lib/storage/local-projects';

// Bridges the Clerk session to the (non-React) sync engine. Rendered only
// inside ClerkProvider, so it must live behind the CLOUD_ENABLED gate.
const CloudSyncController: React.FC = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      // Fetch the token at request time so it is always fresh
      startCloudSync(() => getToken());
      return () => stopCloudSync();
    }
    stopCloudSync();
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      identifyUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? undefined,
      });
      const key = `bt-analytics-signed-in-${user.id}`;
      if (sessionStorage.getItem(key) !== '1') {
        sessionStorage.setItem(key, '1');
        track('user_signed_in', { had_local_projects: listLocalProjects().length > 0 });
      }
    } else {
      resetUser();
    }
  }, [isLoaded, user]);

  return null;
};

export default CloudSyncController;
