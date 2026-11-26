package com.showminetventertainment.showminetv.downloads;

import android.content.Context;
import android.content.Intent;
import android.os.StatFs;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.File;
import java.util.Iterator;

/** Bridge between the web app and the encrypted downloads on this phone. */
@CapacitorPlugin(name = "SecureDownloads")
public class SecureDownloadsPlugin extends Plugin {

    @Override
    public void load() {
        DownloadService.listener = meta -> notifyListeners("change", toJs(getContext(), meta));
    }

    /** Null when the download may play now, otherwise a message for the viewer. */
    static String playProblem(Context ctx, JSONObject m) {
        if (m == null) return "Download not found.";
        if (!"done".equals(m.optString("status"))) return "This download hasn’t finished yet.";
        if (!DlStore.clockOk(ctx)) return "Your phone’s date looks wrong. Fix the date or connect to the internet.";
        long exp = m.optLong("expires", 0);
        if (exp <= System.currentTimeMillis()) return "This download has expired. Connect to the internet to renew it.";
        return null;
    }

    @PluginMethod
    public void start(PluginCall call) {
        String type = "episode".equals(call.getString("type")) ? "episode" : "movie";
        Integer id = call.getInt("id");
        String url = call.getString("url", "");
        if (id == null || id <= 0 || url == null || !url.startsWith("https://")) { call.reject("Missing details"); return; }
        String key = type + "-" + id;
        try {
            JSONObject m = DlStore.read(getContext(), key);
            if (m != null && "done".equals(m.optString("status"))) {
                m.put("expires", call.getLong("expires", m.optLong("expires")));
                DlStore.write(getContext(), key, m);
                call.resolve(toJs(getContext(), m));
                return;
            }
            if (m == null) {
                m = new JSONObject();
                m.put("key", key);
                m.put("type", type);
                m.put("id", id);
                m.put("createdAt", System.currentTimeMillis());
                m.put("wrappedKey", DlCrypto.newWrappedKey());
            }
            m.put("title", call.getString("title", "Showmine"));
            m.put("url", url);
            m.put("quality", "720p".equals(call.getString("quality")) ? "720p" : "480p");
            m.put("posterUrl", call.getString("poster", ""));
            m.put("durationMins", call.getInt("durationMins", 0));
            m.put("expires", call.getLong("expires", 0L));
            m.put("status", "queued");
            m.put("progress", m.optInt("progress", 0));
            m.remove("error");
            DlStore.write(getContext(), key, m);
            DlStore.seeTime(getContext(), call.getLong("serverTime", 0L));
            DownloadService.enqueue(getContext(), key);
            call.resolve(toJs(getContext(), m));
        } catch (Exception e) {
            call.reject("Couldn’t start the download");
        }
    }

    @PluginMethod
    public void list(PluginCall call) {
        JSArray arr = new JSArray();
        for (JSONObject m : DlStore.all(getContext())) arr.put(toJs(getContext(), m));
        JSObject r = new JSObject();
        r.put("items", arr);
        StatFs s = new StatFs(getContext().getFilesDir().getPath());
        r.put("freeBytes", s.getAvailableBytes());
        call.resolve(r);
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (!DlStore.validKey(key)) { call.reject("Bad key"); return; }
        DownloadService.cancel(key);
        // Give the worker a moment to let go of the current file
        new Thread(() -> {
            try { Thread.sleep(400); } catch (InterruptedException ignored) {}
            DlStore.delete(getContext(), key);
            call.resolve();
        }).start();
    }

    @PluginMethod
    public void retry(PluginCall call) {
        String key = call.getString("key");
        JSONObject m = DlStore.validKey(key) ? DlStore.read(getContext(), key) : null;
        if (m == null) { call.reject("Not found"); return; }
        try { m.put("status", "queued"); m.remove("error"); } catch (Exception ignored) {}
        DlStore.write(getContext(), key, m);
        DownloadService.enqueue(getContext(), key);
        call.resolve(toJs(getContext(), m));
    }

    @PluginMethod
    public void play(PluginCall call) {
        String key = call.getString("key");
        JSONObject m = DlStore.validKey(key) ? DlStore.read(getContext(), key) : null;
        String problem = playProblem(getContext(), m);
        if (problem != null) { call.reject(problem); return; }
        Intent i = new Intent(getContext(), OfflinePlayerActivity.class).putExtra(OfflinePlayerActivity.EXTRA_KEY, key);
        getActivity().startActivity(i);
        call.resolve();
    }

    /** licences: { "movie:12": expiresMs, ... } from the server; 0 = no longer allowed. */
    @PluginMethod
    public void renew(PluginCall call) {
        JSObject lic = call.getObject("licences", new JSObject());
        DlStore.seeTime(getContext(), call.getLong("serverTime", 0L));
        Iterator<String> it = lic.keys();
        int updated = 0;
        while (it.hasNext()) {
            String k = it.next();
            String key = k.replace(':', '-');
            if (!DlStore.validKey(key)) continue;
            JSONObject m = DlStore.read(getContext(), key);
            if (m == null) continue;
            try { m.put("expires", lic.getLong(k)); } catch (Exception ignored) {}
            DlStore.write(getContext(), key, m);
            updated++;
        }
        JSObject r = new JSObject();
        r.put("updated", updated);
        call.resolve(r);
    }

    static JSObject toJs(Context ctx, JSONObject m) {
        JSObject o = new JSObject();
        String key = m.optString("key");
        o.put("key", key);
        o.put("type", m.optString("type"));
        o.put("id", m.optInt("id"));
        o.put("title", m.optString("title"));
        o.put("quality", m.optString("quality"));
        o.put("status", m.optString("status"));
        o.put("progress", m.optInt("progress"));
        o.put("bytes", m.optLong("bytes"));
        o.put("expires", m.optLong("expires"));
        o.put("error", m.optString("error", ""));
        o.put("durationMins", m.optInt("durationMins"));
        o.put("resumeMs", m.optLong("resumeMs"));
        o.put("active", DownloadService.isActive(key));
        try {
            File p = new File(DlStore.dir(ctx, key), "poster.jpg");
            o.put("posterPath", p.exists() ? p.getAbsolutePath() : "");
        } catch (Exception e) { o.put("posterPath", ""); }
        o.put("posterUrl", m.optString("posterUrl"));
        o.put("playable", playProblem(ctx, m) == null);
        return o;
    }
}
