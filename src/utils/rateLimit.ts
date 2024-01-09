const userRequests = new Map<string, { value: number; lastHit: number }>();

export const rateLimit = {
    hit: (userId: string): void => {
        const requests = userRequests.get(userId)?.value ?? 0;
        userRequests.set(userId, { value: requests + 1, lastHit: Date.now() });
    },
    get: (userId: string): { value: number; lastHit: number } => userRequests.get(userId) ?? { value: 0, lastHit: 0 },
    reset: (userId: string): boolean => userRequests.delete(userId),
    // todo - old user hits should be cleared at an interval
    clearOld: (): void => {
        for (const [userId, { lastHit }] of userRequests.entries()) {
            // older than 24 hours
            if (lastHit < Date.now() - 24 * 60 * 60 * 1000) {
                userRequests.delete(userId);
            }
        }
    }
};
