import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-6 shadow-lg shadow-black/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Page Not Found</h1>
      
      <p className="text-slate-400 text-center max-w-sm mb-8">
        The page you are looking for doesn&apos;t exist or is currently being built by another team member.
      </p>
      
      <Link 
        href="/login"
        className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
      >
        Go Home
      </Link>
    </div>
  );
}
