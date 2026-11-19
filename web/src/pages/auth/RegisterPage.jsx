import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Alert from '../../components/Alert.jsx';
import AuthShell from '../../components/AuthShell.jsx';
import Button from '../../components/Button.jsx';
import FormField from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import Logo from '../../components/Logo.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import {
  normalizeEmail,
  toFieldErrors,
  validateEmail,
  validateName,
  validatePassword,
} from '../../utils/validation.js';

const roles = [
  {
    value: 'estudiante',
    icon: 'person',
    title: 'Estudiante',
    description: 'Aprender y certificarme',
  },
  {
    value: 'instructor',
    icon: 'co_present',
    title: 'Instructor',
    description: 'Crear cursos y evaluar',
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    rol: 'estudiante',
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  function validate() {
    const nextErrors = {};
    const nameError = validateName(form.nombre);
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);

    if (nameError) {
      nextErrors.nombre = nameError;
    }
    if (emailError) {
      nextErrors.email = emailError;
    }
    if (passwordError) {
      nextErrors.password = passwordError;
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Confirma tu contraseña.';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await register({
        nombre: form.nombre.trim(),
        email: normalizeEmail(form.email),
        password: form.password,
        rol: form.rol,
      });
      navigate('/perfil', { replace: true, state: { welcome: true } });
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
      setSubmitting(false);
    }
  }

  return (
    <AuthShell variant={form.rol}>
      <div>
        <header className="mb-6 flex items-center justify-between gap-4">
          <Logo />
          <Link
            to="/"
            className="rounded-lg px-2 py-1 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-secondary"
          >
            Volver al inicio
          </Link>
        </header>

        <div className="mb-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Nueva cuenta
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-secondary sm:text-[28px] sm:leading-9">
            Crea tu cuenta
          </h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Selecciona tu rol y comienza a disfrutar la experiencia de
            aprendizaje.
          </p>
        </div>

        {formError && (
          <Alert
            variant="error"
            title="No pudimos crear tu cuenta"
            className="mb-5"
          >
            {formError}
          </Alert>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <fieldset>
            <legend className="mb-2 block text-xs font-semibold text-secondary">
              ¿Cómo deseas usar MiniAula?
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => {
                const selected = form.rol === role.value;

                return (
                  <label
                    key={role.value}
                    className={`relative flex cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 p-3 text-center transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-outline bg-surface hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rol"
                      value={role.value}
                      checked={selected}
                      onChange={() => updateField('rol', role.value)}
                      className="sr-only"
                    />
                    <Icon
                      name={role.icon}
                      filled={selected}
                      className={`mb-1 text-[28px] ${
                        selected ? 'text-primary' : 'text-secondary'
                      }`}
                    />
                    <span className="text-xs font-bold text-secondary">
                      {role.title}
                    </span>
                    <span className="mt-0.5 text-[11px] text-on-surface-variant">
                      {role.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <FormField
            id="register-name"
            name="nombre"
            label="Nombre completo"
            required
            autoComplete="name"
            placeholder="Ej. Sofía Martínez"
            value={form.nombre}
            error={errors.nombre}
            onChange={(event) => updateField('nombre', event.target.value)}
          />

          <FormField
            id="register-email"
            name="email"
            label="Correo electrónico"
            type="email"
            icon="mail"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="tu.correo@ejemplo.com"
            value={form.email}
            error={errors.email}
            onChange={(event) => updateField('email', event.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="register-password"
              name="password"
              label="Contraseña"
              type="password"
              revealable
              required
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              error={errors.password}
              onChange={(event) => updateField('password', event.target.value)}
            />

            <FormField
              id="register-confirm-password"
              name="confirmPassword"
              label="Confirmar contraseña"
              type="password"
              revealable
              required
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              onChange={(event) =>
                updateField('confirmPassword', event.target.value)
              }
            />
          </div>

          <Button
            type="submit"
            loading={submitting}
            icon="person_add"
            className="mt-2 w-full py-3"
          >
            {submitting ? 'Creando tu cuenta…' : 'Crear cuenta'}
          </Button>
        </form>
      </div>

      <footer className="mt-6 border-t border-outline-light pt-4 text-center">
        <p className="text-sm text-on-surface-variant">
          ¿Ya tienes una cuenta registrada?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </footer>
    </AuthShell>
  );
}
