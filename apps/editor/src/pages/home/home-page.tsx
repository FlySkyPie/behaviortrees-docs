import React from 'react';
import { Link } from 'react-router-dom';
import { CLOUD_ENABLED } from '../../lib/auth';
import { useProjectStore } from '../../stores/useProjectStore';

const HomePage: React.FC = () => {
	const project = useProjectStore((state) => state.project);

	// Nocturne is flush-left and asymmetric: content hugs the left edge and the
	// whitespace is allowed to fall on the right.
	return (
		<div className="max-w-4xl">
			<div className="mb-14 max-w-2xl">
				<div className="kicker mb-3 text-accent-soft">行為樹</div>
				<h1 className="mb-4 text-4xl font-medium tracking-[-0.02em] text-fg">
					行為樹編輯器
				</h1>
				<p className="text-xl text-muted text-pretty">
					一個免費的線上編輯器，用於創建遊戲、AI 和機器人的行為樹。
				</p>
				<p className="mt-4 text-sm text-faint text-pretty">
					剛接觸行為樹？請閱讀{' '}
					<a href="/learn/" className="text-accent-soft hover:underline">指南</a>{' '}
					或開啟範例：{' '}
					<a href="/?example=enemy-patrol" className="text-accent-soft hover:underline">敵人巡邏 AI</a>,{' '}
					<a href="/?example=open-the-door" className="text-accent-soft hover:underline">選擇器 vs 序列</a>,{' '}
					<a href="/?example=robot-pick-and-place" className="text-accent-soft hover:underline">機器人取放</a>。
					偏好經典編輯器？{' '}
					<a href="https://old.behaviortrees.com" className="text-accent-soft hover:underline">old.behaviortrees.com</a>
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-8 mb-12">
				<div className="card">
					<h2 className="text-2xl font-medium mb-4 text-fg">入門指南</h2>
					<ul className="space-y-3 text-muted">
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							建立新專案或開啟現有專案
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							以視覺化方式設計行為樹
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							匯出行為樹以在遊戲引擎中使用
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							{CLOUD_ENABLED
								? '無需帳號 — 所有資料儲存在您的瀏覽器中。若想跨裝置同步專案，才需登入。'
								: '無需帳號 — 所有資料儲存在您的瀏覽器中'}
						</li>
					</ul>

					<div className="mt-6 flex flex-col sm:flex-row gap-4">
						<Link
							to="/editor"
							className="inline-flex justify-center items-center px-4 py-2 border border-accent bg-transparent text-accent-soft rounded-md hover:bg-accent/15 transition"
						>
							{project ? '開啟編輯器' : '建立專案'}
						</Link>
						<Link
							to="/projects"
							className="inline-flex justify-center items-center px-4 py-2 border border-border bg-transparent text-fg rounded-md hover:bg-fg/7 transition"
						>
							瀏覽專案
						</Link>
					</div>
				</div>

				<div className="card">
					<h2 className="text-2xl font-medium mb-4 text-fg">功能</h2>
					<ul className="space-y-3 text-muted">
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							視覺化節點編輯器
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							標準行為樹節點（序列、選擇器等）
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							自訂節點建立
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							每個專案支援多個行為樹
						</li>
						<li className="flex items-start">
							<span className="mr-2 text-accent-soft">•</span>
							JSON 匯出/匯入
						</li>
					</ul>
				</div>
			</div>

			{project && (
				<div>
					<h2 className="mb-4 text-2xl font-medium">目前專案</h2>
					<div className="card mb-4">
						<h3 className="text-xl font-medium">{project.name}</h3>
						<p className="text-muted">{project.description}</p>
						<div className="mt-4">
							<Link
								to="/editor"
								className="inline-flex justify-center items-center px-4 py-2 border border-accent bg-transparent text-accent-soft rounded-md hover:bg-accent/15 transition"
							>
								開啟編輯器
							</Link>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default HomePage;
