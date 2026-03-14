import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    failedLoginAttempts: number;
    lockUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        failedLoginAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Check if account is currently locked
UserSchema.methods.isLocked = function (): boolean {
    if (this.lockUntil && this.lockUntil > new Date()) {
        return true;
    }
    return false;
};

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
