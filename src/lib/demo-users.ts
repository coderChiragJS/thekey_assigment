import type { Role } from "@/db/schema";

export interface DemoUser {
  id: string;
  name: string;
  role: Role;
}

/**
 * The seeded identities, surfaced in a dev-only user switcher. Since we don't
 * build a real login, switching here changes the x-user-id / x-role headers the
 * client sends — which makes the authorization rules directly demonstrable
 * (e.g. switch to Linus and the TypeScript course feed 403s).
 */
export const DEMO_USERS: DemoUser[] = [
  { id: "user_ada", name: "Ada Lovelace", role: "student" },
  { id: "user_grace", name: "Grace Hopper", role: "student" },
  { id: "user_linus", name: "Linus Torvalds", role: "student" },
  { id: "user_mod", name: "Margaret Hamilton", role: "moderator" },
];

export interface Auth {
  userId: string;
  role: Role;
}
