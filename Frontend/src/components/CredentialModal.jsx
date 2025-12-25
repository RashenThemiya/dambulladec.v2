import { useState } from "react";
import Modal from "react-modal";
import { motion, AnimatePresence } from "framer-motion";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.3, type: "spring", damping: 25, stiffness: 500 }
  },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2 } },
};

const CredentialModal = ({ isOpen, onRequestClose, onVerify }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      await onVerify(email, password);
      // Parent should close modal on success
    } catch (err) {
      setErrorMessage(err?.message || "Email or password is incorrect.");
    }
  };

  const handleClose = () => {
    setErrorMessage("");
    onRequestClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onRequestClose={handleClose}
          ariaHideApp={false}
          contentLabel="Credential Verification"
          className="!p-8 !rounded-2xl !shadow-2xl !max-w-md !w-full !mx-auto !mt-40 !relative !z-50 bg-white"
          overlayClassName="fixed inset-0 z-50 flex items-center justify-center"
          closeTimeoutMS={300} // matches animation duration
        >
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
          />

          <motion.div
            className="bg-white p-8 rounded-2xl shadow-2xl space-y-6 w-96 max-w-md flex flex-col items-center justify-center fixed z-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-center text-red-600">
              Verify Credentials
            </h2>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {errorMessage && (
                <div className="text-red-600 text-sm font-medium text-center">
                  {errorMessage}
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Verify
                </button>
              </div>
            </form>
          </motion.div>
        </Modal>
      )}
    </AnimatePresence>
  );
};

export default CredentialModal;