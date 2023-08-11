import { ObjectId, Filter } from "mongodb";
import { SessionData } from "express-session";

import ConceptDb, { ConceptBase } from "./conceptDb";
import { getParamNames } from "./utils";

export type Action = {
  action: Function,
  validators: Function[]
};

export type Session = Partial<SessionData>;

export class HttpError extends Error {
  constructor(public readonly code: number, public readonly message: string) {
    super(message);
    this.code = code;
  }
}

export default class Concept<Schema extends ConceptBase, Db extends ConceptDb<Schema> = ConceptDb<Schema>> {
  public readonly name: string;
  private readonly actions: Record<string, Action> = {};

  constructor(public readonly db: Db) {
    this.name = db.name;
  }

  public action(name: string): Action {
    if (!(name in this.actions)) {
      throw new Error(`Action ${name} does not exist in ${this.name} concept!`);
    }
    return this.actions[name];
  }

  public defineAction(name: string, action: Function, validators: Function[] = []): void {
    if (name in this.actions) {
      throw new Error(`Action ${name} already defined in ${this.name} concept!`);
    }
    this.actions[name] = { action, validators };
  }

  public async act(name: string, args: Record<string, any>) {
    // TODO: Refactor this (kindly).

    const action = this.action(name);
    for (const validator of action.validators) {
      const vArgs = getParamNames(validator).map(param => {
        if (!(param in args)) {
          throw new Error(`[${this.name}.act(${name})]: validator ${validator} has parameter '${param}' but args doesn't contain it.`)
        }
        return args[param];
      });
      let res = validator.apply(null, vArgs);
      if (res instanceof Promise) {
        res = await res;
      }
    }

    const vArgs = getParamNames(action.action).map(param => {
      if (!(param in args)) {
        throw new Error(`[${this.name}.act(${name})]: action has parameter '${param}' but args doesn't contain it.`)
      }
      return args[param];
    });

    let res = action.action.apply(null, vArgs);
    if (res instanceof Promise) {
      res = await res;
    }
    return res;
  }

  public readonly utilActions = {
    create: async (document: Schema) => {
      const _id = (await this.db.createOne(document)).insertedId;
      return { document: { ...document, _id } };
    },

    read: async (query: Filter<Schema>) => {
      const documents = await this.db.readMany(query, {
        'sort': { dateUpdated: -1 }
      });
      return { documents };
    },

    update: async (_id: string, update: Partial<Schema>) => {
      const id = new ObjectId(_id);
      await this.db.updateOneById(id, update);
      return { document: await this.db.readOneById(id) };
    },

    delete: async (_id: string) => {
      const id = new ObjectId(_id);
      return { document: await this.db.popOneById(id) };
    }
  };
}
