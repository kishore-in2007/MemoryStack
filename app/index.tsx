import { Redirect } from 'expo-router';import { useStore } from '../store/useStore';
export default function Index(){return <Redirect href={useStore(s=>s.user)?'/(tabs)':'/(auth)/login'}/>}
