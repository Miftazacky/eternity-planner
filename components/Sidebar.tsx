'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, CheckSquare, Wallet, Store, Users, Clock, Gift } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Panduan', path: '/panduan', icon: BookOpen },
  { name: 'Checklist', path: '/checklist', icon: CheckSquare },
  { name: 'Budget', path: '/budget', icon: Wallet },
  { name: 'Vendor', path: '/vendor', icon: Store },
  { name: 'Tamu', path: '/tamu', icon: Users },
  { name: 'Rundown', path: '/rundown', icon: Clock },
  { name: 'Seserahan', path: '/seserahan', icon: Gift },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-[#FDFBF7] border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-50">
      {/* Logo & Judul */}
      <div className="p-8 pb-4">
        <h2 className="text-2xl font-serif italic text-rose-900 font-semibold">Eternity Planner</h2>
        <p className="text-xs text-gray-400 mt-1 tracking-wider uppercase">Wedding Management</p>
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-sm font-medium ${
                isActive
                  ? 'bg-rose-900 text-white shadow-lg shadow-rose-900/20'
                  : 'text-gray-500 hover:bg-rose-50 hover:text-rose-900'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}