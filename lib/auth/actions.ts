// Sign-in moved from a Server Action to a native form POST against
// /api/auth/signin (see app/api/auth/signin/route.ts). Server Actions can race
// the cookie write against the client RSC navigation; a Route Handler with a
// 303 redirect is bulletproof. This file is intentionally empty — kept around
// only because the dev mount can't delete files. Safe to remove later.

export {};
