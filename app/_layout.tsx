import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useStore } from '../store/useStore';
import { registerForNotifications } from '../lib/notifications';
import { COLORS } from '../constants/topics';
export default function RootLayout(){const hydrated=useStore(s=>s.hydrated),hydrate=useStore(s=>s.hydrate),revisions=useStore(s=>s.revisions),hour=useStore(s=>s.notificationHour);useEffect(()=>{hydrate()},[]);useEffect(()=>{if(!hydrated)return;const due=revisions.filter(x=>x.status!=='completed'&&x.due_date<=new Date().toISOString().slice(0,10)).length;registerForNotifications(hour,due).catch(()=>{});const sub=Notifications.addNotificationResponseReceivedListener(()=>router.push('/(tabs)/queue'));return()=>sub.remove()},[hydrated,hour]);if(!hydrated)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:COLORS.bg}}><ActivityIndicator size="large" color={COLORS.primary}/></View>;return <Stack screenOptions={{headerStyle:{backgroundColor:'#fff'},headerTintColor:COLORS.ink,headerShadowVisible:false}}><Stack.Screen name="index" options={{headerShown:false}}/><Stack.Screen name="(auth)" options={{headerShown:false}}/><Stack.Screen name="(tabs)" options={{headerShown:false}}/><Stack.Screen name="revision/[id]" options={{title:'Revision session'}}/><Stack.Screen name="revision/result" options={{title:'Performance'}}/></Stack>}
