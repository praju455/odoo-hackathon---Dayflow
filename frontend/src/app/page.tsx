import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void-onyx font-sans overflow-x-hidden selection:bg-cyber-yellow selection:text-black">
      {/* ─── LIQUID HERO SECTION ────────────────────────────────────────── */}
      <section className="relative bg-cyber-yellow rounded-br-[120px] rounded-bl-[40px] pt-8 pb-32 px-6 lg:px-16 overflow-hidden">
        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between mb-24 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-cyber-yellow">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
            <span className="text-black font-extrabold text-2xl tracking-tighter">Dayflow</span>
          </div>
          <div>
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-sm font-semibold tracking-wide hover:scale-105 hover:shadow-lg transition-all duration-300 active:scale-95"
            >
              Sign In
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-left">
            <h1 className="text-black text-6xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-8">
              Every workday, <br/>
              <span className="opacity-90">perfectly aligned.</span>
            </h1>
            <p className="text-black/80 text-lg lg:text-xl font-medium max-w-xl mb-10 leading-relaxed">
              Experience the friction-free HRMS designed for high-velocity teams. Leave management, payroll, and attendance flowing as one unified liquid system.
            </p>
            <div className="flex items-center gap-4">
              <Link 
                href="/login"
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-full text-lg font-semibold tracking-wide hover:scale-105 hover:shadow-2xl transition-all duration-300 active:scale-95"
              >
                Enter Dayflow
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <button className="inline-flex items-center gap-2 border-2 border-black/20 text-black px-8 py-4 rounded-full text-lg font-semibold hover:border-black/40 hover:bg-black/5 transition-all duration-300 active:scale-95">
                View Demo
              </button>
            </div>
          </div>
          
          {/* Hero Visuals / Glassmorphic Card */}
          <div className="flex-1 relative w-full flex justify-center lg:justify-end animate-float">
            {/* The Glassmorphic Data Card */}
            <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-black/60 font-bold mb-1">Total Net Pay</p>
                  <h3 className="text-4xl font-bold text-black tracking-tight">₹ 1,42,500</h3>
                </div>
                <button className="bg-cyber-yellow border-2 border-black/10 text-black text-xs font-bold px-4 py-2 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md">
                  View Slip
                </button>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center bg-black/5 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black text-cyber-yellow rounded-full flex items-center justify-center shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black">Attendance</p>
                      <p className="text-[10px] uppercase tracking-widest text-black/50">Nov 2026</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-black">98.5%</span>
                </div>

                <div className="flex justify-between items-center bg-black/5 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black text-cyber-yellow rounded-full flex items-center justify-center shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black">Leave Request</p>
                      <p className="text-[10px] uppercase tracking-widest text-black/50">Approved</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-700 bg-green-500/20 px-3 py-1 rounded-full">Paid</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── THE VOID SECTION ───────────────────────────────────────────── */}
      <section className="relative bg-void-onyx pt-24 pb-20 px-6 lg:px-16 -mt-16 z-0">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center mt-8">
          
          <div className="bg-void-charcoal border border-void-deepgray rounded-full px-6 py-2 flex items-center gap-3 mb-16 shadow-2xl">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-cyber-yellow">
               <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
             </svg>
             <span className="text-white text-xs font-bold uppercase tracking-widest">Built for the future of work</span>
          </div>

          <p className="text-void-deepgray text-sm uppercase tracking-widest font-bold mb-10 text-center">Trusted by modern enterprises</p>
          <div className="flex flex-wrap justify-center gap-12 lg:gap-24 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default">
             {/* Abstract Logos mimicking tech partners */}
             <div className="flex items-center gap-2 text-white font-bold text-xl select-none"><div className="w-6 h-6 bg-white rounded-md rotate-45"></div> Acme Corp</div>
             <div className="flex items-center gap-2 text-white font-bold text-xl select-none"><div className="w-6 h-6 rounded-full border-4 border-white"></div> Globex</div>
             <div className="flex items-center gap-2 text-white font-bold text-xl select-none"><div className="w-6 h-6 bg-white rounded-br-2xl"></div> Soylent</div>
             <div className="flex items-center gap-2 text-white font-bold text-xl select-none"><div className="w-6 h-2 bg-white rounded-full relative"><div className="absolute top-3 w-6 h-2 bg-white rounded-full"></div></div> Initech</div>
          </div>
        </div>
      </section>
    </div>
  );
}
