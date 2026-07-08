"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/context";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { UserSwitcher } from "./UserSwitcher";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const isSaved = pathname.startsWith("/saved");

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand">
            {t("app.title")}
            <small>{t("app.tagline")}</small>
          </div>
          <nav className="nav" aria-label="Primary">
            <Link href="/feed" className={isSaved ? "" : "active"}>
              {t("nav.feed")}
            </Link>
            <Link href="/saved" className={isSaved ? "active" : ""}>
              {t("nav.saved")}
            </Link>
          </nav>
          <div className="toolbar">
            <UserSwitcher />
            <LocaleSwitcher />
          </div>
        </div>
      </header>
      <main className="main">{children}</main>
    </>
  );
}
