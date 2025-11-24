import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Tag, ChevronRight, ArrowLeft, Loader2, Lock, Plus, LogOut, Trash2, Download, Edit2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import AdminLogin from './AdminLogin';
import ReportEditor from './ReportEditor';

const ReportsPanel = ({ isOpen, onClose }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditReport = (e, report) => {
    e.stopPropagation();
    setEditingReport(report);
    setShowEditor(true);
  };

  const handleDeleteReport = async (e, reportId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(null);
      }

      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report.');
    }
  };

  const handleLoginSuccess = (adminData) => {
    setIsAdmin(true);
    setShowLogin(false);
  };

  const handleSaveSuccess = () => {
    setShowEditor(false);
    setEditingReport(null);
    fetchReports();
  };

  const handleCancelEditor = () => {
    setShowEditor(false);
    setEditingReport(null);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute left-0 top-16 bottom-0 w-full md:w-[480px] bg-neutral-900/95 backdrop-blur-xl border-r border-white/10 shadow-2xl z-[1000] flex flex-col transform transition-transform duration-300 ease-in-out">

      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 relative">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-400" />
            Analyst Hub
          </h2>
          <p className="text-neutral-400 text-sm mt-1">Weekly Global Insights & Reports</p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <>
              <button
                onClick={() => { setEditingReport(null); setShowEditor(true); }}
                className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-full transition-colors"
                title="Add New Report"
              >
                <Plus size={20} />
              </button>
              <button
                onClick={() => setIsAdmin(false)}
                className="p-2 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(!showLogin)}
              className={`p-2 rounded-full transition-colors ${showLogin ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-neutral-600 hover:text-neutral-400'}`}
              title="Admin Login"
            >
              <Lock size={16} />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white ml-2"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Admin Overlays */}
      {showLogin && !isAdmin && (
        <div className="absolute top-[88px] left-0 right-0 z-50 px-6">
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setShowLogin(false)}
          />
        </div>
      )}

      {showEditor && (
        <ReportEditor
          editingReport={editingReport}
          onSaveSuccess={handleSaveSuccess}
          onCancel={handleCancelEditor}
        />
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-neutral-400">
            <Loader2 className="animate-spin mr-2" /> Loading reports...
          </div>
        ) : selectedReport ? (
          // Single Report View
          <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={() => setSelectedReport(null)}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-6 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Reports
            </button>

            <article className="prose prose-invert prose-blue max-w-none">
              {/* Cover Image */}
              {selectedReport.image_url && (
                <div className="mb-6 rounded-xl overflow-hidden shadow-lg border border-white/10">
                  <img
                    src={selectedReport.image_url}
                    alt={selectedReport.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-3 text-xs text-neutral-400 mb-3">
                  <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                    <Calendar size={12} /> {new Date(selectedReport.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                    <Tag size={12} /> {selectedReport.category}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
                  {selectedReport.title}
                </h1>

                {/* Document Download */}
                {selectedReport.document_url && (
                  <a
                    href={selectedReport.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg transition-colors border border-white/10 mb-4"
                  >
                    <Download size={16} /> Download Full Report (PDF)
                  </a>
                )}
              </div>

              <div
                className="text-neutral-300 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: selectedReport.content }}
              />
            </article>
          </div>
        ) : (
          // Reports List
          <div className="p-4 space-y-3">
            {reports.length === 0 ? (
              <div className="text-center text-neutral-500 py-10">
                No reports found.
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent transition-all duration-500" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {report.category}
                        </span>
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(report.date).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Admin Buttons */}
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => handleEditReport(e, report)}
                            className="text-neutral-500 hover:text-blue-500 p-1 rounded transition-colors z-20"
                            title="Edit Report"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteReport(e, report.id)}
                            className="text-neutral-500 hover:text-red-500 p-1 rounded transition-colors z-20"
                            title="Delete Report"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {report.title}
                    </h3>

                    <p className="text-sm text-neutral-400 line-clamp-2 mb-3">
                      {report.summary}
                    </p>

                    <div className="flex items-center text-xs text-neutral-500 group-hover:text-white transition-colors">
                      Read Analysis <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPanel;
