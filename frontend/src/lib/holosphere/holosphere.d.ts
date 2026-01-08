// Type declarations for holosphere module
declare module 'holosphere' {
	export interface HoloSphereConfig {
		appName?: string;
		relays?: string[];
		privateKey?: string;
		logLevel?: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
		persistence?: boolean;
		backgroundSync?: boolean;
		syncInterval?: number;
		maxRetries?: number;
	}

	export default class HoloSphere {
		constructor(config?: HoloSphereConfig);
		init(): Promise<void>;

		// Core CRUD operations
		read(holonId: string, lens: string, key?: string): Promise<any>;
		write(holonId: string, lens: string, data: any, options?: { blocking?: boolean }): Promise<void>;
		update(
			holonId: string,
			lens: string,
			key: string,
			updates: any,
			options?: { blocking?: boolean }
		): Promise<void>;
		delete(holonId: string, lens: string, key?: string, options?: { blocking?: boolean }): Promise<void>;
		getAll(holonId: string, lens: string): Promise<Record<string, any>>;

		// Global operations
		readGlobal(table: string, key?: string): Promise<any>;
		writeGlobal(table: string, data: any): Promise<void>;
		getAllGlobal(table: string): Promise<Record<string, any>>;

		// Subscription
		subscribe(
			holonId: string,
			lens: string,
			callback: (data: any, key: string) => void,
			options?: {
				throttle?: number;
				filter?: (data: any) => boolean;
				resolveHolograms?: boolean;
				realtimeOnly?: boolean;
			}
		): Promise<{ unsubscribe: () => void }>;

		// Federation
		federate(
			sourceHolonId: string,
			targetHolonId: string,
			lens: string,
			options?: { direction?: string; mode?: string }
		): Promise<void>;
		getFederatedData(holonId: string, lens: string, options?: any): Promise<any>;

		// Spatial
		toHolon(lat: number, lng: number, resolution: number): Promise<string>;
		getParents(holonId: string, maxResolution?: number): Promise<string[]>;
		getChildren(holonId: string): Promise<string[]>;

		// Utility
		metrics(): any;
		getCacheStatus(): any;
		clearCaches(): void;
	}

	export class ValidationError extends Error {}
	export class AuthorizationError extends Error {}
}
