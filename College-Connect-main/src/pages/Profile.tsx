import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

import ProfileHeader from "../components/ProfileHeader";
import ProfileBio from "../components/ProfileBio";
import ProfileSkills from "../components/ProfileSkills";
import ProfileResume from "../components/ProfileResume";
import ProfileActivity from "../components/ProfileActivity";
import ProfileExtraFields from "../components/ProfileExtraFields";

export interface ProfileForm {
  name: string;
  bio: string;
  location: string;
  skills: string[];
  avatarFile: File | null;
  avatar: string;
  resumeFile: File | null;
  resumeUrl: string;
  yearOfAdmission: string;
  yearOfGraduation: string;
  course: string;
  branch: string;
  college: string;
  website: string;
  linkedin: string;
  github: string;
  activities?: { title: string; description: string; type?: string }[];
}

const Profile = () => {
  const { currentUser, updateProfile, getProfile } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    bio: "",
    location: "",
    skills: [],
    avatarFile: null,
    avatar: "",
    resumeFile: null,
    resumeUrl: "",
    yearOfAdmission: "",
    yearOfGraduation: "",
    course: "",
    branch: "",
    college: "",
    website: "",
    linkedin: "",
    github: "",
    activities: [],
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      // Agar currentUser nahi hai to fetch karo
      if (!currentUser) {
        const profile = await getProfile();

        // Agar profile mil gaya, to form populate karo
        if (profile) {
          setForm({
            name: profile.name || "",
            bio: profile.bio || "",
            location: profile.location || "",
            skills: Array.isArray(profile.skills) ? profile.skills : [],
            avatarFile: null,
            avatar: profile.avatar || "",
            resumeFile: null,
            resumeUrl: profile.resumeUrl || "",
            yearOfAdmission: profile.admissionYear?.toString() || "",
            yearOfGraduation: profile.graduationYear?.toString() || "",
            course: profile.course || "",
            branch: profile.branch || "",
            college: profile.college || "",
            website: profile.website || "",
            linkedin: profile.linkedin || "",
            github: profile.github || "",
            activities: Array.isArray(profile.activities)
              ? profile.activities
              : [],
          });
        }
        return;
      }

      // Agar currentUser already hai to directly form populate karo
      setForm({
        name: currentUser.name || "",
        bio: currentUser.bio || "",
        location: currentUser.location || "",
        skills: Array.isArray(currentUser.skills)
          ? currentUser.skills
          : currentUser.skills
          ? [currentUser.skills]
          : [],
        avatarFile: null,
        avatar: currentUser.avatar || "",
        resumeFile: null,
        resumeUrl: currentUser.resumeUrl || "",
        yearOfAdmission: currentUser.admissionYear?.toString() || "",
        yearOfGraduation: currentUser.graduationYear?.toString() || "",
        course: currentUser.course || "",
        branch: currentUser.branch || "",
        college: currentUser.college || "",
        website: currentUser.website || "",
        linkedin: currentUser.linkedin || "",
        github: currentUser.github || "",
        activities: Array.isArray(currentUser.activities)
          ? currentUser.activities
          : [],
      });
    };

    loadProfile();
  }, [currentUser]); 

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (
          (key === "avatarFile" || key === "resumeFile") &&
          value instanceof File
        ) {
          formData.append(key === "avatarFile" ? "avatar" : "resume", value);
        } else if (key === "skills" || key === "activities") {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === "string") {
          formData.append(key, value);
        }
      });

      // Send formData to backend
      const updatedProfile = await updateProfile(formData);
      setForm((prev) => ({
        ...prev,
        name: updatedProfile.name || prev.name,
        bio: updatedProfile.bio || prev.bio,
        location: updatedProfile.location || prev.location,
        skills: updatedProfile.skills || prev.skills,
        avatar: updatedProfile.avatar || prev.avatar,
        resumeUrl: updatedProfile.resumeUrl || prev.resumeUrl,
        yearOfAdmission:
          updatedProfile.admissionYear?.toString() || prev.yearOfAdmission,
        yearOfGraduation:
          updatedProfile.graduationYear?.toString() || prev.yearOfGraduation,
        course: updatedProfile.course || prev.course,
        branch: updatedProfile.branch || prev.branch,
        college: updatedProfile.college || prev.college,
        website: updatedProfile.website || prev.website,
        linkedin: updatedProfile.linkedin || prev.linkedin,
        github: updatedProfile.github || prev.github,
        activities: updatedProfile.activities || prev.activities,
        avatarFile: null,
        resumeFile: null,
      }));

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Profile...</p>
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <ProfileHeader
        form={form}
        setForm={setForm}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        loading={loading}
        handleSubmit={handleSubmit}
        currentUser={currentUser}
      />

      {/* Bio + Extra Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProfileBio form={form} setForm={setForm} isEditing={isEditing} />
          <ProfileSkills form={form} setForm={setForm} isEditing={isEditing} />
          <ProfileResume form={form} setForm={setForm} isEditing={isEditing} />
        </div>

        <ProfileExtraFields
          form={form}
          setForm={setForm}
          isEditing={isEditing}
        />
      </div>

      {/* Recent Activity */}
      <ProfileActivity form={form} setForm={setForm} isEditing={isEditing} />
    </div>
  );
};

export default Profile;
