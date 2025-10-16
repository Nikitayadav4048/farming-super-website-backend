const mongoose = require("mongoose");

const soilTestSchema = new mongoose.Schema({
  farmerId: {
    type: String,
    required: true,
    ref: 'Farmer'
  },
  sampleId: {
    type: String,
    unique: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String
  },
  cropType: {
    type: String,
    required: true,
    trim: true
  },
  preferredDate: {
    type: Date,
    required: true
  },
  testFee: {
    type: Number,
    default: 50
  },
  status: {
    type: String,
    enum: ["Requested", "Sample Collected", "Testing", "Completed"],
    default: "Requested"
  },
  results: {
    ph: Number,
    nitrogen: { type: String, enum: ["Low", "Medium", "High"] },
    phosphorus: { type: String, enum: ["Low", "Medium", "High"] },
    potassium: { type: String, enum: ["Low", "Medium", "High"] },
    organicCarbon: String,
    recommendedCrops: [String],
    fertilizerAdvice: String
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  completionDate: Date
}, {
  timestamps: true
});

soilTestSchema.pre("save", async function (next) {
  if (!this.sampleId) {
    const count = await mongoose.model("SoilTest").countDocuments();
    this.sampleId = `ST-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("SoilTest", soilTestSchema);