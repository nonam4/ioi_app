package com.ioi.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class Notifications extends FirebaseMessagingService {

    private SharedPreferences localStorage;
    public Notifications() {}

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        localStorage = this.getSharedPreferences("ioi", Context.MODE_PRIVATE);
        localStorage.edit().putString("token", token).apply();
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {

        localStorage = this.getSharedPreferences("ioi", Context.MODE_PRIVATE);
        String id = localStorage.getString("id", null);

        if(id != null) {
            Intent intent = new Intent(this, Principal.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 0 , intent, PendingIntent.FLAG_ONE_SHOT);

            Context context = getApplicationContext();
            final int NOTIFY_ID = 33701881;

            String notfId = "Mundo Eletrônico";
            String title = "Atendimentos Atualizados";
            String text = "Atualize os dados dentro do app para ver as alterações!";
            NotificationCompat.Builder builder;
            NotificationManager notifManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                assert notifManager != null;
                NotificationChannel channel = notifManager.getNotificationChannel(notfId);
                if (channel == null) {
                    channel = new NotificationChannel(notfId, "Atendimentos", NotificationManager.IMPORTANCE_HIGH);
                    channel.enableVibration(true);
                    notifManager.createNotificationChannel(channel);
                }
            }

            builder = new NotificationCompat.Builder(context, notfId);
            builder.setContentTitle(title)
                    .setSmallIcon(R.drawable.icon)
                    .setContentText(text)
                    .setDefaults(Notification.DEFAULT_ALL)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .setTicker(text);
            Notification notification = builder.build();
            NotificationManagerCompat manager = NotificationManagerCompat.from(getApplicationContext());
            manager.notify(NOTIFY_ID, notification);
        }
    }

    @Override
    public void onDeletedMessages() {}

}