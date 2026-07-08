import type { Role } from "@/db/schema";

export interface DemoUser {
  id: string;
  name: string;
  role: Role;
}

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
