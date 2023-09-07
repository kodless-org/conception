import {
  BulkWriteOptions,
  Collection,
  CountDocumentsOptions,
  DeleteOptions,
  DeleteResult,
  Document,
  Filter,
  FindOneAndUpdateOptions,
  FindOptions,
  InsertManyResult,
  InsertOneResult,
  ObjectId,
  OptionalUnlessRequiredId,
  ReplaceOptions,
  UpdateResult,
  WithoutId,
} from "mongodb";

import db from "../db";

export interface CollectionBase {
  _id: ObjectId;
  dateCreated: Date;
  dateUpdated: Date;
}

export type WithoutBase<T extends CollectionBase> = Omit<T, keyof CollectionBase>;

export default class ConceptDb<Schema extends CollectionBase> {
  protected readonly collection: Collection<Schema>;

  constructor(public readonly name: string) {
    this.collection = db.collection(name);
  }

  /**
   * This method removes "illegal" fields from an item
   * so the client cannot fake them.
   */
  private sanitize(item: Partial<Schema>) {
    delete item._id;
    delete item.dateCreated;
    delete item.dateUpdated;
  }

  async createOne(item: Partial<Schema>): Promise<InsertOneResult> {
    this.sanitize(item);
    item.dateCreated = new Date();
    item.dateUpdated = new Date();
    return await this.collection.insertOne(item as OptionalUnlessRequiredId<Schema>);
  }

  async createMany(items: Partial<Schema>[], options?: BulkWriteOptions): Promise<InsertManyResult> {
    items.forEach((item) => {
      this.sanitize(item);
      item.dateCreated = new Date();
      item.dateUpdated = new Date();
    });
    return await this.collection.insertMany(items as OptionalUnlessRequiredId<Schema>[], options);
  }

  async readOne(filter: Filter<Schema>, options?: FindOptions): Promise<Schema | null> {
    return await this.collection.findOne<Schema>(filter, options);
  }

  async readOneById(_id: ObjectId | string, options?: FindOptions): Promise<Schema | null> {
    return await this.readOne({ _id: new ObjectId(_id) } as Filter<Schema>, options);
  }

  async readMany(filter: Filter<Schema>, options?: FindOptions): Promise<Schema[]> {
    return await this.collection.find<Schema>(filter, options).toArray();
  }

  async replaceOne(filter: Filter<Schema>, item: Partial<Schema>, options?: ReplaceOptions): Promise<UpdateResult<Schema> | Document> {
    this.sanitize(item);
    return await this.collection.replaceOne(filter, item as WithoutId<Schema>, options);
  }

  async replaceOneById(_id: ObjectId | string, item: Partial<Schema>, options?: ReplaceOptions): Promise<UpdateResult<Schema> | Document> {
    this.sanitize(item);
    return await this.collection.replaceOne({ _id: new ObjectId(_id) } as Filter<Schema>, item as WithoutId<Schema>, options);
  }

  async updateOne(filter: Filter<Schema>, update: Partial<Schema>, options?: FindOneAndUpdateOptions): Promise<UpdateResult<Schema>> {
    this.sanitize(update);
    update.dateUpdated = new Date();
    return await this.collection.updateOne(filter, { $set: update }, options);
  }

  async updateOneById(_id: ObjectId | string, update: Partial<Schema>, options?: FindOneAndUpdateOptions): Promise<UpdateResult<Schema>> {
    this.sanitize(update);
    update.dateUpdated = new Date();
    return await this.collection.updateOne({ _id: new ObjectId(_id) } as Filter<Schema>, { $set: update }, options);
  }

  async deleteOne(filter: Filter<Schema>, options?: DeleteOptions): Promise<DeleteResult> {
    return await this.collection.deleteOne(filter, options);
  }

  async deleteOneById(_id: ObjectId | string, options?: DeleteOptions): Promise<DeleteResult> {
    return await this.collection.deleteOne({ _id: new ObjectId(_id) } as Filter<Schema>, options);
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
    await this.deleteOne({ _id: one._id } as Filter<Schema>);
    return one;
  }

  async popOneById(_id: ObjectId | string): Promise<Schema | null> {
    return this.popOne({ _id: new ObjectId(_id) } as Filter<Schema>);
  }
}
