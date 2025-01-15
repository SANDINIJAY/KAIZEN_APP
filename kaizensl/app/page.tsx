"use client";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "./AuthContext";

export default function Home() {
  const { login } = useAuth();

  const [epf, setEpf] = useState("");
  const [profilepic, setProfilePic] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState("");
  const [plant, setPlant] = useState("")
  const [regEpf, setRegEpf] = useState("");
  const [teamLeadEpf, setTeamLeadEpf] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [shift, setShift] = useState("");
  const [section, setSection] = useState("");
  const [name, setName] = useState("")
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRegisterScreen, setIsRegisterScreen] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!epf || !password) {
      setError("Please enter both EPF and Password.");
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}/api/login`, { epf, password });

      if (response.data.success) {
        login(response.data.user);
        setSuccess(true);
        window.location.href = "/KizenStack";
      } else {
        setError(response.data.message || "Invalid credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login.");
    }
  };

  // Registration Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!regEpf || !name || !shift || !section || !regPassword || !confirmPassword || !teamLeadEpf ||!department || !plant || !profilepic) {
      setError("All fields are required.");
      return;
    }

    if (regPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (regPassword.length < 8 || !/\d/.test(regPassword)) {
      setError("Password must be at least 8 characters and include a number.");
      return;
    }

    try {
      const payload = {
        epf: regEpf,
        name,
        shift,
        section,
        password: regPassword,
        teamLeadEpf,
        department,
        profilepic,
        plant,
      };

      const response = await axios.post(`${apiUrl}/api/kaizen_users`, payload);

      if (response.data.success) {
        setSuccess(true);
        alert("Registration successful! You can now login.");
        setIsRegisterScreen(false);
      } else {
        setError(response.data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred during registration.");
    }
  };

  return (
    <div className="justify-center min-h-screen h-auto items-center flex body">
      {!isRegisterScreen ? (
        // Login Screen
        <div className="flex justify-center items-center flex-row">
          <form
            onSubmit={handleLogin}
            className="form justify-center items-center flex flex-col w-[100%] lg:w-[520px]"
          >
            <h2 className="lg:text-3xl text-3xl font-bold">LOGIN</h2>
            {error && <p className="text-red-500">{error}</p>}
            <div className="my-10 flex flex-col w-full">
              <label>
                EPF<span className="text-red-700">*</span>
              </label>
              <input
                type="text"
                placeholder="12345"
                value={epf}
                onChange={(e) => setEpf(e.target.value)}
                className="p-2 input"
              />
              <label>
                Password<span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="p-2 input"
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-sm text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button type="submit" className="button-primary">
              LOGIN
            </button>
            <p className="text-gray-500">
              Don't have an account?{" "}
              <Link href="" onClick={() => setIsRegisterScreen(true)}>
                <span className="text-[#DC5942] hover:text-black transition">Register</span>
              </Link>
            </p>
          </form>
        </div>
      ) : (
        // Registration Screen
        <div className="flex justify-center items-center flex-row">
          <form
            onSubmit={handleSubmit}
            className="form justify-center items-center flex flex-col w-[100%] lg:w-[520px]"
          >
            <h2 className="lg:text-4xl text-3xl font-bold">REGISTER</h2>
            
            <div className="my-10 w-full gap-5">
              <div className="grid">
                <label>
                  EPF<span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  placeholder="12345"
                  value={regEpf}
                  onChange={(e) => setRegEpf(e.target.value)}
                  className="p-2 input"
                />
                <label>
                  Name<span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="p-2 input"
                />
               
                <label>
                  Shift<span className="text-red-700">*</span>
                </label>
                <select value={shift} onChange={(e) => setShift(e.target.value)}  name="shift" id="shift" className="input"  >
                  <option value="shift1">shift1</option>
                  <option value="shift2">shift2</option>
                  <option value="shift3">shift4</option>
                  <option value="shift4">shift3</option>
                </select>
                <label>
                  Department Manager's EPF<span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  placeholder="12345"
                  value={teamLeadEpf}
                  onChange={(e) => setTeamLeadEpf(e.target.value)}
                  className="p-2 input"
                />

                <label>
                  Department<span className="text-red-700">*</span>
                </label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)}  name="department" id="department" className="input"  >
                  <option value="department1">Department 1</option>
                  <option value="department2">Department 2</option>
                  <option value="department3">Department 3</option>
                  <option value="department4">Department 4</option>
                </select>
                <label>
                  Plant<span className="text-red-700">*</span>
                </label>
                <select value={plant} onChange={(e) => setPlant(e.target.value)}  name="plant" id="plant" className="input"  >
                  <option value="plant1">Plant 1</option>
                  <option value="plant2">Plant 2</option>
                  <option value="plant3">Plant 3</option>
                  <option value="plant4">Plant 4</option>
                </select>

                <label>
                  Section<span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="p-2 input"
                />
              </div>

              <label>
                  Profile Pic<span className="text-red-700">*</span>
                </label>
                <input
                  type="file"
                  placeholder=""
                  value={profilepic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  className="p-2 input"
                />
               

              <div>
                <label>
                  Password<span className="text-red-700">*</span>
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="p-2 input"
                />
                <label>
                  Confirm Password<span className="text-red-700">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="p-2 input"
                />
              </div>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <button type="submit" className="button-primary">
              REGISTER
            </button>
            <p className="text-gray-500">
              Already have an account?{" "}
              <Link href="" onClick={() => setIsRegisterScreen(false)}>
                <span className="text-[#DC5942] hover:text-black transition">Login</span>
              </Link>
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
