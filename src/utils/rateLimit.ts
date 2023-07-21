const userRequests = new Map<string, { value: number; lastHit: number }>();

export const rateLimit = {
    hit: (userId: string): void => {
        const requests = userRequests.get(userId)?.value ?? 0;
        userRequests.set(userId, { value: requests + 1, lastHit: Date.now() });
    },
    get: (userId: string): { value: number; lastHit: number } => userRequests.get(userId) ?? { value: 0, lastHit: 0 },
    reset: (userId: string): boolean => userRequests.delete(userId)
};
