const Vendor = require("../models/Vendor");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotEnv = require("dotenv");

dotEnv.config();
const secretKey = process.env.WhatIsYourName;

const vendorRegister = async (req, res) => {
  const { username, email, password, number } = req.body;
  console.log(req.body);
  try {
    const vendorEmail = await Vendor.findOne({ email });
    if (vendorEmail) {
      return res.status(400).json("Email already exists");
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }
    if (!number) {
      return res.status(400).json({ error: "Ph.Number is required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdTimeStamp = new Date();

    const newVendor = new Vendor({
      username,
      email,
      password: hashedPassword,
      number,
      createdTimeStamp,
    });
    await newVendor.save();

    res.status(201).json({ message: "Vendor registered successfully" });
    console.log("Registered");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const vendorLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor || !(await bcrypt.compare(password, vendor.password))) {
      return res.status(401).json({ error: "Invalid username or  password" });
    }
    const token = jwt.sign({ vendorId: vendor._id }, secretKey, {
      expiresIn: "1h",
    });
    const vendorId = vendor._id;
    const vendorName = vendor.username;
    const vendorCreatedTime = vendor.createdTimeStamp;
    res.status(200).json({
      success: "Login successful",
      token,
      vendorId,
      vendorName,
      vendorCreatedTime,
    });
    // console.log(email, "This is token: ", token);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find().populate("firm");
    res.json({ vendors });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getVendorById = async (req, res) => {
  const vendorId = req.params.id;
  // console.log("Fetching vendor by ID:", vendorId);
  try {
    const vendor = await Vendor.findById(vendorId)
      .populate("firm")
      .populate("product");
    if (!vendor) {
      return res.status(404).json("Vendor not found");
    }
    if (!vendor.firm || vendor.firm.length === 0) {
      return res
        .status(200)
        .json({ error: "No firms associated with this vendor" });
    }
    const vendorFirmId = vendor.firm[0]._id;
    res.status(200).json({ vendor, vendorFirmId });
  } catch (error) {
    // console.error("Error fetching vendor by ID:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { vendorRegister, vendorLogin, getAllVendors, getVendorById };
