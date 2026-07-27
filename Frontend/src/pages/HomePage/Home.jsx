
import { Helmet } from "react-helmet-async";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import NewsWidget from "./NewsWidget";
import ContactCallButton from "../ContactPage/ContactCallButton";

import WelcomeSection from "./WelcomeSection";
import DailyPricesSection from "./DailyPricesSection";
import VisionMission from "./VisionMission";
import ServiceSection from "./ServiceSection";
import MarketOperations from "./MarketOperations";
import EconomicCenterNews from "./EconomicCenterNews";



const Home = () => {
    


    return (
        <>
            <Helmet>
                <title>Dambulla Economic Center - Home</title>

                <meta
                    name="description"
                    content="Welcome to Dambulla Economic Center. Discover market operations, news and services."
                />

                <meta
                    name="keywords"
                    content="Dambulla, Economic Center, Market Operations, Daily Prices"
                />

                <meta
                    property="og:title"
                    content="Dambulla Economic Center"
                />

                <meta
                    property="og:description"
                    content="Discover market operations, daily prices and services."
                />

                <meta property="og:type" content="website" />
            </Helmet>

            <Navbar />

            <main>
                <WelcomeSection />

                <DailyPricesSection />

                <VisionMission />

                <ServiceSection />

                <MarketOperations />

                <EconomicCenterNews />
            </main>

            <Footer />
            <NewsWidget />
            <ContactCallButton />
        </>
    );
};

export default Home;