import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import User from "./pages/User";


export default function App() {
	const menuItems = [
		{ label: "Home", path: "/" },
		{ label: "About", path: "/about" },
		{ label: "Dashboard", path: "/dashboard" },
		{ label: "User", path: "/user" },
	];


	return (
		<Router>
			<Layout menuItems={menuItems}>
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/about" element={<About />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/user" element={<User />} />
				</Routes>
			</Layout>
		</Router>
	);
}