export interface ITransactionManager {
    /**
     * Executes a callback function within a database transaction.
     * @param callback - The operations to perform. Receives options (like the session) to pass to repositories.
     */
    withTransaction<T>(callback: (options: unknown) => Promise<T>): Promise<T>;
}