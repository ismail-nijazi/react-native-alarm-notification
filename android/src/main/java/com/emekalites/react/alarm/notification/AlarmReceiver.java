package com.emekalites.react.alarm.notification;

import android.app.Application;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.app.NotificationManager;

import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.ArrayList;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = AlarmReceiver.class.getSimpleName();

    AlarmModel alarm;

    int id;

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;

        final AlarmDatabase alarmDB = new AlarmDatabase(context);
        AlarmUtil alarmUtil = new AlarmUtil((Application) context.getApplicationContext());

        try {
            String intentType = intent.getExtras() != null ? intent.getExtras().getString("intentType") : null;

            if (Constants.ADD_INTENT.equals(intentType)) {
                id = intent.getExtras().getInt("PendingId");

                try {
                    alarm = alarmDB.getAlarm(id);
                    alarmUtil.sendNotification(alarm);
                    ArrayList<AlarmModel> alarms = alarmDB.getAlarmList(1);
                    alarmUtil.setBootReceiver();
                    Log.d(TAG, "alarm start: " + alarm.toString() + ", alarms left: " + alarms.size());
                } catch (Exception e) {
                    Log.e(TAG, "Failed to get alarm from DB or send notification", e);
                }

                return;
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed in intentType handling", e);
        }

        // Handle user interactions
        String action = intent.getAction();
        if (action != null) {
            try {
                switch (action) {
                    case Constants.NOTIFICATION_ACTION_SNOOZE:
                        id = intent.getExtras().getInt("SnoozeAlarmId");
                        alarm = alarmDB.getAlarm(id);
                        alarmUtil.snoozeAlarm(alarm);
                        alarmUtil.removeFiredNotification(alarm.getId());
                        alarmUtil.stopAlarmSound();
                        break;
                    case Constants.NOTIFICATION_ACTION_DISMISS:
                        id = intent.getExtras().getInt("AlarmId");
                        alarm = alarmDB.getAlarm(id);
                        alarmUtil.cancelAlarm(alarm, false);
                        alarmUtil.removeFiredNotification(alarm.getId());
                        alarmUtil.stopAlarmSound(); 
                        ANModule.getReactAppContext()
                                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("OnNotificationDismissed", "{\"id\": \"" + alarm.getId() + "\"}");
                        break;
                    default:
                        Log.w(TAG, "Unknown action received: " + action);
                        break;
                }
            } catch (Exception e) {
                Log.e(TAG, "Error processing notification action", e);
                alarmUtil.stopAlarmSound(); // fail-safe
            }
        }
    }
}
