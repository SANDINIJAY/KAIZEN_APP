"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Header from "../components/Header";
import { useAuth } from "../AuthContext";

export default function AddKaizen() {
  const { user } = useAuth(); // Get user from context
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [beforeDescription, setBeforeDescription] = useState("");
  const [afterDescription, setAfterDescription] = useState("");
  const [saving, setSaving] = useState("");
  const [savingCalculation, setSavingCalculation] = useState("");
  const [beforeSelectedFiles, setBeforeSelectedFiles] = useState<File[]>([]);
  const [beforeImagePreviews, setBeforeImagePreviews] = useState<string[]>([]);
  const [afterSelectedFiles, setAfterSelectedFiles] = useState<File[]>([]);
  const [afterImagePreviews, setAfterImagePreviews] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clean up previews when the component is unmounted
  useEffect(() => {
    return () => {
      beforeImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      afterImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [beforeImagePreviews, afterImagePreviews]);

  // Handle Before Image Change
  const handleBeforeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setBeforeSelectedFiles(files);

      // Generate Previews
      const previews = files.map((file) => URL.createObjectURL(file));
      setBeforeImagePreviews(previews);
    }
  };

  // Handle After Image Change
  const handleAfterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAfterSelectedFiles(files);

      // Generate Previews
      const previews = files.map((file) => URL.createObjectURL(file));
      setAfterImagePreviews(previews);
    }
  };

  // Handle Attachments Change
  const handleAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments(files);
    }
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset error and success messages
    setError("");
    setSuccess(false);
    setLoading(true);

    // Validate required fields
    if (!title || !category || !beforeDescription || !afterDescription || !saving || !savingCalculation) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (!user?.epf) {
      setError("User information is missing. Please log in again.");
      setLoading(false);
      return;
    }

    // Prepare FormData payload
    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("beforeDescription", beforeDescription);
    formData.append("afterDescription", afterDescription);
    formData.append("saving", saving);
    formData.append("savingCalculation", savingCalculation);
    formData.append("epf", user.epf);

    // Append Before Images
    beforeSelectedFiles.forEach((file) => formData.append("beforeImagePreviews", file));

    // Append After Images
    afterSelectedFiles.forEach((file) => formData.append("afterImagePreviews", file));

    // Append Attachments
    attachments.forEach((file) => formData.append("attachments", file));

    try {
      const response = await axios.post("http://localhost:5000/api/kaizens", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setSuccess(true);

        // Reset form fields
        setTitle("");
        setCategory("");
        setBeforeDescription("");
        setAfterDescription("");
        setSaving("");
        setSavingCalculation("");
        setBeforeSelectedFiles([]);
        setAfterSelectedFiles([]);
        setAttachments([]);
        setBeforeImagePreviews([]);
        setAfterImagePreviews([]);
      } else {
        setError(response.data.message || "Failed to add Kaizen.");
      }
    } catch (err) {
      console.error("Error while adding Kaizen:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full items-center justify-center flex flex-col lg:h-screen h-auto">
      <Header />

      <div className="justify-center items-center flex flex-col my-20 lg:my-0 lg:pt-60  lg:mt-20 xl:pt-42">
        <form className="form justify-start items-start flex flex-col" onSubmit={handleSubmit}>
          <h1 className="text-4xl pb-10 font-bold lg:px-0 px-5">KAIZEN DETAILS</h1>

          {/* Display Error and Success Messages */}
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">Kaizen successfully added!</p>}

          <div className="justify-center items-start lg:flex gap-10">
            {/* Left Column */}
            <div className="lg:px-0 px-5">
              <label>Title<span className="text-red-700">*</span></label>
              <input
                type="text"
                placeholder="Kaizen 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="p-2 input"
              />

              <label>Photo Before</label>
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="imageUploadBefore"
                  className="cursor-pointer bg-[#DC5942] hover:bg-black text-white px-4 py-2 rounded">
                  Upload Photos
                </label>
                <input
                  id="imageUploadBefore"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleBeforeImageChange}
                />
                <span id="file-name" className="text-gray-600 text-xs">
                  {beforeSelectedFiles.length > 0 ? `${beforeSelectedFiles.length} file(s) selected` : "No files chosen"}
                </span>
              </div>
              <div className="h-[140px] flex flex-wrap gap-2 w-full border border-black rounded-md my-2">
                {beforeImagePreviews.map((preview, index) => (
                  <div key={index} className="py-2">
                    <img src={preview} alt={`Preview ${index + 1}`} style={{ maxWidth: "100px", maxHeight: "100px" }} />
                  </div>
                ))}
              </div>

              <label>Before Description</label>
              <textarea
                placeholder="Describe the situation before implementation"
                value={beforeDescription}
                onChange={(e) => setBeforeDescription(e.target.value)}
                required
                className="p-2 !h-24 input"
              />

              <label>Saving Calculation</label>
              <textarea
                placeholder="Total savings = 100K"
                value={savingCalculation}
                onChange={(e) => setSavingCalculation(e.target.value)}
                required
                className="p-2 !h-24 input"
              />
            </div>

            {/* Right Column */}
            <div className="lg:px-0 px-5">
              <label>Category<span className="text-red-700">*</span></label>
              <div className="flex flex-row gap-3 pb-4">
                {["Safety", "Quality", "Delivery", "Cost", "Morale"].map((cat) => (
                  <label key={cat} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={category === cat}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                    {cat}
                  </label>
                ))}
              </div>

              <label>Photo After</label>
              <div className="flex items-center space-x-2">
                <label
                  htmlFor="imageUploadAfter"
                  className="cursor-pointer bg-[#DC5942] hover:bg-black text-white px-4 py-2 rounded">
                  Upload Photos
                </label>
                <input
                  id="imageUploadAfter"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleAfterImageChange}
                />
                <span id="file-name" className="text-gray-600 text-xs">
                  {afterSelectedFiles.length > 0 ? `${afterSelectedFiles.length} file(s) selected` : "No files chosen"}
                </span>
              </div>
              <div className="h-[140px] flex flex-wrap gap-2 w-full  border border-black rounded-md my-2">
                {afterImagePreviews.map((preview, index) => (
                  <div key={index} className="py-2">
                    <img src={preview} alt={`Preview ${index + 1}`} style={{ maxWidth: "100px", maxHeight: "100px" }} />
                  </div>
                ))}
              </div>

              <label>After Description</label>
              <textarea
                placeholder="Describe the situation after implementation"
                value={afterDescription}
                onChange={(e) => setAfterDescription(e.target.value)}
                required
                className="p-2 !h-24 input"
              />

              <label>Saving</label>
              <input
                type="number"
                placeholder="12345"
                value={saving}
                onChange={(e) => setSaving(e.target.value)}
                required
                className="p-2 input"
              />

              <label>Additional Attachments</label><br/>
              <label
                htmlFor="additionalAttatchments"
                className="cursor-pointer bg-[#DC5942] hover:bg-black text-white px-4 py-2 rounded">
                Upload Attachments
              </label>
              <input
                id="additionalAttatchments"
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleAttachmentsChange}
              />
            </div>
          </div>

          <div className="w-full h-20 items-end flex lg:justify-end justify-center relative">
            <button type="submit" className="button-secondary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
