/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword, updateUser } from "@/../api/users.api";
import { getTariffs, type Tariff } from "@/../api/tariffs.api";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import useAxiosWithAuth from "@/../utils/axiosInterceptor";
//@ts-ignore
import { useGlobalContext } from "@/../context/GlobalContext.jsx";
import { TariffConfiguration } from "@/components/Settings/tariff-configuration";
import {
  User, Lock, Settings2, ArrowLeft, Loader2,
  Mail, Phone, KeyRound, Eye, EyeOff, ShieldCheck,
  CheckCircle2, AlertCircle
} from "lucide-react";

// ─── Reusable Field components (shared design system) ────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="av-label text-[10.5px] text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder = "", type = "text", prefix, disabled = false, ...rest
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-sm text-muted-foreground font-medium select-none pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={resolvedType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full py-2.5 text-sm border border-border rounded-lg bg-muted
          focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all placeholder:text-muted-foreground
          ${prefix ? "pl-12" : "pl-3"}
          ${isPassword ? "pr-10" : "pr-3"}
        `}
        {...rest}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 text-muted-foreground hover:text-text-secondary transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

// ─── Password strength indicator ─────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const strengthMap = [
    { label: "Too weak",  color: "bg-danger",   text: "text-danger-text"   },
    { label: "Weak",      color: "bg-warn",  text: "text-warn-text" },
    { label: "Fair",      color: "bg-warn",   text: "text-warn-text"  },
    { label: "Good",      color: "bg-primary",    text: "text-accent-text"   },
    { label: "Strong",    color: "bg-ok", text: "text-ok-text"},
  ];
  const s = strengthMap[score];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? s.color : "bg-accent"}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`inline-flex items-center gap-1 text-xs font-medium ${c.ok ? "text-ok-text" : "text-muted-foreground"}`}
          >
            {c.ok
              ? <CheckCircle2 className="w-3 h-3" />
              : <AlertCircle className="w-3 h-3" />
            }
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({
  title, description, icon: Icon, children, footer
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="av-panel overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-5 border-b border-border flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="px-6 py-5">
        {children}
      </div>

      {/* Card footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-border bg-muted/60 flex items-center justify-end">
          {footer}
        </div>
      )}
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({
  active, onClick, icon: Icon, label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all relative
        ${active
          ? "text-accent-text bg-signal-soft/60 border-b-2 border-signal"
          : "text-muted-foreground hover:text-text-secondary hover:bg-muted"
        }
      `}
    >
      <Icon className={`w-4 h-4 ${active ? "text-accent-text" : "text-muted-foreground"}`} />
      {label}
    </button>
  );
}

