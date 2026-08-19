import AsyncStorage from '@react-native-async-storage/async-storage';import type {SupportedLanguage} from '../types/problem';import {isDraftFresh} from '../lib/draftExpiry';
const key=(id:string,language:SupportedLanguage)=>`compiler-draft:${id}:${language}`;
export async function loadDraft(id:string,language:SupportedLanguage){const raw=await AsyncStorage.getItem(key(id,language));if(!raw)return null;try{const value=JSON.parse(raw) as {source:string;savedAt:number};if(!isDraftFresh(value.savedAt)){await AsyncStorage.removeItem(key(id,language));return null}return value.source}catch{return null}}
export async function saveDraft(id:string,language:SupportedLanguage,source:string){await AsyncStorage.setItem(key(id,language),JSON.stringify({source,savedAt:Date.now()}))}
export async function clearDrafts(id:string){await Promise.all((['python','cpp','java'] as SupportedLanguage[]).map(l=>AsyncStorage.removeItem(key(id,l))))}
