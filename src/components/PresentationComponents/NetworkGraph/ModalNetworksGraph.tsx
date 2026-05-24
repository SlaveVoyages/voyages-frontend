import { Close } from '@mui/icons-material';
import { Modal, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

import NETWORKICON from '@/assets/networksIcon.png';
import { setsetOpenModalNetworks } from '@/redux/getPastNetworksGraphDataSlice';
import { RootState } from '@/redux/store';
import '@/style/networks.scss';
import { styleModalNetworks } from '@/styleMUI';
import { translatedConnection } from '@/utils/functions/translationLanguages';

import { NetworkDiagramSlaveVoyagesSVG } from './NetworkDiagramSlaveVoyagesSVG';
const ModalNetworksGraph = () => {
  const dispatch = useDispatch();
  const { openModal } = useSelector(
    (state: RootState) => state.getPastNetworksGraphData,
  );

  const handleClose = () => {
    dispatch(setsetOpenModalNetworks(false));
  };
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );
  const translated = translatedConnection(languageValue);
  return (
    <Modal
      open={openModal}
      disableScrollLock={true}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{ styleModalNetworks }}
    >
      <Box sx={styleModalNetworks}>
        <div className="network-header">
          <div className="network-header-text">
            <img
              alt="network"
              src={NETWORKICON}
              className="network-icon-right"
            />
            {translated.connection}
            <img
              alt="network"
              className="network-icon-left"
              src={NETWORKICON}
            />
          </div>
          <div className="close-modal-icon-network ">
            <Close fontSize="large" onClick={handleClose} />
          </div>
        </div>
        <NetworkDiagramSlaveVoyagesSVG />
      </Box>
    </Modal>
  );
};

export default ModalNetworksGraph;
