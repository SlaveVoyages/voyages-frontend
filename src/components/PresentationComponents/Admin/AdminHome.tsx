import { Fragment } from 'react';

import { useNavigate } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ModelEntry {
  name: string;
  addUrl?: string;
  changeUrl: string;
}

interface AppSection {
  appName: string;
  models: ModelEntry[];
}

// ── Data ──────────────────────────────────────────────────────────────────────
const adminSections: AppSection[] = [
  {
    appName: 'Authentication and Authorization',
    models: [
      { name: 'Groups', changeUrl: '/admin/auth/group/' },
      { name: 'Users', addUrl: '/admin/auth/user/add/', changeUrl: '/admin/auth/user/' },
    ],
  },
  {
    appName: 'Blog',
    models: [
      { name: 'Authors', changeUrl: '/admin/blog/author/' },
      { name: 'Institutions', changeUrl: '/admin/blog/institution/' },
      { name: 'Posts', changeUrl: '/admin/blog/post/' },
      { name: 'Short references', changeUrl: '/admin/blog/shortref/' },
      { name: 'Tags', changeUrl: '/admin/blog/tag/' },
    ],
  },
  {
    appName: 'Common',
    models: [
      { name: 'Locations', changeUrl: '/admin/common/location/' },
      { name: 'Sources', changeUrl: '/admin/common/source/' },
      { name: 'Sparse dates', changeUrl: '/admin/common/sparsedate/' },
    ],
  },
  {
    appName: 'Document',
    models: [
      { name: 'Doc sparse dates', changeUrl: '/admin/document/docsparsedate/' },
      { name: 'Doc tags', changeUrl: '/admin/document/doctag/' },
      { name: 'Docs', changeUrl: '/admin/document/doc/' },
      { name: 'Pages', changeUrl: '/admin/document/page/' },
    ],
  },
  {
    appName: 'Past',
    models: [
      { name: 'African infos', changeUrl: '/admin/past/africaninfo/' },
      { name: 'Enslaved', changeUrl: '/admin/past/enslaved/' },
      { name: 'Enslavement relations', changeUrl: '/admin/past/enslavementrelation/' },
      { name: 'Enslaver aliases', changeUrl: '/admin/past/enslaveralias/' },
      { name: 'Enslaver identities', changeUrl: '/admin/past/enslaveridentity/' },
      { name: 'Enslaver roles', changeUrl: '/admin/past/enslaverrole/' },
      { name: 'Owner outcomes', changeUrl: '/admin/past/owneroutcome/' },
      { name: 'Particular outcomes', changeUrl: '/admin/past/particularoutcome/' },
      { name: 'Slaves outcomes', changeUrl: '/admin/past/slavesoutcome/' },
      { name: 'Vessel captured outcomes', changeUrl: '/admin/past/vesselcapturedoutcome/' },
    ],
  },
  {
    appName: 'Voyage',
    models: [
      { name: 'Cargo types', changeUrl: '/admin/voyage/cargotype/' },
      { name: 'Cargo units', changeUrl: '/admin/voyage/cargounit/' },
      { name: 'Nationalities', changeUrl: '/admin/voyage/nationality/' },
      { name: 'Resistances', changeUrl: '/admin/voyage/resistance/' },
      { name: 'Voyage sparse dates', changeUrl: '/admin/voyage/voyagesparsedate/' },
      { name: 'Voyages', changeUrl: '/admin/voyage/voyage/' },
    ],
  },
  {
    appName: 'Geo',
    models: [
      { name: 'Locations', changeUrl: '/admin/geo/location/' },
    ],
  },
];

// ── Styles (inline, no extra deps) ────────────────────────────────────────────
const headerStyle: React.CSSProperties = {
  background: '#417690',
  color: '#fff',
  padding: '10px 40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: '0.5px',
};

const headerSubStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.75,
  marginTop: 2,
};

const headerNavStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  fontSize: 13,
  alignItems: 'center',
};

const contentStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: '32px auto',
  padding: '0 24px',
  fontFamily:
    '"Roboto","Lucida Grande","DejaVu Sans","Bitstream Vera Sans",Verdana,Arial,sans-serif',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 28,
  border: '1px solid #ddd',
  borderRadius: 4,
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const sectionHeaderStyle: React.CSSProperties = {
  background: '#79aec8',
  color: '#fff',
  padding: '10px 16px',
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.3px',
  textTransform: 'uppercase',
};

const modelRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '9px 16px',
  borderTop: '1px solid #eee',
  background: '#fff',
};

const linkStyle: React.CSSProperties = {
  color: '#417690',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 500,
};

const actionBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 10px',
  borderRadius: 3,
  fontSize: 12,
  fontWeight: 600,
  textDecoration: 'none',
  marginLeft: 6,
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
};

// ── Component ─────────────────────────────────────────────────────────────────
const AdminHome: React.FC = () => {
  const navigate = useNavigate();

  const handleNav = (url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(url);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f8f8',
        fontFamily:
          '"Roboto","Lucida Grande","DejaVu Sans","Bitstream Vera Sans",Verdana,Arial,sans-serif',
      }}
    >
      {/* ── Top header ───────────────────────────────────────────────── */}
      <div style={headerStyle}>
        <div>
          <div style={headerTitleStyle}>Voyage Admin Live</div>
          <div style={headerSubStyle}>Any changes will take effect immediately</div>
        </div>
        <div style={headerNavStyle}>
          <span style={{ opacity: 0.8 }}>Welcome,&nbsp;<strong>admin</strong></span>
          <a href="#" style={{ color: '#fff', fontSize: 13 }} onClick={(e) => e.preventDefault()}>
            Change password
          </a>
          <span style={{ opacity: 0.4 }}>|</span>
          <a href="#" style={{ color: '#fff', fontSize: 13 }} onClick={(e) => e.preventDefault()}>
            View site
          </a>
          <span style={{ opacity: 0.4 }}>|</span>
          <a href="#" style={{ color: '#fff', fontSize: 13 }} onClick={(e) => e.preventDefault()}>
            Log out
          </a>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div style={contentStyle}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 300,
            color: '#333',
            margin: '0 0 24px',
            borderBottom: '1px solid #eee',
            paddingBottom: 12,
          }}
        >
          Site administration
        </h1>

        {adminSections.map((section) => (
          <div key={section.appName} style={sectionStyle}>
            {/* Section header */}
            <div style={sectionHeaderStyle}>{section.appName}</div>

            {/* Model rows */}
            {section.models.map((model, idx) => (
              <Fragment key={model.name}>
                <div
                  style={{
                    ...modelRowStyle,
                    background: idx % 2 === 0 ? '#fff' : '#f9fbfc',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = '#e8f4f8')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      idx % 2 === 0 ? '#fff' : '#f9fbfc')
                  }
                >
                  {/* Model name */}
                  <a
                    href={model.changeUrl}
                    style={{ ...linkStyle, fontSize: 14 }}
                    onClick={handleNav(model.changeUrl)}
                  >
                    {model.name}
                  </a>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {model.addUrl && (
                      <button
                        style={{
                          ...actionBtnStyle,
                          color: '#417690',
                          border: '1px solid #417690',
                        }}
                        onClick={handleNav(model.addUrl)}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = '#417690';
                          (e.currentTarget as HTMLElement).style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = '#417690';
                        }}
                      >
                        + Add
                      </button>
                    )}
                    <button
                      style={{
                        ...actionBtnStyle,
                        color: '#417690',
                        border: '1px solid #417690',
                      }}
                      onClick={handleNav(model.changeUrl)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = '#417690';
                        (e.currentTarget as HTMLElement).style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#417690';
                      }}
                    >
                      ✎ Change
                    </button>
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHome;