// ─── Save button ──────────────────────────────────────────────────────────────
function SaveButton({ isSaving, onClick, label = "Save changes" }: { isSaving: boolean; onClick?: () => void; label?: string }) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={isSaving}
      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg
                 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all shadow-sm shadow-black/10"
    >
      {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {isSaving ? "Saving…" : label}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_PUBLIC_STAGING_API);
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  type TabId = "account" | "configurations" | "security";
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [isSaving, setIsSaving] = useState(false);

  const [userData, setUserData] = useState({
    name:  user?.name  || "",
    email: user?.email || "",
    phone: user?.phone?.slice(3) || "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword:        "",
    newPassword:        "",
    confirmNewPassword: "",
  });

  //@ts-ignore
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);

  useEffect(() => {
    const fetchTariffs = async () => {
      try {
        setIsLoadingTariffs(true);
        const response = await getTariffs(axiosInstance);
        setTariffs(response.data);
      } catch (err) {
        console.error("Error fetching tariffs:", err);
      } finally {
        setIsLoadingTariffs(false);
      }
    };
    fetchTariffs();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateUser(axiosInstance, {
        name:  userData.name,
        email: userData.email,
        phone: `254${userData.phone}`,
      });
      toast.success("Profile updated successfully");
    } catch (err) {
      //@ts-ignore
      toast.error(`Failed to update profile: ${err?.response?.data?.error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error("Passwords don't match");
      return;
    }
    try {
      setIsSaving(true);
      await updatePassword(axiosInstance, {
        newPassword: passwordData.newPassword,
        oldPassword: passwordData.oldPassword,
      });
      toast.success("Password updated — please sign in again");
      setPasswordData({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      //@ts-ignore
      toast.error(`Failed to update password: ${err?.response?.data?.error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: "account",        label: "Account",        icon: User     },
    { id: "configurations", label: "Configurations", icon: Settings2, adminOnly: true },
    { id: "security",       label: "Security",       icon: Lock     },
  ];

  return (
    <div className="min-h-full">
      <Toaster position="top-right" richColors />

      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-4 animate-in">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-text-secondary hover:bg-muted transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="av-label text-[10.5px] text-accent-text mb-0.5">System</p>
            <h1 className="av-display text-[28px] leading-tight font-bold tracking-[-0.03em] text-foreground sm:text-[32px]">Settings<span className="text-signal">.</span></h1>
          </div>
        </div>

        {/* ── Tabs + Content ── */}
        <div className="av-panel overflow-hidden animate-in" style={{ animationDelay: "80ms" }}>

          {/* Tab bar */}
          <div className="flex border-b border-border px-2 pt-1">
            {tabs
              .filter((t) => !t.adminOnly || isAdmin)
              .map((tab) => (
                <TabBtn
                  key={tab.id}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}
          </div>

          {/* Tab content */}
          <div className="p-6">

            {/* ── Account tab ── */}
            {activeTab === "account" && (
              <div className="space-y-5 animate-in">
                {/* User identity header */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted border border-border">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md shadow-black/10 flex-shrink-0">
                    <span className="text-lg font-bold text-white">
                      {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{user?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md bg-accent border border-border text-xs font-medium text-text-secondary">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      {user?.role || "member"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Profile fields */}
                <div>
                  <p className="av-label text-[10.5px] text-muted-foreground mb-4">Profile Information</p>
                  <div className="space-y-4">
                    <Field label="Display Name">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <input
                          type="text"
                          value={userData.name}
                          onChange={(e) => setUserData((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Your full name"
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all placeholder:text-muted-foreground"
                        />
                      </div>
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Email Address">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                          <input
                            type="email"
                            value={userData.email}
                            onChange={(e) => setUserData((p) => ({ ...p, email: e.target.value }))}
                            placeholder="you@example.com"
                            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all placeholder:text-muted-foreground"
                          />
                        </div>
                      </Field>

                      <Field label="Phone Number">
                        <div className="flex items-center gap-0">
                          <span className="flex-shrink-0 px-3 py-2.5 text-sm font-medium text-muted-foreground bg-accent border border-border border-r-0 rounded-l-lg leading-none">
                            +254
                          </span>
                          <div className="relative flex-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                            <input
                              type="text"
                              value={userData.phone}
                              onChange={(e) => setUserData((p) => ({ ...p, phone: e.target.value }))}
                              placeholder="7XXXXXXXX"
                              className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-l-none rounded-r-lg bg-muted focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-signal-edge transition-all placeholder:text-muted-foreground"
                            />
                          </div>
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <SaveButton isSaving={isSaving} onClick={handleSave} />
                </div>
              </div>
            )}

            {/* ── Configurations tab ── */}
            {activeTab === "configurations" && isAdmin && (
              <div className="animate-in">
                <TariffConfiguration />
              </div>
            )}

            {/* ── Security tab ── */}
            {activeTab === "security" && (
              <div className="space-y-5 animate-in">
                <div>
                  <p className="av-label text-[10.5px] text-muted-foreground mb-1">Change Password</p>
                  <p className="text-xs text-muted-foreground">After saving, you'll be signed out and need to sign in again.</p>
                </div>

                <div className="border-t border-border" />

                <div className="space-y-4">
                  <Field label="Current Password">
                    <TextInput
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData((p) => ({ ...p, oldPassword: e.target.value }))}
                      placeholder="Enter your current password"
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Field label="New Password">
                        <TextInput
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                          placeholder="New password"
                        />
                      </Field>
                      {passwordData.newPassword && (
                        <PasswordStrength password={passwordData.newPassword} />
                      )}
                    </div>

                    <Field label="Confirm New Password">
                      <TextInput
                        type="password"
                        value={passwordData.confirmNewPassword}
                        onChange={(e) => setPasswordData((p) => ({ ...p, confirmNewPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      {/* Match indicator */}
                      {passwordData.confirmNewPassword && (
                        <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                          passwordData.newPassword === passwordData.confirmNewPassword
                            ? "text-ok-text"
                            : "text-danger-text"
                        }`}>
                          {passwordData.newPassword === passwordData.confirmNewPassword
                            ? <><CheckCircle2 className="w-3 h-3" />Passwords match</>
                            : <><AlertCircle className="w-3 h-3" />Passwords don't match</>
                          }
                        </p>
                      )}
                    </Field>
                  </div>
                </div>

                {/* Security notice */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-warn-soft border border-warn-edge">
                  <KeyRound className="w-4 h-4 text-warn-text flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-warn-text">Before you save</p>
                    <p className="text-xs text-warn-text mt-0.5">
                      Changing your password will end your current session. Make sure you have access to your email in case you need to recover your account.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <SaveButton
                    isSaving={isSaving}
                    onClick={handleUpdatePassword}
                    label="Update Password"
                  />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;