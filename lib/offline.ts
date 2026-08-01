import AsyncStorage from '@react-native-async-storage/async-storage';
export async function cacheQueue(queue:unknown[]){await AsyncStorage.setItem('cached_queue',JSON.stringify(queue));await AsyncStorage.setItem('cache_date',new Date().toISOString().slice(0,10));}
export async function getCachedQueue(){const data=await AsyncStorage.getItem('cached_queue');return data?JSON.parse(data):[];}
