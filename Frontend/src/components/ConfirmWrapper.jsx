import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ConfirmWrapper = ({
  onConfirm,
  children,
  message,
  additionalInfo,
  confirmText = "Yes, Confirm",
  cancelText = "Cancel",
  icon,
  buttonTextColor = "text-white",
  buttonBackgroundColor = "bg-red-600",
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChildClick = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onConfirm();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-8 rounded-2xl shadow-2xl space-y-6 w-96 max-w-md flex flex-col items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header with custom icon */}
              <div className="flex items-center justify-center space-x-4 mb-4">
                {icon && (
                  <div className="text-4xl text-red-600">
                    {icon}
                  </div>
                )}
                <p className="text-xl font-semibold text-gray-800">{message}</p>
              </div>

              {/* Optional additional info */}
              {additionalInfo && (
                <div className="text-sm text-gray-500 text-center">
                  {additionalInfo}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-center space-x-6 mt-6 w-full">
                <button
                  onClick={handleCancel}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition duration-200"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`${buttonBackgroundColor} ${buttonTextColor} px-6 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition duration-200`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button/content */}
      <div onClick={handleChildClick}>
        {children}
      </div>
    </>
  );
};

export default ConfirmWrapper;
