import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building, Briefcase, List, CheckCircle2, MapPin, Clock, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link, Navigate } from 'react-router-dom';

export default function EmployerDashboard() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('COMPANY');
    const [message, setMessage] = useState(null);
    const [editingJobId, setEditingJobId] = useState(null); // <-- NEW: Tracks which job we are editing

    // Forms (Notice we added setValueJob so we can pre-fill the form)
    const { register: registerCompany, handleSubmit: handleCompanySubmit, reset: resetCompany, setValue: setValueCompany } = useForm();
    const { register: registerJob, handleSubmit: handleJobSubmit, reset: resetJob, setValue: setValueJob } = useForm();

    // 1. Fetch Employer's Company
    const { data: companyData, isLoading: isLoadingCompany } = useQuery({
        queryKey: ['my-company'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/companies/my');
                return data.company;
            } catch (err) {
                if (err.response?.status === 404) return null;
                throw err;
            }
        },
    });

    // 2. Fetch Employer's Posted Jobs
    const { data: jobsData, isLoading: isLoadingJobs } = useQuery({
        queryKey: ['my-jobs'],
        queryFn: async () => {
            const { data } = await api.get('/jobs/my');
            return data.jobs;
        },
        enabled: !!companyData,
    });

    // Pre-fill the company form if data exists
    useEffect(() => {
        if (companyData) {
            setValueCompany('name', companyData.name);
            setValueCompany('description', companyData.description || '');
            setValueCompany('website', companyData.website || '');
            setValueCompany('logoUrl', companyData.logoUrl || '');
        }
    }, [companyData, setValueCompany]);

    // Protect route
    if (!user || user.role !== 'EMPLOYER') {
        return <Navigate to="/" />;
    }

    // Handle Company Create OR Update
    const onCompanySubmit = async (data) => {
        setMessage(null);
        try {
            if (companyData) {
                await api.patch(`/companies/${companyData.id}`, data);
                setMessage({ type: 'success', text: 'Company profile updated successfully!' });
            } else {
                await api.post('/companies', data);
                setMessage({ type: 'success', text: 'Company profile created! You can now post jobs.' });
            }
            queryClient.invalidateQueries(['my-company']);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save company.' });
        }
    };

    // Handle Job Post OR Update
    const onJobSubmit = async (data) => {
        setMessage(null);
        try {
            if (editingJobId) {
                // We are editing an existing job
                await api.patch(`/jobs/${editingJobId}`, data);
                setMessage({ type: 'success', text: 'Job updated successfully!' });
            } else {
                // We are creating a brand new job
                await api.post('/jobs', data);
                setMessage({ type: 'success', text: 'Job posted successfully! It is now live.' });
            }
            resetJob();
            setEditingJobId(null);
            queryClient.invalidateQueries(['my-jobs']);
            setActiveTab('MANAGE');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save job.' });
        }
    };

    // Triggered when clicking "Edit" on a job
    const handleEditClick = (job) => {
        setEditingJobId(job.id);
        setValueJob('title', job.title);
        setValueJob('location', job.location);
        setValueJob('type', job.type);
        setValueJob('salary', job.salary || '');
        setValueJob('description', job.description);
        setActiveTab('JOB');
        setMessage(null);
    };

    // Triggered when clicking "Delete" on a job
    const handleDeleteClick = async (jobId) => {
        if (window.confirm("Are you sure you want to delete this job? This cannot be undone.")) {
            setMessage(null);
            try {
                await api.delete(`/jobs/${jobId}`);
                queryClient.invalidateQueries(['my-jobs']);
                setMessage({ type: 'success', text: 'Job deleted successfully.' });
            } catch (err) {
                setMessage({ type: 'error', text: 'Failed to delete job.' });
            }
        }
    };

    if (isLoadingCompany) return <div className="text-center py-20">Loading dashboard...</div>;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employer Dashboard</h1>
                <p className="mt-2 text-gray-500">Manage your company presence and open positions.</p>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}
                >
                    {message.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    {message.text}
                </motion.div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8 overflow-x-auto">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => { setActiveTab('COMPANY'); setMessage(null); }}
                        className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'COMPANY' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <Building className="w-4 h-4" /> {companyData ? 'Edit Company Profile' : 'Setup Company'}
                    </button>

                    <button
                        onClick={() => { setActiveTab('JOB'); setMessage(null); }}
                        className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'JOB' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <Briefcase className="w-4 h-4" /> {editingJobId ? 'Edit Job' : 'Post a Job'}
                    </button>

                    <button
                        onClick={() => { setActiveTab('MANAGE'); setMessage(null); setEditingJobId(null); resetJob(); }}
                        className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'MANAGE' ? 'border-slate-900 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        <List className="w-4 h-4" /> My Posted Jobs
                    </button>
                </nav>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">

                {/* TAB 1: COMPANY */}
                {activeTab === 'COMPANY' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">
                            {companyData ? 'Update Company Information' : 'Create Company Profile'}
                        </h2>
                        <form onSubmit={handleCompanySubmit(onCompanySubmit)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input {...registerCompany('name', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" placeholder="Acme Corp" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea {...registerCompany('description')} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" placeholder="What does your company do?" />
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
                                {companyData ? 'Save Changes' : 'Create Company'}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* TAB 2: POST/EDIT A JOB */}
                {activeTab === 'JOB' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">{editingJobId ? 'Edit Job' : 'Post a New Job'}</h2>
                        {!companyData && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-lg mb-6">
                                <strong>Wait!</strong> You must setup your Company Profile before you can post jobs.
                            </div>
                        )}
                        <form onSubmit={handleJobSubmit(onJobSubmit)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                                <input {...registerJob('title', { required: true })} disabled={!companyData} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none disabled:bg-gray-100" placeholder="Senior React Developer" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input {...registerJob('location', { required: true })} disabled={!companyData} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none disabled:bg-gray-100" placeholder="New York, NY (or Remote)" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                                    <select {...registerJob('type')} disabled={!companyData} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white disabled:bg-gray-100">
                                        <option value="FULL_TIME">Full Time</option>
                                        <option value="PART_TIME">Part Time</option>
                                        <option value="CONTRACT">Contract</option>
                                        <option value="REMOTE">Remote</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary (Optional)</label>
                                    <input {...registerJob('salary')} disabled={!companyData} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none disabled:bg-gray-100" placeholder="$120k - $150k" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                                <textarea {...registerJob('description', { required: true })} disabled={!companyData} rows="6" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none disabled:bg-gray-100" placeholder="We are looking for..." />
                            </div>
                            <div className="flex gap-3">
                                <button type="submit" disabled={!companyData} className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {editingJobId ? 'Save Changes' : 'Publish Job to Feed'}
                                </button>
                                {editingJobId && (
                                    <button type="button" onClick={() => { setEditingJobId(null); resetJob(); setActiveTab('MANAGE'); }} className="px-6 py-2.5 bg-gray-100 text-slate-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* TAB 3: MANAGE POSTED JOBS */}
                {activeTab === 'MANAGE' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Jobs You've Posted</h2>

                        {isLoadingJobs ? (
                            <div className="text-gray-500">Loading jobs...</div>
                        ) : !companyData || jobsData?.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                                <Briefcase className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900">No jobs posted</h3>
                                <p className="text-gray-500 mt-1">You haven't posted any jobs to the board yet.</p>
                                <button onClick={() => setActiveTab('JOB')} className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                                    Create your first job
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {jobsData.map((job) => (
                                    <div key={job.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <Link to={`/dashboard/employer/jobs/${job.id}/applications`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-lg block mb-1">
                                                {job.title}
                                            </Link>
                                            <div className="flex gap-4 text-sm text-gray-500 mt-2">
                                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                                                <button onClick={() => handleEditClick(job)} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                                    <Edit2 className="w-4 h-4" /> Edit Job
                                                </button>
                                                <button onClick={() => handleDeleteClick(job.id)} className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1">
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end justify-between min-w-[150px]">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                                                {job.status}
                                            </span>
                                            <Link to={`/dashboard/employer/jobs/${job.id}/applications`} className="text-sm font-medium text-slate-900 hover:underline flex items-center gap-1 mt-4">
                                                Review Applicants &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

            </div>
        </div>
    );
}
