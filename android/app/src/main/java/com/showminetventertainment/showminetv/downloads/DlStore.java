package com.showminetventertainment.showminetv.downloads;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.List;

/** Download records, kept in the app's private storage (files/sdl/<key>/meta.json). */
public final class DlStore {
    private DlStore() {}

    public static File root(Context ctx) {
        File r = new File(ctx.getFilesDir(), "sdl");
        if (!r.exists()) r.mkdirs();
        return r;
    }

    public static boolean validKey(String key) {
        return key != null && key.matches("^(movie|episode)-\\d{1,10}$");
    }

    public static File dir(Context ctx, String key) {
        if (!validKey(key)) throw new IllegalArgumentException("bad key");
        return new File(root(ctx), key);
    }

    public static synchronized JSONObject read(Context ctx, String key) {
        try {
            File f = new File(dir(ctx, key), "meta.json");
            if (!f.exists()) return null;
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            try (FileInputStream in = new FileInputStream(f)) {
                byte[] buf = new byte[8192]; int n;
                while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
            }
            return new JSONObject(new String(bo.toByteArray(), StandardCharsets.UTF_8));
        } catch (Exception e) {
            return null;
        }
    }

    public static synchronized void write(Context ctx, String key, JSONObject meta) {
        try {
            File d = dir(ctx, key);
            if (!d.exists()) d.mkdirs();
            File tmp = new File(d, "meta.json.tmp");
            try (FileOutputStream o = new FileOutputStream(tmp)) {
                o.write(meta.toString().getBytes(StandardCharsets.UTF_8));
                o.getFD().sync();
            }
            File f = new File(d, "meta.json");
            if (!tmp.renameTo(f)) { f.delete(); tmp.renameTo(f); }
        } catch (Exception ignored) {}
    }

    public static synchronized void update(Context ctx, String key, String field, Object value) {
        JSONObject m = read(ctx, key);
        if (m == null) return;
        try { m.put(field, value); } catch (Exception ignored) {}
        write(ctx, key, m);
    }

    public static List<JSONObject> all(Context ctx) {
        List<JSONObject> list = new ArrayList<>();
        File[] dirs = root(ctx).listFiles();
        if (dirs == null) return list;
        for (File d : dirs) {
            if (!d.isDirectory() || !validKey(d.getName())) continue;
            JSONObject m = read(ctx, d.getName());
            if (m != null) list.add(m);
        }
        java.util.Collections.sort(list, (a, b) -> Long.compare(b.optLong("createdAt"), a.optLong("createdAt")));
        return list;
    }

    public static void delete(Context ctx, String key) {
        deleteTree(dir(ctx, key));
    }

    private static void deleteTree(File f) {
        File[] kids = f.listFiles();
        if (kids != null) for (File k : kids) deleteTree(k);
        f.delete();
    }

    // ── Clock guard: offline expiry can't be dodged by winding the phone's clock back ──
    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences("sm_downloads", Context.MODE_PRIVATE);
    }

    /** Record trusted time (server time when online, else the phone's clock if it moved forward). */
    public static void seeTime(Context ctx, long serverMs) {
        SharedPreferences p = prefs(ctx);
        long last = p.getLong("lastSeen", 0);
        long now = Math.max(serverMs, System.currentTimeMillis());
        if (now > last) p.edit().putLong("lastSeen", now).apply();
    }

    /** False when the phone's clock is more than 2 hours behind the latest time we've seen. */
    public static boolean clockOk(Context ctx) {
        long last = prefs(ctx).getLong("lastSeen", 0);
        return System.currentTimeMillis() >= last - 2 * 3600_000L;
    }
}
