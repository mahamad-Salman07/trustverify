import {
  LayoutDashboard,
  Upload,
  History,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function Sidebar() {
  const navigate = useNavigate();

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  const links = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Verify Document",
      path: "/upload",
      icon: Upload,
    },
    {
      name: "History",
      path: "/history",
      icon: History,
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-950 text-white p-5 hidden md:flex flex-col">
      <div className="flex items-center gap-2 mb-10">
        <ShieldCheck />
        <span className="font-bold text-xl">
          TRUSTVERIFY
        </span>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-xl transition ${
                  isActive
                    ? "bg-white text-slate-950"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={20} />
              {link.name}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="mt-auto flex items-center gap-3 p-3 text-slate-400 hover:text-white"
      >
        <LogOut size={20} />
        Logout
      </button>
    </aside>
  );
}