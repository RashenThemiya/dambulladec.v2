import { CalendarDays, DollarSign, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const icons = {
  calendar: <CalendarDays className="w-6 h-6 text-white" />,
  file: <FileText className="w-6 h-6 text-white" />,
  dollar: <DollarSign className="w-6 h-6 text-white" />,
};

function DashboardCard({
  title,
  tickets,
  revenue,
  icon,
  bgGradient,
  detailLink,
}) {
  const cardContent = (
    <div
      className={`rounded-2xl text-white p-6 w-full h-48 md:h-52 flex flex-col justify-between ${bgGradient} shadow-xl transition-transform duration-200 hover:scale-[1.02] cursor-pointer`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-2xl font-semibold tracking-wide">{title}</p>

          {typeof revenue === "number" && (
            <h2 className="text-3xl font-bold">Rs. {revenue}</h2>
          )}

          {typeof tickets === "number" && (
            <p className="text-sm">Tickets: {tickets}</p>
          )}
        </div>
        <div className="p-2 bg-white/20 rounded-full">{icons[icon]}</div>
      </div>

      {detailLink && typeof revenue === "number" && (
        <p className="text-sm underline mt-2 inline-block">
          Click for more details →
        </p>
      )}
    </div>
  );

  return detailLink ? (
    <Link to={detailLink} className="block">{cardContent}</Link>
  ) : (
    cardContent
  );
}

export default DashboardCard;
