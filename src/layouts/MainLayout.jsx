import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function MainLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1">
        <Navbar title={title} />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}