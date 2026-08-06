"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAccounts, addAccount, activateAccount } from "@/services/frontend/accountService";

export default function LoginPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [cookie, setCookie] = useState("");
  const [formError, setFormError] = useState("");

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
  });

  const addMutation = useMutation({
    mutationFn: addAccount,
    onSuccess: () => {
      setName("");
      setCookie("");
      setFormError("");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (err) => {
      setFormError(err.message || "Failed to add account");
    }
  });

  const activateMutation = useMutation({
    mutationFn: activateAccount,
    onSuccess: () => {
      router.push("/restaurants");
    },
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim() || !cookie.trim()) {
      setFormError("Both name and cookie are required");
      return;
    }
    addMutation.mutate({ name, cookie });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-8 flex justify-center items-center w-full font-sans">
      <div className="w-full max-w-5xl mt-16 space-y-10">
        <div className="w-full bg-white border border-slate-200/60 p-8 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
          <h2 className="text-xl font-bold mb-6 text-slate-800">
            Add New Account
          </h2>

          <form onSubmit={handleAdd} className="space-y-6 w-full">
            {formError && (
              <div className="w-full text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100">
                {formError}
              </div>
            )}

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2 w-full">
                <label className="w-full text-sm font-semibold text-slate-600 block">Account Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bangalore Store"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-2 w-full">
                <label className="w-full text-sm font-semibold text-slate-600 block">Raw Cookie String</label>
                <input
                  type="text"
                  value={cookie}
                  onChange={(e) => setCookie(e.target.value)}
                  placeholder="csrf=...; __Host-zmxcsrft=..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono text-sm"
                />
              </div>
            </div>

            <div className="w-full flex justify-end">
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="px-8 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm hover:shadow disabled:opacity-50 flex items-center gap-2"
              >
                {addMutation.isPending ? "Adding..." : "Save Account"}
              </button>
            </div>
          </form>
        </div>

        <div className="w-full space-y-6 pt-4">
          <h2 className="w-full text-xl font-bold text-slate-800 pl-1">
            Available Accounts
          </h2>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="w-full animate-pulse bg-white border border-slate-100 rounded-2xl h-36"></div>
              ))
            ) : accounts.length === 0 ? (
              <div className="col-span-full w-full text-center py-12 text-slate-500 bg-white border border-dashed border-slate-300 rounded-2xl">
                No accounts saved yet. Add one above!
              </div>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.key}
                  className="group w-full bg-white border border-slate-200 p-6 rounded-2xl hover:border-emerald-400 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36 shadow-sm hover:shadow-md"
                >
                  <div className="w-full">
                    <h3 className="w-full text-lg font-bold text-slate-800 mb-1 truncate" title={account.key}>
                      {account.key}
                    </h3>
                    <p className="w-full text-xs font-mono text-slate-400 truncate mt-1">
                      {account.cookie.substring(0, 30)}...
                    </p>
                  </div>

                  <button
                    onClick={() => activateMutation.mutate(account.key)}
                    disabled={activateMutation.isPending}
                    className="absolute top-0 right-0 h-full w-0 group-hover:w-full bg-emerald-50 transition-all duration-300 flex items-center justify-center disabled:opacity-80"
                  >
                    <span className="opacity-0 group-hover:opacity-100 text-emerald-700 font-semibold tracking-wide flex items-center gap-2 transition-opacity duration-300 delay-75">
                      {activateMutation.isPending && activateMutation.variables === account.key ? (
                        "Logging in..."
                      ) : (
                        "Login to " + account.key
                      )}
                    </span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
