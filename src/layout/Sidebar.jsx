import { NavLink } from "react-router-dom";
import { Home, Users, Clock } from "lucide-react";

export default function Sidebar({ items, collapsed }) {
    const iconMap = {
        "Dashboard": <Home size={20} />,
        "Persons": <Users size={20} />,
        "Person Presence": <Clock size={20} />,
    };

    return (
        <div className={`bg-gray-900 text-white h-full p-4 ${collapsed ? "w-16" : "w-56"} duration-300`}>
            <ul className="space-y-3">
                {items.map((item) => (
                    <li key={item.path}>
                        <NavLink
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 p-2 rounded-lg 
                                ${isActive ? "bg-sky-600" : "hover:bg-gray-700"}`
                            }
                        >
                            {iconMap[item.label]}
                            {!collapsed && item.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    );
}
