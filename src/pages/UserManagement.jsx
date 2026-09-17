import React, { useState, useEffect, useCallback, useMemo } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/api/supabaseClient";

import {
  UserPlus,
  Loader2,
  Shield,
  User as UserIcon,
  AlertCircle,
  Pencil,
  Ban,
  CheckCircle2,
  Building2,
  MapPin,
  X,
  Save,
  Trash2,
} from "lucide-react";

const ROLES = [
  { value: "admin", label: "Admin", desc: "Full access to everything" },
  { value: "branch_user", label: "Branch User", desc: "Sees only their branch's data" },
  { value: "zone_user", label: "Zone User", desc: "Sees only their zone's data" },
  { value: "viewer", label: "Viewer", desc: "Read-only access to all data" },
];

const roleBadge = (role) => {
  switch (role) {
    case "admin":
      return { bg: "#eef0f7", color: "#21264e", Icon: Shield, text: "Admin" };
    case "branch_user":
      return { bg: "#e6f0ff", color: "#006AE0", Icon: Building2, text: "Branch User" };
    case "zone_user":
      return { bg: "#fff4e0", color: "#a95f00", Icon: MapPin, text: "Zone User" };
    case "viewer":
    default:
      return { bg: "#e3faf0", color: "#087a4a", Icon: UserIcon, text: "Viewer" };
  }
};

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "viewer",
    branch_id: "",
    zone_id: "",
  });

  const isAdmin = user?.role === "admin";

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [uRes, bRes, zRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(`
            id, email, full_name, role, is_disabled, branch_id, zone_id,
            branches:branch_id(id,name,code),
            zones:zone_id(id,name,code)
          `)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("branches").select("id,name,code").order("name"),
        supabase.from("zones").select("id,name,code,branch_id").order("name"),
      ]);

      if (uRes.error) throw uRes.error;
      if (bRes.error) throw bRes.error;
      if (zRes.error) throw zRes.error;

      setUsers(uRes.data || []);
      setBranches(bRes.data || []);
      setZones(zRes.data || []);
    } catch (e) {
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredZones = useMemo(() => {
    if (!form.branch_id) return zones;
    return zones.filter((z) => z.branch_id === form.branch_id);
  }, [zones, form.branch_id]);

  const resetForm = () => {
    setForm({
      email: "",
      password: "",
      full_name: "",
      role: "viewer",
      branch_id: "",
      zone_id: "",
    });
    setEditingId(null);
    setOpenForm(false);
  };

  const openCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      email: row.email || "",
      password: "",
      full_name: row.full_name || "",
      role: row.role || "viewer",
      branch_id: row.branch_id || "",
      zone_id: row.zone_id || "",
    });
    setOpenForm(true);
  };

  const handleFormChange = (field, value) => {
    const next = { ...form, [field]: value };
    if (field === "branch_id") {
      next.zone_id = "";
    }
    if (
      field === "role" &&
      value !== "branch_user" &&
      value !== "zone_user"
    ) {
      next.branch_id = "";
      next.zone_id = "";
    }
    setForm(next);
  };

  const validateForm = () => {
    if (!editingId && !form.email.trim()) {
      setError("Email is required when creating a new user.");
      return false;
    }
    if (!editingId && form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (!form.role) {
      setError("Role is required.");
      return false;
    }
    if (form.role === "branch_user" && !form.branch_id) {
      setError("Branch is required for Branch User role.");
      return false;
    }
    if (form.role === "zone_user" && !form.zone_id) {
      setError("Zone is required for Zone User role.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (editingId) {
        const { error: functionErr } = await supabase.functions.invoke("admin-create-user", {
          body: {
            action: "update",
            user_id: editingId,
            email: form.email.trim(),
            full_name: form.full_name.trim() || null,
            role: form.role,
            branch_id: form.branch_id || null,
            zone_id: form.zone_id || null,
          },
        });
        if (functionErr) throw functionErr;
        setSuccess("User updated successfully.");
      } else {
        const { error: functionErr } = await supabase.functions.invoke("admin-create-user", {
          body: {
            email: form.email.trim(),
            password: form.password,
            full_name: form.full_name.trim() || null,
            role: form.role,
            branch_id: form.branch_id || null,
            zone_id: form.zone_id || null,
          },
        });
        if (functionErr) throw functionErr;
        setSuccess("User created and profile assigned successfully.");
      }
      resetForm();
      await loadAll();
    } catch (e) {
      let message = e?.message || "Failed to save.";
      if (e?.context instanceof Response) {
        try {
          const details = await e.context.json();
          message = details?.error || message;
        } catch {
        }
      }
      if (message === "Failed to send a request to the Edge Function") {
        message = "The admin-create-user Edge Function is unavailable. Deploy it to the same Supabase project as this app, then try again.";
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUser = async (row) => {
    if (row.id === user?.id) return;
    if (!window.confirm(`Permanently remove ${row.email || row.id}? This cannot be undone.`)) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const { error: functionErr } = await supabase.functions.invoke("admin-create-user", {
        body: { action: "delete", user_id: row.id },
      });
      if (functionErr) throw functionErr;
      setSuccess("User removed successfully.");
      await loadAll();
    } catch (e) {
      let message = e?.message || "Failed to remove user.";
      if (e?.context instanceof Response) {
        try {
          const details = await e.context.json();
          message = details?.error || message;
        } catch {
        }
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDisable = async (row) => {
    const verb = row.is_disabled ? "Enable" : "Disable";
    if (!window.confirm(`${verb} user ${row.email || row.id}?`)) return;
    try {
      const { error: e } = await supabase
        .from("profiles")
        .update({ is_disabled: !row.is_disabled })
        .eq("id", row.id);
      if (e) throw e;
      setSuccess(`User ${verb.toLowerCase()}d.`);
      await loadAll();
    } catch (err) {
      setError(err?.message || "Toggle failed.");
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="p-8 max-w-3xl mx-auto text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-700">Admin access required</h2>
          <p className="text-sm text-slate-500 mt-1">You need admin privileges to manage users.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div
          className="rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          style={{ backgroundColor: "#21264e" }}
        >
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5" /> User Management
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Admin-only: create users and assign roles & branch/zone scope.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[#21264e]"
            style={{ backgroundColor: "#08dc7d" }}
          >
            <UserPlus className="w-4 h-4" /> Create User
          </button>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            New users are created in Supabase Auth and assigned their application profile automatically. You can
            edit, disable, enable, or permanently remove users from this page.
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        {openForm && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                {editingId ? (
                  <><Pencil className="w-4 h-4 text-[#006AE0]" /> Edit User</>
                ) : (
                    <><UserPlus className="w-4 h-4 text-[#08dc7d]" /> Create New User</>
                )}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => handleFormChange("full_name", e.target.value)}
                  placeholder="Display name"
                  className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#006AE0]"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wide">
                  Email {!editingId && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  disabled={!!editingId}
                  value={form.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  placeholder="name@example.com"
                  className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#006AE0] disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide">
                    Temporary Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => handleFormChange("password", e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#006AE0]"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="text-xs text-slate-500 uppercase tracking-wide">Role</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-1">
                  {ROLES.map((r) => {
                    const active = form.role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => handleFormChange("role", r.value)}
                        className={`text-left rounded-lg border p-3 transition ${
                          active
                            ? "border-[#006AE0] bg-[#006AE0]/5 ring-1 ring-[#006AE0]"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-sm font-semibold text-slate-800">{r.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {["branch_user", "zone_user", "admin"].includes(form.role) && (
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide">
                    Branch {form.role === "branch_user" && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={form.branch_id}
                    onChange={(e) => handleFormChange("branch_id", e.target.value)}
                    className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#006AE0] bg-white"
                  >
                    <option value="">— None —</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.code ? `(${b.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.role === "zone_user" && (
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wide">
                    Zone <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.zone_id}
                    onChange={(e) => handleFormChange("zone_id", e.target.value)}
                    className="w-full mt-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#006AE0] bg-white"
                  >
                    <option value="">— None —</option>
                    {filteredZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} {z.code ? `(${z.code})` : ""}
                      </option>
                    ))}
                  </select>
                  {!form.branch_id && filteredZones.length === zones.length && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tip: pick a Branch first to shorten this list.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: "#006AE0" }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? "Save Changes" : "Create User"}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Team Members ({users.length})</h2>
            <button
              onClick={loadAll}
              className="text-xs text-[#006AE0] font-medium hover:underline"
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No profiles yet. Seed your admin profile via the migration SQL, then assign more profiles above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-2.5 font-medium">Name</th>
                    <th className="text-left px-5 py-2.5 font-medium">Email</th>
                    <th className="text-left px-5 py-2.5 font-medium">Role</th>
                    <th className="text-left px-5 py-2.5 font-medium">Scope</th>
                    <th className="text-left px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const badge = roleBadge(u.role);
                    const BadgeIcon = badge.Icon;
                    const isSelf = u.id === user?.id;
                    const branchName = u.branches?.name;
                    const zoneName = u.zones?.name;
                    return (
                      <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-5 py-3">
                          <div className="font-medium text-slate-800">
                            {u.full_name || <span className="text-slate-400 italic">—</span>}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
                            {u.id}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{u.email || "—"}</td>
                        <td className="px-5 py-3">
                          <span
                            className="inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-0.5"
                            style={{ backgroundColor: badge.bg, color: badge.color }}
                          >
                            <BadgeIcon className="w-3 h-3" /> {badge.text}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {branchName && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f0ff] text-[#006AE0] text-[11px] font-semibold px-2 py-0.5">
                                <Building2 className="w-3 h-3" /> {branchName}
                              </span>
                            )}
                            {zoneName && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e0] text-[#a95f00] text-[11px] font-semibold px-2 py-0.5">
                                <MapPin className="w-3 h-3" /> {zoneName}
                              </span>
                            )}
                            {!branchName && !zoneName && (
                              <span className="text-[11px] text-slate-400 italic">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {u.is_disabled ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                              <Ban className="w-3 h-3" /> Disabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEdit(u)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#006AE0] hover:underline mr-3"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => toggleDisable(u)}
                              disabled={submitting}
                              className={`inline-flex items-center gap-1 text-xs font-medium hover:underline ${
                                u.is_disabled ? "text-emerald-600" : "text-red-500"
                              }`}
                            >
                              {u.is_disabled ? (
                                <><CheckCircle2 className="w-3 h-3" /> Enable</>
                              ) : (
                                <><Ban className="w-3 h-3" /> Disable</>
                              )}
                            </button>
                          )}
                          {!isSelf && (
                            <button
                              onClick={() => deleteUser(u)}
                              disabled={submitting}
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
