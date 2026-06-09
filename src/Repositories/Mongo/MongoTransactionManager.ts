import mongoose, { ClientSession } from "mongoose";
import { ITransactionManager } from "../Interfaces/ITransactionManager.js";
import logger from "../../Config/logger.config.js"; 

export class MongoTransactionManager implements ITransactionManager {
    
    public async withTransaction<T>(callback: (options: { session: ClientSession }) => Promise<T>): Promise<T> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const result = await callback({ session });
            await session.commitTransaction();
            
            return result;
        } catch (error) {
            await session.abortTransaction();
            logger.error("Transaction aborted due to error:", error);
            throw error; 
        } finally {
            await session.endSession();
        }
    }
}