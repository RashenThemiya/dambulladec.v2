import { useTranslation } from "react-i18next";

const ContactInfoExtras = () => {
  const { t } = useTranslation();

  const darkGreen = "#145214";

  const mainCenters = [
    { label: t("footer.thambuththegama"), phone: "0252 275 171" },
    { label: t("footer.nuwaraEliya"), phone: "0522 223 176" },
    { label: t("footer.narahenpita"), phone: "0112 369 626" },
    { label: t("footer.welisara"), phone: "0112 981 896" },
    { label: t("footer.veyangoda"), phone: "0332 296 914" },
  ];

  const regionalCenters = [
    { label: t("footer.ratmalana"), phone: "0112 709 800" },
    { label: t("footer.meegoda"), phone: "0112 830 816" },
    { label: t("footer.kandeketiya"), phone: "0717 453 193" },
    { label: t("footer.kepptipola"), phone: "0572 280 208" },
  ];

  const renderCenters = (title, centers) => (
    <div className="mb-8">
      <h3
        className="text-xl sm:text-2xl font-semibold tracking-wide border-b pb-2 mb-4"
        style={{ borderColor: darkGreen, color: darkGreen }}
      >
        {title}
      </h3>
      <ul className="space-y-3 text-sm text-gray-700">
        {centers.map(({ label, phone }) => (
          <li
            key={phone}
            className="flex justify-between items-center hover:text-green-800 transition-colors duration-200"
          >
            <span className="font-medium">{label}</span>
            <span className="text-red-600 font-semibold text-xs">{phone}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10 bg-white text-gray-800">
      {/* Organization Info */}
     <div className="flex flex-col items-center lg:items-start space-y-8">
  <div className="flex items-center space-x-6">
    <img
      src="/images/logo.jpg"
      alt="Government Logo"
      className="w-20 h-20 rounded-full border border-gray-300 shadow-sm"
    />
    <div className="text-gray-800 text-center lg:text-left font-medium leading-relaxed">
      <p className="text-2xl font-semibold">Dambulla DEC</p>
      <p className="text-base text-gray-600">Dambulla Dedicated Economic Center</p>
      <p className="text-base text-gray-600">Sri Lanka</p>
    </div>
  </div>

  <div className="flex gap-6 text-2xl text-green-900">
    <a href="#" aria-label="Facebook" className="hover:text-green-700">
      <i className="fab fa-facebook-square" />
    </a>
    <a href="#" aria-label="Twitter" className="hover:text-green-700">
      <i className="fab fa-twitter-square" />
    </a>
    <a href="#" aria-label="LinkedIn" className="hover:text-green-700">
      <i className="fab fa-linkedin" />
    </a>
  </div>
</div>

      {/* Main Centers */}
      <div>{renderCenters(t("footer.mainCenters"), mainCenters)}</div>

      {/* Regional Centers */}
      <div>{renderCenters(t("footer.regionalCenters"), regionalCenters)}</div>
    </section>
  );
};

export default ContactInfoExtras;
