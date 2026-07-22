import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, User, Mail, FileText } from 'lucide-react';
import api from '../services/api';

export default function ManageJobApplications() {
    const { jobId } = useParams();
    const queryClient = useQueryClient();

    // Fetch the list of people who applied to this specific job
    const { data, isLoading, error } = useQuery({
        queryKey: ['job-applications', jobId],
        queryFn: async () => {
            const { data } = await api.get(`/applications/jobs/${jobId}`);
            return data;
        }
    });

    // The mutation to Accept/Reject a candidate
    const updateStatusMutation = useMutation({
        mutationFn: async ({ applicationId, status }) => {
            await api.patch(`/applications/${applicationId}/status`, { status });
        },
        onSuccess: () => {
            // Instantly refresh the page data when the status changes
            queryClient.invalidateQueries(['job-applications', jobId]);
        }
    });

    if (isLoading) return <div className="p-10 text-center text-gray-500">Loading applicants...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Failed to load applications. Did the backend route match?</div>;

    const { job, applications } = data;

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Back Button */}
                <Link to="/dashboard/employer" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-slate-900 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900">Applicants for {job.title}</h1>
                    <p className="text-gray-500 mt-2 text-lg">You have {applications.length} total application{applications.length !== 1 ? 's' : ''}.</p>
                </div>

                <div className="space-y-6">
                    {applications.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
                            <p className="text-gray-500">No one has applied yet. Check back soon!</p>
                        </div>
                    ) : (
                        applications.map((app) => (
                            <div key={app.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <div className="flex flex-col md:flex-row justify-between gap-4">

                                    {/* Applicant Info */}
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <User className="w-5 h-5 text-gray-400" /> {app.user.name}
                                        </h3>
                                        <p className="text-gray-600 flex items-center gap-2 mt-1">
                                            <Mail className="w-4 h-4 text-gray-400" /> {app.user.email}
                                        </p>
                                        <div className="mt-2 text-sm text-gray-500">
                                            Applied on {new Date(app.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Status Controls */}
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${app.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 border-green-200' :
                                            app.status === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' :
                                                app.status === 'REVIEWED' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    'bg-gray-100 text-gray-700 border-gray-200'
                                            }`}>
                                            {app.status}
                                        </span>
                                        <select
                                            className="mt-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 px-3 py-1 bg-white cursor-pointer"
                                            value={app.status}
                                            onChange={(e) => updateStatusMutation.mutate({ applicationId: app.id, status: e.target.value })}
                                            disabled={updateStatusMutation.isPending}
                                        >
                                            <option value="PENDING">Mark as Pending</option>
                                            <option value="REVIEWED">Mark as Reviewed</option>
                                            <option value="ACCEPTED">Accept Candidate</option>
                                            <option value="REJECTED">Reject Candidate</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Cover Letter Box */}
                                {app.coverLetter && (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                            <FileText className="w-4 h-4" /> Cover Letter
                                        </h4>
                                        <div className="bg-gray-50 p-5 rounded-xl text-gray-700 text-sm whitespace-pre-wrap leading-relaxed border border-gray-100">
                                            {app.coverLetter}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
