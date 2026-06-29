import { Link } from 'react-router-dom';
import { useAuth } from '../../src/context/AuthContext';
import { Briefcase, LogOut, User } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-slate-900 p-1.5 rounded-lg group-hover:bg-slate-800 transition-colors">
                                <Briefcase className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-slate-900 tracking-tight">
                                JobBoard
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <span className="text-sm text-gray-500 hidden sm:block">
                                    Hello, {user.name} <span className="text-xs bg-gray-100 px-2 py-1 rounded-full ml-1 border border-gray-200">{user.role}</span>
                                </span>

                                {user.role === 'EMPLOYER' ? (
                                    <Link to="/dashboard/employer" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link to="/dashboard/seeker" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                                        My Applications
                                    </Link>
                                )}

                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors ml-4"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Log out</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                                    Log in
                                </Link>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}