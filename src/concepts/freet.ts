import ConceptDb from "../conceptDb";
import WebConcept from "../conceptRouter";

interface Freet {
  author: string;
  content: string;
}

const freet = new ConceptDb<Freet>("freet");

export default freet;