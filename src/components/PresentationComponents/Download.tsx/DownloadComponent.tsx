import React from 'react';

import LOADINGLOGO from '@/assets/sv-logo_v2_notext.svg';

const DownloadComponent: React.FC = () => {
  return (
    <>
      <div style={{ marginTop: '15%', textAlign: 'center' }}>
        <div>DownloadComponent page is coming soon</div>
        <img
          src={LOADINGLOGO}
          alt="document"
          style={{ width: '30%', padding: '5%' }}
        />
      </div>
    </>
  );
};

export default DownloadComponent;
