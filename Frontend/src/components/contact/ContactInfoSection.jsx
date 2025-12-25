import axios from "axios";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const ContactInfoSection = () => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const API_KEY = "1f680c87a76ad7a1a04a4c6df65afa97";
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=Dambulla&appid=${API_KEY}&units=metric`
        );
        setWeather(res.data);
        setError(null);
      } catch (err) {
        setError(t("weather.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [t]);

  const cards = [
    {
      icon: "📍",
      title: t("contact.address"),
      content: t("Kandy - Jaffna Highway, Dambulla"),
    },
    {
      icon: "✉️",
      title: t("contact.email"),
      content: "dambulladec@gmail.com",
      link: "mailto:dambulladec@gmail.com",
    },
    {
      icon: "📞",
      title: t("contact.phone"),
      content: "066-2285181",
      link: "tel:0662285181",
    },
    weather && !loading && !error
      ? {
          icon: "🌤️",
          title: t("weather.title"),
          content: `${weather.main.temp}°C, ${weather.weather[0].description}`,
          image: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`,
        }
      : null,
  ].filter(Boolean); // Remove null values

  return (
    <div className="relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-[url('/images/welcome2.jpg')] bg-cover bg-center z-0"
        style={{ filter: "blur(2px) brightness(0.3)" }}
      />
      <div className="absolute inset-0 bg-black/40 z-0" />

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Left: Contact Details */}
          <div className="text-left space-y-6 pl-2">
            <h2 className="text-4xl md:text-5xl font-extrabold text-green-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {t("contact.title") || "Talk to Us"}
            </h2>
            <p className="text-lg md:text-xl text-gray-100 leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
              {t("contact.description") ||
                "We are here to help you anytime. Reach us through the contact information below."}
            </p>

            {/* Contact + Weather Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {cards.map(({ icon, title, content, link, image }, index) => (
                <div
                  key={index}
                  className="backdrop-blur-md bg-white/20 border border-white/30 rounded-2xl p-5 text-white shadow-xl transition transform hover:scale-105 hover:shadow-green-400/30 duration-300"
                >
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-2xl shadow-md">
                      {icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white text-center mb-2">{title}</h3>
                  {image && (
                    <div className="flex justify-center mb-2">
                      <img src={image} alt="Weather Icon" className="w-12 h-12" />
                    </div>
                  )}
                  {link ? (
                    <a
                      href={link}
                      className="block text-center text-green-100 text-sm hover:underline break-words"
                    >
                      {content}
                    </a>
                  ) : (
                    <p className="text-sm text-center text-white/90 break-words">{content}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Map */}
          <div className="relative">
            <div className="rounded-3xl w-full h-[450px] overflow-hidden shadow-2xl border-4 border-white/20">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.277423359984!2d80.64919217568517!3d7.8660103061068485!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3afca5432c8b3317%3A0x7def86b17389191e!2sDambulla%20Dedicated%20Economic%20Center!5e0!3m2!1sen!2slk!4v1745987171143!5m2!1sen!2slk"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Dambulla Economic Centre Map"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoSection;
