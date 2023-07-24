import {
  Collection, Document,
  Filter, UpdateFilter,
  OptionalUnlessRequiredId, WithoutId,
  FindOptions, BulkWriteOptions, DeleteOptions, UpdateOptions, FindOneAndUpdateOptions, CountDocumentsOptions,
  InsertOneResult, InsertManyResult, DeleteResult, UpdateResult, ReplaceOptions, ObjectId
} from "mongodb";

import db from "./db";

export interface ConceptBase extends Document {
  _id?: ObjectId;
  dateCreated: Date;
  dateUpdated: Date;
};

export default class ConceptDb<Schema extends ConceptBase> {
  protected readonly collection: Collection<Schema>;

  constructor(public readonly name: string) {
    this.collection = db.collection(name);
  }

  async createOne(item: Schema): Promise<InsertOneResult> {
    return await this.collection.insertOne(item as OptionalUnlessRequiredId<Schema>);
  }

  async createMany(items: Schema[], options?: BulkWriteOptions): Promise<InsertManyResult> {
    return await this.collection.insertMany(items as OptionalUnlessRequiredId<Schema>[], options);
  }

  async readOne(filter: Filter<Schema>, options?: FindOptions): Promise<Schema | null> {
    return await this.collection.findOne<Schema>(filter, options);
  }

  async readOneById(_id: ObjectId, options?: FindOptions): Promise<Schema | null> {
    return await this.readOne({_id} as Filter<Schema>, options);
  }

  async readMany(filter: Filter<Schema>, options?: FindOptions): Promise<Schema[]> {
    return await this.collection.find<Schema>(filter, options).toArray();
  }

  async replaceOne(filter: Filter<Schema>, item: WithoutId<Schema>, options?: ReplaceOptions): Promise<UpdateResult<Schema> | Document> {
    return await this.collection.replaceOne(filter, item, options);
  }

  async replaceOneById(_id: ObjectId, item: WithoutId<Schema>, options?: ReplaceOptions): Promise<UpdateResult<Schema> | Document> {
    return await this.collection.replaceOne({_id} as Filter<Schema>, item, options);
  }
  
  async updateOne(filter: Filter<Schema>, update: UpdateFilter<Schema>, options?: FindOneAndUpdateOptions): Promise<UpdateResult<Schema>> {
    return await this.collection.updateOne(filter, update, options);
  }

  async updateOneById(_id: ObjectId, update: UpdateFilter<Schema>, options?: FindOneAndUpdateOptions): Promise<UpdateResult<Schema>> {
    return await this.collection.updateOne({_id} as Filter<Schema>, update, options);
  }

  async updateMany(filter: Filter<Schema>, update: UpdateFilter<Schema>, options?: UpdateOptions): Promise<UpdateResult<Schema>> {
    return await this.collection.updateMany(filter, update, options);
  }

  async deleteOne(filter: Filter<Schema>, options?: DeleteOptions): Promise<DeleteResult> {
    return await this.collection.deleteOne(filter, options);
  }

  async deleteOneById(_id: ObjectId, options?: DeleteOptions): Promise<DeleteResult> {
    return await this.collection.deleteOne({_id} as Filter<Schema>, options);
  }

  async deleteMany(filter: Filter<Schema>, options?: DeleteOptions): Promise<DeleteResult> {
    return await this.collection.deleteMany(filter, options);
  }

  async count(filter: Filter<Schema>, options?: CountDocumentsOptions): Promise<number> {
    return await this.collection.countDocuments(filter, options);
  }

  async popOne(filter: Filter<Schema>): Promise<Schema | null> {
    const one = await this.readOne(filter);
    if (one === null) {
      return null;
    }
    await this.deleteOne({_id: one._id} as Filter<Schema>);
    return one;
  }

  async popOneById(_id: ObjectId): Promise<Schema | null> {
    return this.popOne({_id} as Filter<Schema>);
  }
}