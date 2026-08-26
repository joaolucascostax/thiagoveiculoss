import { Link } from "react-router-dom";
import { useSettings } from "@/contexts/StoreSettingsContext";

interface HeaderProps {
  onSearchToggle?: () => void;
}

const Header = ({ onSearchToggle }: HeaderProps) => {
  const { settings } = useSettings();
  const storeName = settings?.store_name || "VITRINECAR";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary-container">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-primary-foreground font-black text-lg tracking-widest uppercase">
            {storeName}
          </span>
        </Link>
        <div className="flex items-center gap-3" />
      </div>
    </header>
  );
};

export default Header;
