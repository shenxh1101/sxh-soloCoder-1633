import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Home,
  Calendar,
  Users,
  UserCog,
  BarChart3,
  Settings,
  Scissors,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "首页", icon: Home },
  { path: "/appointments", label: "预约管理", icon: Calendar },
  { path: "/members", label: "会员管理", icon: Users },
  { path: "/technicians", label: "技师管理", icon: UserCog },
  { path: "/reports", label: "统计报表", icon: BarChart3 },
  { path: "/settings", label: "系统设置", icon: Settings },
];

const pageTitles: Record<string, string> = {
  "/": "首页概览",
  "/appointments": "预约管理",
  "/members": "会员管理",
  "/technicians": "技师管理",
  "/reports": "统计报表",
  "/settings": "系统设置",
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentTitle =
    pageTitles[location.pathname] || "理发店管理系统";

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-64 md:w-16 bg-accent-800 flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-center border-b border-accent-900">
          <div className="flex items-center gap-2 md:justify-center">
            <Scissors className="w-8 h-8 text-brand-500" />
            <span className="text-white font-bold text-lg md:hidden">
              理发店
            </span>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors duration-200",
                    "hover:bg-accent-700/50",
                    isActive
                      ? "bg-accent-700 text-brand-500"
                      : "text-white/80 hover:text-white",
                    "md:justify-center md:px-2"
                  )
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="md:hidden">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center px-4 md:px-6 sticky top-0 z-30">
          <button
            className="md:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100 mr-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <h1 className="text-lg font-semibold text-neutral-800">
            {currentTitle}
          </h1>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
