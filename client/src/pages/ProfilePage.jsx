import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);

  const navigate = useNavigate();

  const [selectedImg, setSelectedImg] = useState(null);
  const [name, setName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If no new image is selected
    if (!selectedImg) {
      await updateProfile({
        fullName: name,
        bio,
      });

      navigate("/");
      return;
    }

    // Convert image to Base64
    const reader = new FileReader();

    reader.readAsDataURL(selectedImg);

    reader.onload = async () => {
      const base64Image = reader.result;
      console.log(base64Image);

      const success = await updateProfile({
    profilePic: base64Image,
    fullName: name,
    bio,
});

if (success) {
    navigate("/");
}
    };
  };

  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center">

      <div className="w-5/6 max-w-2xl backdrop-blur-2xl border border-gray-600 rounded-lg flex items-center justify-between max-sm:flex-col-reverse text-gray-300">

        {/* Left Section */}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 p-10 flex-1"
        >
          <h3 className="text-xl font-semibold">
            Profile Details
          </h3>

          {/* Upload Image */}

          <label
            htmlFor="avatar"
            className="flex items-center gap-4 cursor-pointer"
          >
            <input
              id="avatar"
              type="file"
              accept=".png,.jpg,.jpeg"
              hidden
              onChange={(e) => setSelectedImg(e.target.files[0])}
            />

            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : authUser?.profilePic || assets.avatar_icon
              }
              alt=""
              className="w-12 h-12 rounded-full object-cover"
            />

            <span>Upload Profile Image</span>
          </label>

          {/* Name */}

          <input
            type="text"
            placeholder="Your Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-3 rounded-md bg-transparent border border-gray-500 outline-none"
          />

          {/* Bio */}

          <textarea
            rows={4}
            placeholder="Write your bio..."
            required
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="p-3 rounded-md bg-transparent border border-gray-500 outline-none resize-none"
          />

          {/* Save Button */}

          <button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-violet-600 py-3 rounded-full text-white cursor-pointer hover:opacity-90"
          >
            Save
          </button>
        </form>

        {/* Right Section */}

        <img
          src={
            selectedImg
              ? URL.createObjectURL(selectedImg)
              : authUser?.profilePic || assets.logo_icon
          }
          alt=""
          className="max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 object-cover"
        />
      </div>
    </div>
  );
};

export default ProfilePage;