import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MapPin, DollarSign, Clock, Building, ArrowLeft, Briefcase, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function JobDetails() {

    const { jobId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [applyError, setApplyError] = useState('');
    const [applySuccess, setApplySuccess] = useState(false);

    // Fetch the specific Job Details
    const { data: jobData, isLoading, error } = useQuery({
        queryKey: ['job', jobId],
        queryFn: async () => {
            const { data } = await api.get(`/jobs/${jobId}`);
            return data.job;
        },
    });

    // The mutation that actually submits the application
    const applyMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.post(`/applications/${jobId}`, { coverLetter });
            return data;
        },
        onSuccess: () => {
            setApplySuccess(true);
            // Close the modal automatically after 2 seconds
            setTimeout(() => {
                setIsModalOpen(false);
                setApplySuccess(false);
            }, 2000);
        },
        onError: (err) => {
            // Check for the 409 "Already applied" error from your backend
            setApplyError(err.response?.data?.error || 'Failed to apply.');
        }
    });

    const handleApplyClick = () => {
        if (!user) {
            navigate('/login'); // Redirect to login if logged out
            return;
        }
        setIsModalOpen(true);
    };

    const submitApplication = (e) => {
        e.preventDefault();
        setApplyError('');
        applyMutation.mutate();
    };

    if (isLoading) return <div className="p-10 text-center text-gray-500">Loading job details...</div>;
    if (error || !jobData) return <div className="p-10 text-center text-red-500">Failed to load job.</div>;

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Back Button */}
                <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-slate-900 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to jobs
                </Link>

                {/* Job Header Card */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gray-100 rounded-xl">
                                    <Building className="w-8 h-8 text-slate-700" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-extrabold text-slate-900">{jobData.title}</h1>
                                    <p className="text-lg font-medium text-blue-600 mt-1">{jobData.company.name}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-6">
                                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {jobData.location}</div>
                                {jobData.salary && <div className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> {jobData.salary}</div>}
                                <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {jobData.type.replace('_', ' ')}</div>
                                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(jobData.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Hide the apply button entirely if the user is an EMPLOYER */}
                        {(!user || user.role === 'JOBSEEKER') && (
                            <button
                                onClick={handleApplyClick}
                                className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                Apply Now
                            </button>
                        )}
                    </div>
                </div>

                {/* Job Description Card */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">About the role</h2>
                    <div className="prose max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {jobData.description}
                    </div>
                </div>
            </div>

            {/* Premium Apply Modal (Powered by Framer Motion) */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>

                            {applySuccess ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900">Application Sent!</h3>
                                </div>
                            ) : (
                                <form onSubmit={submitApplication}>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Apply for {jobData.title}</h3>
                                    <p className="text-gray-500 text-sm mb-6">At {jobData.company.name}</p>

                                    {applyError && (
                                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
                                            {applyError}
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter (Optional)</label>
                                        <textarea
                                            rows="5"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow outline-none resize-none"
                                            placeholder="Why are you a great fit for this role?"
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={applyMutation.isPending} className="px-5 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center gap-2">
                                            {applyMutation.isPending ? 'Sending...' : 'Submit Application'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
