/*
  شريط القسم
  ------------------------------------------------------------------
  رابطان فقط. المؤشّر النشط عنصر واحد مشترك ينزلق بين الرابطين
  (layoutId) بدل أن يظهر ويختفي — فيقرأ الطفل الانتقال كحركة واحدة.
*/
import { NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { BookHeart, Home } from "lucide-react";
import { DUR, EASE_CLAY } from "@/injazi/motion/motion";

const LINKS = [
  { to: "/injazi", label: "الرئيسية", icon: Home, end: true },
  { to: "/injazi/journal", label: "دفتري", icon: BookHeart, end: false },
];

export function InjaziNav() {
  return (
    <nav className="iz-nav" aria-label="أقسام إنجازي يحكي">
      <div className="iz-nav__inner">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="iz-nav__link">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="iz-nav-active"
                    className="iz-nav__pill"
                    transition={{ duration: DUR.base, ease: EASE_CLAY }}
                  />
                )}
                <span className="iz-nav__content">
                  <Icon size={18} strokeWidth={2.4} aria-hidden="true" />
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
