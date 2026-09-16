/*
  ترويسة الموقع.
  الشعار والاسم والشعار النصي من الإعدادات — لا نصّ ثابت في الكود.
  القائمة على الجوال تُفتح كلوح سفلي بدل قائمة منسدلة صغيرة، لأن
  الإبهام يصل إلى أسفل الشاشة لا إلى أعلاها.
*/
import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogIn, LogOut, Menu, Shield, User, X } from "lucide-react";
import { ClayObject } from "@/injazi/components/ClayObject";
import { MusicPlayer } from "@/injazi/ui/MusicPlayer";
import { signOutUser } from "@/injazi/services/auth";
import { useSession, useSettings } from "@/injazi/hooks/useLive";
import { showToast } from "@/injazi/lib/toast";
import { DUR, EASE_CLAY } from "@/injazi/motion/motion";

export function SiteHeader() {
  const settings = useSettings();
  const { profile } = useSession();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  const links = [
    { to: "/", label: "الرئيسية", icon: LayoutDashboard, show: true },
    { to: "/teacher", label: "بوابة المعلمات", icon: User, show: profile?.role === "teacher" || profile?.role === "admin" },
    { to: "/admin", label: "لوحة الإدارة", icon: Shield, show: profile?.role === "admin" },
  ].filter((link) => link.show);

  async function logout() {
    await signOutUser();
    setMenu(false);
    showToast("تم تسجيل الخروج", "info");
    navigate("/");
  }

  return (
    <header className="iz-header">
      <Link to="/" className="iz-header__brand">
        {settings.logoUrl ? (
          <img className="iz-header__logo" src={settings.logoUrl} alt="" />
        ) : (
          <ClayObject name="star" tone="gold" size={38} grounded={false} />
        )}
        <span className="iz-header__text">
          <strong>{settings.platformName}</strong>
          <small>{settings.tagline}</small>
        </span>
      </Link>

      <nav className="iz-header__nav" aria-label="التنقّل الرئيسي">
        {links.map(({ to, label, icon: LinkIcon }) => (
          <NavLink key={to} to={to} end={to === "/"} className="iz-header__link">
            <LinkIcon size={16} strokeWidth={2.4} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        {profile ? (
          <button type="button" className="iz-header__link" onClick={logout}>
            <LogOut size={16} strokeWidth={2.4} aria-hidden="true" />
            خروج
          </button>
        ) : (
          <NavLink to="/login" className="iz-header__link">
            <LogIn size={16} strokeWidth={2.4} aria-hidden="true" />
            دخول
          </NavLink>
        )}
      </nav>

      <div className="iz-header__side">
        <MusicPlayer settings={settings} />
        <button
          type="button"
          className="iz-header__burger"
          onClick={() => setMenu(true)}
          aria-label="فتح القائمة"
          aria-expanded={menu}
        >
          <Menu size={20} strokeWidth={2.5} />
        </button>
      </div>

      {createPortal(
      <AnimatePresence>
        {menu && (
          <div className="iz-menu-layer">
            <motion.div
              className="iz-modal__scrim"
              onClick={() => setMenu(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="iz-menu"
              role="dialog"
              aria-label="القائمة"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: DUR.slow, ease: EASE_CLAY }}
            >
              <div className="iz-menu__head">
                <strong>{profile?.name ?? "زائرة"}</strong>
                <button type="button" className="iz-icon-btn" onClick={() => setMenu(false)} aria-label="إغلاق">
                  <X size={20} strokeWidth={2.6} />
                </button>
              </div>
              {links.map(({ to, label, icon: LinkIcon }) => (
                <NavLink key={to} to={to} end={to === "/"} className="iz-menu__link" onClick={() => setMenu(false)}>
                  <LinkIcon size={18} strokeWidth={2.4} aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
              {profile ? (
                <button type="button" className="iz-menu__link" onClick={logout}>
                  <LogOut size={18} strokeWidth={2.4} aria-hidden="true" />
                  تسجيل الخروج
                </button>
              ) : (
                <NavLink to="/login" className="iz-menu__link" onClick={() => setMenu(false)}>
                  <LogIn size={18} strokeWidth={2.4} aria-hidden="true" />
                  دخول
                </NavLink>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
        document.body,
      )}
    </header>
  );
}
