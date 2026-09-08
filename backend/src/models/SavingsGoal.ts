import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface ISavingsGoal extends Document {
  userId: Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    targetAmount: { type: Number, required: true, min: 0.01 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date },
  },
  { timestamps: true }
);

SavingsGoalSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    delete ret.__v;
    return ret;
  },
});

export const SavingsGoal: Model<ISavingsGoal> =
  mongoose.models.SavingsGoal || mongoose.model<ISavingsGoal>("SavingsGoal", SavingsGoalSchema);
