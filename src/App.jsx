import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout"; 
import Dashboard from "./pages/Dashboard";
import UserPresence from "./pages/UserPresence";
import User from "./pages/User";


export default function App() {
	const menuItems = [ 
		{ label: "Dashboard", path: "/dashboard" },
		{ label: "User", path: "/user" },
		{ label: "User Presence", path: "/user_presence" },
	];


	return (
		<Router>
			<Layout menuItems={menuItems}>
				<Routes> 
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/user" element={<User />} />
					<Route path="/user_presence" element={<UserPresence />} />
				</Routes>
			</Layout>
		</Router>
	);
}