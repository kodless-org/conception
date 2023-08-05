Thoughts during the development, mainly self-dialogue

---

### Concern
I have pre-defined methods like `defineCreateAction`. Let's say we want to use this for `Freet` concept. Now the API would require the client to send `author` in the request body so this can work. Technically, this is not required: the logged in user is already stored in session. Is this good or bad?

### Thoughts
Let's see pros and cons.
- Pro: This actually could be a feature in an app where one can make posts on behalf of others (then you just need to validate this process).
- Con: Client is more verbose by sending info that's already known.
- Pro: Client is more verbose?
  - Reading code might be easier 🧐

### Decision
Keep the feature, con is not strong enough.

---