import { DocumentAttributeValue } from "./utils/kendraTypes";
export const PAGE_SIZE = 25;

export const CHARACTER_WIDTH = 13;

export const COLLAPSED_LINES = 2;

export const FAQ_MATCHES = "Kendra found questions like yours";

export interface FAQExpandedMapType {
  expanded: boolean;
}

export enum QueryResultType {
  All = "ALL",
  Answer = "ANSWER",
  QuestionAnswer = "QUESTION_ANSWER",
  Document = "DOCUMENT"
}

export enum DocumentAttributeKeys {
  Author = "Author",
  Category = "Category",
  CreatedAt = "CreatedAt",
  Format = "FileFormat",
  SourceUri = "SourceURI",
  UpdatedAt = "UpdatedAt",
  Version = "Version"
}

export type AttributeMap = {
  [key in DocumentAttributeKeys]: DocumentAttributeValue
};

export enum AdditionalResultAttributeKeys {
  QuestionText = "QuestionText",
  AnswerText = "AnswerText"
}

export type AdditionalResultAttributeMap = {
  [key in AdditionalResultAttributeKeys]: {};
};

export enum Relevance {
  Relevant = "RELEVANT",
  NotRelevant = "NOT_RELEVANT"
}

export const ROLE_MAPPING = [
  "Intake Staff",
  "PA Staff",
  "Admin",
  "Registered Nurse",
  "Medical Doctor",
];

export const MENUS = {
  "overview": "INTAKE",
  "member": "PA CASE INFO/ADMIN CHECK",
  // "outreach":"ADMIN CHECK STATUS",
  "clinical":"RN REVIEW",
  "doctor":"MD REVIEW",
  "initiate":"STATUS & NOTIFICATION",
  "archive":"HISTORY",
}
 {/* <Menu.Item key="overview">OVERVIEW</Menu.Item>
          <Menu.Item key="initiate">AUTHORIZATION INTAKE</Menu.Item>
          <Menu.Item key="member">MEMBER&amp;CLAIM INFO</Menu.Item>       
          <Menu.Item key="clinical">RN REVIEW</Menu.Item>
          <Menu.Item key="doctor">MD REVIEW</Menu.Item> 
           <Menu.Item key="outreach">FINAL DECISION</Menu.Item>
          <Menu.Item key="archive">ARCHIVE</Menu.Item> */}
          // <Menu.Item key="overview">INTAKE</Menu.Item>
          // <Menu.Item key="member">PA CASE INFO/ROUTING</Menu.Item>
          // <Menu.Item key="outreach">ADMIN CHECK STATUS</Menu.Item>
          // <Menu.Item key="clinical">RN REVIEW</Menu.Item>
          // <Menu.Item key="doctor">MD REVIEW</Menu.Item>
          // <Menu.Item key="initiate">STATUS&amp;NOTIFICATION</Menu.Item>
          // <Menu.Item key="archive">HISTORY</Menu.Item>

export const ROLE_MENUE_MAPPING = {
  "Intake Staff":["overview","member"],
  "PA Staff": ["overview", "member",],
  // "PA Staff": ["overview", "member", "outreach",],
  // "Admin": ["overview", "member", "outreach", "clinical", "doctor", "initiate", "archive"],
  "Admin":[ "overview","member","clinical","doctor","initiate","archive"],
  "Registered Nurse":["clinical","initiate", "archive"],
  "Medical Doctor":["clinical","doctor","initiate", "archive",],
}



export const BACKEND_HOST = ""
export const USER_LOGIN = ""

export const TOPIC_ANALYSIS = ""
export const RELATIONSHIP = ""


export const PA_HOST_EMAIL = ""



export const PWC_LOGIN_URL ="";
// export const PA_HOST = "https://uoz8c451m1.execute-api.us-west-2.amazonaws.com/dev/cases"
export const PA_HOST = ""


export const TRIAL_URL = "https://xnsyichzuf.execute-api.us-east-2.amazonaws.com/dev/trial"
export const criteria_url="https://xnsyichzuf.execute-api.us-east-2.amazonaws.com/dev/gwcase-support"