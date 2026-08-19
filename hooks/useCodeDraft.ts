import {useEffect,useRef,useState} from 'react';
import type {SupportedLanguage} from '../types/problem';
import {loadDraft,saveDraft} from '../services/draftService';
export function useCodeDraft(id:string,language:SupportedLanguage,starter=''){
  const [source,setSource]=useState(starter),[loaded,setLoaded]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>{let live=true;setLoaded(false);loadDraft(id,language).then(v=>{if(live){setSource(v??starter);setLoaded(true)}});return()=>{live=false}},[id,language,starter]);
  useEffect(()=>{if(!loaded)return;clearTimeout(timer.current);timer.current=setTimeout(()=>saveDraft(id,language,source),400);return()=>clearTimeout(timer.current)},[id,language,source,loaded]);
  return{source,setSource,loaded};
}
