"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../components/Header";
import { useAuth } from "../../AuthContext";

// Define Kaizen type
type Kaizen = {
    id: number;
    title: string;
    category: string;
    status: string;
    beforeDescription: string;
    afterDescription: string;
    saving: string;
    savingCalculation: string;
    beforeImages?: string[];
    afterImages?: string[];
    attachments1?: string[];
    managerComment?: string;
    managerSaving?: string;
    managerApprovalNote?: string;
    processComment?: string;
    processSaving?: string;
    processApprovalNote?: string;
    financeComment?: string;
    financeSaving?: string;
    financeApprovalNote?: string;
};

export default function IndividualKaizen() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const id = params?.id;

    const [kaizen, setKaizen] = useState<Kaizen | null>(null);
    const [isTeamLead, setIsTeamLead] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    // Form state
    const [managerComment, setManagerComment] = useState("");
    const [managerSaving, setManagerSaving] = useState("");
    const [managerApprovalNote, setManagerApprovalNote] = useState("");

    const [processComment, setProcessComment] = useState("");
    const [processSaving, setProcessSaving] = useState("");
    const [processApprovalNote, setProcessApprovalNote] = useState("");

    const [financeComment, setFinanceComment] = useState("");
    const [financeSaving, setFinanceSaving] = useState("");
    const [financeApprovalNote, setFinanceApprovalNote] = useState("");

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    useEffect(() => {
        if (!id) return;

        const fetchKaizen = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/kaizen/${id}`);
                const data = await response.json();

                if (response.ok) {

                    setKaizen(data.data);
                    console.log("Fetched Kaizen Data:", data.data);

                    // Initialize input fields with backend values
                    setManagerComment(data.data.managerComments || "");
                    setManagerSaving(data.data.managerSavings || "");
                    setManagerApprovalNote(data.data.managerApprovalNotes || "");

                    setProcessComment(data.data.processExcellenceComments || "");
                    setProcessSaving(data.data.processExcellenceSavings || "");
                    setProcessApprovalNote(data.data.processExcellenceApprovalNotes || "");

                    setFinanceComment(data.data.financeComments || "");
                    setFinanceSaving(data.data.financeSavings || "");
                    setFinanceApprovalNote(data.data.financeApprovalNotes || "");


                    console.log("Manager Comment:", managerComment);
                    console.log("Process Comment:", processComment);
                    console.log("Finance Comment:", financeComment);

                    // Parse images if they are JSON strings from the backend
                    data.data.beforeImages = Array.isArray(data.data.beforeImages)
                        ? data.data.beforeImages
                        : JSON.parse(data.data.beforeImages || "[]");

                    data.data.afterImages = Array.isArray(data.data.afterImages)
                        ? data.data.afterImages
                        : JSON.parse(data.data.afterImages || "[]");


                    data.data.attachments1 = Array.isArray(data.data.attachments1)
                        ? data.data.attachments1
                        : JSON.parse(data.data.attachments1 || "[]");


                    setKaizen(data.data); // Set the processed data to the state
                    setError(null);
                } else {
                    throw new Error(data.message || "Failed to fetch Kaizen details.");
                }
            } catch (fetchError) {
                console.error("Fetch Error:", fetchError);
                setError("An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };


        const checkTeamLeadStatus = async () => {
            try {
                // Check if user is a team lead
                const teamLeadResponse = await fetch(`${apiUrl}/api/team_leads/${user?.epf}`);
                const teamLeadData = await teamLeadResponse.json();

                if (teamLeadResponse.ok && teamLeadData.isTeamLead) {
                    setIsTeamLead(true);
                    return;
                }

                // Check if user is an admin lead
                const adminLeadResponse = await fetch(`${apiUrl}/api/admin_leads/${user?.epf}`);
                const adminLeadData = await adminLeadResponse.json();

                if (adminLeadResponse.ok && adminLeadData.isAdminLead) {
                    setIsTeamLead(true);
                } else {
                    setIsTeamLead(false);
                }
            } catch (error) {
                console.error("Error checking lead status:", error);
                setIsTeamLead(false);
            }
        };

        fetchKaizen();
        checkTeamLeadStatus();
    }, [id, user?.epf]);


    const handleApprovalAction = async (stage: string, action: "approve" | "reject") => {
        try {
            const payload = {
                id,
                stage,
                action,
                comment:
                    stage === "manager"
                        ? managerComment
                        : stage === "processExcellence"
                            ? processComment
                            : financeComment,
                saving:
                    stage === "manager"
                        ? managerSaving
                        : stage === "processExcellence"
                            ? processSaving
                            : financeSaving,
                approvalNote:
                    stage === "manager"
                        ? managerApprovalNote
                        : stage === "processExcellence"
                            ? processApprovalNote
                            : financeApprovalNote,
            };

            const response = await fetch(`${apiUrl}/api/kaizen/${id}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const updatedData = await response.json();

            if (response.ok) {
                setKaizen(updatedData.data); // Update frontend with updated data
                alert(`Kaizen ${action === "approve" ? "approved" : "rejected"} by ${stage}.`);
            } else {
                alert(updatedData.message || "Failed to perform action.");
            }
        } catch (err) {
            console.error("Error performing action:", err);
            alert("An error occurred while performing the action.");
        }
    };
    if (loading) return <p>Loading Kaizen details...</p>;

    if (error) {
        return (
            <div>
                <Header />
                <div className="pt-20 text-center">
                    <p className="text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    if (!kaizen) return <p>No Kaizen data available.</p>;

    return (
        <div>
            <div className="w-full items-center justify-start flex flex-col lg:h-screen h-auto">
                <Header />

                <div className="w-[90%] lg:w-[80%] mt-32">
                    <h1 className="text-4xl font-bold lg:px-0 px-5 uppercase">{kaizen.title}</h1>
                    <h4 className="text-lg font-semibold text-gray-600 py-2">
                        Category - <span>{kaizen.category}</span>
                    </h4>

                    <div className="my-10">
                        <h4 className="text-xl font-semibold uppercase text-gray-600 py-5">Before Details</h4>
                        <p>{kaizen.beforeDescription}</p>
                    </div>

                    <div>
                        <h4 className="text-xl font-semibold uppercase text-gray-600 py-5">Before Images</h4>
                        {kaizen.beforeImages?.length > 0 ? (
                            <div className="flex flex-wrap gap-4">
                                {kaizen.beforeImages.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`Before Image ${index + 1}`}
                                        className="w-40 h-40 object-cover rounded-lg border"
                                    />
                                ))}
                            </div>
                        ) : (
                            <p>No before images available.</p>
                        )}
                    </div>

                    <div className="my-10">
                        <h4 className="text-xl font-semibold uppercase text-gray-600 py-5">After Details</h4>
                        <p>{kaizen.afterDescription}</p>
                    </div>


                    <div>
                        <h4 className="text-xl font-semibold uppercase text-gray-600 py-5">After Images</h4>
                        {kaizen.afterImages?.length > 0 ? (
                            <div className="flex flex-wrap gap-4">
                                {kaizen.afterImages.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`After Image ${index + 1}`}
                                        className="w-40 h-40 object-cover rounded-lg border"
                                    />
                                ))}
                            </div>
                        ) : (
                            <p>No after images available.</p>
                        )}
                    </div>

                    <div className="my-10">
                        <h4 className="text-xl font-semibold uppercase text-gray-600 py-5">Savings</h4>
                        <p>{kaizen.saving || "N/A"}</p>
                    </div>

                    <div className="my-10">
                        <h4 className="text-xl font-semibold uppercase text-gray-600 py-5">Savings Calculation</h4>
                        <p>{kaizen.savingCalculation || "N/A"}</p>
                    </div>





                    <div className="my-10">
                        <h4 className="text-xl font-semibold uppercase text-gray-600 py-5">Attachments</h4>
                        {kaizen.attachments1?.length > 0 ? (
                            <div className="flex flex-wrap gap-4">
                                {kaizen.attachments1.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`After Image ${index + 1}`}
                                        className="w-40 h-40 object-cover rounded-lg border"
                                    />
                                ))}
                            </div>
                        ) : (
                            <p>No after images available.</p>
                        )}
                    </div>


                    {isTeamLead && (
                        <>
                            <ApprovalSection
                                title="Department Manager Approval"
                                comment={managerComment}
                                setComment={setManagerComment}
                                saving={managerSaving}
                                setSaving={setManagerSaving}
                                approvalNote={managerApprovalNote}
                                setApprovalNote={setManagerApprovalNote}
                                isDisabled={!!kaizen.managerComment}
                                handleApprovalAction={() => handleApprovalAction("manager", "approve")}
                                handleRejectAction={() => handleApprovalAction("manager", "reject")}
                            />

                            <ApprovalSection
                                title="Process Excellence REP Approval"
                                comment={processComment}
                                setComment={setProcessComment}
                                saving={processSaving}
                                setSaving={setProcessSaving}
                                approvalNote={processApprovalNote}
                                setApprovalNote={setProcessApprovalNote}
                                isDisabled={!!kaizen.processComment}
                                handleApprovalAction={() => handleApprovalAction("processExcellence", "approve")}
                                handleRejectAction={() => handleApprovalAction("processExcellence", "reject")}
                            />

                            <ApprovalSection
                                title="Finance Manager Approval"
                                comment={financeComment}
                                setComment={setFinanceComment}
                                saving={financeSaving}
                                setSaving={setFinanceSaving}
                                approvalNote={financeApprovalNote}
                                setApprovalNote={setFinanceApprovalNote}
                                isDisabled={!!kaizen.financeComment}
                                handleApprovalAction={() => handleApprovalAction("finance", "approve")}
                                handleRejectAction={() => handleApprovalAction("finance", "reject")}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}



function ApprovalSection({
    title,
    comment,
    setComment,
    saving,
    setSaving,
    approvalNote,
    setApprovalNote,
    isDisabled,
    handleApprovalAction,
    handleRejectAction,
}: {
    title: string;
    comment: string;
    setComment: React.Dispatch<React.SetStateAction<string>>;
    saving: string;
    setSaving: React.Dispatch<React.SetStateAction<string>>;
    approvalNote: string;
    setApprovalNote: React.Dispatch<React.SetStateAction<string>>;
    isDisabled: boolean;
    handleApprovalAction: () => void;
    handleRejectAction: () => void;
}) {
    return (
        <div className="my-10 border p-5 rounded-lg">
            <h4 className="text-xl font-semibold uppercase text-gray-600 py-5">{title}</h4>
            <textarea
                placeholder="Add Comments if u have any"
                className="w-full p-2 border rounded mb-4"
                value={comment}
                onChange={!isDisabled ? (e) => setComment(e.target.value) : undefined}
                readOnly={isDisabled}
            ></textarea>
            <input
                type="number"
                placeholder="Suggest a New Saving Amount"
                className="w-full p-2 border rounded mb-4"
                value={saving}
                onChange={!isDisabled ? (e) => setSaving(e.target.value) : undefined}
                readOnly={isDisabled}
            />
            <textarea
                placeholder="Approval Note (Mandatory feild) -  Please keep the reason here"
                className="w-full p-2 border rounded mb-4"
                value={approvalNote}
                onChange={!isDisabled ? (e) => setApprovalNote(e.target.value) : undefined}
                readOnly={isDisabled}
            ></textarea>
            {!isDisabled && (
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={handleApprovalAction}>
                        Submit and Approve
                    </button>
                    <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={handleRejectAction}>
                        Reject
                    </button>
                </div>
            )}
        </div>
    );
}