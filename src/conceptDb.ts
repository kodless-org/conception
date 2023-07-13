import {
  Collection, Document, Filter,
  OptionalUnlessRequiredId, WithId,
  FindOptions, BulkWriteOptions, DeleteOptions,
  InsertOneResult, InsertManyResult, DeleteResult, CountDocumentsOptions 
} from "mongodb";

import db from "db";

export default class ConceptDb<Schema extends Document> {
  private readonly collection: Collection<Schema>;
  constructor(public readonly name: string) {
    this.collection = db.collection(name);
  }

  async createOne(item: OptionalUnlessRequiredId<Schema>): Promise<InsertOneResult> {
    return await this.collection.insertOne(item);
  }

  async createMany(items: OptionalUnlessRequiredId<Schema>[], options?: BulkWriteOptions): Promise<InsertManyResult> {
    return await this.collection.insertMany(items, options);
  }

  async readOne(filter: Filter<Schema>, options?: FindOptions): Promise<WithId<Schema> | null> {
    return await this.collection.findOne<WithId<Schema>>(filter, options);
  }

  async readMany(filter: Filter<Schema>, options?: FindOptions): Promise<WithId<Schema>[]> {
    return await this.collection.find<WithId<Schema>>(filter, options).toArray();
  }

  async deleteOne(filter: Filter<Schema>, options?: DeleteOptions): Promise<DeleteResult> {
    return await this.collection.deleteOne(filter, options);
  }

  async deleteMany(filter: Filter<Schema>, options?: DeleteOptions): Promise<DeleteResult> {
    return await this.collection.deleteMany(filter, options);
  }

  async count(filter: Filter<Schema>, options?: CountDocumentsOptions): Promise<number> {
    return await this.collection.countDocuments(filter, options);
  }
}