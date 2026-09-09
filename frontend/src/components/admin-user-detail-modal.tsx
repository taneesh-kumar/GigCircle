import React, { useEffect, useState } from 'react';
import { getAdminUserDetailApi } from '@/services/api/admin';
import type { AdminUserDetail } from '@/types/admin';
import { format } from 'date-fns';

interface AdminUserDetailModalProps {
  userId: number | null;
  onClose: () => void;
}

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({ userId, onClose }) => {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    getAdminUserDetailApi(userId)
      .then((data) => {
        setDetail(data);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load user details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 text-gray-100 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              User Details
              {detail && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                  ID: #{detail.id}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Comprehensive administrative view</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Close user details"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Loading user profile & statistics...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/50 border border-red-800/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {/* Profile Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-950/40 p-4 rounded-xl border border-gray-800/80">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Name</label>
                  <p className="text-base font-semibold text-white mt-0.5">{detail.name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email</label>
                  <p className="text-base text-gray-200 mt-0.5 font-mono">{detail.email}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Phone</label>
                  <p className="text-sm text-gray-300 mt-0.5 font-mono">{detail.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Created Date</label>
                  <p className="text-sm text-gray-300 mt-0.5">
                    {detail.createdAt ? format(new Date(detail.createdAt), 'PPP p') : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Role</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                      detail.role === 'ADMIN' ? 'bg-purple-950 text-purple-300 border border-purple-800/50' :
                      detail.role === 'WORKER' ? 'bg-blue-950 text-blue-300 border border-blue-800/50' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                    }`}>
                      {detail.role}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Account Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                      detail.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' :
                      detail.status === 'SUSPENDED' ? 'bg-amber-950 text-amber-300 border border-amber-800/50' :
                      'bg-red-950 text-red-300 border border-red-800/50'
                    }`}>
                      {detail.status || (detail.active ? 'ACTIVE' : 'DEACTIVATED')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div>
                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Account Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-950/60 p-3 rounded-lg border border-gray-800 text-center">
                    <span className="text-xs text-gray-400 block">Service Requests</span>
                    <span className="text-lg font-bold text-emerald-400 mt-1 block">{detail.serviceRequestsCreatedCount ?? 0}</span>
                  </div>
                  <div className="bg-gray-950/60 p-3 rounded-lg border border-gray-800 text-center">
                    <span className="text-xs text-gray-400 block">Jobs Assigned</span>
                    <span className="text-lg font-bold text-blue-400 mt-1 block">{detail.jobsAssignedCount ?? 0}</span>
                  </div>
                  <div className="bg-gray-950/60 p-3 rounded-lg border border-gray-800 text-center">
                    <span className="text-xs text-gray-400 block">Jobs Completed</span>
                    <span className="text-lg font-bold text-indigo-400 mt-1 block">{detail.jobsCompletedCount ?? 0}</span>
                  </div>
                  <div className="bg-gray-950/60 p-3 rounded-lg border border-gray-800 text-center">
                    <span className="text-xs text-gray-400 block">Ratings Received</span>
                    <span className="text-lg font-bold text-amber-400 mt-1 block">
                      {detail.ratingsReceivedCount ?? 0} {detail.averageRatingReceived ? `(★ ${detail.averageRatingReceived.toFixed(1)})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Financial Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-950/30 p-4 rounded-xl border border-gray-800">
                  <div>
                    <span className="text-xs text-gray-400 block">Total Gross Volume</span>
                    <span className="text-base font-semibold text-white mt-0.5 block">₹{(detail.totalGrossVolume ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Worker Net Earnings</span>
                    <span className="text-base font-semibold text-emerald-400 mt-0.5 block">₹{(detail.totalWorkerEarnings ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Platform Fees Collected</span>
                    <span className="text-base font-semibold text-purple-400 mt-0.5 block">₹{(detail.totalPlatformFees ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Worker Specific Information */}
              {detail.role === 'WORKER' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Worker Profile & Verification</h3>
                  <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800 space-y-3">
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Experience: </span>
                        <span className="text-gray-200 font-semibold">{detail.experienceYears ?? 0} yrs</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Hourly Rate: </span>
                        <span className="text-emerald-400 font-semibold">₹{detail.hourlyRate ?? 0}/hr</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Availability: </span>
                        <span className={`font-semibold ${detail.available ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {detail.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Verification Status: </span>
                        <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                          detail.verificationStatus === 'VERIFIED' ? 'bg-emerald-950 text-emerald-300' :
                          detail.verificationStatus === 'REJECTED' ? 'bg-red-950 text-red-300' :
                          'bg-amber-950 text-amber-300'
                        }`}>
                          {detail.verificationStatus || 'NOT_SUBMITTED'}
                        </span>
                      </div>
                    </div>

                    {detail.bio && (
                      <div>
                        <span className="text-xs text-gray-500 block">Bio</span>
                        <p className="text-xs text-gray-300 mt-1 italic bg-gray-900/60 p-2.5 rounded border border-gray-800/60">{detail.bio}</p>
                      </div>
                    )}

                    {detail.skills && detail.skills.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.skills.map((skill, idx) => (
                            <span key={idx} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Admin Audit Activity */}
              <div>
                <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Recent Admin Audit Log</h3>
                {detail.recentActivity && detail.recentActivity.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {detail.recentActivity.map((act) => (
                      <div key={act.id} className="bg-gray-950/60 p-3 rounded-lg border border-gray-800/80 text-xs flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-400">{act.actionType}</span>
                            <span className="text-gray-500">by Admin #{act.actorUserId}</span>
                          </div>
                          <p className="text-gray-300 mt-1">{act.description}</p>
                        </div>
                        <span className="text-gray-500 whitespace-nowrap ml-2">
                          {act.createdAt ? format(new Date(act.createdAt), 'MMM d, p') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 bg-gray-950/30 p-3 rounded-lg border border-gray-800 text-center">
                    No admin audit log recorded for this user.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
