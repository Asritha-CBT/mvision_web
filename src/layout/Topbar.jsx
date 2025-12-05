import { Button } from "../components/Button";


export default function Topbar({ onToggle }) {
    return (
        <div className="w-full bg-gray-900 p-4 flex items-center justify-between shadow-lg">
            <button
            onClick={onToggle}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition"
            >
                ☰
            </button>
            <h1 className="text-lg font-semibold font-heading text-red-500">Machine Vision</h1>
        </div>
    );
}