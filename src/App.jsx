import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout"; 
import Dashboard from "./pages/Dashboard";
import User from "./pages/User";


export default function App() {
	const menuItems = [ 
		{ label: "Dashboard", path: "/dashboard" },
		{ label: "User", path: "/user" },
	];


	return (
		<Router>
			<Layout menuItems={menuItems}>
				<Routes> 
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/user" element={<User />} />
				</Routes>
			</Layout>
		</Router>
	);
}