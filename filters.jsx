// Sidebar filter panel.
// Style and artist lists are derived from the loaded data — they reflect
// only what's actually present in the current results.

function Section({ title, count, right, children }) {
  return (
    <div style={{ borderTop: "1px solid var(--line-soft)", padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between",
                    marginBottom: 12 }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--fg-3)" }}>
          {title}{count != null && <span style={{ color: "var(--fg-2)" }}> · {count}</span>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function ChipToggle({ active, onClick, children, dim }) {
  return (
    <button onClick={onClick}
      style={{
        padding: "5px 10px",
        borderRadius: 999,
        border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
        background: active ? "color-mix(in oklab, var(--accent) 18%, transparent)" : "transparent",
        color: active ? "var(--accent)" : (dim ? "var(--fg-3)" : "var(--fg-2)"),
        fontFamily: "IBM Plex Mono, monospace",
        fontSize: 11,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.12s ease",
      }}>
      {children}
    </button>
  );
}

function FilterPanel({ filters, setFilter, allArtists, allStyles, resultCount, onReset }) {
  const dateChips = [
    { v: "7d",   label: "7 days"  },
    { v: "30d",  label: "30 days" },
    { v: "90d",  label: "90 days" },
    { v: "year", label: String(new Date().getFullYear()) },
    { v: "all",  label: "All"     },
  ];

  const sortOptions = [
    { v: "newest", label: "Newest first" },
    { v: "oldest", label: "Oldest first" },
    { v: "artist", label: "Artist A→Z"   },
    { v: "title",  label: "Title A→Z"    },
  ];

  return (
    <aside style={{
      width: 290,
      flex: "0 0 290px",
      borderRight: "1px solid var(--line-soft)",
      background: "var(--bg)",
      height: "calc(100vh - 109px)",
      position: "sticky",
      top: 109,
      overflowY: "auto",
    }}>
      <div style={{ padding: "18px 20px 4px", display: "flex",
                    alignItems: "baseline", justifyContent: "space-between" }}>
        <div className="serif" style={{ fontSize: 22, fontStyle: "italic" }}>Filters</div>
        <button onClick={onReset} className="mono"
          style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
                   color: "var(--fg-3)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--fg)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--fg-3)"}>
          Reset
        </button>
      </div>
      <div style={{ padding: "0 20px 14px" }}>
        <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
          <span style={{ color: "var(--accent)" }}>{resultCount}</span> results
        </div>
      </div>

      <Section title="Sort">
        <select value={filters.sort} onChange={e => setFilter("sort", e.target.value)}
          style={{
            width: "100%", padding: "8px 10px",
            background: "var(--bg-2)", color: "var(--fg)",
            border: "1px solid var(--line)", borderRadius: 4,
            fontFamily: "IBM Plex Sans, sans-serif", fontSize: 13,
            appearance: "none",
            backgroundImage: "linear-gradient(45deg, transparent 50%, var(--fg-3) 50%), linear-gradient(135deg, var(--fg-3) 50%, transparent 50%)",
            backgroundPosition: "calc(100% - 16px) 50%, calc(100% - 11px) 50%",
            backgroundSize: "5px 5px, 5px 5px",
            backgroundRepeat: "no-repeat",
          }}>
          {sortOptions.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
        </select>
      </Section>

      <Section title="Released">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {dateChips.map(c => (
            <ChipToggle key={c.v} active={filters.window === c.v}
                        onClick={() => setFilter("window", c.v)}>
              {c.label}
            </ChipToggle>
          ))}
        </div>
      </Section>

      <Section title="Style" count={filters.styles.length || null}>
        {allStyles.length === 0 ? (
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
            no style tags yet
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allStyles.map(s => (
              <ChipToggle key={s} active={filters.styles.includes(s)}
                onClick={() => setFilter("toggleStyle", s)}>
                {s}
              </ChipToggle>
            ))}
          </div>
        )}
      </Section>

      <Section title="Artist · Composer" count={filters.artists.length || null}>
        <input
          placeholder="filter list…"
          value={filters.artistQuery}
          onChange={e => setFilter("artistQuery", e.target.value)}
          style={{
            width: "100%", padding: "7px 10px", marginBottom: 10,
            background: "var(--bg-2)", color: "var(--fg)",
            border: "1px solid var(--line)", borderRadius: 4,
            fontSize: 12, outline: "none",
          }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--line)"}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 2,
                      maxHeight: 220, overflowY: "auto" }}>
          {allArtists
            .filter(a => a.toLowerCase().includes(filters.artistQuery.toLowerCase()))
            .map(a => {
              const active = filters.artists.includes(a);
              return (
                <button key={a} onClick={() => setFilter("toggleArtist", a)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "5px 0", textAlign: "left",
                    color: active ? "var(--accent)" : "var(--fg-2)",
                    fontSize: 12.5,
                  }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: 3,
                    border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
                    background: active ? "var(--accent)" : "transparent",
                    flex: "0 0 12px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--bg)", fontSize: 9, fontWeight: 700,
                  }}>{active ? "✓" : ""}</span>
                  {a}
                </button>
              );
            })
          }
        </div>
      </Section>

      <div style={{ height: 24 }} />
    </aside>
  );
}

window.FilterPanel = FilterPanel;
