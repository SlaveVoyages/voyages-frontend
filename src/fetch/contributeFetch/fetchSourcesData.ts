import axios from 'axios';

import { AUTHTOKEN, BASEURL } from '@/share/AUTH_BASEURL';

export interface SourceRow {
  zotero_group_id?: number | null;
  zotero_item_id?: string | null;
  bib?: string | null;
  thumbnail?: string | null;
  iiif_manifest_url?: string | null;
  text_snippet?: string | null;
  enslavers_count?: number | null;
  named_enslaved_count?: number | null;
  source_type?: { id: number; name: string } | null;
  short_ref?: { id: number; name: string } | null;
  date?: unknown;
}

export interface SourceListResponse {
  page: number;
  page_size: number;
  count: number;
  results: SourceRow[];
}

/**
 * Read a page of sources from the voyages-api `document/` endpoint (the same
 * source list the public site uses), for the editorial Source Codes page.
 * Read-only: source editing stays in the Django admin.
 */
export const fetchSourcesData = async (
  page: number,
  pageSize: number,
): Promise<SourceListResponse> => {
  const response = await axios.post(
    `${BASEURL}/document/`,
    { filter: [], page, page_size: pageSize },
    {
      headers: {
        Authorization: AUTHTOKEN,
        'Content-Type': 'application/json',
      },
    },
  );
  return response.data;
};
