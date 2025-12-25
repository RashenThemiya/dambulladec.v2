import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import ContactCallButton from "../components/contact/ContactCallButton";
import ContactInfoExtras from "../components/contact/ContactInfoExtras";
import ContactInfoSection from "../components/contact/ContactInfoSection"; // Unified ContactCards + Map

const Contact = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50">
      {/* Background: Blurred & darkened */}
     
      <div className="absolute inset-0  z-0" />

      {/* Main Content */}
      <div className="relative z-10">
        <Navbar />

        {/* Contact Information Section (Cards + Map) */}
        <ContactInfoSection />

        {/* Extra Info Section (Weather + Center List + Call Button) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <ContactInfoExtras />
          <div className="mt-8 flex justify-center">
            <ContactCallButton />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Contact;
