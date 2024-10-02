const Firm = require("../models/Firm");
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const multer = require("multer");
const Path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // Destination folder where the uploaded images will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + Path.extname(file.originalname)); // Generating a unique filename
  },
});

const upload = multer({ storage: storage });

const addFirm = async (req, res) => {
  try {
    const { firmName, area, category, region, offer } = req.body;
    const image = req.file ? req.file.filename : undefined;

    const vendor = await Vendor.findById(req.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (vendor.firm.length > 0) {
      console.log("vendor.firm.length:", vendor.firm.length);
      return res.status(400).json({ message: "Vendor can have only one firm" });
    }

    const firm = new Firm({
      firmName,
      area,
      category,
      region,
      offer,
      image,
      vendor: vendor._id,
    });

    const savedFirm = await firm.save();

    const vendorFirmId = savedFirm._id;

    vendor.firm.push(savedFirm);

    await vendor.save();

    return res
      .status(200)
      .json({ message: "Firm added successfully", vendorFirmId });
  } catch (error) {
    console.error(error);
    return res.status(500).json("Internal server error");
  }
};

const deleteFirmById = async (req, res) => {
  try {
    const firmId = req.params.firmId;

    // Delete the firm by its ID
    const deletedFirm = await Firm.findByIdAndDelete(firmId);
    if (!deletedFirm) {
      return res.status(404).json({ error: "Firm not found" });
    }

    // Delete all products associated with this firm
    await Product.deleteMany({ firm: firmId });

    // Remove the firm reference from the vendor
    await Vendor.updateOne(
      { _id: deletedFirm.vendor },
      {
        $pull: { firm: firmId },
      }
    );

    res
      .status(200)
      .json({ message: "Firm and associated products deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { addFirm: [upload.single("image"), addFirm], deleteFirmById };
