import mongoose from 'mongoose';

/**
 * A funded local business the community pool has backed.
 */
const fundedBusinessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nameHi: { type: String, default: '' },
    city: { type: String, default: '' },
    category: { type: String, default: 'other' },
    amountFunded: { type: Number, required: true }, // paise
    monthlyReturnPercent: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'repaid', 'defaulted'], default: 'active' },
    fundedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

/**
 * Singleton document holding the community fund. `totalUnits` tracks the
 * denominator for every user's share percentage.
 */
const poolSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    balance: { type: Number, default: 0 }, // uninvested paise sitting in the fund
    totalContributed: { type: Number, default: 0 },
    totalUnits: { type: Number, default: 0 },
    totalReturns: { type: Number, default: 0 },
    businesses: { type: [fundedBusinessSchema], default: [] },
  },
  { timestamps: true },
);

poolSchema.statics.getMain = async function getMain() {
  let pool = await this.findOne({ key: 'main' });
  if (!pool) pool = await this.create({ key: 'main' });
  return pool;
};

export const Pool = mongoose.model('Pool', poolSchema);
