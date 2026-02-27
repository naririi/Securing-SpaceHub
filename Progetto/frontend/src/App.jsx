import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer"; 

import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import MyBookings from "./pages/MyBookings";
import CreateBooking from "./pages/CreateBooking";
import EditBooking from "./pages/EditBooking";
import PrivacyPolicy from "./pages/PrivacyPolicy"; 
import Terms from "./pages/Terms";

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                {/* Wrapper principale per mantenere il Footer in fondo alla pagina */}
                <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
                    
                    <Navbar />

                    <div style={{ flex: 1 }}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/rooms" element={<Rooms />} />

                            {/* Nuove rotte pubbliche (NIST AC-8) */}
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<Terms />} />

                            <Route
                                path="/my-bookings"
                                element={<ProtectedRoute><MyBookings /></ProtectedRoute>}
                            />
                            <Route
                                path="/create-booking"
                                element={<ProtectedRoute><CreateBooking /></ProtectedRoute>}
                            />
                            <Route
                                path="/edit-booking/:id"
                                element={<ProtectedRoute><EditBooking /></ProtectedRoute>}
                            />
                        </Routes>
                    </div>

                    <Footer />

                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}