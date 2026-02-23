import React, { useCallback, useMemo, useState } from 'react';

import '@/style/estimates.scss';
import {
  ArrowLeftOutlined,
  CaretDownOutlined,
  DeleteOutlined,
  LinkOutlined,
  PlusOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { Box } from '@mui/material';
import { ContributionStatus } from '@slavevoyages/voyages-contribute';
import { Button, Divider, Space, Tag, Tabs, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getMockEnslaverSections,
  MOCK_ENSLAVER_CONTRIBUTIONS,
  PendingEnslaverContrib,
} from '../../mockData/pendingEnslavers';

const { Text } = Typography;

// ── Site teal (matches SlaveVoyages brand) ───────────────────────────────────
const TEAL = 'rgb(55, 148, 141)';
const TEAL_DARK = '#138496';
const btnTeal: React.CSSProperties = {
  background: TEAL,
  borderColor: TEAL_DARK,
  color: '#fff',
};

// ── Comparison table ─────────────────────────────────────────────────────────
const ComparisonTable: React.FC<{ contrib: PendingEnslaverContrib }> = ({
  contrib,
}) => {
  const sections = useMemo(() => getMockEnslaverSections(contrib), [contrib]);
  return (
    <div style={{ fontSize: 13, overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <thead>
          <tr style={{ background: '#555', color: '#fff' }}>
            {['Variable', 'Original value', 'Contributed value', 'Editor'].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: '7px 10px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 12,
                    width: '25%',
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <React.Fragment key={section.title}>
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '10px 10px 4px',
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#333',
                    borderTop: '2px solid #ddd',
                    background: '#fff',
                  }}
                >
                  {section.title}
                </td>
              </tr>
              {section.fields.map((field, idx) => {
                const changed = field.original !== field.contributed;
                return (
                  <tr
                    key={field.variable}
                    style={{ background: idx % 2 === 0 ? '#f5f5f5' : '#fff' }}
                  >
                    <td
                      style={{
                        padding: '5px 10px',
                        color: '#444',
                        verticalAlign: 'top',
                      }}
                    >
                      {field.variable}:
                    </td>
                    <td
                      style={{
                        padding: '5px 10px',
                        verticalAlign: 'top',
                        color: '#555',
                      }}
                    >
                      {field.original || '—'}
                    </td>
                    <td
                      style={{
                        padding: '5px 10px',
                        verticalAlign: 'top',
                        background: changed ? '#fffde7' : undefined,
                        fontWeight: changed ? 600 : 400,
                        color: changed ? '#b45309' : '#555',
                      }}
                    >
                      {field.contributed || '—'}
                    </td>
                    <td
                      style={{
                        padding: '5px 10px',
                        verticalAlign: 'top',
                        color: '#555',
                      }}
                    >
                      {field.editor || '—'}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Aliases & Voyages tab ────────────────────────────────────────────────────
const AliasesTab: React.FC<{ contrib: PendingEnslaverContrib }> = ({
  contrib,
}) => {
  const aliases =
    contrib.type === 'merge' && contrib.enslaverMergeTarget
      ? [contrib.enslaver, contrib.enslaverMergeTarget]
      : [contrib.enslaver];
  const [selected, setSelected] = useState(aliases[0]);
  const numericId = contrib.id.replace('e-0', '102').replace('e-', '100');

  return (
    <div>
      {/* Action row — left + right groups */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Space size={4}>
          <Button size="small" icon={<PlusOutlined />} style={btnTeal}>
            New Alias
          </Button>
          <Button size="small" icon={<StarOutlined />} style={btnTeal}>
            Set as Principal
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />}>
            Delete Alias
          </Button>
        </Space>
        <Space size={4}>
          <Button size="small" icon={<CaretDownOutlined />}>
            Move to
          </Button>
          <Button size="small" style={btnTeal}>
            Show
          </Button>
          <Button size="small" danger>
            Delink
          </Button>
          <Button size="small" icon={<LinkOutlined />} style={btnTeal}>
            Link Voyage
          </Button>
        </Space>
      </div>

      {/* Two-column layout: alias list | voyage panel */}
      <div style={{ display: 'flex', gap: 16, minHeight: 220 }}>
        {/* Alias list */}
        <div
          style={{
            width: '45%',
            border: '1px solid #dee2e6',
            borderRadius: 4,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {aliases.map((alias) => (
            <button
              key={alias}
              type="button"
              onClick={() => setSelected(alias)}
              tabIndex={0}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: selected === alias ? '#e8f4f8' : '#fff',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 13,
                border: 'none',
                borderBottom: '1px solid #f0f0f0',
                outline: selected === alias ? '2px solid #0c5460' : 'none',
                fontWeight: selected === alias ? 600 : 400,
                color: selected === alias ? '#0c5460' : '#333',
              }}
              aria-pressed={selected === alias}
            >
              {alias} (id {numericId})
            </button>
          ))}
        </div>

        {/* Voyage panel */}
        <div
          style={{
            flex: 1,
            border: '1px solid #dee2e6',
            borderRadius: 4,
            background: '#fff',
            padding: 12,
            fontSize: 13,
            color: '#9ca3af',
          }}
        >
          No voyages linked to this alias.
        </div>
      </div>
    </div>
  );
};

// ── Personal information tab ─────────────────────────────────────────────────
const PersonalInfoTab: React.FC<{ contrib: PendingEnslaverContrib }> = ({
  contrib,
}) => {
  const rows: [string, string][] = [
    ['Full name', contrib.enslaver],
    ['Gender', 'Male'],
    ['Birth year', '—'],
    ['Death year', '—'],
    ['Birth place', '—'],
    ['Death place', '—'],
    ['Race / Origin', '—'],
    ['Occupation', 'Merchant'],
  ];
  return (
    <table
      style={{
        fontSize: 13,
        borderCollapse: 'collapse',
        width: '100%',
        maxWidth: 560,
      }}
    >
      <tbody>
        {rows.map(([label, value], i) => (
          <tr
            key={label}
            style={{ background: i % 2 === 0 ? '#f8f9fa' : '#fff' }}
          >
            <td
              style={{
                padding: '6px 12px',
                color: '#495057',
                width: '38%',
                fontWeight: 500,
                borderRight: '1px solid #dee2e6',
              }}
            >
              {label}
            </td>
            <td style={{ padding: '6px 12px', color: '#212529' }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ── Biographical Sources tab ─────────────────────────────────────────────────
const BiographicalSourcesTab: React.FC = () => (
  <div style={{ color: '#6c757d', fontSize: 13, padding: '12px 0' }}>
    No biographical sources attached to this contribution.
  </div>
);

// ── Notes from contributor tab ───────────────────────────────────────────────
const NotesTab: React.FC<{ contrib: PendingEnslaverContrib }> = ({
  contrib,
}) => (
  <div
    style={{
      background: '#fff3cd',
      border: '1px solid #ffc107',
      borderRadius: 4,
      padding: '12px 16px',
      fontSize: 13,
      lineHeight: 1.7,
      maxWidth: 700,
      color: '#856404',
    }}
  >
    {contrib.notes || 'No notes provided by contributor.'}
  </div>
);

// ── Review & Submit tab ──────────────────────────────────────────────────────
const ReviewTab: React.FC<{
  contrib: PendingEnslaverContrib;
  onAccept: () => void;
  onReject: () => void;
}> = ({ contrib, onAccept, onReject }) => (
  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    <ComparisonTable contrib={contrib} />
    <Divider style={{ margin: '8px 0' }} />
    {contrib.status === ContributionStatus.Submitted ? (
      <Space>
        <Button
          style={{
            background: '#28a745',
            borderColor: '#28a745',
            color: '#fff',
          }}
          onClick={onAccept}
        >
          Accept Contribution
        </Button>
        <Button danger onClick={onReject}>
          Reject Contribution
        </Button>
      </Space>
    ) : (
      <Tag
        color={contrib.status === ContributionStatus.Accepted ? 'green' : 'red'}
        style={{ fontSize: 13, padding: '4px 12px' }}
      >
        {contrib.status === ContributionStatus.Accepted
          ? '✓ Accepted'
          : '✗ Rejected'}
      </Tag>
    )}
  </Space>
);

// ── Main page ────────────────────────────────────────────────────────────────
const EnslaverContributionReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contrib, setContrib] = useState<PendingEnslaverContrib | undefined>(
    () => MOCK_ENSLAVER_CONTRIBUTIONS.find((c) => c.id === id),
  );

  const handleAccept = useCallback(() => {
    setContrib((prev) =>
      prev ? { ...prev, status: ContributionStatus.Accepted } : prev,
    );
  }, []);

  const handleReject = useCallback(() => {
    setContrib((prev) =>
      prev ? { ...prev, status: ContributionStatus.Rejected } : prev,
    );
  }, []);

  if (!contrib) {
    return (
      <Box style={{ padding: 24 }}>
        <div
          style={{
            color: '#721c24',
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: 4,
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Contribution &ldquo;{id}&rdquo; not found.</span>
          <Button
            size="small"
            onClick={() =>
              navigate('/contribute/editor_main/enslavers_contrib')
            }
          >
            Back to list
          </Button>
        </div>
      </Box>
    );
  }

  const displayName =
    contrib.type === 'merge' && contrib.enslaverMergeTarget
      ? `${contrib.enslaver}  ···  ${contrib.enslaverMergeTarget}`
      : contrib.enslaver;

  // Back button rendered inside the tab bar on the left
  const tabBarLeftContent = (
    <button
      onClick={() => navigate('/contribute/editor_main/enslavers_contrib')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        border: '1px solid #dee2e6',
        borderRadius: 3,
        background: '#fff',
        cursor: 'pointer',
        marginRight: 12,
        fontSize: 16,
        color: '#495057',
        flexShrink: 0,
      }}
      title="Back to list"
    >
      <ArrowLeftOutlined />
    </button>
  );

  const tabItems = [
    {
      key: 'aliases',
      label: 'Aliases and Voyages',
      children: <AliasesTab contrib={contrib} />,
    },
    {
      key: 'personal',
      label: 'Personal information',
      children: <PersonalInfoTab contrib={contrib} />,
    },
    {
      key: 'sources',
      label: 'Biographical Sources',
      children: <BiographicalSourcesTab />,
    },
    {
      key: 'notes',
      label: 'Notes from contributor',
      children: <NotesTab contrib={contrib} />,
    },
    {
      key: 'review',
      label: 'Review and Submit',
      children: (
        <ReviewTab
          contrib={contrib}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      ),
    },
  ];

  return (
    <Box style={{ paddingTop: 0, paddingBottom: 16, width: '100%' }}>
      {/* Subtle meta bar above tabs */}
      <div
        style={{
          fontSize: 12,
          color: '#6c757d',
          padding: '6px 0 10px',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Text type="secondary">
          <strong style={{ color: '#212529' }}>{displayName}</strong>
        </Text>
        <Tag color="rgb(55, 148, 141)" style={{ fontSize: 11 }}>
          {contrib.type.toUpperCase()}
        </Tag>
        <span>
          Contributor: <strong>{contrib.contributor}</strong>
        </span>
        <span>
          Submitted:{' '}
          <strong>{dayjs(contrib.timestamp).format('YYYY-MM-DD')}</strong>
        </span>
        {contrib.status !== ContributionStatus.Submitted && (
          <Tag
            color={
              contrib.status === ContributionStatus.Accepted ? 'green' : 'red'
            }
          >
            {contrib.status === ContributionStatus.Accepted
              ? 'Accepted'
              : 'Rejected'}
          </Tag>
        )}
      </div>

      {/* Tabs — back arrow inline with tab bar */}
      <Tabs
        defaultActiveKey="aliases"
        items={tabItems}
        type="card"
        tabBarExtraContent={{ left: tabBarLeftContent }}
        tabBarStyle={{ marginBottom: 10 }}
      />
    </Box>
  );
};

export default EnslaverContributionReview;
