import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import ContactCallButton from "./ContactCallButton";
import ContactCenters from "./ContactCenters";
import ContactDetails from "./ContactDetails";

const Contact = () => {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Helmet>
                <title>
                    {t("contact.pageTitle", {
                        defaultValue:
                            "Contact Us | Dambulla Dedicated Economic Center",
                    })}
                </title>

                <meta
                    name="description"
                    content={t("contact.metaDescription", {
                        defaultValue:
                            "Contact the Dambulla Dedicated Economic Center for general inquiries, location details, phone numbers and working hours.",
                    })}
                />
            </Helmet>

            <Navbar />

            <main className="flex-1">
                {/* Contact heading */}
                <section className="bg-white px-4 pb-8 pt-14 sm:px-6 lg:pt-16">
                    <div className="mx-auto max-w-[1512px] text-center">
                        <h1 className="text-[38px] font-extrabold leading-tight text-black sm:text-[48px]">
                            {t("contact.headingFirst", {
                                defaultValue: "Contact",
                            })}{" "}
                            <span className="text-[#08772f]">
                                {t("contact.headingSecond", {
                                    defaultValue: "Us",
                                })}
                            </span>
                        </h1>

                        <p className="mx-auto mt-4 max-w-[900px] text-[15px] leading-relaxed text-[#7b7b7b] sm:text-[17px]">
                            {t("contact.description", {
                                defaultValue:
                                    "We're here to help you connect with the Dambulla Dedicated Economic Center. Whether you have inquiries, feedback, or need market information, our team is ready to assist.",
                            })}
                        </p>
                    </div>
                </section>

                <ContactDetails />
                <ContactCenters />
            </main>

            <ContactCallButton />
            <Footer />
        </div>
    );
};

export default Contact;