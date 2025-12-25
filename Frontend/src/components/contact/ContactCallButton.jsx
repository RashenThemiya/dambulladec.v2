const ContactCallButton = () => {
  return (
    <a
      href="tel:+0662285181"
      className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-green-700 transition-all duration-300"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 5a2 2 0 012-2h3.28a2 2 0 011.94 1.52l.58 2.32a2 2 0 01-.45 1.86L8.1 10.9a11.05 11.05 0 005.01 5.01l2.2-2.2a2 2 0 011.86-.45l2.32.58A2 2 0 0121 17.72V21a2 2 0 01-2 2h-.28C9.95 23 1 14.05 1 3.28V3a2 2 0 012-2z"
        />
      </svg>
      Call Center
    </a>
  );
};

export default ContactCallButton;
