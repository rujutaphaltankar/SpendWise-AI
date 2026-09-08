import mongoose, { Document, Schema, Model, Types } from "mongoose";
import { INCOME_SOURCES } from "../config/constants";

export interface IIncome extends Document {
  userId: Types.ObjectId;
  amount: number;
  source: string;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema = new Schema<IIncome>(
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
    source: {
      type: String,
      enum: INCOME_SOURCES,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

IncomeSchema.index({ userId: 1, date: -1 });

IncomeSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

export const Income: Model<IIncome> =
  mongoose.models.Income || mongoose.model<IIncome>("Income", IncomeSchema);
