export type Platform = 'LeetCode' | 'Codeforces' | 'CodeChef';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Unknown';
export type SupportedLanguage = 'python' | 'cpp' | 'java';
export interface ProblemCatalogItem { id:string; platform:Platform; externalId?:string|null; slug:string; title:string; difficulty:Difficulty; topics:string[]; url:string }
export interface ProblemSearchResponse { items:ProblemCatalogItem[]; query:string; platform:Platform; hasMore:boolean }
export interface AddSolvedProblemInput { catalogProblemId?:string; name:string; platform:Platform; difficulty:Exclude<Difficulty,'Unknown'>; topic:string; subtopic:string; pattern:string; url?:string; solvedDate:string; language:SupportedLanguage; sourceCode:string; explanation?:string; timeComplexity?:string; spaceComplexity?:string }
