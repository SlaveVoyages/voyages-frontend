import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────
interface FormErrors {
  username?: string;
  password1?: string;
  password2?: string;
}

// ── Reusable form-row ─────────────────────────────────────────────────────────
const FormRow: React.FC<{
  id: string;
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
}> = ({ id, label, required, helpText, error, children }) => (
  <div
    className="form-row"
    style={{
      overflow: 'hidden',
      padding: '10px',
      fontSize: 13,
      borderBottom: '1px solid #eee',
    }}
  >
    <div style={{ overflow: 'hidden' }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          padding: '4px 10px 0 0',
          float: 'left',
          width: 160,
          wordWrap: 'break-word',
          lineHeight: 1,
          fontWeight: required ? 'bold' : 'normal',
          color: required ? '#333' : '#666',
          fontSize: 13,
        }}
      >
        {label}:{required && <span style={{ color: '#c00', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ marginLeft: 170 }}>
        {children}
        {error && (
          <ul
            style={{
              margin: '4px 0 0 0',
              padding: 0,
              listStyle: 'none',
            }}
          >
            <li
              style={{
                fontSize: 12,
                display: 'block',
                padding: '4px 5px 4px 25px',
                border: '1px solid red',
                color: 'white',
                background: `red url(https://legacy.slavevoyages.org/static/admin/img/icon_alert.gif) 5px 0.3em no-repeat`,
              }}
            >
              {error}
            </li>
          </ul>
        )}
        {helpText && (
          <p
            className="help"
            style={{
              fontSize: 10,
              color: '#999',
              margin: '4px 0 0 0',
              padding: 0,
            }}
          >
            {helpText}
          </p>
        )}
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AdminUserAdd: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '20em',
    border: '1px solid #ccc',
    padding: '2px 3px',
    fontSize: 11,
    fontFamily: '"Lucida Grande",Verdana,Arial,sans-serif',
    verticalAlign: 'middle',
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!username.trim()) e.username = 'This field is required.';
    else if (username.length < 3)
      e.username = 'Username must be at least 3 characters.';
    if (!password1) e.password1 = 'This field is required.';
    else if (password1.length < 8)
      e.password1 = 'This password is too short. It must contain at least 8 characters.';
    if (!password2) e.password2 = 'This field is required.';
    else if (password1 !== password2)
      e.password2 = "The two password fields didn't match.";
    return e;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaved(true);
    // After save, navigate back to user list
    setTimeout(() => navigate('/admin/auth/user/'), 800);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f8f8',
        fontFamily:
          '"Lucida Grande","DejaVu Sans","Bitstream Vera Sans",Verdana,Arial,sans-serif',
        fontSize: 13,
        color: '#333',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#05768A',
          color: '#fff',
          overflow: 'hidden',
          padding: '0 10px',
          position: 'relative',
        }}
      >
        <div style={{ float: 'left', paddingTop: 6 }}>
          <h1
            style={{
              padding: '0 10px 5px 0',
              margin: 0,
              fontWeight: 'normal',
              color: '#fff',
              fontSize: 18,
            }}
          >
            Voyage Admin Live
          </h1>
          <h2
            style={{
              padding: 0,
              fontSize: 12,
              margin: '-6px 0 8px 0',
              fontWeight: 'normal',
              color: '#fff',
              opacity: 0.8,
            }}
          >
            Any changes will take effect immediately
          </h2>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '10px 12px',
            fontSize: 11,
            textAlign: 'right',
            color: '#fff',
          }}
        >
          Welcome, <strong>admin</strong>.&nbsp;&nbsp;
          <a
            href="#"
            style={{ color: '#fff', textDecoration: 'underline', marginRight: 8 }}
            onClick={(e) => e.preventDefault()}
          >
            Change password
          </a>
          <a
            href="/"
            style={{ color: '#fff', textDecoration: 'underline', marginRight: 8 }}
            onClick={(e) => { e.preventDefault(); navigate('/'); }}
          >
            View site
          </a>
          <a
            href="#"
            style={{ color: '#fff', textDecoration: 'underline' }}
            onClick={(e) => e.preventDefault()}
          >
            Log out
          </a>
        </div>
      </div>

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '2px 8px 3px 8px',
          fontSize: 11,
          color: '#999',
          borderBottom: '1px solid #ccc',
          background: `white url(https://legacy.slavevoyages.org/static/admin/img/nav-bg-reverse.gif) 0 -10px repeat-x`,
        }}
      >
        <a
          href="/admin/"
          style={{ color: '#417690' }}
          onClick={(e) => { e.preventDefault(); navigate('/admin/'); }}
        >
          Home
        </a>
        {' › '}
        <a href="#" style={{ color: '#417690' }} onClick={(e) => e.preventDefault()}>
          Authentication and Authorization
        </a>
        {' › '}
        <a
          href="/admin/auth/user/"
          style={{ color: '#417690' }}
          onClick={(e) => { e.preventDefault(); navigate('/admin/auth/user/'); }}
        >
          Users
        </a>
        {' › '}
        Add user
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div
        id="content"
        style={{
          maxWidth: 1000,
          margin: '10px auto',
          padding: '0 15px',
          position: 'relative',
        }}
      >
        {/* Object tools */}
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 4px 0',
            float: 'right',
            display: 'flex',
            gap: 4,
          }}
        >
          <li>
            <a
              href="/admin/auth/user/"
              style={{
                display: 'inline-block',
                padding: '3px 10px',
                background: '#417690',
                color: '#fff',
                fontSize: 11,
                fontWeight: 'bold',
                textDecoration: 'none',
                borderRadius: 2,
              }}
              onClick={(e) => { e.preventDefault(); navigate('/admin/auth/user/'); }}
            >
              ← Back to Users
            </a>
          </li>
        </ul>

        <h1 style={{ fontSize: 18, color: '#666', margin: '0 0 16px 0', fontWeight: 'bold', clear: 'none' }}>
          Add user
        </h1>

        {/* Success message */}
        {saved && (
          <ul style={{ padding: 0, margin: '0 0 10px 0' }}>
            <li
              style={{
                fontSize: 12,
                display: 'block',
                padding: '4px 5px 4px 25px',
                marginBottom: 3,
                borderBottom: '1px solid #ddd',
                color: '#666',
                background: `#ffc url(https://legacy.slavevoyages.org/static/admin/img/icon_success.gif) 5px 0.3em no-repeat`,
                listStyle: 'none',
              }}
            >
              The user "<strong>{username}</strong>" was added successfully.
            </li>
          </ul>
        )}

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleSave} noValidate>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            First, enter a username and password. Then, you'll be able to edit more user options.
          </p>

          {/* Fieldset */}
          <fieldset
            className="module aligned"
            style={{
              border: '1px solid #ccc',
              marginBottom: 20,
              background: 'white',
              padding: 0,
            }}
          >
            <h2
              style={{
                margin: 0,
                padding: '2px 5px 3px 5px',
                fontSize: 11,
                textAlign: 'left',
                fontWeight: 'bold',
                background: '#008ca8',
                color: 'white',
              }}
            >
              &nbsp;
            </h2>

            {/* Username */}
            <FormRow
              id="id_username"
              label="Username"
              required
              error={errors.username}
              helpText="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."
            >
              <input
                id="id_username"
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={150}
                autoFocus
                style={{
                  ...inputStyle,
                  borderColor: errors.username ? 'red' : '#ccc',
                  background: errors.username ? '#ffc' : '#fff',
                }}
              />
            </FormRow>

            {/* Password */}
            <FormRow
              id="id_password1"
              label="Password"
              required
              error={errors.password1}
              helpText="Your password must contain at least 8 characters."
            >
              <input
                id="id_password1"
                type="password"
                name="password1"
                value={password1}
                onChange={(e) => setPassword1(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.password1 ? 'red' : '#ccc',
                  background: errors.password1 ? '#ffc' : '#fff',
                }}
              />
            </FormRow>

            {/* Password confirmation */}
            <FormRow
              id="id_password2"
              label="Password confirmation"
              required
              error={errors.password2}
              helpText="Enter the same password as before, for verification."
            >
              <input
                id="id_password2"
                type="password"
                name="password2"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.password2 ? 'red' : '#ccc',
                  background: errors.password2 ? '#ffc' : '#fff',
                }}
              />
            </FormRow>
          </fieldset>

          {/* ── Submit row ────────────────────────────────────────────── */}
          <div
            className="submit-row"
            style={{
              padding: '12px 14px',
              margin: '0 0 20px',
              background: '#f8f8f8',
              border: '1px solid #eee',
              borderRadius: 4,
              overflow: 'hidden',
              textAlign: 'right',
            }}
          >
            <input
              type="submit"
              value="Save"
              className="default"
              style={{
                height: 35,
                lineHeight: '15px',
                margin: '0 0 0 8px',
                padding: '0 15px',
                border: '2px solid #5b80b2',
                background: '#7CA0C7',
                fontWeight: 'bold',
                color: 'white',
                fontSize: 13,
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: 3,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLInputElement).style.background = '#5b80b2')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLInputElement).style.background = '#7CA0C7')
              }
            />
            <input
              type="button"
              value="Save and add another"
              style={{
                height: 35,
                lineHeight: '15px',
                margin: '0 0 0 5px',
                padding: '0 12px',
                border: '1px solid #bbb',
                background: '#e8e8e8',
                fontSize: 12,
                cursor: 'pointer',
                borderRadius: 3,
                color: '#333',
              }}
              onClick={() => {
                const errs = validate();
                if (Object.keys(errs).length > 0) { setErrors(errs); return; }
                setUsername(''); setPassword1(''); setPassword2(''); setErrors({});
              }}
            />
            <input
              type="button"
              value="Save and continue editing"
              style={{
                height: 35,
                lineHeight: '15px',
                margin: '0 0 0 5px',
                padding: '0 12px',
                border: '1px solid #bbb',
                background: '#e8e8e8',
                fontSize: 12,
                cursor: 'pointer',
                borderRadius: 3,
                color: '#333',
              }}
              onClick={handleSave}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserAdd;
