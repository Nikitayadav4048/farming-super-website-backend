// const mongoose = require("mongoose");

// const farmerSchema = new mongoose.Schema(
//   {
//     // 🧍 Personal Details
//     fullName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     mobile: {
//       type: String,
//       required: true,
//       match: /^[0-9]{10}$/, // ✅ better than length
//       unique: true,
//     },
//     village: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     block: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     district: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     state: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     pin: {
//       type: String,
//       required: true,
//       match: /^[0-9]{6}$/, // ✅ regex for 6-digit PIN
//     },
//     category: {
//       type: String,
//       required: true,
//       enum: ["SC", "ST", "OBC", "General"],
//     },
//     farmArea: {
//       type: Number,
//       required: true,
//       min: 0,
//     },
//     primaryCrops: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     // 🪪 KYC Details
//     aadharNumber: {
//       type: String,
//       required: true,
//       match: /^[0-9]{12}$/, // ✅ regex for 12-digit Aadhaar
//       unique: true,
//     },
//     aadharFront: {
//       type: String,
//       required: false, // stored as file path or URL
//     },
//     aadharBack: {
//       type: String,
//       required: false,
//     },
//     selfie: {
//       type: String,
//       required: false,
//     },
//     panNumber: {
//       type: String,
//       trim: true,
//     },

//     // 🏦 Bank Details
//     accountHolder: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     bankName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     branch: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     accountNumber: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     ifsc: {
//       type: String,
//       required: true,
//       trim: true,
//       uppercase: true,
//     },
//     cheque: {
//       type: String,
//       required: false, // file path or URL
//     },
//     upi: {
//       type: String,
//       trim: true,
//     },

//     // 📍 GPS & Farm Location
//     farmLocation: {
//       latitude: {
//         type: Number,
//         required: true,
//       },
//       longitude: {
//         type: Number,
//         required: true,
//       },
//     },
//     farmPhoto: {
//       type: String,
//       trim: true,
//     },

//     // ⚙ System Fields
//     farmerId: {
//       type: String,
//       unique: true,
//     },
//     registrationDate: {
//       type: Date,
//       default: Date.now,
//     },
//     verifiedBy: {
//       type: String,
//       trim: true,
//     },
//     status: {
//       type: String,
//       enum: ["Pending", "Verified"],
//       default: "Pending",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // 🆔 Generate unique Farmer ID before saving
// farmerSchema.pre("save", async function (next) {
//   if (!this.farmerId) {
//     const count = await mongoose.model("Farmer").countDocuments();
//     this.farmerId = `FRM${String(count + 1).padStart(6, "0")}`;
//   }
//   next();
// });

// module.exports = mongoose.model("Farmer", farmerSchema);




const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema(
  {
    // 🧍 Personal Details
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/, // ✅ better than length
      unique: true,
    },
    village: {
      type: String,
      required: true,
      trim: true,
    },
    block: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pin: {
      type: String,
      required: true,
      match: /^[0-9]{6}$/, // ✅ regex for 6-digit PIN
    },
    category: {
      type: String,
      required: true,
      enum: ["SC", "ST", "OBC", "General"],
    },
    farmArea: {
      type: Number,
      required: true,
      min: 0,
    },
    primaryCrops: {
      type: String,
      required: true,
      trim: true,
    },

    // 🪪 KYC Details
    aadharNumber: {
      type: String,
      required: true,
      match: /^[0-9]{12}$/, // ✅ regex for 12-digit Aadhaar
      unique: true,
    },
    aadharFront: {
      type: String,
      required: false, // stored as file path or URL
    },
    aadharBack: {
      type: String,
      required: false,
    },
    selfie: {
      type: String,
      required: false,
    },
    panNumber: {
      type: String,
      trim: true,
    },

    // 🏦 Bank Details
    accountHolder: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ifsc: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    cheque: {
      type: String,
      required: false, // file path or URL
    },
    upi: {
      type: String,
      trim: true,
    },

    // 📍 GPS & Farm Location
    farmLocation: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    farmPhoto: {
      type: String,
      trim: true,
    },

    // ⚙ System Fields
    farmerId: {
      type: String,
      unique: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    verifiedBy: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Verified"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// 🆔 Generate unique Farmer ID before saving
farmerSchema.pre("save", async function (next) {
  if (!this.farmerId) {
    const count = await mongoose.model("Farmer").countDocuments();
    this.farmerId = `FRM${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Farmer", farmerSchema);