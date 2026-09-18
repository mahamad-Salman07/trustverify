import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";

export default function Verification() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/results/${id}`);
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, navigate]);

  const steps = [
    "File uploaded",
    "Document preprocessing",
    "AI analysis",
    "Forensic analysis",
    "Official verification",
    "Cross-document verification",
  ];

  return (
    <MainLayout title="Verification">
      <div className="max-w-3xl mx-auto">

        <div className="bg-white border rounded-2xl p-8">

          <div className="text-center mb-10">
            <LoaderCircle
              size={55}
              className="mx-auto animate-spin"
            />

            <h2 className="text-2xl font-bold mt-5">
              Analyzing Document
            </h2>

            <p className="text-slate-500 mt-2">
              Please wait while TRUSTVERIFY analyzes your file.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
              >
                <CheckCircle2 size={22} />

                <div>
                  <p className="font-medium">
                    {step}
                  </p>

                  <p className="text-xs text-slate-500">
                    {index < 2
                      ? "Completed"
                      : "Processing"}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </MainLayout>
  );
}