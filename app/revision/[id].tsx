import {Redirect,useLocalSearchParams} from 'expo-router';export default function LegacyRevision(){const {id}=useLocalSearchParams<{id:string}>();return <Redirect href={`/revision/${id}/review`}/>}
