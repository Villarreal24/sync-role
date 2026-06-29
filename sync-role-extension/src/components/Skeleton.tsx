import { styles } from "../lib/styles"

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{ ...styles.skeleton, width: `${50 + i * 8}px`, marginBottom: 2 }}
          />
          <div style={{ ...styles.skeleton, height: 36 }} />
        </div>
      ))}
    </div>
  )
}

export default Skeleton
