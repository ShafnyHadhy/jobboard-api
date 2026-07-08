import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building, Briefcase, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function EmployerDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('COMPANY'); // 'COMPANY' or 'JOB'
    const [message, setMessage] = useState(null);

    // Form for creating a company
    const { register: registerCompany, handleSubmit: handleCompanySubmit, reset: resetCompany } = useForm();

    // Form for posting a job
    const { register: registerJob, handleSubmit: handleJobSubmit, reset: resetJob } = useForm();

    // Protect route
    if (!user || user.role !== 'EMPLOYER') {
        return <Navigate to="/" />;
    }

    const onCompanySubmit = async (data) => {
        setMessage(null);
        try {
            await api.post('/companies', data);
            setMessage({ type: 'success', text: 'Company profile created successfully! You can now post jobs.' });
            resetCompany();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create company.' });
        }
    };

    const onJobSubmit = async (data) => {
        setMessage(null);
        try {
            await api.post('/jobs', data);
            setMessage({ type: 'success', text: 'Job posted successfully! It is now live on the public feed.' });
            resetJob();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to post job.' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employer Dashboard</h1>
                <p className="mt-2 text-gray-500">Manage your company presence and post new opportunities.</p>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                >
                    {message.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    {message.text}
                </motion.div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => { setActiveTab('COMPANY'); setMessage(null); }}
                        className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'COMPANY'
                                ? 'border-slate-900 text-slate-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Building className="w-4 h-4" /> Company Setup
                    </button>
                    <button
                        onClick={() => { setActiveTab('JOB'); setMessage(null); }}
                        className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'JOB'
                                ? 'border-slate-900 text-slate-900'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Briefcase className="w-4 h-4" /> Post a Job
                    </button>
                </nav>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
                {activeTab === 'COMPANY' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Create Company Profile</h2>
                        <form onSubmit={handleCompanySubmit(onCompanySubmit)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input {...registerCompany('name', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-shadow" placeholder="Acme Corp" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea {...registerCompany('description')} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-shadow" placeholder="What does your company do?" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                                    <input {...registerCompany('website')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" placeholder="https://acme.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Optional)</label>
                                    <input {...registerCompany('logoUrl')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" placeholder="https://image.com/logo.png" />
                                </div>
                            </div>
                            <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors">
                                Save Company Profile
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Post a New Job</h2>
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm p-4 rounded-lg mb-6">
                            <strong>Note:</strong> You must have saved a Company Profile before posting jobs.
                        </div>
                        <form onSubmit={handleJobSubmit(onJobSubmit)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                                <input {...registerJob('title', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" placeholder="Senior React Developer" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input {...registerJob('location', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" placeholder="New York, NY (or Remote)" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                                    <select {...registerJob('type')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white">
                                        <option value="FULL_TIME">Full Time</option>
                                        <option value="PART_TIME">Part Time</option>
                                        <option value="CONTRACT">Contract</option>
                                        <option value="REMOTE">Remote</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary (Optional)</label>
                                    <input {...registerJob('salary')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" placeholder="$120k - $150k" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                                <textarea {...registerJob('description', { required: true })} rows="6" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" placeholder="We are looking for..." />
                            </div>
                            <button type="submit" className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors">
                                Publish Job to Feed
                            </button>
                        </form>
                    </motion.div>
                )}
            </div>
        </div>
    );
}