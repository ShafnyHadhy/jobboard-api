import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, DollarSign, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { Link } from 'react-router-dom';

export default function Home() {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');

    // React Query fetches our jobs from the API
    const { data, isLoading, error } = useQuery({
        queryKey: ['jobs', searchTerm],
        queryFn: async () => {
            const { data } = await api.get(`/jobs${searchTerm ? `?search=${searchTerm}` : ''}`);
            return data;
        },
    });

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchTerm(searchInput);
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            {/* Hero Section */}
            <div className="bg-white border-b border-gray-200 py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl tracking-tight">
                        Find your next dream job.
                    </h1>
                    <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
                        Browse thousands of openings from top companies and apply with a single click.
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto relative flex items-center">
                        <Search className="absolute left-4 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            className="w-full pl-12 pr-24 py-4 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow text-lg"
                            placeholder="Search job titles or keywords..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-2 bottom-2 px-6 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>
            </div>

            {/* Job Feed */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">Latest Opportunities</h2>
                    {data?.pagination && (
                        <span className="text-sm text-gray-500">{data.pagination.total} jobs found</span>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse h-32" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center">
                        Failed to load jobs. Is your backend running?
                    </div>
                ) : data?.jobs?.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                        <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
                        <p className="mt-2 text-gray-500">Try adjusting your search terms.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data?.jobs.map((job, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                key={job.id}
                                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between gap-4"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-blue-600">{job.company?.name}</span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                                            {job.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" /> {job.location}
                                        </div>
                                        {job.salary && (
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4" /> {job.salary}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" /> {new Date(job.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">{job.description}</p>
                                </div>

                                <div className="flex items-center sm:flex-col sm:justify-center gap-2 mt-4 sm:mt-0">
                                    <Link to={`/jobs/${job.id}`} className="px-4 py-2 bg-white text-slate-900 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto">
                                        View Details
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}