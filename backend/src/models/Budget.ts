import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { EXPENSE_CATEGORIES } from "../config/constants";

export interface IBudget extends Document {
  userId: Types.ObjectId;
  category: string | null;
  amount: number;
  thresholds: number[];
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, enum: [...EXPENSE_CATEGORIES, null], default: null },
    amount: { type: Number, required: true, min: 0 },
    thresholds: {
      type: [Number],
      default: [50, 75, 90, 100],
      validate: {
        validator: (arr: number[]) => arr.every((t) => t > 0 && t <= 200),
        message: "Thresholds must be between 1 and 200 percent",
      },
    },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

BudgetSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

export const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);
