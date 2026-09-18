import { Bell, User } from "lucide-react";

export default function Navbar({ title }) {
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <h1 className="font-bold text-xl">{title}</h1>

      <div className="flex items-center gap-5">
        <Bell size={20} />

        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 rounded-full">
            <User size={18} />
          </div>

          <span className="hidden sm:block text-sm font-medium">
            User
          </span>
        </div>
      </div>
    </header>
  );
}