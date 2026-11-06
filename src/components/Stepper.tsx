import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, onStepClick }) => {
  const steps = [
    { number: 1, title: 'Data Proyek' },
    { number: 2, title: 'Input Gambar / Manual' },
    { number: 3, title: 'Perhitungan Volume' },
    { number: 4, title: 'Rekap & Ekspor' },
  ];

  return (
    <div className="bg-white/60 backdrop-blur-md border-b border-black/[0.06] px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-start gap-2 overflow-x-auto text-xs py-0.5 no-scrollbar">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-black/[0.04] border border-black/[0.04]">
          {steps.map((step) => {
            const isDone = currentStep > step.number;
            const isActive = currentStep === step.number;

            return (
              <button
                key={step.number}
                onClick={() => onStepClick(step.number)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer apple-press ${
                  isActive
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : isDone
                    ? 'text-emerald-700 font-medium hover:text-emerald-800'
                    : 'text-slate-500 hover:text-slate-800 font-normal'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-[#0071E3] text-white'
                      : 'bg-black/10 text-slate-600'
                  }`}
                >
                  {isDone ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : step.number}
                </div>
                <span className="whitespace-nowrap tracking-tight">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
