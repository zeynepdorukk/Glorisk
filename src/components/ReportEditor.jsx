import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Save, X, Loader2, Image as ImageIcon, FileText } from 'lucide-react';

const ReportEditor = ({ onSaveSuccess, onCancel, editingReport = null }) => {
    const [formData, setFormData] = useState({
        title: '',
        category: 'Economy',
        date: new Date().toISOString().split('T')[0],
        summary: '',
        content: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [docFile, setDocFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    // Load existing report data when editing
    useEffect(() => {
        if (editingReport) {
            setFormData({
                title: editingReport.title || '',
                category: editingReport.category || 'Economy',
                date: editingReport.date || new Date().toISOString().split('T')[0],
                summary: editingReport.summary || '',
                content: editingReport.content ? editingReport.content.replace(/<p>/g, '').replace(/<\/p>/g, '\n').trim() : ''
            });
        }
    }, [editingReport]);

    const handleFileUpload = async (file, bucket) => {
        if (!file) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setUploadStatus(imageFile || docFile ? 'Uploading files...' : 'Saving report...');

        try {
            // 1. Upload Files if they exist
            let imageUrl = editingReport?.image_url || null;
            let docUrl = editingReport?.document_url || null;

            if (imageFile) {
                imageUrl = await handleFileUpload(imageFile, 'images');
            }

            if (docFile) {
                docUrl = await handleFileUpload(docFile, 'documents');
            }

            setUploadStatus('Saving report...');

            // 2. Format Content
            const formattedContent = formData.content
                .split('\n')
                .filter(line => line.trim() !== '')
                .map(line => `<p>${line}</p>`)
                .join('');

            const reportData = {
                title: formData.title,
                category: formData.category,
                date: formData.date,
                summary: formData.summary,
                content: formattedContent,
                image_url: imageUrl,
                document_url: docUrl
            };

            // 3. Insert or Update Database
            if (editingReport) {
                // Update existing report
                const { error } = await supabase
                    .from('reports')
                    .update(reportData)
                    .eq('id', editingReport.id);

                if (error) throw error;
            } else {
                // Insert new report
                const { error } = await supabase
                    .from('reports')
                    .insert([reportData]);

                if (error) throw error;
            }

            onSaveSuccess();
        } catch (error) {
            console.error('Error saving report:', error);
            alert('Failed to save report. Make sure you created the storage buckets!');
        } finally {
            setLoading(false);
            setUploadStatus('');
        }
    };

    return (
        <div className="p-6 bg-neutral-900 absolute inset-0 z-20 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                    {editingReport ? 'Edit Report' : 'New Analyst Report'}
                </h3>
                <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full text-neutral-400">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm text-neutral-400 mb-1">Report Title</label>
                    <input
                        required
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        placeholder="e.g., Global Market Shift"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-neutral-400 mb-1">Category</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 [&>option]:bg-neutral-900"
                        >
                            <option value="Economy">Economy</option>
                            <option value="Politics">Politics</option>
                            <option value="Security">Security</option>
                            <option value="Technology">Technology</option>
                            <option value="Environment">Environment</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-neutral-400 mb-1">Date</label>
                        <input
                            required
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-dashed border-white/20 rounded-lg hover:bg-white/5 transition-colors text-center relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 text-neutral-400">
                            <ImageIcon size={24} className={imageFile ? 'text-blue-400' : ''} />
                            <span className="text-xs">
                                {imageFile ? imageFile.name : (editingReport?.image_url ? 'Change Cover Image' : 'Upload Cover Image')}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 border border-dashed border-white/20 rounded-lg hover:bg-white/5 transition-colors text-center relative">
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setDocFile(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-2 text-neutral-400">
                            <FileText size={24} className={docFile ? 'text-blue-400' : ''} />
                            <span className="text-xs">
                                {docFile ? docFile.name : (editingReport?.document_url ? 'Change Document' : 'Upload Document (PDF)')}
                            </span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-neutral-400 mb-1">Summary (Short Description)</label>
                    <textarea
                        required
                        rows={2}
                        value={formData.summary}
                        onChange={e => setFormData({ ...formData, summary: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Brief overview appearing in the list..."
                    />
                </div>

                <div>
                    <label className="block text-sm text-neutral-400 mb-1">Full Analysis Content</label>
                    <textarea
                        required
                        rows={8}
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                        placeholder="Write your full analysis here..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" />
                            <span className="text-sm font-normal">{uploadStatus}</span>
                        </>
                    ) : (
                        <><Save size={18} /> {editingReport ? 'Update Report' : 'Publish Report'}</>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ReportEditor;
