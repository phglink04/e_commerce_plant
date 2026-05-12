import { Check } from "lucide-react";

type Step = {
  label: string;
  description?: string;
};

type OrderTimelineProps = {
  steps: Step[];
  currentIndex: number; // 0-based index of current step
  cancelledAtIndex?: number; // if order is cancelled, show at which step
};

export default function OrderTimeline({
  steps,
  currentIndex,
  cancelledAtIndex,
}: OrderTimelineProps) {
  const isCancelled = cancelledAtIndex !== undefined;

  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const isDone = !isCancelled && i < currentIndex;
        const isCurrent = !isCancelled && i === currentIndex;
        const isCancelledStep = isCancelled && i === cancelledAtIndex;
        const isPending = !isDone && !isCurrent && !isCancelledStep;
        const isLast = i === steps.length - 1;

        return (
          <li key={step.label} className="flex items-start gap-3">
            {/* Icon + connector line */}
            <div className="flex flex-col items-center">
              <div
                className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isCurrent
                      ? "border-emerald-500 bg-white shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
                      : isCancelledStep
                        ? "border-rose-400 bg-rose-50"
                        : "border-slate-200 bg-white"
                }`}
              >
                {isDone ? (
                  <Check size={13} />
                ) : isCurrent ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                ) : isCancelledStep ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                )}
              </div>

              {!isLast && (
                <div
                  className={`mt-1 h-8 w-0.5 ${
                    isDone ? "bg-emerald-300" : "bg-slate-200"
                  }`}
                />
              )}
            </div>

            {/* Label */}
            <div className="pb-6 pt-1">
              <p
                className={`text-sm font-semibold ${
                  isDone || isCurrent
                    ? "text-slate-900"
                    : isCancelledStep
                      ? "text-rose-700"
                      : "text-slate-400"
                }`}
              >
                {step.label}
                {isCancelledStep && " (Cancelled)"}
              </p>
              {step.description && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
