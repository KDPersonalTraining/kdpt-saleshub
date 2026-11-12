// While a screen loads: its outline in soft grey blocks, not a blank page.
export default function Loading() {
  return (
    <div className="ds ds-page skel" aria-busy="true" aria-label="Loading">
      <i style={{ width: '45%', height: 30 }} />
      <i style={{ height: 200, borderRadius: 24 }} />
      <i style={{ height: 64 }} />
      <i style={{ height: 64 }} />
      <i style={{ height: 64 }} />
    </div>
  );
}
