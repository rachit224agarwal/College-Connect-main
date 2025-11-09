import Hackathon from "../models/Hackathon.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const getAllHackathons = async (req, res) => {
  try {
    const { type, search, upcoming } = req.query;

    let query = {};
    if (type && type !== "all") {
      query.type = type;
    }

    if (upcoming === "true") {
      query.startDate = { $gte: new Date() };
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const hackathons = await Hackathon.find(query)
      .sort({ startDate: 1 })
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      count: hackathons.length,
      hackathons,
    });
  } catch (error) {
    console.error("Get hackathons error : ", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch hackathons",
      details: error.message,
    });
  }
};

export const getHackathonById = async (req, res) => {
  try {
    const { id } = req.params;
    const hackathon = await Hackathon.findById(id)
      .populate("createdBy", "name email")
      .populate("registeredUsers", "name email avatar");
    if (!hackathon) {
      return res.status(404).json({
        error: "Hackathon not found",
      });
    }
    res.status(200).json({
      success: true,
      hackathon,
    });
  } catch (error) {
    console.error("Get hackathon error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch hackathon",
      details: error.message,
    });
  }
};

export const createHackathon = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      type,
      organizerName,
      organizerEmail,
      prizes,
      expectedParticipants,
      registrationDeadline,
      websiteUrl,
      tags,
      requirements,
    } = req.body;
    
    if (!title || !description || !startDate || !endDate || !location) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    let imageUrl = "";
    if (req.file) {
      try {
        const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
          folder: "hackathons",
        });
        imageUrl = uploadedImage.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
      }
    }
    
    const hackathon = await Hackathon.create({
      title,
      description,
      image: imageUrl,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location,
      type: type || "In-Person",
      organizerName,
      organizerEmail,
      prizes,
      expectedParticipants,
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : null,
      websiteUrl,
      tags: tags ? (typeof tags === "string" ? tags.split(",") : tags) : [],
      requirements,
      createdBy: req.user._id,
    });
    
    res.status(201).json({
      success: true,
      message: "Hackathon created successfully",
      hackathon,
    });
  } catch (error) {
    console.error("Create hackathon error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create hackathon",
      details: error.message,
    });
  }
};

// ⭐ FIXED: Update Hackathon - Handle Empty Arrays
export const updateHackathon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // ⭐ FIX 1: Clean up registeredUsers array
    if (updates.registeredUsers) {
      // If it's a string (from form data), parse it
      if (typeof updates.registeredUsers === "string") {
        try {
          updates.registeredUsers = JSON.parse(updates.registeredUsers);
        } catch (e) {
          // If parsing fails, treat as empty array
          updates.registeredUsers = [];
        }
      }

      // Filter out empty strings and invalid IDs
      if (Array.isArray(updates.registeredUsers)) {
        updates.registeredUsers = updates.registeredUsers.filter(
          (id) => id && typeof id === "string" && id.trim() !== "" && id !== "null" && id !== "undefined"
        );
      }

      // If array is empty after filtering, don't update this field
      if (updates.registeredUsers.length === 0) {
        delete updates.registeredUsers;
      }
    }

    // ⭐ FIX 2: Clean up teams array (if exists)
    if (updates.teams) {
      if (typeof updates.teams === "string") {
        try {
          updates.teams = JSON.parse(updates.teams);
        } catch (e) {
          updates.teams = [];
        }
      }

      if (Array.isArray(updates.teams)) {
        updates.teams = updates.teams.filter(
          (id) => id && typeof id === "string" && id.trim() !== "" && id !== "null" && id !== "undefined"
        );
      }

      if (updates.teams.length === 0) {
        delete updates.teams;
      }
    }

    // Handle file upload
    if (req.file) {
      try {
        const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
          folder: "hackathons",
        });
        updates.image = uploadedImage.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
      }
    }

    // Handle tags
    if (updates.tags && typeof updates.tags === "string") {
      updates.tags = updates.tags.split(",").map(tag => tag.trim()).filter(tag => tag);
    }

    // Handle date fields
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }
    if (updates.registrationDeadline) {
      updates.registrationDeadline = new Date(updates.registrationDeadline);
    }

    console.log("📝 Updating hackathon with:", updates);

    const hackathon = await Hackathon.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!hackathon) {
      return res.status(404).json({ error: "Hackathon not found" });
    }

    res.status(200).json({
      success: true,
      message: "Hackathon updated successfully",
      hackathon,
    });
  } catch (error) {
    console.error("Update hackathon error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update hackathon",
      details: error.message,
    });
  }
};

export const deleteHackathon = async (req, res) => {
  try {
    const { id } = req.params;

    const hackathon = await Hackathon.findByIdAndDelete(id);

    if (!hackathon) {
      return res.status(404).json({ error: "Hackathon not found" });
    }

    res.status(200).json({
      success: true,
      message: "Hackathon deleted successfully",
    });
  } catch (error) {
    console.error("Delete hackathon error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete hackathon",
      details: error.message,
    });
  }
};

export const registerForHackathon = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const hackathon = await Hackathon.findById(id);

    if (!hackathon) {
      return res.status(404).json({ error: "Hackathon not found" });
    }

    if (!hackathon.registrationOpen) {
      return res.status(400).json({ error: "Registration is closed" });
    }

    if (hackathon.registeredUsers.includes(userId)) {
      return res.status(400).json({ error: "Already registered" });
    }

    hackathon.registeredUsers.push(userId);
    await hackathon.save();

    res.status(200).json({
      success: true,
      message: "Registered successfully",
      hackathon,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register",
      details: error.message,
    });
  }
};

export const unregisterFromHackathon = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const hackathon = await Hackathon.findById(id);

    if (!hackathon) {
      return res.status(404).json({ error: "Hackathon not found" });
    }

    hackathon.registeredUsers = hackathon.registeredUsers.filter(
      (user) => user.toString() !== userId.toString()
    );
    await hackathon.save();

    res.status(200).json({
      success: true,
      message: "Unregistered successfully",
      hackathon,
    });
  } catch (error) {
    console.error("Unregister error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to unregister",
      details: error.message,
    });
  }
};