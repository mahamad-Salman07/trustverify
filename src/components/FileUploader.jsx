import { useState } from "react";
import { UploadCloud, FileText } from "lucide-react";

export default function FileUploader({ onFile }) {
  const [file, setFile] = useState(null);

  function handleFile(e) {
    const selected = e.target.files?.[0];

    if (!selected) return;

    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowed.includes(selected.type)) {
      alert("Only PDF, PNG, JPG and DOCX files are supported.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      alert("Maximum file size is 10 MB.");
      return;
    }

    setFile(selected);
    onFile(selected);
  }

  return (
    <label className="block cursor-pointer">
      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-slate-500 transition bg-white">

        {file ? (
          <>
            <FileText
              size={45}
              className="mx-auto mb-4"
            />

            <p className="font-semibold">
              {file.name}
            </p>

            <p className="text-sm text-slate-500 mt-2">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </>
        ) : (
          <>
            <UploadCloud
              size={50}
              className="mx-auto mb-4 text-slate-400"
            />

            <p className="font-semibold text-lg">
              Upload your document
            </p>

            <p className="text-slate-500 mt-2">
              PDF, PNG, JPG or DOCX
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Maximum 10 MB
            </p>
          </>
        )}

      </div>

      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.docx"
        onChange={handleFile}
        className="hidden"
      />
    </label>
  );
}