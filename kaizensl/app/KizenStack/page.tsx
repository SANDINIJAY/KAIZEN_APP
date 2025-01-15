"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { useAuth } from "../AuthContext";
import ProtectedPage from "../components/ProtectedPage";
import Link from "next/link";

// Helper function to get status styles
const getStatusStyles = (status: string) => {
  switch (status) {
    case "TrialOngoing":
      return { borderColor: "border-gray-300", bgColor: "bg-gray-300", text: "Trial Ongoing" };
    case "Pending Manager Approval":
      return { borderColor: "border-green-500", bgColor: "bg-green-500", text: "Pending Manager Approval" };
    case "Manager Approved":
      return { borderColor: "border-yellow-500", bgColor: "bg-yellow-500", text: "Manager Approved. Pending Process Excellence Approval" };
    case "Process Excellence Manager Approved":
      return { borderColor: "border-blue-500", bgColor: "bg-blue-500", text: "Process Excellence Manager Approved. Pending Finance Rep Approval" };
    case "Finance Rep Approved":
      return { borderColor: "border-purple-500", bgColor: "bg-purple-500", text: "Fully Approved" };
    case "Manager Rejected":
      return { borderColor: "border-red-500", bgColor: "bg-red-500", text: "Rejected By Manager Rejected" };
    case "Process Excellence Manager Rejected":
      return { borderColor: "border-red-500", bgColor: "bg-red-500", text: "Rejected By Process Excellence Manager" };
    case "Finance Rep Rejected":
      return { borderColor: "border-red-500", bgColor: "bg-red-500", text: "Rejected By Finance Rep" };
    default:
      return { borderColor: "border-red-500", bgColor: "bg-red-500", text: "Rejected" };
  }
};

