import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  
  const menuItems = [
    {
      title: "Dashboard",
      icon: "dashboard",
      href: "/admin/dashboard",
    },
    {
      title: "View Content",
      icon: "visibility",
      href: "/admin/view-subjects",
    },
    {
      title: "Manage Subjects",
      icon: "category",
      href: "/admin/manage-subjects",
    },
    {
      title: "Study Materials",
      icon: "description",
      href: "/admin/materials",
    },
    {
      title: "Users",
      icon: "people",
      href: "/admin/users",
    },
  ];
  
  return (
    <div className={cn("bg-white border-r border-border", className)}>
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold text-primary">Admin Panel</h2>
      </div>
      <nav className="p-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <span className="material-icons mr-3">{item.icon}</span>
                    <span>{item.title}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}