import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout"; 
import Dashboard from "./pages/Dashboard";
import UserPresence from "./pages/UserPresence";
import User from "./pages/User";
import Camera from "./pages/Camera";
import CameraCategory from "./pages/CameraCategory";


export default function App() {
	const menuItems = [ 
		{ label: "Dashboard", path: "/dashboard" },
		{ label: "Category", path: "/category" },
		{ label: "Camera", path: "/camera" },
		{ label: "Persons", path: "/user" },
		{ label: "Person Presence", path: "/user_presence" },
	]; 

	return (
		<Router>
			<Layout menuItems={menuItems}>
				<Routes> 
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/category" element={<CameraCategory />} />
					<Route path="/camera" element={<Camera />} />
					<Route path="/user" element={<User />} />
					<Route path="/user_presence" element={<UserPresence />} />
				</Routes>
			</Layout>
		</Router>
	);
}