import React from 'react';

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-stretch">
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-[#21264e] relative overflow-hidden p-12 xl:p-16 flex-col justify-between">
        <img src="/h2.svg" alt="" aria-hidden="true" className="absolute -right-28 -top-28 h-80 w-80 opacity-20" />
        <img src="/h1.svg" alt="" aria-hidden="true" className="absolute -bottom-32 -left-20 h-96 w-96 opacity-[.15]" />
        <div className="relative">
          <img src="/logo.png" alt="Retailer Incentive Statement" className="h-10 w-auto" />
          <div className="mt-24 max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#61c7d0]">
              Retailer Incentive Statement
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight text-white xl:text-5xl">
              Your performance, clearly in view.
            </h2>
            <p className="mt-6 text-base leading-7 text-white/65">
              Access statements, calculate incentives, and keep every result close at hand.
            </p>
          </div>
        </div>
        <div className="relative flex items-center gap-3 text-sm text-white/50">
          <span className="h-px w-8 bg-[#61c7d0]" />
          Secure access for your team
        </div>
      </div>
      <div className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-[55%] xl:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center justify-center rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-slate-200/80 backdrop-blur-sm">
            <img src="/logo_b.webp" alt="Retailer Incentive Statement" className="h-9 w-auto" />
          </div>
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e3f3f5] text-[#006ae0]">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#182039]">{title}</h1>
            {subtitle && <p className="mt-2 text-[#68738b]">{subtitle}</p>}
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-[0_18px_50px_rgba(33,38,78,0.08)] sm:p-8">
            {children}
          </div>
          {footer && <p className="mt-6 text-center text-sm text-[#68738b]">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
