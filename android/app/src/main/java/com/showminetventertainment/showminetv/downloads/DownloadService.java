package com.showminetventertainment.showminetv.downloads;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.StatFs;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.crypto.Cipher;

/**
 * Downloads queued titles in the background (foreground service with a
 * progress notification). HLS streams are fetched segment by segment and
 * each piece is encrypted before it touches storage.
 */
public class DownloadService extends Service {
    public static final String ACTION_START = "sm.dl.START";
    public static final String ACTION_CANCEL = "sm.dl.CANCEL";
    public static final String EXTRA_KEY = "key";
    private static final String CHANNEL = "downloads";
    private static final int NOTIF_ID = 4201;
    private static final long MIN_FREE_BYTES = 300L * 1024 * 1024;

    /** Progress listener set by the Capacitor plugin while the app is open. */
    public interface Listener { void onChange(JSONObject meta); }
    public static volatile Listener listener;

    private static final LinkedBlockingDeque<String> queue = new LinkedBlockingDeque<>();
    private static volatile String current;
    private static volatile String cancelKey;
    private Thread worker;

    public static void enqueue(Context ctx, String key) {
        Intent i = new Intent(ctx, DownloadService.class).setAction(ACTION_START).putExtra(EXTRA_KEY, key);
        if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i); else ctx.startService(i);
    }

    public static void cancel(String key) {
        queue.remove(key);
        if (key.equals(current)) cancelKey = key;
    }

    public static boolean isActive(String key) {
        return key.equals(current) || queue.contains(key);
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startAsForeground("Preparing download…", 0, true);
        String key = intent != null ? intent.getStringExtra(EXTRA_KEY) : null;
        if (key != null && DlStore.validKey(key) && !queue.contains(key) && !key.equals(current)) queue.add(key);
        // Resume anything left half-done (e.g. after the app was closed)
        for (JSONObject m : DlStore.all(this)) {
            String k = m.optString("key");
            String st = m.optString("status");
            if (("queued".equals(st) || "downloading".equals(st)) && !queue.contains(k) && !k.equals(current)) queue.add(k);
        }
        if (worker == null || !worker.isAlive()) {
            worker = new Thread(this::runQueue, "sm-downloads");
            worker.start();
        }
        return START_STICKY;
    }

    private void runQueue() {
        String key;
        while ((key = queue.poll()) != null) {
            current = key;
            cancelKey = null;
            try {
                download(key);
            } catch (Cancelled c) {
                // removed by the user: files are deleted by the plugin
            } catch (Exception e) {
                JSONObject m = DlStore.read(this, key);
                if (m != null) {
                    try { m.put("status", "failed"); m.put("error", friendly(e)); } catch (Exception ignored) {}
                    DlStore.write(this, key, m);
                    emit(m);
                }
            }
            current = null;
        }
        stopForeground(true);
        stopSelf();
    }

    // ── HLS download ──────────────────────────────────────────────────
    private static class Cancelled extends Exception {}
    private void checkCancel(String key) throws Cancelled { if (key.equals(cancelKey)) throw new Cancelled(); }

    private void download(String key) throws Exception {
        JSONObject m = DlStore.read(this, key);
        if (m == null) return;
        File dir = DlStore.dir(this, key);
        byte[] ck = DlCrypto.unwrap(m.getString("wrappedKey"));
        String title = m.optString("title", "Showmine");

        m.put("status", "downloading");
        m.remove("error");
        DlStore.write(this, key, m);
        emit(m);
        startAsForeground(title, 0, true);

        // Poster for the offline list (plain image, nothing secret)
        String poster = m.optString("posterUrl", "");
        File posterFile = new File(dir, "poster.jpg");
        if (!poster.isEmpty() && !posterFile.exists()) {
            try { saveTo(fetch(poster, 4 * 1024 * 1024), posterFile); } catch (Exception ignored) {}
        }

        // 1. Pick the rendition
        String masterUrl = m.getString("url");
        int targetH = "720p".equals(m.optString("quality")) ? 720 : 480;
        String master = new String(fetch(masterUrl, 2 * 1024 * 1024), StandardCharsets.UTF_8);
        String mediaUrl = masterUrl;
        String media = master;
        if (master.contains("#EXT-X-STREAM-INF")) {
            mediaUrl = pickVariant(masterUrl, master, targetH);
            media = new String(fetch(mediaUrl, 4 * 1024 * 1024), StandardCharsets.UTF_8);
        }

        // 2. Walk the playlist, download + encrypt every resource, rewrite to local names
        List<String> out = new ArrayList<>();
        List<String[]> jobs = new ArrayList<>();   // {remoteUrl, localName}
        Pattern uriAttr = Pattern.compile("URI=\"([^\"]+)\"");
        int seg = 0, res = 0;
        for (String raw : media.split("\\r?\\n")) {
            String line = raw.trim();
            if (line.isEmpty()) continue;
            if (line.startsWith("#EXT-X-KEY") || line.startsWith("#EXT-X-MAP")) {
                Matcher mm = uriAttr.matcher(line);
                if (mm.find() && !line.contains("METHOD=NONE")) {
                    String local = String.format("res_%03d.enc", res++);
                    jobs.add(new String[]{resolve(mediaUrl, mm.group(1)), local});
                    line = line.substring(0, mm.start(1)) + local + line.substring(mm.end(1));
                }
                out.add(line);
            } else if (line.startsWith("#")) {
                out.add(line);
            } else {
                String local = String.format("seg_%05d.enc", seg++);
                jobs.add(new String[]{resolve(mediaUrl, line), local});
                out.add(local);
            }
        }
        if (seg == 0) throw new Exception("Empty video");
        m.put("total", jobs.size());

        long bytes = 0;
        int done = 0;
        int lastPct = -1;
        for (String[] job : jobs) {
            checkCancel(key);
            File f = new File(dir, job[1]);
            if (!f.exists()) {
                if (freeBytes() < MIN_FREE_BYTES) throw new Exception("Phone storage is full");
                byte[] data = fetchRetry(job[0], 64 * 1024 * 1024, key);
                writeEncrypted(ck, data, f);
            }
            bytes += f.length();
            done++;
            int pct = (int) (done * 100L / jobs.size());
            if (pct != lastPct) {
                lastPct = pct;
                m.put("progress", pct);
                m.put("done", done);
                m.put("bytes", bytes);
                DlStore.write(this, key, m);
                emit(m);
                startAsForeground(title, pct, false);
            }
        }
        java.util.Arrays.fill(ck, (byte) 0);

        try (FileOutputStream o = new FileOutputStream(new File(dir, "index.m3u8"))) {
            StringBuilder sb = new StringBuilder();
            for (String l : out) sb.append(l).append('\n');
            o.write(sb.toString().getBytes(StandardCharsets.UTF_8));
        }
        m.put("status", "done");
        m.put("progress", 100);
        m.put("bytes", bytes);
        m.put("completedAt", System.currentTimeMillis());
        DlStore.write(this, key, m);
        emit(m);
        notifyDone(title);
    }

    private static String pickVariant(String base, String master, int targetH) {
        String best = null; int bestH = -1; String fallback = null; int fbH = Integer.MAX_VALUE;
        String[] lines = master.split("\\r?\\n");
        Pattern resP = Pattern.compile("RESOLUTION=\\d+x(\\d+)");
        for (int i = 0; i < lines.length; i++) {
            if (!lines[i].startsWith("#EXT-X-STREAM-INF")) continue;
            int h = 0;
            Matcher mm = resP.matcher(lines[i]);
            if (mm.find()) h = Integer.parseInt(mm.group(1));
            String uri = null;
            for (int j = i + 1; j < lines.length; j++) {
                String l = lines[j].trim();
                if (!l.isEmpty() && !l.startsWith("#")) { uri = l; break; }
            }
            if (uri == null) continue;
            if (h <= targetH && h > bestH) { bestH = h; best = uri; }
            if (h < fbH) { fbH = h; fallback = uri; }
        }
        String pick = best != null ? best : fallback;
        if (pick == null) throw new IllegalStateException("No video variant");
        return resolve(base, pick);
    }

    private static String resolve(String base, String ref) {
        try { return new URL(new URL(base), ref).toString(); } catch (Exception e) { return ref; }
    }

    private static void writeEncrypted(byte[] key, byte[] data, File target) throws Exception {
        byte[] iv = DlCrypto.newIv();
        Cipher c = DlCrypto.ctrAt(key, iv, 0, Cipher.ENCRYPT_MODE);
        File tmp = new File(target.getPath() + ".part");
        try (FileOutputStream o = new FileOutputStream(tmp)) {
            o.write(iv);
            o.write(c.update(data));
            byte[] fin = c.doFinal();
            if (fin != null) o.write(fin);
        }
        java.util.Arrays.fill(data, (byte) 0);
        if (!tmp.renameTo(target)) throw new Exception("Could not save file");
    }

    private byte[] fetchRetry(String url, int max, String key) throws Exception {
        Exception last = null;
        for (int a = 0; a < 4; a++) {
            checkCancel(key);
            try { return fetch(url, max); } catch (Exception e) { last = e; Thread.sleep(1500L * (a + 1)); }
        }
        throw last;
    }

    private static byte[] fetch(String url, int max) throws Exception {
        if (!url.startsWith("https://")) throw new Exception("Insecure address");
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(30000);
        c.setRequestProperty("Referer", "https://v2.showmine.ng/");
        c.setRequestProperty("User-Agent", "ShowmineTV-Downloader");
        try {
            int code = c.getResponseCode();
            if (code != 200) throw new Exception("HTTP " + code);
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                byte[] buf = new byte[32 * 1024];
                int n, total = 0;
                while ((n = in.read(buf)) > 0) {
                    total += n;
                    if (total > max) throw new Exception("File too large");
                    bo.write(buf, 0, n);
                }
                return bo.toByteArray();
            }
        } finally {
            c.disconnect();
        }
    }

    private static void saveTo(byte[] data, File f) throws Exception {
        try (FileOutputStream o = new FileOutputStream(f)) { o.write(data); }
    }

    private long freeBytes() {
        StatFs s = new StatFs(getFilesDir().getPath());
        return s.getAvailableBytes();
    }

    private static String friendly(Exception e) {
        String m = e.getMessage() == null ? "" : e.getMessage();
        if (m.contains("storage")) return m;
        if (e instanceof java.net.UnknownHostException || e instanceof java.net.SocketTimeoutException
                || e instanceof java.net.ConnectException) return "No internet connection";
        return "Download failed. Try again.";
    }

    private void emit(JSONObject m) {
        Listener l = listener;
        if (l != null) { try { l.onChange(new JSONObject(m.toString())); } catch (Exception ignored) {} }
    }

    // ── Notifications ─────────────────────────────────────────────────
    private void ensureChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL, "Downloads", NotificationManager.IMPORTANCE_LOW);
                ch.setDescription("Progress of offline downloads");
                nm.createNotificationChannel(ch);
            }
        }
    }

    private PendingIntent openApp() {
        Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (i == null) i = new Intent();
        i.setData(Uri.parse("https://v2.showmine.ng/downloads"));
        return PendingIntent.getActivity(this, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void startAsForeground(String title, int pct, boolean indeterminate) {
        ensureChannel();
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.stat_sys_download)
                .setContentTitle(title)
                .setContentText(indeterminate ? "Preparing…" : ("Downloading · " + pct + "%"))
                .setProgress(100, pct, indeterminate)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setContentIntent(openApp())
                .build();
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(NOTIF_ID, n);
        }
    }

    private void notifyDone(String title) {
        ensureChannel();
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setContentTitle(title)
                .setContentText("Downloaded · ready to watch offline")
                .setAutoCancel(true)
                .setContentIntent(openApp())
                .build();
        try {
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTIF_ID + 1 + Math.abs(title.hashCode() % 1000), n);
        } catch (SecurityException ignored) {}
    }
}
