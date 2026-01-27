// lib/utils/time.ts
import type { PreflightRecord } from '$lib/types';

export function getDisplayElapsedMs(record: PreflightRecord): number {
	const elapsedMs = Number.isFinite(record.elapsedMs) ? record.elapsedMs : 0;
	if (record.completedAt) {
		const wallTime = Math.max(0, record.completedAt - record.createdAt);
		return elapsedMs ? Math.min(elapsedMs, wallTime) : wallTime;
	}
	return elapsedMs;
}

export function formatDuration(ms: number): string {
	if (ms < 0) ms = 0;
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return [
		hours.toString().padStart(2, '0'),
		minutes.toString().padStart(2, '0'),
		seconds.toString().padStart(2, '0')
	].join(':');
}
