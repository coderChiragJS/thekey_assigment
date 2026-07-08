"use client";

import { useI18n } from "@/i18n/context";
import { useCurrentUser } from "@/lib/current-user";

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
