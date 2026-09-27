import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    titleHi: { type: String, default: '' },
    description: { type: String, default: '' },
    descriptionHi: { type: String, default: '' },
    price: { type: Number, required: true }, // in paise
    mrp: { type: Number, default: 0 }, // in paise, for strike-through display
    currency: { type: String, default: 'INR' },
    category: {
      type: String,
      enum: ['grocery', 'fashion', 'electronics', 'home', 'beauty', 'farm', 'other'],
      default: 'other',
      index: true,
    },
    images: { type: [String], default: [] },
    stock: { type: Number, default: 0 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    city: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    cashbackPercent: { type: Number, default: 2 }, // credited to the buyer's wallet
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ title: 'text', description: 'text' });

export const Product = mongoose.model('Product', productSchema);
