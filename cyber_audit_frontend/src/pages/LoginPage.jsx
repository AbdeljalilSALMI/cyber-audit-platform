import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { ApiError } from "../lib/api";
import { useSession } from "../context/SessionContext.jsx";

export default function LoginPage() {
  const { login } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Renseignez votre identifiant et votre mot de passe.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue. Réessayez ultérieurement.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Masthead rule — the page's single ornamental gesture */}
      <div className="h-[3px] w-full bg-brand-900" />

      <header className="px-8 py-6 sm:px-12">
        <span className="flex items-center gap-2 font-mono text-[13px] font-medium tracking-[0.14em] text-brand-900">
          <span className="flex items-end gap-[2px]" aria-hidden="true">
            <span className="h-2 w-[3px] bg-brand-700" />
            <span className="h-3.5 w-[3px] bg-brand-700" />
            <span className="h-2.5 w-[3px] bg-accent" />
          </span>
          CYBERAUDIT
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[400px]">
          <div className="overflow-hidden rounded border border-border bg-surface shadow-card">
            <div className="h-1 w-full bg-brand-700" />

            <div className="px-8 py-9">
              <h1 className="text-[19px] font-semibold leading-tight text-ink-primary">
                Connexion
              </h1>
              <p className="mt-1.5 text-[13.5px] text-ink-secondary">
                Accédez à votre espace d'audit cybersécurité.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-2.5 rounded-sm border border-danger-border bg-danger-bg px-3.5 py-3"
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger"
                    strokeWidth={2}
                  />
                  <p className="text-[13px] leading-snug text-danger">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="username"
                    className="block text-[13px] font-medium text-ink-primary"
                  >
                    Identifiant
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSubmitting}
                    className="mt-1.5 block h-11 w-full rounded-sm border border-border bg-white px-3.5 text-[14px] text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-bg disabled:text-ink-muted"
                    placeholder="ex. auditeur.martin"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-[13px] font-medium text-ink-primary"
                    >
                      Mot de passe
                    </label>
                    <a
                      href="#forgot-password"
                      className="text-[12.5px] font-medium text-accent hover:text-brand-700"
                    >
                      Mot de passe oublié ?
                    </a>
                  </div>
                  <div className="relative mt-1.5">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="block h-11 w-full rounded-sm border border-border bg-white px-3.5 pr-10 text-[14px] text-ink-primary placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-bg disabled:text-ink-muted"
                      placeholder="••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-muted hover:text-ink-secondary"
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={1.75} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-11 w-full items-center justify-center rounded-sm bg-brand-700 text-[14px] font-medium text-white transition-transform hover:bg-brand-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-brand-700/60"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-white/40 border-t-white" />
                      Connexion en cours
                    </span>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </form>
            </div>

            <div className="border-t border-border bg-bg px-8 py-3.5">
              <p className="text-[12px] text-ink-muted">
                Accès réservé au personnel autorisé de l'organisation. Toute
                tentative non autorisée est journalisée.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center font-mono text-[11px] tracking-wide text-ink-muted">
            SESSION SÉCURISÉE · TLS 1.3 · v1.0.0
          </p>
        </div>
      </main>
    </div>
  );
}
