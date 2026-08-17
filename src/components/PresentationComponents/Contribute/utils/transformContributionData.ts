import {
  Contribution,
  PublicationBatch,
} from '@slavevoyages/voyages-contribute';

import { extractItineraryData } from './extractItineraryData';
import { extractLinkedShipData } from './extractLinkedShipData';
import { extractShipData } from './extractShipData';
export type TransformedContribution = Contribution & {
  changeSetId: string;
  id: string;
  voyage_id: string | number;
  status: number;
  timestamp?: number;
  shipName?: string;
  portOfDeparture?: string;
  nationality?: string;
  tonnage?: string;
  batch?: PublicationBatch;
  type?: string;
  /**
   * Who decided the contribution's status, and when. Carried through by the
   * spread below; declared here because the installed package's `Contribution`
   * predates the fields, and a reader should not have to infer them from a
   * spread. Drop this once the pin moves to a package that declares them.
   */
  decidedBy?: string | null;
  decidedAt?: number | null;
};

const MIN_VALID_TIMESTAMP = new Date('2000-01-01').getTime();

export const transformContributionData = (
  contribution: Contribution,
): TransformedContribution => {
  const changeSetData = contribution.changeSet || {};

  // The backend sometimes returns a voyage's historical departure date instead
  // of the contribution save time. Guard against pre-2000 values and fall back
  // to 0 (sentinel) so the UI can render "—" and sort these rows to the bottom.
  const rawTs = changeSetData.timestamp;
  const ts =
    rawTs && Number(new Date(rawTs)) >= MIN_VALID_TIMESTAMP ? rawTs : 0;

  return {
    ...contribution,
    ...changeSetData,
    timestamp: ts,
    changeSetId: changeSetData?.id ?? '',
    id: contribution?.id ?? '',
    voyage_id: contribution?.root?.id ?? '',
    status: contribution?.status,
    shipName: extractShipData(changeSetData, 'VoyageShip_ship_name'),
    portOfDeparture: extractItineraryData(changeSetData),
    nationality: extractLinkedShipData(
      changeSetData,
      'VoyageShip_nationality_ship_id',
      'Nation name',
    ),
    tonnage: extractShipData(changeSetData, 'VoyageShip_tonnage'),
    batch: contribution?.batch ?? undefined,
    type: contribution?.root?.type,
  };
};
