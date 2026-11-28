import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import FormField from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  normalizeEmail,
  toFieldErrors,
  validateEmail,
  validateName,
  validatePassword,
} from '../../utils/validation.js';

function getInitials(nombre) {
  const words = nombre.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return 'MA';
  }

  const first = words[0][0] ?? '';
  const last = words.length > 1 ? words[words.length - 1][0] ?? '' : '';
  return `${first}${last}`.toUpperCase();
}

function formatDate(value) {
  if (!value) {
    return 'Fecha no disponible';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function ProfilePage() {
  const { usuario, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? '',
    email: usuario?.email ?? '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ nombre: false, email: false });
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(
    location.state?.welcome
      ? '¡Bienvenido a MiniAula! Tu cuenta está lista para empezar.'
      : null,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      nombre: touched.nombre ? current.nombre : usuario?.nombre ?? '',
      email: touched.email ? current.email : usuario?.email ?? '',
    }));
  }, [usuario?.nombre, usuario?.email, touched.nombre, touched.email]);

  if (!usuario) {
    return null;
  }

  const roleLabel = usuario.rol === 'instructor' ? 'Instructor' : 'Estudiante';
  const roleIcon = usuario.rol === 'instructor' ? 'co_present' : 'school';
  const panelPrincipal = usuario.rol === 'instructor' ? '/instructor/cursos' : '/panel';
  const roleClasses = usuario.rol === 'instructor'
    ? 'bg-warning-light text-warning'
    : 'bg-success-light text-success';

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setTouched((current) => (
      field === 'nombre' || field === 'email'
        ? { ...current, [field]: true }
        : current
    ));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
    setSuccess(null);
  }

  function resetForm() {
    setForm({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      confirmPassword: '',
    });
    setTouched({ nombre: false, email: false });
    setErrors({});
    setFormError(null);
    setSuccess(null);
  }

  function buildChanges() {
    const changes = {};
    const nombre = form.nombre.trim();
    const email = normalizeEmail(form.email);

    if (touched.nombre && nombre !== usuario.nombre) {
      changes.nombre = nombre;
    }
    if (touched.email && email !== usuario.email) {
      changes.email = email;
    }
    if (form.password) {
      changes.password = form.password;
    }

    return changes;
  }

  function validate() {
    const nextErrors = {};
    const nameError = validateName(form.nombre);
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password, { required: false });

    if (nameError) {
      nextErrors.nombre = nameError;
    }
    if (emailError) {
      nextErrors.email = emailError;
    }
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (form.password && !form.confirmPassword) {
      nextErrors.confirmPassword = 'Confirma la nueva contraseña.';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const changes = buildChanges();
    if (Object.keys(changes).length === 0) {
      setFormError('No hay cambios para guardar. Modifica al menos un dato.');
      return;
    }

    setSaving(true);

    try {
      const updated = await updateProfile(changes);
      setForm({
        nombre: updated.nombre,
        email: updated.email,
        password: '',
        confirmPassword: '',
      });
      setTouched({ nombre: false, email: false });
      setSuccess(
        changes.password
          ? 'Tus datos y tu contraseña se actualizaron correctamente.'
          : 'Tus datos se actualizaron correctamente.',
      );
    } catch (error) {
      if (error.status === 409) {
        const detailErrors = toFieldErrors(error.details, [
          'nombre',
          'email',
          'password',
        ]);

        if (
          error.code === 'EMAIL_EN_USO'
          || detailErrors.email
          || Object.keys(detailErrors).length === 0
        ) {
          setErrors({
            ...detailErrors,
            email: 'Ya existe una cuenta con ese correo electrónico.',
          });
        } else {
          setErrors(detailErrors);
        }
      } else if (error.status === 422) {
        const detailErrors = toFieldErrors(error.details, [
          'nombre',
          'email',
          'password',
        ]);
        setErrors(detailErrors);

        if (Object.keys(detailErrors).length === 0) {
          setFormError(error.message);
        }
      } else {
        setFormError(error.message);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Mi cuenta
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary sm:text-4xl">
            Tu perfil
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
            Administra tus datos personales y tu seguridad. Los cambios se
            guardan en tu cuenta de MiniAula.
          </p>
        </div>
        <Link
          to={panelPrincipal}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          Ir al panel principal
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-card border border-outline bg-surface p-6 shadow-card">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-on-primary shadow-card">
              {getInitials(usuario.nombre)}
            </div>
            <h2 className="mt-4 break-words text-lg font-semibold text-secondary">
              {usuario.nombre}
            </h2>
            <p className="mt-1 max-w-full break-all text-xs leading-5 text-on-surface-variant">
              {usuario.email}
            </p>
            <span
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${roleClasses}`}
            >
              <Icon name={roleIcon} filled className="text-[16px]" />
              {roleLabel}
            </span>
          </div>

          <dl className="mt-6 space-y-3 border-t border-outline-light pt-5 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-on-surface-variant">Rol</dt>
              <dd className="text-right font-medium text-secondary">
                {roleLabel}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-on-surface-variant">Miembro desde</dt>
              <dd className="text-right font-medium text-secondary">
                {formatDate(usuario.creadoEn)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-on-surface-variant">Cuenta</dt>
              <dd className="text-right font-medium text-success">Activa</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-[10px] bg-background p-3 text-xs leading-5 text-on-surface-variant">
            <div className="flex items-start gap-2">
              <Icon
                name="shield_lock"
                filled
                className="mt-0.5 shrink-0 text-[18px] text-primary"
              />
              <p>
                Tu sesión se mantiene guardada en este navegador para que no
                tengas que iniciar sesión en cada recarga.
              </p>
            </div>
          </div>

          <Button
            variant="danger"
            icon="logout"
            iconPosition="start"
            className="mt-5 w-full"
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </aside>

        <section className="rounded-card border border-outline bg-surface p-6 shadow-card sm:p-8">
          <div className="flex items-start gap-3 border-b border-outline-light pb-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/5 text-primary">
              <Icon name="manage_accounts" className="text-[22px]" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-secondary">
                Datos personales
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Mantén tu información al día. Tu correo se usa para iniciar
                sesión.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            {success && (
              <Alert variant="success" title="Cambios guardados">
                {success}
              </Alert>
            )}

            {formError && (
              <Alert variant="error" title="No pudimos guardar tus datos">
                {formError}
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="profile-name"
                name="nombre"
                label="Nombre completo"
                required
                autoComplete="name"
                value={form.nombre}
                error={errors.nombre}
                onChange={(event) => updateField('nombre', event.target.value)}
              />
              <FormField
                id="profile-email"
                name="email"
                label="Correo electrónico"
                type="email"
                icon="mail"
                required
                autoComplete="email"
                inputMode="email"
                value={form.email}
                error={errors.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </div>

            <div className="rounded-[10px] border border-outline bg-background/60 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-primary shadow-card">
                  <Icon name="key" className="text-[20px]" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-secondary">
                    Seguridad
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                    Déjalo en blanco si no deseas cambiar tu contraseña. La
                    nueva contraseña debe tener al menos 8 caracteres.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField
                  id="profile-password"
                  name="password"
                  label="Nueva contraseña"
                  type="password"
                  revealable
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  error={errors.password}
                  onChange={(event) =>
                    updateField('password', event.target.value)
                  }
                />
                <FormField
                  id="profile-confirm-password"
                  name="confirmPassword"
                  label="Confirmar contraseña"
                  type="password"
                  revealable
                  autoComplete="new-password"
                  placeholder="Repite la contraseña"
                  value={form.confirmPassword}
                  error={errors.confirmPassword}
                  onChange={(event) =>
                    updateField('confirmPassword', event.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-outline-light pt-5 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Descartar cambios
              </Button>
              <Button
                type="submit"
                loading={saving}
                icon="save"
                iconPosition="start"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
