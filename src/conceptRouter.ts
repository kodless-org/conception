import express from "express";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { OptionalUnlessRequiredId, Document, ObjectId, Filter, BulkWriteOptions } from "mongodb";
import ConceptDb, { ConceptBase } from "./conceptDb";

export type RequestFinalHandler = RequestHandler; // no next()

export type Validator = RequestHandler;
export type Action = RequestFinalHandler;

export type ActionOptions = {
  'validate'?: Validator[],
};

export default class ConceptRouter<Schema extends ConceptBase, Db extends ConceptDb<Schema> = ConceptDb<Schema>> {
  public readonly name: string;
  public readonly router = express.Router();
  private readonly actions: Record<string, Action>;
  private readonly options: Record<string, ActionOptions>;
  private readonly syncs: Record<string, Action[]>;

  constructor(public readonly db: Db) {
    this.name = db.name;
    this.actions = this.options = this.syncs = {};
  }

  public action(name: string): Action {
    if (!(name in this.actions)) {
      throw new Error(`Action ${name} does not exist in ${this.name} concept!`);
    }
    return this.actions[name];
  }

  public defineAction(name: string, action: RequestFinalHandler, options?: ActionOptions): void {
    if (name in this.actions) {
      throw new Error(`Action ${name} already defined in ${this.name} concept!`);
    }
    this.actions[name] = action;
    if (options) this.options[name] = options;
  }

  public sync(actionName: string, action: Action): void {
    if (!(actionName in this.syncs)) this.syncs[actionName] = [];
    this.syncs[actionName].push(action);
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
    this.defineAction('create', async (req: Request, res: Response) => {
      const document = req.body.document as Schema;
      document.dateCreated = document.dateUpdated = new Date();
      const _id = (await this.db.createOne(document)).insertedId;
      res.json({ document: { _id, ...document } });
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
    this.defineAction('read', async (req: Request, res: Response) => {
      const filter = req.query.filter as Filter<Schema>;
      const documents = await this.db.readMany(filter, {
        'sort': {dateUpdated: -1}
      });
      res.json({ documents });
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
    this.defineAction('update', async (req: Request, res: Response) => {
      const update = req.body.partialDocument as Partial<Schema>;
      const _id = new ObjectId(req.params._id);
      await this.db.updateOneById(_id, update);
      const document = await this.db.readOneById(_id);
      res.json({ document });
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
    this.defineAction('delete', async (req: Request, res: Response) => {
      const _id = new ObjectId(req.params._id);
      const document = await this.db.popOneById(_id);
      res.json({ document });
    }, options);
  }
}