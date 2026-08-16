import { Inbox, AlertCircle, Clock, type LucideIcon } from 'lucide-react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="space-y-4 w-full max-w-md">
        <div className="flex justify-center">
          <div className="w-10 h-10 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-center text-sm text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

export function EmptyState({
  title = 'No items yet',
  description = 'Get started by creating your first item.',
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
        <Icon size={48} className="text-slate-500 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg font-medium hover:bg-amber-600 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error loading this data. Please try again.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-red-500/10 rounded-lg p-6 mb-6">
        <AlertCircle size={48} className="text-red-500 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-sm">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function SkeletonLoader({ count = 3, height = 'h-12' }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} bg-slate-800 rounded-lg animate-pulse`}></div>
      ))}
    </div>
  );
}

export function LoadingMessage({ message = 'Please wait...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 justify-center p-6 text-slate-400">
      <Clock size={18} className="animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
