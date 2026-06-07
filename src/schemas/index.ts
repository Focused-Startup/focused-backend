import { userTypeDefs } from "./user";
import { noteTypeDefs } from "./note";
import { goalTypeDefs } from "./goal";
import { userRelationshipTypeDefs } from "./userRelationship";
import { questionTypeDefs } from "./question";
import { responseTypeDefs } from "./response";
import { canvasUserRelationshipTypeDefs } from "./canvasUserRelationship";
import { canvasTypeDefs } from "./canvas";

export const typeDefs = [
    userTypeDefs,
    noteTypeDefs,
    goalTypeDefs,
    userRelationshipTypeDefs,
    questionTypeDefs,
    responseTypeDefs,
    canvasUserRelationshipTypeDefs,
    canvasTypeDefs,
];