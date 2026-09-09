import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../lib/adminAuth";
import { UserPlus, Trash2, KeyRound, Check, X } from "lucide-react";

type Account = {
  id: number;
  username: string;
  isActive: boolean;
  createdAt: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirm, setNewConfirm] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  const [changingPasswordFor, setChangingPasswordFor] = useState<number | null>(null);
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch<Account[]>("/api/admin/accounts");
      setAccounts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess(false);

    if (!newUsername.trim() || !newPassword) {
      setCreateError("Username and password are required");
      return;
    }
    if (newPassword !== newConfirm) {
      setCreateError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setCreateError("Password must be at least 8 characters");
      return;
    }

    setCreating(true);
    try {
      await adminFetch("/api/admin/accounts", {
        method: "POST",
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword }),
      });
      setCreateSuccess(true);
      setNewUsername("");
      setNewPassword("");
      setNewConfirm("");
      fetchAccounts();
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  const handleChangePassword = async (id: number) => {
    setPwError("");
    setPwSuccess(false);
    if (!newPw) {
      setPwError("Password is required");
      return;
    }
    if (newPw !== newPwConfirm) {
      setPwError("Passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    setSavingPw(true);
    try {
      await adminFetch(`/api/admin/accounts/${id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPw }),
      });
      setPwSuccess(true);
      setNewPw("");
      setNewPwConfirm("");
      setTimeout(() => {
        setPwSuccess(false);
        setChangingPasswordFor(null);
      }, 2000);
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Failed to update password");
    } finally {
      setSavingPw(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await adminFetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
      setConfirmDeleteId(null);
      fetchAccounts();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete account");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-['Playfair_Display'] text-[#1A1A1A]">Admin Accounts</h2>
        <p className="text-gray-500 text-sm mt-1">
          Create and manage additional admin accounts. The master password (set via environment) always works regardless of accounts listed here.
        </p>
      </div>

      {/* Existing accounts */}
      <div className="bg-white border border-gray-200 rounded-sm mb-8">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-[#1A1A1A] uppercase tracking-wider">Existing Accounts</h3>
        </div>

        {loading && (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading…</div>
        )}

        {!loading && error && (
          <div className="px-5 py-4 text-red-600 text-sm">{error}</div>
        )}

        {!loading && !error && accounts.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            No additional admin accounts yet. Create one below.
          </div>
        )}

        {!loading && accounts.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {accounts.map((account) => (
              <li key={account.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#1A1A1A]">{account.username}</p>
                      {account.isActive ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded uppercase tracking-wider">Active</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-wider">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Created {formatDate(account.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setChangingPasswordFor(account.id);
                        setNewPw("");
                        setNewPwConfirm("");
                        setPwError("");
                        setPwSuccess(false);
                      }}
                      className="p-1.5 text-gray-400 hover:text-[#D4A373] transition-colors"
                      title="Change password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    {confirmDeleteId === account.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button
                          onClick={() => handleDelete(account.id)}
                          disabled={deletingId === account.id}
                          className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                          title="Confirm delete"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(account.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Change password inline form */}
                {changingPasswordFor === account.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-[#1A1A1A] mb-3 uppercase tracking-wider">Change Password</p>
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="New password (min 8 characters)"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-[#D4A373]"
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={newPwConfirm}
                        onChange={(e) => setNewPwConfirm(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-[#D4A373]"
                      />
                      {pwError && <p className="text-xs text-red-600">{pwError}</p>}
                      {pwSuccess && <p className="text-xs text-green-600">Password updated.</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleChangePassword(account.id)}
                          disabled={savingPw}
                          className="px-4 py-2 bg-[#1A1A1A] text-white text-xs uppercase tracking-wider font-medium hover:bg-[#D4A373] transition-colors rounded-sm disabled:opacity-50"
                        >
                          {savingPw ? "Saving…" : "Save Password"}
                        </button>
                        <button
                          onClick={() => { setChangingPasswordFor(null); setPwError(""); }}
                          className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create new account */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#D4A373]" />
          <h3 className="text-sm font-medium text-[#1A1A1A] uppercase tracking-wider">Create New Account</h3>
        </div>
        <form onSubmit={handleCreate} className="px-5 py-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
            <input
              type="text"
              placeholder="e.g. staff1"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              autoComplete="off"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-[#D4A373]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-[#D4A373]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={newConfirm}
              onChange={(e) => setNewConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-sm focus:outline-none focus:border-[#D4A373]"
            />
          </div>

          {createError && <p className="text-xs text-red-600">{createError}</p>}
          {createSuccess && <p className="text-xs text-green-600">Account created successfully.</p>}

          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 bg-[#1A1A1A] text-white text-xs uppercase tracking-widest font-medium hover:bg-[#D4A373] transition-colors rounded-sm disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
