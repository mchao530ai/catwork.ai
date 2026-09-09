import { useState } from "react";
import { adminFetch } from "../../lib/adminAuth";

type RecordType = "booking" | "enquiry";

type AdminReplyComposerProps = {
  recordType: RecordType;
  recordId: number;
  customerName: string;
  customerEmail: string;
  defaultSubject: string;
};

export default function AdminReplyComposer({
  recordType,
  recordId,
  customerName,
  customerEmail,
  defaultSubject,
}: AdminReplyComposerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const openComposer = () => {
    setSubject(defaultSubject);
    setMessage("");
    setStatus("idle");
    setError("");
    setIsOpen(true);
  };

  const closeComposer = () => {
    if (status !== "sending") setIsOpen(false);
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim() || status === "sending") return;

    setStatus("sending");
    setError("");
    try {
      await adminFetch("/api/admin/email/reply", {
        method: "POST",
        body: JSON.stringify({
          recordType,
          recordId,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "The email could not be sent.");
    }
  };

  const mailtoHref = `mailto:${customerEmail}?subject=${encodeURIComponent(defaultSubject)}`;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={openComposer}
        className="px-4 py-2 bg-[#1A1A1A] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#D4A373] transition-colors rounded-sm"
      >
        Reply by Email
      </button>
      <a
        href={mailtoHref}
        className="px-3 py-2 text-xs text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors rounded-sm"
      >
        Open in email app
      </a>

      {isOpen && (
        <div className="basis-full mt-2 bg-[#FDFBF7] border border-gray-200 rounded-sm p-4">
          {status === "sent" ? (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-green-700">
                Email sent to <strong>{customerEmail}</strong>.
              </p>
              <button
                type="button"
                onClick={closeComposer}
                className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 hover:border-gray-300 rounded-sm"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Reply to {customerName}
                </p>
                <button
                  type="button"
                  onClick={closeComposer}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                    To
                  </label>
                  <input
                    value={customerEmail}
                    readOnly
                    className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 text-gray-500 rounded-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`reply-subject-${recordType}-${recordId}`} className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <input
                    id={`reply-subject-${recordType}-${recordId}`}
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    maxLength={200}
                    required
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 text-[#1A1A1A] rounded-sm focus:outline-none focus:border-[#D4A373]"
                  />
                </div>
                <div>
                  <label htmlFor={`reply-message-${recordType}-${recordId}`} className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Message
                  </label>
                  <textarea
                    id={`reply-message-${recordType}-${recordId}`}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={10000}
                    required
                    rows={5}
                    placeholder="Write your reply…"
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 text-[#1A1A1A] rounded-sm resize-y focus:outline-none focus:border-[#D4A373]"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="submit"
                  disabled={status === "sending" || !subject.trim() || !message.trim()}
                  className="px-4 py-2 bg-[#1A1A1A] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#D4A373] transition-colors rounded-sm disabled:opacity-40"
                >
                  {status === "sending" ? "Sending…" : "Send Email"}
                </button>
                <button
                  type="button"
                  onClick={closeComposer}
                  disabled={status === "sending"}
                  className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}