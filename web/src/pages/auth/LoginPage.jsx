import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import Alert from '../../components/Alert.jsx';
import AuthShell from '../../components/AuthShell.jsx';
import Button from '../../components/Button.jsx';
import FormField from '../../components/FormField.jsx';
import Logo from '../../components/Logo.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  normalizeEmail,
  toFieldErrors,
  validateEmail,
} from '../../utils/validation.js';

function resolveDestination(from, rol) {
  if (
    typeof from === 'string'
    && from.startsWith('/')
    && !from.startsWith('//')
    && !from.startsWith('/login')
  ) {
    return from;
  }

  return rol === 'instructor' ? '/instructor/cursos' : '/panel';
}

export default function LoginPage() {
  const { login, notice, clearNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    clearNotice();

    const nextErrors = {};
    const emailError = validateEmail(form.email);
    if (emailError) {
      nextErrors.email = emailError;
    }
    if (!form.password) {
      nextErrors.password = 'Ingresa tu contraseña.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const usuarioSesion = await login({
        email: normalizeEmail(form.email),
        password: form.password,
      });
      navigate(resolveDestination(location.state?.from, usuarioSesion?.rol), {
        replace: true,
      });
    } catch (error) {
      if (error.status === 422) {
        const detailErrors = toFieldErrors(error.details, ['email', 'password']);
        setErrors(detailErrors);

        if (Object.keys(detailErrors).length === 0) {
          setFormError(error.message);
        }
      } else {
        setFormError(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell variant="login">
      <div>
        <header className="mb-8 flex items-center justify-between gap-4">
          <Logo />
          <Link
            to="/"
            className="rounded-control px-2 py-1 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary"
          >
            Volver al inicio
          </Link>
        </header>

        <div className="mb-8">
          <h1 className="mb-2 text-headline-lg-mobile text-secondary sm:text-headline-lg">
            ¡Qué bueno tenerte de vuelta!
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Accede a tus cursos y retoma tu aprendizaje.
          </p>
        </div>

        <div className="mb-5 space-y-3">
          {notice && (
            <Alert variant="info" title="Tu sesión expiró">
              {notice}
            </Alert>
          )}

          {formError && (
            <Alert variant="error" title="No pudimos iniciar tu sesión">
              {formError}
            </Alert>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="login-email"
            name="email"
            label="Correo electrónico"
            type="email"
            icon="mail"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="ejemplo@miniaula.edu"
            value={form.email}
            error={errors.email}
            onChange={(event) => updateField('email', event.target.value)}
          />

          <FormField
            id="login-password"
            name="password"
            label="Contraseña"
            type="password"
            icon="lock"
            revealable
            required
            autoComplete="current-password"
            placeholder="Ingresa tu contraseña"
            value={form.password}
            error={errors.password}
            onChange={(event) => updateField('password', event.target.value)}
          />

          <Button
            type="submit"
            loading={submitting}
            icon="arrow_forward"
            className="mt-2 w-full py-3"
          >
            {submitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="mt-4 text-center text-body-sm text-on-surface-variant">
          Tu sesión se mantendrá iniciada en este dispositivo hasta que cierres
          sesión o el token expire.
        </p>

        <details className="mt-6 rounded-control border border-dashed border-outline bg-background p-3 text-body-sm text-on-surface-variant">
          <summary className="cursor-pointer font-semibold text-secondary">
            Usar una cuenta de demostración
          </summary>
          <div className="mt-2 space-y-1">
            <p>
              Estudiante:{' '}
              <span className="font-medium text-secondary">
                carla.estudiante@miniaula.test
              </span>
            </p>
            <p>
              Contraseña:{' '}
              <span className="font-medium text-secondary">Miniaula123!</span>
            </p>
          </div>
        </details>
      </div>

      <footer className="mt-8 border-t border-outline-light pt-5 text-center">
        <p className="text-body-md text-on-surface-variant">
          ¿No tienes una cuenta aún?{' '}
          <Link
            to="/registro"
            className="font-semibold text-primary hover:underline"
          >
            Crear cuenta gratis
          </Link>
        </p>
      </footer>
    </AuthShell>
  );
}
