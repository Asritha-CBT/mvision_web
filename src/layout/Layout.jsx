import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";


export default function Layout({ children, menuItems }) {
    const [collapsed, setCollapsed] = useState(false); 

    return (
        <div className="flex h-screen">
            <Sidebar items={menuItems} collapsed={collapsed} /> 
            <div className="flex-1 flex flex-col">
                <Topbar onToggle={() => setCollapsed(!collapsed)} />
                <main className="p-6 bg-gray-800 flex-1 overflow-auto">{children}</main>
            </div>
        </div>
    );
}