import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (mongoose.connections[0].readyState) {
            return true;
        }

        const mongoUri = process.env.DB_URI || "";
        await mongoose.connect(mongoUri);
        console.log("Successfully connected to MongoDB!");
        return true;
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
};

export default connectDB;
