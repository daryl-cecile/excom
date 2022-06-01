
export const Realms = {
	BACKGROUND: 'background-script',
	POPUP: 'popup-script',
	CONTENT: 'content-script'
} as const;

export type Realm = typeof Realms[keyof typeof Realms];