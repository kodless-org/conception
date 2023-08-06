import express from "express";
import { Request, Response, RequestHandler } from "express";
import { ObjectId, Filter } from "mongodb";
import ConceptDb, { ConceptBase } from "./conceptDb";
import { makeRoute } from "./decorators";
import { SessionData } from "express-session";

export type Validator = RequestHandler;
export type Action = Function;

export type Session = Partial<SessionData>;

export type ActionOptions = {
  'validate'?: Validator[],
};

export default class ConceptRouter<Schema extends ConceptBase, Db extends ConceptDb<Schema> = ConceptDb<Schema>> {
  public readonly name: string;
  public readonly router = express.Router();
  private readonly actions: Record<string, RequestHandler> = {};
  private readonly options: Record<string, ActionOptions> = {};
  private readonly syncs: Record<string, Action[]> = {};

  constructor(public readonly db: Db) {
    this.name = db.name;
  }

  public action(name: string): Action {
    if (!(name in this.actions)) {
      throw new Error(`Action ${name} does not exist in ${this.name} concept!`);
    }
    return this.actions[name];
  }

  public defineAction(name: string, action: Action, options?: ActionOptions): void {
    if (name in this.actions) {
      throw new Error(`Action ${name} already defined in ${this.name} concept!`);
    }
    this.actions[name] = makeRoute(action);
    if (options) this.options[name] = options;
  }

  public sync(name: string, action: Action): void {
    if (!(name in this.syncs)) this.syncs[name] = [];
    this.syncs[name].push(action);
  }

  public handlers(name: string): RequestHandler[] {
    if (!(name in this.actions)) {
      throw new Error(`Action ${name} is not defined!`);
    }
    const handlers = [];
    if (name in this.options) {
      handlers.push(...this.options[name].validate || []);
    }
    handlers.push(this.actions[name]);
    return handlers;
  }

  /**
   * Defines action "create":
   * 
   * @matches
   *  - `req.document`: Document to create.
   * @affects
   *  - Create the given document.
   * @returns JSON with following fields:
   *  - `document`: Created document, including its `_id` field.
   */
  public defineCreateAction(options?: ActionOptions) {
    this.defineAction('create', async (document: Schema) => {
      const _id = (await this.db.createOne(document)).insertedId;
      return { document: { ...document, _id } };
    }, options);
  }

  /**
   * Defines action "read":
   * 
   * @requires
   *  - `req.query`: Filter for documents to read (@see https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/query-document/#specify-a-query)
   * @affects Nothing.
   * @returns JSON with following fields:
   *  - `documents`: All matching documents sorted in order of `dateUpdated` (newest first).
   */
  public defineReadAction(options?: ActionOptions) {
    this.defineAction('read', async (query: Filter<Schema>) => {
      const documents = await this.db.readMany(query, {
        'sort': { dateUpdated: -1 }
      });
      return { documents };
    }, options);
  }

  /**
   * Defines action "update":
   * 
   * @requires
   *  - `req.params._id`: ID of the document to update
   *  - `req.body.partialDocument`: Patch to the document.
   * @affects
   *  - Update fields in `req.body.partialDocument` in document with id `req.params._id`
   *    with given new values.
   * @returns JSON with following fields:
   *  - `document`: Updated document.
   */
  public defineUpdateAction(options?: ActionOptions) {
    this.defineAction('update', async (_id: string, update: Partial<Schema>) => {
      const id = new ObjectId(_id);
      await this.db.updateOneById(id, update);
      return { document: await this.db.readOneById(id) };
    }, options);
  }

  /**
   * Defines action "delete":
   * 
   * @requires
   *  - `req.params._id`: ID of the document to delete
   * @affects
   *  - Delete document with given id.
   * @returns JSON with following fields:
   *  - `document`: Deleted document or null if it was not found.
   */
  public defineDeleteAction(options?: ActionOptions) {
    this.defineAction('delete', async (_id: string) => {
      const id = new ObjectId(_id);
      return { document: await this.db.popOneById(id) };
    }, options);
  }
}