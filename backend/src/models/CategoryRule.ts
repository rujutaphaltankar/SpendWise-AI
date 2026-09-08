import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { EXPENSE_CATEGORIES } from "../config/constants";

export interface ICategoryRule extends Document {
  userId: Types.ObjectId;
  merchantKey: string;
  category: string;
  timesConfirmed: number;
  updatedAt: Date;
}

const CategoryRuleSchema = new Schema<ICategoryRule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    merchantKey: { type: String, required: true, trim: true, lowercase: true },
    category: { type: String, required: true, enum: EXPENSE_CATEGORIES },
    timesConfirmed: { type: Number, default: 1 },
  },
  { timestamps: true }
);

CategoryRuleSchema.index({ userId: 1, merchantKey: 1 }, { unique: true });

export const CategoryRule: Model<ICategoryRule> =
  mongoose.models.CategoryRule ||
  mongoose.model<ICategoryRule>("CategoryRule", CategoryRuleSchema);
