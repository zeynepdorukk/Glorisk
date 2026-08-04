import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

/** Keeps a rendering failure in one panel from blanking the whole map. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-sm rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
          <AlertTriangle className="mx-auto mb-2 text-rose-400" size={22} />
          <p className="text-sm text-rose-200">Something went wrong in this panel.</p>
          <p className="mt-1 font-mono text-[11px] text-rose-300/70">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-3 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/10"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
