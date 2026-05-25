import '@/style/contributeContent.scss';
import '@/style/newVoyages.scss';

import { Button } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { Spin } from 'antd';

import { useContributeNewVoyages } from '@/hooks/contribute/useContributeNewVoyages';

import { TransformedContribution } from './utils/transformContributionData';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const ContributeHomeWelcome: React.FC = () => {
  const {
    gridRef,
    contributions,
    isLoadingTable,
    contributePath,
    buttons,
    translatedContribute,
    handleClickSideBar,
    columnDefs,
    defaultColDef,
    getRowStyle,
  } = useContributeNewVoyages();

  if (contributePath) return null;

  return (
    <div className="contribute-content">
      <h1 className="page-title-1">
        {translatedContribute.contributeContributeHomeWelcome}
      </h1>

      <div style={{ margin: '10px 0 24px 0' }}>
        {buttons.map((btn) => (
          <Button
            onClick={() => handleClickSideBar(btn.path)}
            key={btn.nameBtn}
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              backgroundColor: 'rgb(55, 148, 141)',
              color: '#fff',
              marginRight: '0.5rem',
              height: 32,
              fontSize: '0.85rem',
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(6, 186, 171, 0.83)' },
            }}
          >
            {btn.nameBtn}
          </Button>
        ))}
      </div>

      {isLoadingTable ? (
        <div
          style={{
            width: 'calc(100vw - 120px)',
            height: 200,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            border: '1px solid #d9d9d9',
            borderRadius: 12,
            backgroundColor: '#fafafa',
          }}
        >
          <Spin size="large" tip="Loading contributions..." />
        </div>
      ) : (
        contributions.length > 0 && (
          <>
            <div
              style={{
                marginBottom: 6,
                color: '#6b7280',
                fontSize: 13,
                textAlign: 'right',
              }}
            >
              {contributions.length} contribution
              {contributions.length !== 1 ? 's' : ''}
            </div>
            <div
              className="ag-theme-alpine compact-table"
              style={{
                width: 'calc(100vw - 120px)',
                border: '1px solid #d9d9d9',
                borderRadius: 12,
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              }}
            >
              <AgGridReact<TransformedContribution>
                theme="legacy"
                ref={gridRef}
                rowData={contributions}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                getRowStyle={getRowStyle}
                domLayout="autoHeight"
                enableBrowserTooltips={true}
                getRowClass={(params) =>
                  params.rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
                }
                headerHeight={36}
                suppressHorizontalScroll={false}
              />
            </div>
          </>
        )
      )}
    </div>
  );
};

export default ContributeHomeWelcome;
