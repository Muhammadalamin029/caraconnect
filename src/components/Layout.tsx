import { useState, type FC, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  MapPinIcon,
  PlusIcon,
  WalletIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { userProfile, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ...(userProfile?.is_runner ? [{ name: 'Browse Tasks', href: '/tasks', icon: MapPinIcon }] : []),
    ...(userProfile?.is_requester ? [{ name: 'Create Task', href: '/tasks/create', icon: PlusIcon }] : []),
    ...(userProfile?.is_requester ? [{ name: 'Task Templates', href: '/task-templates', icon: DocumentDuplicateIcon }] : []),
    { name: 'My Tasks', href: '/my-tasks', icon: ClipboardDocumentListIcon },
    { name: 'My Wallet', href: '/wallet', icon: WalletIcon },
    { name: 'Messages', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    ...(userProfile?.is_admin ? [{ name: 'Admin Panel', href: '/admin', icon: ShieldCheckIcon }] : []),
  ];

  const isCurrentPath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className={`fixed inset-y-0 left-0 flex w-72 sm:w-80 flex-col bg-slate-800 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
            <h1 className="text-xl font-bold text-cyan-500">CaraConnect</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white p-2 rounded-md hover:bg-slate-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isCurrentPath(item.href)
                      ? 'bg-cyan-500 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-cyan-500 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userProfile?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {userProfile?.is_runner && userProfile?.is_requester 
                    ? 'Runner & Requester'
                    : userProfile?.is_runner 
                      ? 'Runner'
                      : 'Requester'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        <div className="flex flex-col flex-grow bg-slate-800 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-between flex-shrink-0 px-4">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-cyan-500">CaraConnect</h1>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isCurrentPath(item.href)
                      ? 'bg-cyan-500 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && item.name}
                </Link>
              );
            })}
          </nav>
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-cyan-500 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userProfile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {userProfile?.is_runner && userProfile?.is_requester 
                      ? 'Runner & Requester'
                      : userProfile?.is_runner 
                        ? 'Runner'
                        : 'Requester'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}>
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex-shrink-0 flex h-16 bg-slate-800 border-b border-slate-700 lg:border-none">
          <button
            type="button"
            className="px-4 border-r border-slate-700 text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <button
            type="button"
            className="hidden lg:block px-4 border-r border-slate-700 text-slate-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 hover:text-white"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 px-3 sm:px-4 flex justify-between items-center">
            <div className="flex-1 flex max-w-lg">
              <div className="w-full flex">
                <div className="relative w-full text-slate-400 focus-within:text-white">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                    <MapPinIcon className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full h-full pl-10 pr-3 py-2 border-transparent bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:ring-0 focus:border-transparent text-sm rounded-lg"
                    placeholder="Search tasks..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-3 flex items-center">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="hidden sm:block text-sm text-slate-300 truncate max-w-32">
                  {userProfile?.full_name || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white p-2 rounded-md hover:bg-slate-700"
                  title="Logout"
                >
                  <UserIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
