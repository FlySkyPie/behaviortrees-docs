import { Boxes, CircleHelp, Play, Sparkles, Wand2, type LucideIcon } from 'lucide-react';
import type { NodeCategory } from '../types';

export interface CategoryMeta {
	/** Plural label for panel tabs and headings. */
	title: string;
	/** The uppercase micro-label printed above a node's name on the canvas. */
	kicker: string;
	icon: LucideIcon;
	/** Tailwind colour suffix, i.e. `cat-composite` -> `text-cat-composite`. */
	tone: string;
	hasSource: boolean;
	hasTarget: boolean;
}

/**
 * The one source of truth for category presentation and connection arity.
 * Previously this lived in two places that had already drifted: a `-500` solid
 * map in nodes-panel.tsx and a `-50/-200/-900` tint map spread across five
 * per-category node components.
 */
export const NODE_CATEGORIES: Record<NodeCategory, CategoryMeta> = {
	composite: {
		title: '複合節點',
		kicker: '複合',
		icon: Boxes,
		tone: 'cat-composite',
		hasSource: true,
		hasTarget: true,
	},
	decorator: {
		title: '裝飾節點',
		kicker: '裝飾',
		icon: Wand2,
		tone: 'cat-decorator',
		hasSource: true,
		hasTarget: true,
	},
	action: {
		title: '動作節點',
		kicker: '動作',
		icon: Play,
		tone: 'cat-action',
		hasSource: false,
		hasTarget: true,
	},
	condition: {
		title: '條件節點',
		kicker: '條件',
		icon: CircleHelp,
		tone: 'cat-condition',
		hasSource: false,
		hasTarget: true,
	},
	root: {
		title: '根節點',
		kicker: '根',
		icon: Sparkles,
		tone: 'cat-root',
		hasSource: true,
		hasTarget: false,
	},
};

export const CATEGORY_ORDER: NodeCategory[] = [
	'composite',
	'decorator',
	'action',
	'condition',
	'root',
];

export function categoryMeta(category: string): CategoryMeta {
	return NODE_CATEGORIES[category as NodeCategory] ?? NODE_CATEGORIES.action;
}

/**
 * Tailwind can only see class names it finds as complete literals in source,
 * so the per-category utilities are enumerated here rather than interpolated.
 */
export const CATEGORY_RAIL: Record<NodeCategory, string> = {
	composite: 'bg-cat-composite',
	decorator: 'bg-cat-decorator',
	action: 'bg-cat-action',
	condition: 'bg-cat-condition',
	root: 'bg-cat-root',
};

export const CATEGORY_TEXT: Record<NodeCategory, string> = {
	composite: 'text-cat-composite',
	decorator: 'text-cat-decorator',
	action: 'text-cat-action',
	condition: 'text-cat-condition',
	root: 'text-cat-root',
};
