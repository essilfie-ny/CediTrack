package com.ceditrack.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "CediTrackSmsReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                String format = bundle.getString("format");

                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage;
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                            smsMessage = SmsMessage.createFromPdu((byte[]) pdu, format);
                        } else {
                            smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        }

                        String sender = smsMessage.getDisplayOriginatingAddress();
                        String messageBody = smsMessage.getMessageBody();

                        Log.d(TAG, "SMS received from: " + sender + ", message: " + messageBody);

                        // Check if SMS is from Mobile Money or Bank senders
                        if (isFinancialSms(sender, messageBody)) {
                            sendSmsToBackend(messageBody, sender);
                        }
                    }
                }
            }
        }
    }

    private boolean isFinancialSms(String sender, String body) {
        if (sender == null || body == null) return false;
        String s = sender.toLowerCase();
        String b = body.toLowerCase();

        boolean senderMatch = s.contains("mobilemoney") || s.contains("momo") || s.contains("mtn")
                || s.contains("telecel") || s.contains("vodafone") || s.contains("at")
                || s.contains("bank") || s.contains("ecobank") || s.contains("gcb");

        boolean bodyMatch = (b.contains("ghs") || b.contains("gh₵") || b.contains("payment") || b.contains("received") || b.contains("paid") || b.contains("transferred"))
                && (b.contains("cash") || b.contains("balance") || b.contains("reference") || b.contains("fee"));

        return senderMatch || bodyMatch;
    }

    private void sendSmsToBackend(final String smsBody, final String sender) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    // Send parsed SMS directly to CediTrack backend
                    URL url = new URL("http://localhost:3001/api/messages/parse");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                    conn.setDoOutput(true);

                    String jsonInputString = "{\"raw_message\": \"" + smsBody.replace("\"", "\\\"").replace("\n", " ") + "\", \"sender\": \"" + sender + "\"}";

                    try (OutputStream os = conn.getOutputStream()) {
                        byte[] input = jsonInputString.getBytes("utf-8");
                        os.write(input, 0, input.length);
                    }

                    int responseCode = conn.getResponseCode();
                    Log.d(TAG, "Sms auto-parse backend response code: " + responseCode);
                    conn.disconnect();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to send SMS to backend", e);
                }
            }
        }).start();
    }
}
