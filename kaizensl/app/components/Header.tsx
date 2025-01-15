"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../AuthContext";

function ProfileCard({ user, onClose, onLogout }: { user: any; onClose: () => void; onLogout: () => void }) {
  return (
    <div className="absolute top-10 right-0 bg-white w-[300px] h-auto shadow-lg flex flex-col justify-start items-center pt-10 px-4 rounded-md">
      <div onClick={onClose} className="absolute top-2 right-2 cursor-pointer">
        <Image
          className="z-20 w-6 p-1 object-cover"
          src="/Images/close.png"
          alt="Close profile"
          width={12}
          height={12}
        />
      </div>
      <div className="w-24 h-24 relative rounded-full overflow-hidden">
        <Image
          className="z-20 w-full object-cover"
          src="/Images/stretch-2.jpg"
          alt="User profile"
          fill
          onError={(e) => (e.currentTarget.src = "/Images/default-profile.png")}
        />
      </div>
      <div className="justify-center w-full items-start flex flex-col pt-5 gap-y-3 font-bold text-gray-700">
        <p>Name: {user.name}</p>
        <p>EPF: {user.epf}</p>
        <p>Shift: {user.shift}</p>
        <p>Section: {user.section}</p>
      </div>
      <div className="mt-5 w-full">
      

        <button onClick={onLogout} className="button-primary "> LOGOUT</button>
      </div>
    </div>
  );
}

function Header() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleOnClickProfile = () => {
    setProfileOpen(!profileOpen);
  };

  const handleLogout = () => {
    logout(); // Log out the user using AuthContext
    setProfileOpen(false); // Close the profile dropdown
  };

  return (
    <div className="header flex justify-between items-center p-5 bg-[#DC5942] shadow-md">
      {/* Logo */}
      <div>
        <Image
          className="z-20"
          src="/Images/png-transparent-profile-logo-computer-icons-user.png"
          alt="Logo"
          width={90}
          height={38}
        />
      </div>

      {/* Navigation and Profile */}
      <div className="flex lg:gap-10 gap-3 justify-center items-center relative">
        {/* Add Kaizen Link */}
        <Link href="/AddKaizen">
          <Image
            className="z-20 cursor-pointer"
            src="/Images/plus.png"
            alt="Add Kaizen"
            width={20}
            height={38}
          />
        </Link>

          <Link href="/KizenStack">
          <Image
            className="z-20 cursor-pointer"
            src="/Images/invoice.png"
            alt="Add Kaizen"
            width={20}
            height={38}
          />
        </Link>

        {/* Profile Dropdown */}
        <button
          onClick={handleOnClickProfile}
          aria-expanded={profileOpen}
          aria-label="Toggle profile dropdown"
          className="relative z-10"
        >
          <Image
            className="z-20 cursor-pointer"
            src="/Images/user.png"
            alt="User profile icon"
            width={30}
            height={38}
          />
        </button>

        {/* Profile Card */}
        {profileOpen && user && (
          <ProfileCard
            user={user}
            onClose={handleOnClickProfile}
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
}

export default Header;