export default function KaizenStack() {
  const { user } = useAuth();
  const [userKaizens, setUserKaizens] = useState([]); // For the user's own Kaizens
  const [allKaizens, setAllKaizens] = useState([]); // For all Kaizens (admins only)
  const [teamKaizens, setTeamKaizens] = useState([]); // For team Kaizens (team lead)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeamLead, setIsTeamLead] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initializeData = async () => {
      if (!user) {
        setLoading(false);
        setError("User not found. Please log in.");
        router.push("/"); // Redirect to login page
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      try {
        // If admin, fetch all Kaizens
        if (user.role === "process_exc_manager" || user.role === "finance_manager" || user.role === "finance_rep" ) {
          try {
            // Include the role as a query parameter
            const response = await fetch(`${apiUrl}/api/kaizensall?role=${user.role}`);
            const data = await response.json();
        
            console.log('All Kaizens:', data);
        
            if (response.ok) {
              setAllKaizens(data.data); // Populate with all Kaizens
            } else {
              console.warn("Failed to fetch all Kaizens:", data.message);
            }
          } catch (error) {
            console.error("Error fetching Kaizens:", error.message);
          }
        }

        // Fetch user's own Kaizens
        const kaizenResponse = await fetch(`${apiUrl}/api/kaizens/${user.epf}`);
        const kaizenData = await kaizenResponse.json();

        if (kaizenResponse.ok) {
          setUserKaizens(kaizenData.data || []); // Populate with user's own Kaizens
        } else {
          throw new Error(kaizenData.message || "Failed to fetch Kaizens.");
        }

        // Check if the user is a team lead
        const leadResponse = await fetch(`${apiUrl}/api/team_leads/${user.epf}`);
        const leadData = await leadResponse.json();

        if (leadResponse.ok && leadData.isTeamLead) {
          setIsTeamLead(true);

          // Fetch team Kaizens if the user is a team lead
          const teamResponse = await fetch(`${apiUrl}/api/team_kaizens/${user.epf}`);
          const teamData = await teamResponse.json();

          if (teamResponse.ok) {
            setTeamKaizens(teamData.data || []); // Populate the team Kaizen list
          } else {
            console.error("Failed to fetch team Kaizens:", teamData.message);
          }
        }
      } catch (error) {
        console.error("An error occurred while fetching data:", error);
        setError("No Kaizens to show. Add your first kaizen");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [user, router]);

  if (loading) return <p>Loading your Kaizens...</p>;

  if (error) {
    return (
      <div>
        <Header />
        <div className="lg:pt-40 pt-28 justify-center items-center flex">
          <h1 className="text-4xl lg:w-[75%] w-[90%] pb-5 font-bold">YOUR KAIZEN LIST</h1>
        </div>
        <p className="text-red-500 text-center mt-5">{error}</p>
      </div>
    );
  }

  return (
    <ProtectedPage>
      <div>
        <Header />

        {/* Display All Kaizens for process_exc_manager and finance_manager */}
        {(user?.role === "process_exc_manager" || user?.role === "finance_manager") && (
          <div className="lg:pt-40 pt-28 justify-center items-center flex flex-col">
            <h1 className="text-4xl lg:w-[75%] w-[90%] pb-5 font-bold">ALL KAIZENS</h1>
            <div className="bg-white lg:w-[80%] w-[90%] h-auto lg:p-10 grid md:grid-cols-2 pb-10 gap-10">
              {allKaizens.length > 0 ? (
                allKaizens.map((item: any, index: number) => {
                  const { borderColor, bgColor, text } = getStatusStyles(item.status);
                  return (
                    <Link href={`/kaizen/${item.id}`} key={index}>
                      <div className={`border-2 ${borderColor} w-[100%] rounded-lg p-4`}>
                        <h1 className="text-3xl">{item.title}</h1>
                        <p className="text-sm text-gray-500 pr-32 my-2">{item.beforeDescription.slice(0, 90)}...</p>
                        <p className="text-xl">Save {item.saving} LKR</p>
                        <div className="top-3 right-3 inline-block group">
                          <button className={`w-auto px-2 h-6 ${bgColor} rounded-full text-white shadow-lg`}>
                            {text}
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="text-gray-500">No Kaizens found.</p>
              )}
            </div>
          </div>
        )}

        {/* Team Kaizens Section (Only for Team Leads) */}
        {isTeamLead && (
          <div className="lg:pt-40 pt-28 justify-center items-center flex flex-col">
            <h1 className="text-4xl lg:w-[75%] w-[90%] pb-5 font-bold">YOUR TEAM KAIZENS</h1>
            <div className="bg-white lg:w-[80%] w-[90%] h-auto lg:p-10 grid md:grid-cols-2 pb-10 gap-10">
              {teamKaizens.length > 0 ? (
                teamKaizens.map((item: any, index: number) => {
                  const { borderColor, bgColor, text } = getStatusStyles(item.status);
                  return (
                    <Link href={`/kaizen/${item.id}`} key={index}>
                      <div className={`border-2 ${borderColor} w-[100%] rounded-lg p-4`}>
                        <h1 className="text-3xl">{item.title}</h1>
                        <p className="text-sm text-gray-500 pr-32 my-2">{item.beforeDescription.slice(0, 90)}...</p>
                        <p className="text-xl">Save {item.saving} LKR</p>
                        <div className="top-3 right-3 inline-block group">
                          <button className={`w-auto px-2 h-6 ${bgColor} rounded-full text-white shadow-lg`}>
                            {text}
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="text-gray-500">No Kaizens found under your supervision.</p>
              )}
            </div>
          </div>
        )}

        {/* User's Kaizens Section */}
        <div className="lg:pt-40 pt-28 justify-center items-center flex">
          <h1 className="text-4xl lg:w-[75%] w-[90%] pb-5 font-bold">YOUR KAIZENS</h1>
        </div>
        <div className="w-full z-50 h-auto justify-center items-center flex-row flex">
          <div className="bg-white lg:w-[80%] w-[90%] h-auto lg:p-10 grid md:grid-cols-2 pb-10 gap-10">
            {userKaizens.length > 0 ? (
              userKaizens.map((item: any, index: number) => {
                const { borderColor, bgColor, text } = getStatusStyles(item.status);
                return (
                  <Link href={`/kaizen/${item.id}`} key={index}>
                    <div className={`border-2 ${borderColor} w-[100%] rounded-lg p-4`}>
                      <h1 className="text-3xl">{item.title}</h1>
                      <p className="text-sm text-gray-500 pr-32 my-2">{item.beforeDescription.slice(0, 90)}...</p>
                      <p className="text-xl">Save {item.saving} LKR</p>
                      <div className="top-3 right-3 inline-block group">
                        <button className={`w-auto px-2 h-6 ${bgColor} rounded-full text-white shadow-lg`}>
                          {text}
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-gray-500 text-center mt-5">No Kaizens found for you.</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
