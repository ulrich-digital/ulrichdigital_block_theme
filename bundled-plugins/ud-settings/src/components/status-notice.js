import { createPortal, useEffect, useRef, useState } from "@wordpress/element";
import { __ } from "@wordpress/i18n";

const storageKey = () => `ud-settings:saved:${window.location.pathname}`;
export function rememberSavedNotice() {
 try { window.sessionStorage.setItem(storageKey(), String(Date.now())); } catch (_) { /* Storage can be disabled. */ }
}
export function consumeSavedNotice() {
 try {
  const saved = Number(window.sessionStorage.getItem(storageKey()));
  window.sessionStorage.removeItem(storageKey());
  return saved > 0 && Date.now() - saved < 30000;
 } catch (_) { return false; }
}

export default function StatusNotice({ status, children, onRemove }) {
 const [hovered, setHovered] = useState(false);
 const [focused, setFocused] = useState(false);
 const dismiss = useRef(onRemove);
 dismiss.current = onRemove;
 useEffect(() => {
  if (status !== "success" || hovered || focused) return;
  const timer = window.setTimeout(() => dismiss.current?.(), 8000);
  return () => window.clearTimeout(timer);
 }, [status, children, hovered, focused]);
 return createPortal(
  <div className="ud-settings-toast"
   onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
   onFocus={() => setFocused(true)}
   onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
   <div role={status === "error" ? "alert" : "status"}>{children}</div>
   <button type="button" onClick={onRemove} aria-label={__("Meldung schliessen", "ud-settings")}>×</button>
  </div>, document.body
 );
}
