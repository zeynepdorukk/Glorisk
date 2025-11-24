import React from 'react';
import { X, Shield, TrendingUp, AlertTriangle } from 'lucide-react';

const AboutModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-neutral-900/95 backdrop-blur">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-emerald-500" />
                        About Glorisk Methodology
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-8 text-neutral-300">
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-blue-400" />
                            Risk Scoring System
                        </h3>
                        <p className="leading-relaxed">
                            Glorisk utilizes a composite scoring model to evaluate country-specific risks.
                            The Total Risk Score (0-100) is derived from a weighted average of two primary vectors:
                        </p>
                        <ul className="mt-4 space-y-3 pl-4 border-l-2 border-white/10">
                            <li>
                                <strong className="text-white">Economic Risk:</strong> Evaluates inflation, debt-to-GDP ratio, currency stability, and unemployment rates.
                            </li>
                            <li>
                                <strong className="text-white">Political Risk:</strong> Assesses government stability, geopolitical conflict, corruption index, and social unrest.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-400" />
                            Color Coding Guide
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <div>
                                    <div className="text-white font-medium">Very Low Risk</div>
                                    <div className="text-xs text-neutral-500">Score: 0-20</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                <div className="w-4 h-4 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                                <div>
                                    <div className="text-white font-medium">Low Risk</div>
                                    <div className="text-xs text-neutral-500">Score: 21-40</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                <div>
                                    <div className="text-white font-medium">Medium Risk</div>
                                    <div className="text-xs text-neutral-500">Score: 41-60</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                <div className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                                <div>
                                    <div className="text-white font-medium">High Risk</div>
                                    <div className="text-xs text-neutral-500">Score: 61-80</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                <div>
                                    <div className="text-white font-medium">Critical Risk</div>
                                    <div className="text-xs text-neutral-500">Score: 81-100</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-200">
                        <strong>Note:</strong> This data is for demonstration purposes only and does not reflect real-time geopolitical analysis.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;
