import { EdgesAggroutes } from '@/share/InterfaceTypesMap';

import { getEdgesSize } from './getNodeSize';

export const getMinValueEdge = (edgeData: EdgesAggroutes[]): number => {
  let minEdgeSize = Infinity;
  if (edgeData?.length > 0) {
    edgeData.forEach((edge) => {
      const weight = getEdgesSize(edge);
      if (weight) {
        if (weight < minEdgeSize) {
          minEdgeSize = weight;
        }
      }
    });
  }
  return minEdgeSize;
};

export const getMaxValueEdge = (edgeData: EdgesAggroutes[]): number => {
  let maxEdgeSize = -Infinity;
  if (edgeData?.length > 0) {
    edgeData.forEach((edge) => {
      const weight = getEdgesSize(edge);
      if (weight) {
        if (weight > maxEdgeSize) {
          maxEdgeSize = weight;
        }
      }
    });
  }
  return maxEdgeSize;
};
