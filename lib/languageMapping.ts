import type {SupportedLanguage} from '../types/problem';
export function judgeLanguageEnv(language:SupportedLanguage){return language==='python'?'JUDGE_LANG_PYTHON_ID':language==='cpp'?'JUDGE_LANG_CPP_ID':'JUDGE_LANG_JAVA_ID'}
