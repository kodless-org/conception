import { ConceptBase } from "../conceptDb";

export interface Friend extends ConceptBase {
  userId: string;
  friendIds: string[];
}

export interface FriendRequest extends ConceptBase {
  fromId: string;
  toId: string;
  status: "pending" | "rejected" | "accepted";
}

// class FriendConcept extends Concept
