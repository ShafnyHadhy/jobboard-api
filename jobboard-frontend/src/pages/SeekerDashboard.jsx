import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function SeekerDashboard() {
    const { user } = useAuth();

    // Protect the route: if not a jobseeker, send them home
    if (!user || user.role !== 'JOBSEEKER') {
        return <Navigate to="/" />;
    }

    const { data, isLoading, error } = useQuery({
        queryKey: ['my-applications'],
        queryFn: async () => {
            const { data } = await api.get('/applications/my');
            return data;
        },
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-4 h-4" /> Pending Review
                    </span>
                );
            case 'REVIEWED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Building2 className="w-4 h-4" /> Under Review
                    </span>
                );
            case 'ACCEPTED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-4 h-4" /> Accepted
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                        <XCircle className="w-4 h-4" /> Not Selected
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Applications</h1>
                <p className="mt-2 text-gray-500">Track the status of jobs you've applied to.</p>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map((n) => (
                        <div key={n} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse h-32" />
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center">
                    Failed to load applications.
                </div>
            ) : data?.applications?.length === 0 ? (
                <div className="bg-white p-16 rounded-xl border border-gray-200 text-center shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-2 text-gray-500 mb-6">You haven't applied to any jobs. Start exploring!</p>
                    <a href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors">
                        Browse Jobs
                    </a>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {data.applications.map((app, index) => (
                            <motion.li
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                key={app.id}
                                className="p-6 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                            {app.job.title}
                                        </h3>
                                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1 font-medium text-slate-700">
                                                <Building2 className="h-4 w-4 text-gray-400" /> {app.job.company.name}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4 text-gray-400" /> {app.job.location}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4 text-gray-400" /> Applied {new Date(app.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        {getStatusBadge(app.status)}
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}