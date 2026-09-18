import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";

export default function EvidenceCard({
  title,
  status,
  description,
}) {
  const icons = {
    verified: CheckCircle2,
    suspicious: AlertTriangle,
    failed: XCircle,
    inconclusive: HelpCircle,
  };

  const Icon = icons[status] || HelpCircle;

  return (
    <div className="bg-white border rounded-2xl p-5">
      <div className="flex items-start gap-4">

        <div className="p-3 bg-slate-100 rounded-xl">
          <Icon size={22} />
        </div>

        <div>
          <h3 className="font-bold">
            {title}
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            {description}
          </p>

          <p className="text-sm font-semibold mt-3 capitalize">
            {status}
          </p>
        </div>

      </div>
    </div>
  );
}