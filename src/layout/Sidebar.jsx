import { Link } from "react-router-dom";
import { motion } from "framer-motion";


export default function Sidebar({ items, collapsed }) {
    return (
        <motion.div
        animate={{ width: collapsed ? 0 : 230 }}
        className="h-full bg-gray-900 shadow-xl overflow-hidden"
        >
            <h2 className="text-xl font-bold mb-4 font-heading" hidden={collapsed}>Menu</h2>
            {items.map((item) => (
                <Link
                key={item.path}
                to={item.path}
                className="block p-2 rounded hover:bg-gray-700 text-gray-200"
                >
                    {item.label}
                </Link>
            ))}
        </motion.div>
    );
}