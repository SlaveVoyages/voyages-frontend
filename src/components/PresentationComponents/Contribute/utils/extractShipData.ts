// Helper functions
export const extractShipData = (changeSetData: any, property: string) => {
  const shipChange = changeSetData.changes?.[0]?.changes?.find(
    (c: any) => c.kind === 'owned' && c.property === 'Voyage_Ship',
  );
  return (
    shipChange?.changes?.find((s: any) => s.property === property)?.changed ||
    ''
  );
};
