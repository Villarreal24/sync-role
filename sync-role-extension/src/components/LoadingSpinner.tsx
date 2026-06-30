interface Props {
  message: string
}

function LoadingSpinner({ message }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        gap: 20,
      }}
    >
      <div
        style={{
          color: "#a1a1aa",
          fontSize: 13,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        {message}
      </div>
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #27272a",
          borderTopColor: "#3b82f6",
          borderRightColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
          boxShadow: "0 0 15px rgba(59, 130, 246, 0.15)",
        }}
      />
    </div>
  )
}

export default LoadingSpinner
