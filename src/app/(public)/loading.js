export default function Loading() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <p className="loading-text">Loading....</p>
    </div>
  );
}
