import { Link } from "react-router-dom";
import { useSettings } from "@/contexts/StoreSettingsContext";

const Footer = () => {
  const { settings } = useSettings();
  const storeName = settings?.store_name || "VITRINECAR";

  return (
    <footer className="bg-on-surface text-surface pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-8">



          <p className="text-surface/40 text-xs tracking-wider uppercase">
            © {new Date().getFullYear()} {storeName}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
