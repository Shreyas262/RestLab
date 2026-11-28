import Link from "next/link";
import { GUIDE_PATH } from "../guide-topics";
import { NavLink } from "./nav-link";

const NAV_ITEMS = [
  { href: "/", label: "Playground" },
  { href: GUIDE_PATH, label: "Guide" },
  { href: "/apis", label: "Public APIs" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-8">
        <Link
          href="/"
          className="rounded-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          RestLab
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
