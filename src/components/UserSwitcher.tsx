"use client";

import { useI18n } from "@/i18n/context";
import { useCurrentUser } from "@/lib/current-user";

/**
 * Dev-only identity switcher. Stands in for a real login: choosing a user sets
 * the x-user-id / x-role headers the client sends, making the authorization
 * rules directly observable in the UI.
 */
export function UserSwitcher() {
  const { t } = useI18n();
  const { user, users, setUserId } = useCurrentUser();

  return (
    <label className="control">
      {t("toolbar.viewingAs")}
      <select
        className="select"
        value={user.id}
        onChange={(e) => setUserId(e.target.value)}
        aria-label={t("toolbar.viewingAs")}
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} · {t(u.role === "moderator" ? "role.moderator" : "role.student")}
          </option>
        ))}
      </select>
    </label>
  );
}
