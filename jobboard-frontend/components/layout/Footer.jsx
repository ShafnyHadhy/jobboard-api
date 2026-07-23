import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex justify-center md:justify-start mb-6 md:mb-0">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-slate-900 p-2 rounded-lg group-hover:bg-slate-800 transition-colors">
                                <Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                                JobBoard
                            </span>
                        </Link>
                    </div>

                    <div className="flex justify-center space-x-6 md:order-2 text-sm font-medium text-gray-500">
                        <Link to="#" className="hover:text-slate-900 transition-colors">About</Link>
                        <Link to="#" className="hover:text-slate-900 transition-colors">Contact</Link>
                        <Link to="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
                        <Link to="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-8 flex items-center justify-center">
                    <p className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} JobBoard Platform. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
