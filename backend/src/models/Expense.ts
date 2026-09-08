import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, EXPENSE_SOURCES } from "../config/constants";

export interface IExpense extends Document {
  userId: Types.ObjectId;
  amount: number;
  merchant: string;
  category: string;
  subcategory?: string;
  date: Date;
  paymentMethod?: string;
  description?: string;
  receiptUrl?: string;
  source: string;
  aiCategorized: boolean;
  aiConfidence?: number;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    merchant: {
      type: String,
      required: [true, "Merchant is required"],
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      required: true,
      enum: EXPENSE_CATEGORIES,
    },
    subcategory: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: EXPENSE_SOURCES,
      default: "manual",
    },
    aiCategorized: {
      type: Boolean,
      default: false,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    isRecurring: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Common query shapes: a user's expenses in a date range, or by category.
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1 });

ExpenseSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);
