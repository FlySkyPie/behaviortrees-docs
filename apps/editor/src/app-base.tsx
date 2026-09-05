import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useProjectStore } from './stores/useProjectStore';
import { useTheme } from './lib/theme';
import { Toaster } from 'sonner';
import AppLayout from './components/layouts/app-layout';
import ExampleLoader from './components/example-loader';
import HomePage from './pages/home/home-page';
import EditorPage from './pages/editor/editor-page';
import ProjectsPage from './pages/projects/projects-page';
import SettingsPage from './pages/settings/settings-page';
import AdminPage from './pages/admin/admin-page';
import PrivacyPage from './pages/privacy/privacy-page';
import ProductAnalyticsTracker from './components/analytics/product-analytics-tracker';

import './index.css';

function App() {
	const restoreLastProject = useProjectStore((state) => state.restoreLastProject);
	const base = (import.meta as Record<string, any>).env.BASE_URL || '/';

	// Reopen the last project on startup, like the old editor's recents
	useEffect(() => {
		restoreLastProject();
	}, [restoreLastProject]);

	// Theme is applied before first paint by the inline script in index.html;
	// useTheme only keeps it in sync with OS and cross-tab changes.
	const { resolved } = useTheme();

	return (
		<BrowserRouter basename={base}>
			<Toaster position="bottom-right" theme={resolved} />
			<ExampleLoader />
			<ProductAnalyticsTracker />
			<AppLayout>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/editor" element={<EditorPage />} />
					<Route path="/projects" element={<ProjectsPage />} />
					<Route path="/settings" element={<SettingsPage />} />
					<Route path="/privacy" element={<PrivacyPage />} />
					<Route path="/admin" element={<AdminPage />} />
				</Routes>
			</AppLayout>
		</BrowserRouter>
	);
}

export default App;
