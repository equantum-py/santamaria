"use client";

import Link from "next/link";
import { adminModules, demoProfiles } from "./demo-data";
import { useDemoProfile } from "@/lib/admin/client-state";

export function AdminModuleFrame({ title, children }: { title: string; children: React.ReactNode }) {
  const [profileId, setProfileId] = useDemoProfile();
  const profile = demoProfiles.find((item) => item.id === profileId) ?? demoProfiles[0];
  const moduleLinks = adminModules.filter((item) => ["dashboard", "pos", "caja"].includes(item.id) && profile.allowedModules.includes(item.id));

  return (
    <div className="sm-admin">
      <header className="admin-topbar admin-module-topbar">
        <div className="admin-breadcrumb"><span>Santa María</span><span aria-hidden="true">›</span><strong>{title}</strong></div>
        <div className="admin-topbar-actions">
          <span className="admin-top-demo"><span className="admin-demo-dot" /> Datos simulados</span>
          <label className="admin-profile-select-label" htmlFor="admin-demo-profile">Perfil demo</label>
          <select id="admin-demo-profile" className="admin-profile-select" value={profileId} onChange={(event) => setProfileId(event.target.value)} aria-label="Cambiar perfil de demostración">
            {demoProfiles.map((item) => <option value={item.id} key={item.id}>{item.role}</option>)}
          </select>
          <span className="admin-top-avatar" aria-hidden="true">{profile.initials}</span>
        </div>
      </header>
      <main className="admin-content admin-module-content">
        <div className="admin-module-links" aria-label="Módulos disponibles">
          {moduleLinks.map((item) => <Link key={item.id} href={item.id === "dashboard" ? "/admin" : `/admin/${item.id}`} aria-current={item.label === title ? "page" : undefined}>{item.label}</Link>)}
        </div>
        {!profile.allowedModules.includes(title === "Punto de venta" ? "pos" : "caja") ? (
          <section className="admin-panel admin-access-note"><h1>Módulo no visible para este perfil</h1><p>Elegí un perfil de demostración con acceso visual a {title}.</p></section>
        ) : children}
        <footer className="admin-footer"><span>Santa María Admin · Demo funcional, sin operaciones reales</span><span>Etapa 02 · POS y Caja</span></footer>
      </main>
    </div>
  );
}
