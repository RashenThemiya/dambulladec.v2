const LoadingSpinner = () => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin bg-transparent" />
    </div>
  );
};

export default LoadingSpinner;
