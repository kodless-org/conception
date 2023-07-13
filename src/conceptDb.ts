import {
  Collection, Document,
  Filter, UpdateFilter,
  OptionalUnlessRequiredId, WithId, WithoutId,
  FindOptions, BulkWriteOptions, DeleteOptions, UpdateOptions, FindOneAndUpdateOptions, CountDocumentsOptions,
  InsertOneResult, InsertManyResult, DeleteResult, UpdateResult, ReplaceOptions
} from "mongodb";

import db from "./db";

export default class ConceptDb<Schema extends Document> {
  protected readonly collection: Collection<Schema>;

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

  async replaceOne(filter: Filter<Schema>, item: WithoutId<Schema>, options?: ReplaceOptions): Promise<UpdateResult<Schema> | Document> {
    return await this.collection.replaceOne(filter, item, options);
  }

  async updateOne(filter: Filter<Schema>, update: UpdateFilter<Schema>, options: FindOneAndUpdateOptions): Promise<UpdateResult> {
    return await this.collection.updateOne(filter, update, options);
  }

  async updateMany(filter: Filter<Schema>, update: UpdateFilter<Schema>, options?: UpdateOptions): Promise<UpdateResult> {
    return await this.collection.updateMany(filter, update, options);
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

  async popOne(filter: Filter<Schema>): Promise<WithId<Schema> | null> {
    const one = await this.readOne(filter);
    if (one === null) {
      return null;
    }
    await this.deleteOne({_id: one._id} as Filter<Schema>);
    return one;
  }
}