import FreetConcept, { FreetDoc } from "./concepts/freet";
import FriendConcept, { FriendRequestDoc, FriendshipDoc } from "./concepts/friend";
import UserConcept, { UserDoc } from "./concepts/user";
import WebSessionConcept from "./concepts/websession";
import DocCollection from "./framework/doc";

// App Definition using concepts
export const WebSession = new WebSessionConcept({});
export const User = new UserConcept({ users: new DocCollection<UserDoc>("users") });
export const Freet = new FreetConcept({ freets: new DocCollection<FreetDoc>("freets") });
export const Friend = new FriendConcept({
  friends: new DocCollection<FriendshipDoc>("friends"),
  requests: new DocCollection<FriendRequestDoc>("friendRequests"),
});
