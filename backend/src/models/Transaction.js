import mongoose from 'mongoose';

/**
 * One row per money movement. A purchase creates a parent `purchase` row plus
 * child rows for each leg of the split, so the ledger always reconciles.
 */
const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['purchase', 'seller_payout', 'referral_bonus', 'pool_contribution', 'cashback', 'topup', 'pool_payout'],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true }, // in paise, always positive
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // who this leg credits/debits
    direction: { type: String, enum: ['credit', 'debit'], required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', index: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    note: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
