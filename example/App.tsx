import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  ToastAndroid,
  Platform,
  NativeEventEmitter,
  NativeModules,
  AppState,
} from 'react-native';
import ReactNativeAN from 'react-native-alarm-notification';

const {RNAlarmNotification} = NativeModules;
const RNEmitter = new NativeEventEmitter(RNAlarmNotification);

const alarmNotifData = {
  title: 'Alarm',
  message: 'Stand up',
  vibrate: true,
  play_sound: true,
  schedule_type: 'once',
  channel: 'wakeup',
  data: {content: 'my notification id is 22'},
  loop_sound: true,
  has_button: true,
};

const repeatAlarmNotifData = {
  title: 'Alarm',
  message: 'Stand up',
  vibrate: true,
  play_sound: true,
  channel: 'wakeup',
  data: {content: 'my notification id is 22'},
  loop_sound: true,
  schedule_type: 'repeat',
  repeat_interval: 'minutely',
  interval_value: 5, // repeat after 5 minutes
};

interface AlarmUpdate {
  date: string;
  id: string;
}

const App: React.FC = () => {
  const [fireDate, setFireDate] = useState<string>(
    ReactNativeAN.parseDate(new Date(Date.now())),
  );
  const [futureFireDate, setFutureFireDate] = useState<string>('1');
  const [alarmId, setAlarmId] = useState<string | null>(null);
  const [update, setUpdate] = useState<AlarmUpdate[]>([]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // 🛑 Stop alarm sound when app becomes active
        ReactNativeAN.stopAlarmSound();

        // ✅ Optional: Remove any lingering notifications
        if (Platform.OS === 'android') {
          ReactNativeAN.removeAllFiredNotifications();
        }
      }
    });

    return () => subscription.remove();
  }, []);

  const subscribeDismiss = useRef<any>();
  const subscribeOpen = useRef<any>();

  const setAlarm = async () => {
    const details = {
      ...alarmNotifData,
      fire_date: fireDate,
      play_sound: true,
      loop_sound: true,
      volume: 1.0,
    };
    console.log(`Alarm set: ${fireDate}`);

    try {
      const alarm = await ReactNativeAN.scheduleAlarm(details);
      if (alarm) {
        setUpdate(prev => [
          ...prev,
          {date: `Alarm set: ${fireDate}`, id: alarm.id},
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setFutureAlarm = async () => {
    const _seconds = parseInt(futureFireDate, 10) * 15 * 1000;
    const fire_date = ReactNativeAN.parseDate(new Date(Date.now() + _seconds));

    const details = {
      ...alarmNotifData,
      fire_date,
      sound_name: '',
      play_sound: true,
      loop_sound: true,
      volume: 1.0,
    };

    try {
      const alarm = await ReactNativeAN.scheduleAlarm(details);
      if (alarm) {
        setUpdate(prev => [
          ...prev,
          {date: `Alarm set: ${fire_date}`, id: alarm.id},
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setFutureRepeatAlarm = async () => {
    const _seconds = parseInt(futureFireDate, 10) * 60 * 1000;
    const fire_date = ReactNativeAN.parseDate(new Date(Date.now() + _seconds));

    const details = {
      ...repeatAlarmNotifData,
      fire_date,
      sound_name: 'iphone_ringtone.mp3',
      volume: 0.9,
      bypass_dnd: true,
      play_sound: true,
      loop_sound: true,
    };
    console.log(`Alarm set: ${fire_date}`);

    try {
      const alarm = await ReactNativeAN.scheduleAlarm(details);
      if (alarm) {
        setUpdate(prev => [
          ...prev,
          {date: `Alarm set: ${fire_date}`, id: alarm.id},
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stopAlarmSound = () => {
    ReactNativeAN.stopAlarmSound();
  };

  const sendNotification = () => {
    const details = {
      ...alarmNotifData,
      data: {content: 'my notification id is 45'},
      sound_name: 'iphone_ringtone.mp3',
      volume: 0.9,
    };
    console.log(details);
    ReactNativeAN.sendNotification(details);
  };

  const viewAlarms = async () => {
    const list = await ReactNativeAN.getScheduledAlarms();
    const updates = list.map((l: any) => ({
      date: `Alarm: ${l.day}-${l.month}-${l.year} ${l.hour}:${l.minute}:${l.second}`,
      id: l.id,
    }));
    setUpdate(updates);
  };

  const deleteAlarm = async () => {
    if (alarmId) {
      console.log(`Delete alarm: ${alarmId}`);
      ReactNativeAN.deleteAlarm(parseInt(alarmId, 10));
      setAlarmId(null);
      ToastAndroid.show('Alarm deleted!', ToastAndroid.SHORT);
      await viewAlarms();
    }
  };

  const showPermissions = () => {
    ReactNativeAN.checkPermissions((permissions: any) => {
      console.log(permissions);
    });
  };

  useEffect(() => {
    subscribeDismiss.current = RNEmitter.addListener(
      'OnNotificationDismissed',
      (data: string) => {
        const obj = JSON.parse(data);
        console.log(`Notification id: ${obj.id} dismissed`);
      },
    );

    subscribeOpen.current = RNEmitter.addListener(
      'OnNotificationOpened',
      (data: string) => {
        const obj = JSON.parse(data);
        console.log(`App opened by notification: ${obj.id}`);
      },
    );

    if (Platform.OS === 'ios') {
      showPermissions();
      ReactNativeAN.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      });
    }

    return () => {
      subscribeDismiss.current?.remove();
      subscribeOpen.current?.remove();
    };
  }, []);

  return (
    <View style={styles.wrapper}>
      <View>
        <Text>Alarm Date in the future (example 01-01-2022 00:00:00)</Text>
        <TextInput
          style={styles.date}
          onChangeText={setFireDate}
          value={fireDate}
        />
        <Button onPress={setAlarm} title="Set Alarm" color="#007fff" />
      </View>
      <View style={styles.margin}>
        <Text>Alarm Time From Now (in minutes):</Text>
        <TextInput
          style={styles.date}
          onChangeText={setFutureFireDate}
          value={futureFireDate}
        />
      </View>
      <View style={styles.margin}>
        <Button
          onPress={setFutureAlarm}
          title="Set Future Alarm"
          color="#007fff"
        />
      </View>
      <View style={styles.margin}>
        <Button
          onPress={setFutureRepeatAlarm}
          title="Set Future Alarm with Repeat"
          color="#007fff"
        />
      </View>
      <View style={styles.margin}>
        <Button
          onPress={sendNotification}
          title="Send Notification Now"
          color="#007fff"
        />
      </View>
      <View style={styles.margin}>
        <Button
          onPress={stopAlarmSound}
          title="Stop Alarm Sound"
          color="#841584"
        />
      </View>
      <View>
        <TextInput
          style={styles.date}
          onChangeText={setAlarmId}
          value={alarmId || ''}
        />
      </View>
      <View style={styles.margin}>
        <Button onPress={deleteAlarm} title="Delete Alarm" color="#841584" />
      </View>
      <View style={styles.margin}>
        <Button
          onPress={viewAlarms}
          title="See all active alarms"
          color="#841584"
        />
      </View>
      <Text>{JSON.stringify(update, null, 2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {flex: 1, padding: 20},
  date: {height: 40, borderColor: 'gray', borderWidth: 1},
  margin: {marginVertical: 8},
});

export default App;
